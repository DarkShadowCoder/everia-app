// workers/replay-renderer/server.js
// ============================================================
// EVERIA — FFmpeg Replay Renderer
// ============================================================

import 'dotenv/config';

import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

import ffmpegPath from 'ffmpeg-static';

import { createClient } from '@supabase/supabase-js';

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const PORT = Number(process.env.PORT || 10000);

const REPLAY_RENDERER_SECRET =
  process.env.REPLAY_RENDERER_SECRET;

const SUPABASE_URL =
  process.env.SUPABASE_URL;

// SUPABASE_SECRET est la variable recommandée.
// SUPABASE_SERVICE_ROLE_KEY est conservée comme fallback
// pour compatibilité avec une ancienne configuration.
const SUPABASE_SECRET =
  process.env.SUPABASE_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================

const missingVariables = [];

if (!REPLAY_RENDERER_SECRET) {
  missingVariables.push(
    'REPLAY_RENDERER_SECRET'
  );
}

if (!SUPABASE_URL) {
  missingVariables.push(
    'SUPABASE_URL'
  );
}

if (!SUPABASE_SECRET) {
  missingVariables.push(
    'SUPABASE_SECRET'
  );
}

if (missingVariables.length > 0) {
  throw new Error(
    `Variables d'environnement manquantes : ${missingVariables.join(
      ', '
    )}`
  );
}

if (!ffmpegPath) {
  throw new Error(
    'Impossible de trouver le binaire FFmpeg fourni par ffmpeg-static.'
  );
}

// ============================================================
// SUPABASE CLIENT
// ============================================================

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

// ============================================================
// HTTP RESPONSE HELPER
// ============================================================

function send(
  response,
  status,
  body
) {
  if (response.headersSent) {
    return;
  }

  response.writeHead(
    status,
    {
      'content-type':
        'application/json; charset=utf-8',

      'cache-control':
        'no-store',
    }
  );

  response.end(
    JSON.stringify(body)
  );
}

// ============================================================
// JSON BODY PARSER
// ============================================================

function readJson(request) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const chunks = [];

      let size = 0;
      let settled = false;

      function fail(error) {
        if (settled) {
          return;
        }

        settled = true;
        reject(error);
      }

      function succeed(value) {
        if (settled) {
          return;
        }

        settled = true;
        resolve(value);
      }

      request.on(
        'data',
        (chunk) => {
          size += chunk.length;

          if (
            size >
            2 * 1024 * 1024
          ) {
            fail(
              new Error(
                'Payload too large.'
              )
            );

            try {
              request.destroy();
            } catch {
              // Ignore destroy errors.
            }

            return;
          }

          chunks.push(chunk);
        }
      );

      request.on(
        'end',
        () => {
          try {
            const raw =
              Buffer.concat(
                chunks
              ).toString(
                'utf8'
              );

            if (!raw.trim()) {
              throw new Error(
                'Request body is empty.'
              );
            }

            const parsed =
              JSON.parse(raw);

            succeed(parsed);
          } catch (
            error
          ) {
            fail(error);
          }
        }
      );

      request.on(
        'error',
        fail
      );
    }
  );
}

// ============================================================
// DOWNLOAD MEDIA
// ============================================================

async function download(
  url,
  target
) {
  if (!url) {
    throw new Error(
      'Media URL is missing.'
    );
  }

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Media download failed: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const buffer =
    Buffer.from(
      arrayBuffer
    );

  await fs.writeFile(
    target,
    buffer
  );

  return target;
}

// ============================================================
// RUN FFMPEG
// ============================================================

function runFfmpeg(
  args
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const child =
        spawn(
          ffmpegPath,
          args,
          {
            stdio: [
              'ignore',
              'pipe',
              'pipe',
            ],
          }
        );

      let stderr = '';

      child.stderr.on(
        'data',
        (chunk) => {
          stderr +=
            chunk.toString();

          // Empêche les logs FFmpeg de devenir énormes.
          if (
            stderr.length >
            20000
          ) {
            stderr =
              stderr.slice(
                -20000
              );
          }
        }
      );

      child.on(
        'error',
        (error) => {
          reject(error);
        }
      );

      child.on(
        'close',
        (code) => {
          if (
            code === 0
          ) {
            resolve();
            return;
          }

          reject(
            new Error(
              `ffmpeg exited ${code}: ${stderr.slice(
                -4000
              )}`
            )
          );
        }
      );
    }
  );
}

// ============================================================
// IMAGE → VIDEO
// ============================================================

function imageArgs(
  input,
  output,
  durationSec
) {
  return [
    '-y',

    '-loop',
    '1',

    '-t',
    String(
      durationSec
    ),

    '-i',
    input,

    '-vf',
    [
      'scale=1080:1920:force_original_aspect_ratio=increase',
      'crop=1080:1920',
      'format=yuv420p',
      'setsar=1',
    ].join(','),

    '-r',
    '30',

    '-an',

    '-c:v',
    'libx264',

    '-preset',
    'veryfast',

    '-crf',
    '21',

    output,
  ];
}

