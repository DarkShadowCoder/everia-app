// supabase/functions/media-process/index.js
// ------------------------------------------------------------
// Pipeline média principal Everia.
//
// source
//   ↓
// display / thumbnail
//   ↓
// media.status = ready
//   ↓
// media-ai
//
// L'analyse IA est découplée du traitement média principal.
// Si l'IA échoue, le média reste accessible.
// ------------------------------------------------------------

import {
  serve,
} from 'https://deno.land/std@0.224.0/http/server.ts';

import {
  createClient,
} from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// ============================================================
// ENV
// ============================================================

const SUPABASE_URL =
  Deno.env.get(
    'SUPABASE_URL'
  );

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get(
    'SUPABASE_SERVICE_ROLE_KEY'
  );

const SUPABASE_ANON_KEY =
  Deno.env.get(
    'SUPABASE_ANON_KEY'
  );

const MEDIA_WORKER_SECRET =
  Deno.env.get(
    'EVERIA_MEDIA_WORKER_SECRET'
  );

const INTERNAL_WORKER_SECRET =
  Deno.env.get(
    'EVERIA_INTERNAL_WORKER_SECRET'
  );

const MEDIA_BUCKET =
  'event-media';

const AI_FUNCTION =
  'media-ai';

const WORKER_ID =
  `everia-media-worker-${crypto.randomUUID()}`;

const DEFAULT_MAX_ATTEMPTS =
  5;

const DEFAULT_BATCH_SIZE =
  5;

const MAX_BATCH_SIZE =
  10;

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error(
    'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants.'
  );
}

const admin =
  createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken:
          false,

        persistSession:
          false,

        detectSessionInUrl:
          false,
      },
    }
  );

// ============================================================
// CORS
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin':
    '*',

  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-everia-media-worker-secret',

  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
};

// ============================================================
// JSON
// ============================================================

function json(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(
      data
    ),
    {
      status,

      headers: {
        ...corsHeaders,

        'Content-Type':
          'application/json',
      },
    }
  );
}

// ============================================================
// HELPERS
// ============================================================

function isUuid(
  value
) {
  return (
    typeof value ===
      'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function positiveInt(
  value,
  fallback
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  ) &&
    number >
      0
    ? Math.floor(
        number
      )
    : fallback;
}

function isImage(
  media
) {
  return (
    media?.media_type ===
      'photo' ||
    media?.mime_type?.startsWith(
      'image/'
    )
  );
}

function isVideo(
  media
) {
  return (
    media?.media_type ===
      'video' ||
    media?.mime_type?.startsWith(
      'video/'
    )
  );
}

function extensionFromMedia(
  media
) {
  const name =
    media?.file_name ||
    '';

  const match =
    name.match(
      /\.([a-z0-9]+)$/i
    );

  if (
    match?.[1]
  ) {
    return match[1].toLowerCase();
  }

  const mimeMap = {
    'image/jpeg':
      'jpg',

    'image/jpg':
      'jpg',

    'image/png':
      'png',

    'image/webp':
      'webp',

    'image/heic':
      'heic',

    'image/heif':
      'heif',

    'video/mp4':
      'mp4',

    'video/quicktime':
      'mov',

    'video/webm':
      'webm',
  };

  return (
    mimeMap[
      media?.mime_type
    ] ||
    (
      isVideo(
        media
      )
        ? 'mp4'
        : 'jpg'
    )
  );
}

// ============================================================
// AUTH
// ============================================================

async function authenticate(
  request
) {
  const workerSecret =
    request.headers.get(
      'x-everia-media-worker-secret'
    );

  if (
    MEDIA_WORKER_SECRET &&
    workerSecret ===
      MEDIA_WORKER_SECRET
  ) {
    return {
      type:
        'worker',

      user:
        null,
    };
  }

  const authorization =
    request.headers.get(
      'Authorization'
    );

  if (
    !authorization?.startsWith(
      'Bearer '
    )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(
        7
      )
      .trim();

  if (
    !token
  ) {
    return null;
  }

  const client =
    createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY ||
        SUPABASE_SERVICE_ROLE_KEY,
      {
        global: {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },

        auth: {
          autoRefreshToken:
            false,

          persistSession:
            false,

          detectSessionInUrl:
            false,
        },
      }
    );

  const {
    data,
    error,
  } =
    await client.auth.getUser();

  if (
    error ||
    !data?.user
  ) {
    return null;
  }

  return {
    type:
      'user',

    user:
      data.user,
  };
}

