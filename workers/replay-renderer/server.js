// workers/replay-renderer/server.js
// ============================================================
// EVERIA — FFmpeg Replay Renderer
// ============================================================

import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  spawn,
} from 'node:child_process';

import ffmpegPath from 'ffmpeg-static';

import {
  createClient,
} from '@supabase/supabase-js';

const PORT =
  Number(
    process.env.PORT ||
      8080
  );

const SECRET =
  process.env
    .REPLAY_RENDERER_SECRET;

const SUPABASE_URL =
  process.env
    .SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

if (
  !SECRET ||
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error(
    'REPLAY_RENDERER_SECRET, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY sont requis.'
  );
}

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    }
  );

function send(
  response,
  status,
  body
) {
  response.writeHead(
    status,
    {
      'content-type':
        'application/json; charset=utf-8',
    }
  );

  response.end(
    JSON.stringify(
      body
    )
  );
}

function readJson(
  request
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const chunks =
        [];

      let size = 0;

      request.on(
        'data',
        (chunk) => {
          size +=
            chunk.length;

          if (
            size >
            2 * 1024 * 1024
          ) {
            reject(
              new Error(
                'Payload too large.'
              )
            );

            request.destroy();

            return;
          }

          chunks.push(
            chunk
          );
        }
      );

      request.on(
        'end',
        () => {
          try {
            resolve(
              JSON.parse(
                Buffer.concat(
                  chunks
                ).toString(
                  'utf8'
                )
              )
            );
          } catch (
            error
          ) {
            reject(
              error
            );
          }
        }
      );

      request.on(
        'error',
        reject
      );
    }
  );
}

async function download(
  url,
  target
) {
  const response =
    await fetch(url);

  if (
    !response.ok
  ) {
    throw new Error(
      `Media download failed: ${response.status}`
    );
  }

  const buffer =
    Buffer.from(
      await response.arrayBuffer()
    );

  await fs.writeFile(
    target,
    buffer
  );

  return target;
}

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

      let stderr =
        '';

      child.stderr.on(
        'data',
        (chunk) => {
          stderr +=
            chunk.toString();
        }
      );

      child.on(
        'error',
        reject
      );

      child.on(
        'close',
        (code) => {
          if (
            code ===
            0
          ) {
            resolve();
          } else {
            reject(
              new Error(
                `ffmpeg exited ${code}: ${stderr.slice(
                  -4000
                )}`
              )
            );
          }
        }
      );
    }
  );
}

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
    'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p,setsar=1',

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
    'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p,setsar=1',

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
        (file) =>
          `file '${file.replaceAll(
            "'",
            "'\\''"
          )}'`
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

async function render(
  payload
) {
  if (
    !payload?.replayId ||
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

  let durationMs =
    0;

  try {
    for (
      let index = 0;
      index <
      payload.items.length;
      index += 1
    ) {
      const item =
        payload.items[
          index
        ];

      if (!item.url) {
        continue;
      }

      const extension =
        item.type ===
        'video'
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

      await download(
        item.url,
        source
      );

      await runFfmpeg(
        item.type ===
          'video'
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
          duration *
            1000
        );
    }

    if (
      !clips.length
    ) {
      throw new Error(
        'NO_RENDERABLE_MEDIA'
      );
    }

    const outputFile =
      path.join(
        work,
        'replay.mp4'
      );

    await concatClips(
      clips,
      outputFile
    );

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

    const outputPath =
      `${payload.eventId}/replays/${payload.replayId}.mp4`;

    const thumbnailPath =
      `${payload.eventId}/replays/${payload.replayId}.jpg`;

    const outputBuffer =
      await fs.readFile(
        outputFile
      );

    const thumbnailBuffer =
      await fs.readFile(
        thumbnailFile
      );

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

    return {
      outputPath,
      thumbnailPath,
      durationMs,
    };
  } finally {
    await fs.rm(
      work,
      {
        recursive:
          true,

        force:
          true,
      }
    );
  }
}

const server =
  http.createServer(
    async (
      request,
      response
    ) => {
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
          }
        );
      }

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

      if (
        request.headers[
          'x-renderer-secret'
        ] !==
        SECRET
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

      try {
        const payload =
          await readJson(
            request
          );

        const result =
          await render(
            payload
          );

        return send(
          response,
          200,
          result
        );
      } catch (
        error
      ) {
        console.error(
          '[Everia renderer]',
          error
        );

        return send(
          response,
          400,
          {
            error:
              error?.message ||
              'Render failed',
          }
        );
      }
    }
  );

server.listen(
  PORT,
  () => {
    console.log(
      `Everia replay renderer listening on ${PORT}`
    );
  }
);