// ============================================================
// VIDEO → VIDEO
// ============================================================

function videoArgs(
  input,
  output,
  durationSec
) {
  return [
    '-y',

    '-stream_loop',
    '-1',

    '-i',
    input,

    '-t',
    String(
      durationSec
    ),

    '-vf',
    [
      'scale=1080:1920:force_original_aspect_ratio=increase',
      'crop=1080:1920',
      'format=yuv420p',
      'setsar=1',
    ].join(','),

    '-r',
    '30',

    '-an',

    '-c:v',
    'libx264',

    '-preset',
    'veryfast',

    '-crf',
    '22',

    '-movflags',
    '+faststart',

    output,
  ];
}

// ============================================================
// CONCAT VIDEO CLIPS
// ============================================================

async function concatClips(
  clips,
  output
) {
  const listPath =
    path.join(
      path.dirname(
        output
      ),
      'concat.txt'
    );

  const content =
    clips
      .map(
        (file) => {
          const safeFile =
            file.replaceAll(
              "'",
              "'\\''"
            );

          return `file '${safeFile}'`;
        }
      )
      .join('\n');

  await fs.writeFile(
    listPath,
    content,
    'utf8'
  );

  await runFfmpeg([
    '-y',

    '-f',
    'concat',

    '-safe',
    '0',

    '-i',
    listPath,

    '-c:v',
    'libx264',

    '-preset',
    'veryfast',

    '-crf',
    '21',

    '-pix_fmt',
    'yuv420p',

    '-movflags',
    '+faststart',

    '-an',

    output,
  ]);
}

// ============================================================
// RENDER REPLAY
// ============================================================

async function render(
  payload
) {
  if (
    !payload?.replayId
  ) {
    throw new Error(
      'REPLAY_ID_REQUIRED'
    );
  }

  if (
    !payload?.eventId
  ) {
    throw new Error(
      'EVENT_ID_REQUIRED'
    );
  }

  if (
    !Array.isArray(
      payload.items
    ) ||
    !payload.items.length
  ) {
    throw new Error(
      'REPLAY_EMPTY'
    );
  }

  const work =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        'everia-replay-'
      )
    );

  const clips = [];

  let durationMs = 0;

  try {
    // --------------------------------------------------------
    // PROCESS EVERY REPLAY ITEM
    // --------------------------------------------------------

    for (
      let index = 0;
      index <
      payload.items.length;
      index += 1
    ) {
      const item =
        payload.items[index];

      if (
        !item ||
        !item.url
      ) {
        console.warn(
          `[Everia] Skipping item ${index}: missing URL`
        );

        continue;
      }

      const isVideo =
        item.type ===
        'video';

      const extension =
        isVideo
          ? '.mp4'
          : '.jpg';

      const source =
        path.join(
          work,
          `source-${index}${extension}`
        );

      const clip =
        path.join(
          work,
          `clip-${index}.mp4`
        );

      const duration =
        Math.max(
          1.5,
          Number(
            item.durationMs ||
              3000
          ) / 1000
        );

      console.log(
        `[Everia] Rendering item ${
          index + 1
        }/${payload.items.length} (${item.type || 'image'})`
      );

      // Download original media.
      await download(
        item.url,
        source
      );

      // Normalize into 1080x1920 MP4.
      await runFfmpeg(
        isVideo
          ? videoArgs(
              source,
              clip,
              duration
            )
          : imageArgs(
              source,
              clip,
              duration
            )
      );

      clips.push(
        clip
      );

      durationMs +=
        Math.round(
          duration * 1000
        );
    }

    // --------------------------------------------------------
    // ENSURE AT LEAST ONE CLIP EXISTS
    // --------------------------------------------------------

    if (
      !clips.length
    ) {
      throw new Error(
        'NO_RENDERABLE_MEDIA'
      );
    }

    // --------------------------------------------------------
    // FINAL REPLAY
    // --------------------------------------------------------

    const outputFile =
      path.join(
        work,
        'replay.mp4'
      );

    await concatClips(
      clips,
      outputFile
    );

    // --------------------------------------------------------
    // THUMBNAIL
    // --------------------------------------------------------

    const thumbnailFile =
      path.join(
        work,
        'thumb.jpg'
      );

    await runFfmpeg([
      '-y',

      '-ss',
      '0.5',

      '-i',
      outputFile,

      '-frames:v',
      '1',

      '-q:v',
      '3',

      thumbnailFile,
    ]);

    // --------------------------------------------------------
    // STORAGE PATHS
    // --------------------------------------------------------

    const outputPath =
      `${payload.eventId}/replays/${payload.replayId}.mp4`;

    const thumbnailPath =
      `${payload.eventId}/replays/${payload.replayId}.jpg`;

    // --------------------------------------------------------
    // READ GENERATED FILES
    // --------------------------------------------------------

    const outputBuffer =
      await fs.readFile(
        outputFile
      );

    const thumbnailBuffer =
      await fs.readFile(
        thumbnailFile
      );

    // --------------------------------------------------------
    // UPLOAD VIDEO TO SUPABASE STORAGE
    // --------------------------------------------------------

    const {
      error:
        uploadError,
    } =
      await supabase
        .storage
        .from(
          'replays'
        )
        .upload(
          outputPath,
          outputBuffer,
          {
            contentType:
              'video/mp4',

            cacheControl:
              '31536000',

            upsert:
              true,
          }
        );

    if (
      uploadError
    ) {
      throw uploadError;
    }

    // --------------------------------------------------------
    // UPLOAD THUMBNAIL TO SUPABASE STORAGE
    // --------------------------------------------------------

    const {
      error:
        thumbnailError,
    } =
      await supabase
        .storage
        .from(
          'replays'
        )
        .upload(
          thumbnailPath,
          thumbnailBuffer,
          {
            contentType:
              'image/jpeg',

            cacheControl:
              '31536000',

            upsert:
              true,
          }
        );

    if (
      thumbnailError
    ) {
      throw thumbnailError;
    }

    console.log(
      '[Everia] Replay uploaded successfully'
    );

    console.log(
      `[Everia] Video: ${outputPath}`
    );

    console.log(
      `[Everia] Thumbnail: ${thumbnailPath}`
    );

    console.log(
      `[Everia] Duration: ${durationMs} ms`
    );

    return {
      outputPath,
      thumbnailPath,
      durationMs,
    };
  } finally {
    // --------------------------------------------------------
    // REMOVE TEMPORARY FILES
    // --------------------------------------------------------

    await fs.rm(
      work,
      {
        recursive: true,
        force: true,
      }
    );
  }
}