// ============================================================
// MEDIA
// ============================================================

async function loadMedia(
  mediaId
) {
  const {
    data,
    error,
  } =
    await admin
      .from(
        'media'
      )
      .select('*')
      .eq(
        'id',
        mediaId
      )
      .single();

  if (
    error ||
    !data
  ) {
    throw new Error(
      'Média introuvable.'
    );
  }

  return data;
}

// ============================================================
// AUTHORIZATION
// ============================================================

async function authorizeMedia(
  auth,
  media
) {
  if (
    auth?.type ===
    'worker'
  ) {
    return true;
  }

  if (
    auth?.type !==
      'user' ||
    !auth.user
  ) {
    return false;
  }

  if (
    media.uploader_user_id ===
    auth.user.id
  ) {
    return true;
  }

  const {
    data,
  } =
    await admin
      .from(
        'event_members'
      )
      .select(
        'role, status'
      )
      .eq(
        'event_id',
        media.event_id
      )
      .eq(
        'user_id',
        auth.user.id
      )
      .maybeSingle();

  return (
    data?.status ===
      'joined' &&
    [
      'owner',
      'admin',
      'organizer',
    ].includes(
      data?.role
    )
  );
}

// ============================================================
// SIGNED URL
// ============================================================

async function createSignedSourceUrl(
  media
) {
  const {
    data,
    error,
  } =
    await admin.storage
      .from(
        MEDIA_BUCKET
      )
      .createSignedUrl(
        media.original_path,
        300
      );

  if (
    error ||
    !data?.signedUrl
  ) {
    throw new Error(
      `Source introuvable : ${media.original_path}`
    );
  }

  return data.signedUrl;
}

// ============================================================
// DERIVATIVE PATH
// ============================================================

function derivativePath(
  media,
  kind
) {
  if (
    kind ===
    'thumbnail'
  ) {
    return `${media.event_id}/thumbnails/${media.id}.jpg`;
  }

  return `${media.event_id}/display/${media.id}.${extensionFromMedia(
    media
  )}`;
}

// ============================================================
// TRANSFORM URL
// ============================================================

function transformUrl(
  path,
  options
) {
  const encoded =
    path
      .split('/')
      .map(
        (
          segment
        ) =>
          encodeURIComponent(
            segment
          )
      )
      .join('/');

  const params =
    new URLSearchParams({
      resize:
        'contain',
    });

  if (
    options.width
  ) {
    params.set(
      'width',
      String(
        options.width
      )
    );
  }

  if (
    options.height
  ) {
    params.set(
      'height',
      String(
        options.height
      )
    );
  }

  if (
    options.quality
  ) {
    params.set(
      'quality',
      String(
        options.quality
      )
    );
  }

  return `${SUPABASE_URL}/storage/v1/render/image/authenticated/${MEDIA_BUCKET}/${encoded}?${params.toString()}`;
}

// ============================================================
// IMAGE DERIVATIVE
// ============================================================

