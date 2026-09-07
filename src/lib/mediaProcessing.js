// src/lib/mediaProcessing.js
// ============================================================
// EVERIA — MEDIA PROCESSING CLIENT
// ============================================================
//
// Le mobile :
// - déclenche un job immédiatement après upload
// - consulte ses propres jobs
// - reprend uniquement ses jobs
//
// Le mobile ne déclenche PLUS l'action "drain" globale.
// Le "drain" doit être réservé au worker serveur / cron.
// ============================================================

import {
  supabase,
} from '@/lib/supabase';

// ============================================================
// CONSTANTS
// ============================================================

const FUNCTION_NAME =
  'media-process';

const DEFAULT_RESUME_LIMIT =
  5;

const MAX_RESUME_LIMIT =
  10;

// ============================================================
// ERROR
// ============================================================

function normalizeFunctionError(
  error,
  fallback
) {
  if (
    error?.message
  ) {
    return new Error(
      error.message
    );
  }

  return new Error(
    fallback ||
      'Erreur du service de traitement média.'
  );
}

// ============================================================
// FUNCTION INVOKE
// ============================================================

async function invoke(
  body
) {
  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      FUNCTION_NAME,
      {
        body,
      }
    );

  if (
    error
  ) {
    throw normalizeFunctionError(
      error
    );
  }

  return data;
}

// ============================================================
// PROCESS ONE MEDIA
// ============================================================

export async function processMedia(
  mediaId
) {
  if (
    !mediaId
  ) {
    throw new Error(
      'mediaId est requis.'
    );
  }

  return invoke({
    action:
      'process',

    mediaId,
  });
}

// ============================================================
// PROCESS ONE JOB
// ============================================================

export async function processMediaJob(
  jobId
) {
  if (
    !jobId
  ) {
    throw new Error(
      'jobId est requis.'
    );
  }

  return invoke({
    action:
      'process',

    jobId,
  });
}

// ============================================================
// GET JOB
// ============================================================

export async function getMediaProcessingJob(
  mediaId
) {
  if (
    !mediaId
  ) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'media_processing_jobs'
      )
      .select(
        '*'
      )
      .eq(
        'media_id',
        mediaId
      )
      .order(
        'created_at',
        {
          ascending:
            false,
        }
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data;
}

// ============================================================
// GET CURRENT USER JOBS
// ============================================================

async function getMyPendingMediaJobs(
  limit
) {
  const safeLimit =
    Math.min(
      Math.max(
        Number(
          limit
        ) ||
          DEFAULT_RESUME_LIMIT,
        1
      ),
      MAX_RESUME_LIMIT
    );

  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth.getUser();

  if (
    userError
  ) {
    throw userError;
  }

  if (
    !user?.id
  ) {
    return [];
  }

  /*
   * On récupère uniquement les jobs dont le média
   * appartient à l'utilisateur courant.
   *
   * On ne demande volontairement pas au serveur de
   * faire un "drain" global.
   */

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'media_processing_jobs'
      )
      .select(
        `
          *,
          media:media_id(
            id,
            event_id,
            uploader_user_id,
            status,
            deleted_at
          )
        `
      )
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

  /*
   * Double protection côté client.
   * La RLS reste la vraie protection côté Supabase.
   */

  return (
    data ||
    []
  ).filter(
    (
      job
    ) =>
      job?.media?.uploader_user_id ===
        user.id &&
      !job?.media?.deleted_at
  );
}

// ============================================================
// RESUME MY JOBS
// ============================================================
//
// Cette fonction remplace complètement l'ancien appel:
//
//   action: "drain"
//
// Elle ne touche jamais aux jobs des autres utilisateurs.
//

export async function resumeMyMediaJobs(
  limit =
    DEFAULT_RESUME_LIMIT
) {
  try {
    const jobs =
      await getMyPendingMediaJobs(
        limit
      );

    if (
      !jobs.length
    ) {
      return {
        processed:
          0,

        failed:
          0,

        skipped:
          0,

        total:
          0,
      };
    }

    let processed =
      0;

    let failed =
      0;

    let skipped =
      0;

    for (
      const job of
        jobs
    ) {
      try {
        /*
         * Si le média a déjà été traité entre le SELECT
         * et maintenant, le backend retournera simplement
         * l'état approprié.
         */

        const result =
          await processMediaJob(
            job.id
          );

        const status =
          result?.status;

        if (
          [
            'completed',
            'already_ready',
            'already_completed',
          ].includes(
            status
          )
        ) {
          processed +=
            1;
        } else if (
          status ===
          'skipped'
        ) {
          skipped +=
            1;
        }
      } catch (
        error
      ) {
        failed +=
          1;

        /*
         * Une erreur sur un job ne doit jamais interrompre
         * la reprise des autres jobs.
         */

        console.warn(
          '[Everia] Media job resume failed:',
          {
            jobId:
              job.id,

            mediaId:
              job.media_id,

            message:
              error?.message ||
              String(
                error
              ),
          }
        );
      }
    }

    return {
      processed,

      failed,

      skipped,

      total:
        jobs.length,
    };
  } catch (
    error
  ) {
    /*
     * Le démarrage de l'application ne doit jamais
     * dépendre du worker média.
     */

    console.warn(
      '[Everia] Unable to resume media jobs safely:',
      error?.message ||
        error
    );

    return {
      processed:
        0,

      failed:
        0,

      skipped:
        0,

      total:
        0,

      error:
        error,
    };
  }
}

// ============================================================
// RETRY
// ============================================================

export async function retryMediaProcessing(
  mediaId
) {
  if (
    !mediaId
  ) {
    throw new Error(
      'mediaId est requis.'
    );
  }

  return invoke({
    action:
      'retry',

    mediaId,
  });
}

// ============================================================
// ANALYZE MEDIA
// ============================================================
//
// Cette fonction correspond au moteur IA séparé.
//

export async function analyzeMedia(
  mediaId
) {
  if (
    !mediaId
  ) {
    throw new Error(
      'mediaId est requis.'
    );
  }

  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      'media-ai',
      {
        body: {
          action:
            'analyze',

          mediaId,
        },
      }
    );

  if (
    error
  ) {
    throw normalizeFunctionError(
      error,
      'Impossible de lancer l’analyse IA.'
    );
  }

  return data;
}

// ============================================================
// REFRESH STORY
// ============================================================

export async function refreshEventStory(
  eventId
) {
  if (
    !eventId
  ) {
    throw new Error(
      'eventId est requis.'
    );
  }

  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      'media-ai',
      {
        body: {
          action:
            'refresh_story',

          eventId,
        },
      }
    );

  if (
    error
  ) {
    throw normalizeFunctionError(
      error,
      'Impossible de reconstruire la narration Everia.'
    );
  }

  return data;
}