// ============================================================
// HTTP SERVER
// ============================================================

const server =
  http.createServer(
    async (
      request,
      response
    ) => {
      try {
        // ------------------------------------------------------
        // HEALTH CHECK
        // ------------------------------------------------------

        if (
          request.method ===
            'GET' &&
          request.url ===
            '/health'
        ) {
          return send(
            response,
            200,
            {
              ok: true,

              service:
                'everia-replay-renderer',

              ffmpeg:
                Boolean(
                  ffmpegPath
                ),
            }
          );
        }

        // ------------------------------------------------------
        // ONLY POST /render IS SUPPORTED
        // ------------------------------------------------------

        if (
          request.method !==
            'POST' ||
          request.url !==
            '/render'
        ) {
          return send(
            response,
            404,
            {
              error:
                'Not found',
            }
          );
        }

        // ------------------------------------------------------
        // AUTHENTICATE CALLER
        // ------------------------------------------------------

        const receivedSecret =
          request.headers[
            'x-renderer-secret'
          ];

        if (
          !receivedSecret ||
          receivedSecret !==
            REPLAY_RENDERER_SECRET
        ) {
          return send(
            response,
            401,
            {
              error:
                'Unauthorized',
            }
          );
        }

        // ------------------------------------------------------
        // READ REQUEST BODY
        // ------------------------------------------------------

        const payload =
          await readJson(
            request
          );

        // ------------------------------------------------------
        // RENDER
        // ------------------------------------------------------

        const result =
          await render(
            payload
          );

        // ------------------------------------------------------
        // SUCCESS
        // ------------------------------------------------------

        return send(
          response,
          200,
          {
            ok: true,
            ...result,
          }
        );
      } catch (
        error
      ) {
        console.error(
          '[Everia renderer]',
          error
        );

        if (
          response.headersSent
        ) {
          try {
            response.end();
          } catch {
            // Ignore.
          }

          return;
        }

        return send(
          response,
          400,
          {
            ok: false,

            error:
              error?.message ||
              'Render failed',
          }
        );
      }
    }
  );

// ============================================================
// SERVER START
// ============================================================

server.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      '============================================================'
    );

    console.log(
      'EVERIA — FFmpeg Replay Renderer'
    );

    console.log(
      '============================================================'
    );

    console.log(
      `Server listening on port ${PORT}`
    );

    console.log(
      `Health endpoint: /health`
    );

    console.log(
      `Render endpoint: /render`
    );

    console.log(
      `FFmpeg available: ${Boolean(
        ffmpegPath
      )}`
    );

    console.log(
      'Supabase configuration: loaded'
    );

    console.log(
      '============================================================'
    );
  }
);

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

function shutdown(
  signal
) {
  console.log(
    `[Everia] Received ${signal}. Shutting down...`
  );

  server.close(
    () => {
      console.log(
        '[Everia] Server closed.'
      );

      process.exit(0);
    }
  );
}

process.on(
  'SIGTERM',
  () => {
    shutdown('SIGTERM');
  }
);

process.on(
  'SIGINT',
  () => {
    shutdown('SIGINT');
  }
);