async function createImageDerivative(
  media,
  sourceUrl,
  kind
) {
  if (
    !isImage(
      media
    )
  ) {
    return null;
  }

  const targetPath =
    derivativePath(
      media,
      kind
    );

  let body =
    null;

  let contentType =
    'image/jpeg';

  try {
    const response =
      await fetch(
        transformUrl(
          media.original_path,
          kind ===
            'thumbnail'
            ? {
                width:
                  640,

                height:
                  640,

                quality:
                  78,
              }
            : {
                width:
                  1920,

                height:
                  1920,

                quality:
                  84,
              }
        ),
        {
          headers: {
            Authorization:
              `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,

            apikey:
              SUPABASE_SERVICE_ROLE_KEY,
          },
        }
      );

    if (
      response.ok
    ) {
      body =
        await response.arrayBuffer();

      contentType =
        response.headers.get(
          'content-type'
        ) ||
        'image/jpeg';
    }
  } catch (
    error
  ) {
    console.warn(
      '[Everia] Storage transform failed:',
      error?.message
    );
  }

  if (
    !body
  ) {
    const response =
      await fetch(
        sourceUrl
      );

    if (
      !response.ok
    ) {
      throw new Error(
        `Impossible de lire la source pour ${kind}.`
      );
    }

    body =
      await response.arrayBuffer();

    contentType =
      response.headers.get(
        'content-type'
      ) ||
      'image/jpeg';
  }

  const {
    error,
  } =
    await admin.storage
      .from(
        MEDIA_BUCKET
      )
      .upload(
        targetPath,
        body,
        {
          contentType,

          cacheControl:
            '31536000',

          upsert:
            true,
        }
      );

  if (
    error
  ) {
    throw error;
  }

  return {
    path:
      targetPath,

    contentType,
  };
}

// ============================================================
// CLAIM JOB
// ============================================================

async function claimJob(
  job
) {
  const maxAttempts =
    positiveInt(
      job.max_attempts,
      DEFAULT_MAX_ATTEMPTS
    );

  const nextAttempt =
    Number(
      job.attempt ||
        0
    ) + 1;

  if (
    nextAttempt >
    maxAttempts
  ) {
    return {
      claimed:
        false,

      exhausted:
        true,
    };
  }

  if (
    [
      'completed',
      'skipped',
    ].includes(
      job.status
    )
  ) {
    return {
      claimed:
        false,

      terminal:
        true,
    };
  }

  const {
    data,
    error,
  } =
    await admin
      .from(
        'media_processing_jobs'
      )
      .update({
        status:
          'running',

        attempt:
          nextAttempt,

        max_attempts:
          maxAttempts,

        worker_id:
          WORKER_ID,

        started_at:
          new Date().toISOString(),

        completed_at:
          null,

        error_code:
          null,

        error_message:
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        job.id
      )
      .in(
        'status',
        [
          'queued',
          'failed',
        ]
      )
      .select('*')
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  if (
    !data
  ) {
    return {
      claimed:
        false,

      busy:
        true,
    };
  }

  return {
    claimed:
      true,

    job:
      data,
  };
}

// ============================================================
// COMPLETE JOB
// ============================================================

async function markCompleted(
  jobId
) {
  const {
    data,
    error,
  } =
    await admin
      .from(
        'media_processing_jobs'
      )
      .update({
        status:
          'completed',

        completed_at:
          new Date().toISOString(),

        worker_id:
          WORKER_ID,

        error_code:
          null,

        error_message:
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        jobId
      )
      .eq(
        'status',
        'running'
      )
      .select('*')
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  if (
    !data
  ) {
    throw new Error(
      'Impossible de finaliser le job.'
    );
  }

  return data;
}

// ============================================================
// FAIL JOB
// ============================================================

async function markFailed(
  job,
  error,
  terminal
) {
  const {
    error:
      updateError,
  } =
    await admin
      .from(
        'media_processing_jobs'
      )
      .update({
        status:
          terminal
            ? 'failed'
            : 'queued',

        worker_id:
          WORKER_ID,

        error_code:
          error?.code ||
          'MEDIA_PROCESSING_ERROR',

        error_message:
          error?.message ||
          'Erreur inconnue.',

        completed_at:
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        job.id
      );

  if (
    updateError
  ) {
    console.error(
      '[Everia] markFailed error:',
      updateError
    );
  }
}

// ============================================================
// TRIGGER AI
// ============================================================

async function triggerMediaAI(
  mediaId
) {
  if (
    !INTERNAL_WORKER_SECRET
  ) {
    return {
      status:
        'skipped',

      reason:
        'EVERIA_INTERNAL_WORKER_SECRET_missing',
    };
  }

  try {
    const response =
      await fetch(
        `${SUPABASE_URL}/functions/v1/${AI_FUNCTION}`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',

            'x-everia-worker-secret':
              INTERNAL_WORKER_SECRET,
          },

          body:
            JSON.stringify({
              action:
                'analyze',

              mediaId,
            }),
        }
      );

    const body =
      await response
        .json()
        .catch(
          () => ({})
        );

    if (
      !response.ok
    ) {
      throw new Error(
        body?.error ||
          `media-ai HTTP ${response.status}`
      );
    }

    return body;
  } catch (
    error
  ) {
    console.warn(
      '[Everia] media-ai trigger failed:',
      error?.message
    );

    return {
      status:
        'failed',

      error:
        error?.message,
    };
  }
}

// ============================================================
// PROCESS JOB
// ============================================================

async function processJob(
  originalJob,
  auth
) {
  const media =
    await loadMedia(
      originalJob.media_id
    );

  if (
    !(
      await authorizeMedia(
        auth,
        media
      )
    )
  ) {
    throw new Error(
      'Accès refusé.'
    );
  }

  if (
    media.deleted_at
  ) {
    await admin
      .from(
        'media_processing_jobs'
      )
      .update({
        status:
          'skipped',

        completed_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        originalJob.id
      );

    return {
      status:
        'skipped',

      reason:
        'media_deleted',

      mediaId:
        media.id,
    };
  }

  if (
    [
      'ready',
      'published',
    ].includes(
      media.status
    )
  ) {
    await admin
      .from(
        'media_processing_jobs'
      )
      .update({
        status:
          'completed',

        completed_at:
          new Date().toISOString(),

        error_code:
          null,

        error_message:
          null,
      })
      .eq(
        'id',
        originalJob.id
      );

    const ai =
      media
        .processing_metadata
        ?.ai
        ?.status ===
      'completed'
        ? {
            status:
              'already_completed',
          }
        : await triggerMediaAI(
            media.id
          );

    return {
      status:
        'already_ready',

      mediaId:
        media.id,

      ai,
    };
  }

  const claim =
    await claimJob(
      originalJob
    );

  if (
    claim.exhausted
  ) {
    throw new Error(
      'Nombre maximal de tentatives atteint.'
    );
  }

  if (
    claim.terminal
  ) {
    return {
      status:
        'already_completed',

      mediaId:
        media.id,
    };
  }

  if (
    claim.busy
  ) {
    return {
      status:
        'already_processing',

      mediaId:
        media.id,
    };
  }

  if (
    !claim.claimed ||
    !claim.job
  ) {
    return {
      status:
        'not_claimed',

      mediaId:
        media.id,
    };
  }

  const job =
    claim.job;

  try {
    const sourceUrl =
      await createSignedSourceUrl(
        media
      );

    let displayPath =
      media.display_path ||
      media.original_path;

    let thumbnailPath =
      media.thumbnail_path ||
      null;

    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    if (
      isImage(
        media
      )
    ) {
      const display =
        await createImageDerivative(
          media,

          sourceUrl,

          'display'
        );

      const thumbnail =
        await createImageDerivative(
          media,

          sourceUrl,

          'thumbnail'
        );

      displayPath =
        display?.path ||
        displayPath;

      thumbnailPath =
        thumbnail?.path ||
        thumbnailPath;
    }

    // --------------------------------------------------------
    // VIDEO
    // --------------------------------------------------------

    if (
      isVideo(
        media
      )
    ) {
      displayPath =
        media.original_path;

      thumbnailPath =
        media.thumbnail_path ||
        null;
    }

    // --------------------------------------------------------
    // METADATA
    // --------------------------------------------------------

    const processedAt =
      new Date().toISOString();

    const processingMetadata =
      {
        ...(media.processing_metadata ||
          {}),

        pipeline_version:
          '3.0.0',

        processed_at:
          processedAt,

        worker_id:
          WORKER_ID,

        job_id:
          job.id,

        display_path:
          displayPath,

        thumbnail_path:
          thumbnailPath,

        media_type:
          media.media_type,

        mime_type:
          media.mime_type ||
          null,

        ai: {
          status:
            media
              .processing_metadata
              ?.ai
              ?.status ||
            'queued',
        },
      };

    // --------------------------------------------------------
    // UPDATE MEDIA
    // --------------------------------------------------------

    const {
      data:
        updated,
      error,
    } =
      await admin
        .from(
          'media'
        )
        .update({
          status:
            'ready',

          display_path:
            displayPath,

          thumbnail_path:
            thumbnailPath,

          processing_metadata:
            processingMetadata,

          processing_error:
            null,

          processing_started_at:
            job.started_at,

          processed_at:
            processedAt,

          updated_at:
            processedAt,
        })
        .eq(
          'id',
          media.id
        )
        .select('*')
        .single();

    if (
      error
    ) {
      throw error;
    }

    if (
      !updated
    ) {
      throw new Error(
        'Le média n’a pas pu être mis à jour.'
      );
    }

    await markCompleted(
      job.id
    );

    // --------------------------------------------------------
    // AI
    // --------------------------------------------------------

    const ai =
      await triggerMediaAI(
        media.id
      );

    return {
      status:
        'completed',

      mediaId:
        media.id,

      jobId:
        job.id,

      displayPath,

      thumbnailPath,

      ai,
    };
  } catch (
    error
  ) {
    const attempt =
      Number(
        job.attempt ||
          1
      );

    const maxAttempts =
      positiveInt(
        job.max_attempts,
        DEFAULT_MAX_ATTEMPTS
      );

    const terminal =
      attempt >=
      maxAttempts;

    await admin
      .from(
        'media'
      )
      .update({
        status:
          terminal
            ? 'failed'
            : 'pending',

        processing_error:
          error?.message ||
          'Erreur inconnue.',

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        media.id
      );

    await markFailed(
      job,
      error,
      terminal
    );

    throw error;
  }
}

// ============================================================
// DRAIN
// ============================================================

async function drainJobs(
  auth,
  limit
) {
  const safeLimit =
    Math.min(
      positiveInt(
        limit,
        DEFAULT_BATCH_SIZE
      ),
      MAX_BATCH_SIZE
    );

  const {
    data,
    error,
  } =
    await admin
      .from(
        'media_processing_jobs'
      )
      .select('*')
      .in(
        'status',
        [
          'queued',
          'failed',
        ]
      )
      .order(
        'priority',
        {
          ascending:
            false,
        }
      )
      .order(
        'queued_at',
        {
          ascending:
            true,
        }
      )
      .limit(
        safeLimit
      );

  if (
    error
  ) {
    throw error;
  }

  const jobs =
    [];

  for (
    const job of
      data ||
    []
  ) {
    const media =
      await loadMedia(
        job.media_id
      ).catch(
        () =>
          null
      );

    if (
      !media?.deleted_at &&
      (
        auth.type ===
          'worker' ||
        media.uploader_user_id ===
          auth.user.id
      )
    ) {
      jobs.push(
        job
      );
    }
  }

  let processed =
    0;

  let failed =
    0;

  let busy =
    0;

  for (
    const job of
      jobs
  ) {
    try {
      const result =
        await processJob(
          job,
          auth
        );

      if (
        [
          'completed',
          'already_ready',
          'already_completed',
        ].includes(
          result.status
        )
      ) {
        processed +=
          1;
      } else if (
        result.status ===
        'already_processing'
      ) {
        busy +=
          1;
      }
    } catch (
      error
    ) {
      failed +=
        1;

      console.warn(
        '[Everia] Media job failed:',
        job.id,
        error?.message
      );
    }
  }

  return {
    processed,

    failed,

    busy,

    total:
      jobs.length,
  };
}

// ============================================================
// FIND JOB
// ============================================================

async function findJob({
  jobId,
  mediaId,
}) {
  let query =
    admin
      .from(
        'media_processing_jobs'
      )
      .select('*')
      .order(
        'created_at',
        {
          ascending:
            false,
        }
      )
      .limit(
        1
      );

  if (
    isUuid(
      jobId
    )
  ) {
    query =
      query.eq(
        'id',
        jobId
      );
  } else if (
    isUuid(
      mediaId
    )
  ) {
    query =
      query.eq(
        'media_id',
        mediaId
      );
  } else {
    throw new Error(
      'jobId ou mediaId invalide.'
    );
  }

  const {
    data,
    error,
  } =
    await query.maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  if (
    !data
  ) {
    throw new Error(
      'Job de traitement introuvable.'
    );
  }

  return data;
}

// ============================================================
// RETRY
// ============================================================

async function retryJob(
  mediaId,
  auth
) {
  const media =
    await loadMedia(
      mediaId
    );

  if (
    !(
      await authorizeMedia(
        auth,
        media
      )
    )
  ) {
    throw new Error(
      'Accès refusé.'
    );
  }

  const job =
    await findJob({
      mediaId,
    });

  if (
    job.status ===
    'running'
  ) {
    return {
      status:
        'already_processing',

      mediaId,

      jobId:
        job.id,
    };
  }

  if (
    job.status ===
      'completed' &&
    media.status ===
      'ready'
  ) {
    return {
      status:
        'already_completed',

      mediaId,

      jobId:
        job.id,
    };
  }

  const maxAttempts =
    positiveInt(
      job.max_attempts,
      DEFAULT_MAX_ATTEMPTS
    );

  const attempt =
    Number(
      job.attempt ||
        0
    );

  const nextAttempt =
    attempt >=
    maxAttempts
      ? 0
      : attempt;

  const {
    data:
      updated,
    error,
  } =
    await admin
      .from(
        'media_processing_jobs'
      )
      .update({
        status:
          'queued',

        attempt:
          nextAttempt,

        max_attempts:
          maxAttempts,

        worker_id:
          null,

        queued_at:
          new Date().toISOString(),

        started_at:
          null,

        completed_at:
          null,

        error_code:
          null,

        error_message:
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        job.id
      )
      .in(
        'status',
        [
          'failed',
          'skipped',
          'queued',
        ]
      )
      .select('*')
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  if (
    !updated
  ) {
    throw new Error(
      'Le job ne peut pas être relancé.'
    );
  }

  await admin
    .from(
      'media'
    )
    .update({
      status:
        'pending',

      processing_error:
        null,

      processing_started_at:
        null,

      processed_at:
        null,
    })
    .eq(
      'id',
      mediaId
    );

  return processJob(
    updated,
    auth
  );
}

// ============================================================
// SERVER
// ============================================================

serve(
  async (
    request
  ) => {
    if (
      request.method ===
      'OPTIONS'
    ) {
      return new Response(
        'ok',
        {
          headers:
            corsHeaders,
        }
      );
    }

    if (
      request.method !==
      'POST'
    ) {
      return json(
        {
          error:
            'Méthode non autorisée.',
        },
        405
      );
    }

    try {
      const auth =
        await authenticate(
          request
        );

      if (
        !auth
      ) {
        return json(
          {
            error:
              'Non authentifié.',
          },
          401
        );
      }

      const body =
        await request
          .json()
          .catch(
            () => ({})
          );

      const action =
        body?.action ||
        'process';

      if (
        action ===
        'drain'
      ) {
        return json(
          await drainJobs(
            auth,
            body.limit
          )
        );
      }

      if (
        action ===
        'retry'
      ) {
        if (
          !isUuid(
            body.mediaId
          )
        ) {
          return json(
            {
              error:
                'mediaId invalide.',
            },
            400
          );
        }

        return json(
          await retryJob(
            body.mediaId,
            auth
          )
        );
      }

      if (
        action !==
        'process'
      ) {
        return json(
          {
            error:
              `Action inconnue : ${action}`,
          },
          400
        );
      }

      if (
        !isUuid(
          body.jobId
        ) &&
        !isUuid(
          body.mediaId
        )
      ) {
        return json(
          {
            error:
              'jobId ou mediaId est requis.',
          },
          400
        );
      }

      const job =
        await findJob({
          jobId:
            body.jobId,

          mediaId:
            body.mediaId,
        });

      return json(
        await processJob(
          job,
          auth
        )
      );
    } catch (
      error
    ) {
      console.error(
        '[Everia] media-process error:',
        error
      );

      return json(
        {
          error:
            error?.message ||
            'Erreur de traitement média.',
        },
        500
      );
    }
  }
);