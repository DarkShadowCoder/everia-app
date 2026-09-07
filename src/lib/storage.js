
// src/lib/storage.js
// ============================================================
// EVERIA — Storage Service
// ============================================================
//
// Buckets :
//
// event-media
// event-covers
// avatars
// replays
// exports
//
// Convention :
//
// event-media
//   {eventId}/{uploaderId}/{timestamp}-{fileName}
//
// event-covers
//   {eventId}/cover.{extension}
//
// avatars
//   {userId}/{fileName}
//
// replays
//   {eventId}/{replayId}/{fileName}
//
// exports
//   {userId}/{exportId}/{fileName}
//
// IMPORTANT
// ------------------------------------------------------------
// Les fonctions de résolution de bucket ne doivent PAS forcer
// event-media avant d'avoir analysé le chemin.
// ============================================================

import {
  supabase,
} from '@/lib/supabase';

import {
  STORAGE_BUCKET,
} from '@/constants/config';

// ============================================================
// CONSTANTS
// ============================================================

export const STORAGE_BUCKETS = {
  MEDIA:
    'event-media',

  COVERS:
    'event-covers',

  AVATARS:
    'avatars',

  REPLAYS:
    'replays',

  EXPORTS:
    'exports',
};

// ============================================================
// HELPERS
// ============================================================

function isHttpUrl(
  value
) {
  return (
    typeof value ===
      'string' &&
    (
      value.startsWith(
        'https://'
      ) ||
      value.startsWith(
        'http://'
      )
    )
  );
}

function normalizePath(
  path
) {
  if (
    typeof path !==
    'string'
  ) {
    return '';
  }

  return path
    .trim()
    .replace(
      /^\/+/,
      ''
    );
}

function fileNameFromPath(
  path
) {
  const normalized =
    normalizePath(
      path
    );

  if (
    !normalized
  ) {
    return '';
  }

  const parts =
    normalized.split(
      '/'
    );

  return (
    parts[
      parts.length - 1
    ] || ''
  );
}

function extensionFromPath(
  path
) {
  const fileName =
    fileNameFromPath(
      path
    );

  const match =
    fileName.match(
      /\.([a-z0-9]+)$/i
    );

  return (
    match?.[1]
      ?.toLowerCase() ||
    null
  );
}

function isValidUuid(
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

// ============================================================
// BUCKET DETECTION
// ============================================================
//
// Cette fonction est volontairement indépendante du défaut
// STORAGE_BUCKET.
//
// Exemple:
//
// resolveStorageBucket('eventId/cover.jpeg')
// → event-covers
//
// resolveStorageBucket('eventId/userId/photo.jpg')
// → event-media
// ============================================================

export function resolveStorageBucket(
  path,
  explicitBucket = null
) {
  if (
    explicitBucket
  ) {
    return explicitBucket;
  }

  const normalized =
    normalizePath(
      path
    );

  if (
    !normalized
  ) {
    return (
      STORAGE_BUCKET ||
      STORAGE_BUCKETS.MEDIA
    );
  }

  const lower =
    normalized.toLowerCase();

  // ----------------------------------------------------------
  // URL
  // ----------------------------------------------------------

  if (
    isHttpUrl(
      normalized
    )
  ) {
    return (
      STORAGE_BUCKET ||
      STORAGE_BUCKETS.MEDIA
    );
  }

  // ----------------------------------------------------------
  // COVER EVENT
  // ----------------------------------------------------------
  //
  // supporte :
  //
  // eventId/cover.jpg
  // eventId/cover.jpeg
  // eventId/cover.png
  // eventId/cover.webp
  //
  // et :
  //
  // eventId/cover
  // ----------------------------------------------------------

  if (
    /(?:^|\/)cover(?:\.[a-z0-9]+)?$/i.test(
      lower
    )
  ) {
    return (
      STORAGE_BUCKETS.COVERS
    );
  }

  // ----------------------------------------------------------
  // AVATAR
  // ----------------------------------------------------------

  if (
    /(?:^|\/)avatar(?:\.[a-z0-9]+)?$/i.test(
      lower
    ) ||
    lower.includes(
      '/avatars/'
    )
  ) {
    return (
      STORAGE_BUCKETS.AVATARS
    );
  }

  // ----------------------------------------------------------
  // REPLAY
  // ----------------------------------------------------------

  if (
    lower.includes(
      '/replay/'
    ) ||
    lower.includes(
      '/replays/'
    ) ||
    /\.(mp4|mov|m4v|webm)$/i.test(
      lower
    )
  ) {
    /*
     * Attention :
     *
     * On ne bascule automatiquement vers "replays" que pour
     * les chemins contenant explicitement replay/replays.
     *
     * Une vidéo normale d'événement reste dans event-media.
     */
    if (
      lower.includes(
        '/replay/'
      ) ||
      lower.includes(
        '/replays/'
      )
    ) {
      return (
        STORAGE_BUCKETS.REPLAYS
      );
    }
  }

  // ----------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------

  if (
    lower.includes(
      '/export/'
    ) ||
    lower.includes(
      '/exports/'
    )
  ) {
    return (
      STORAGE_BUCKETS.EXPORTS
    );
  }

  // ----------------------------------------------------------
  // DEFAULT
  // ----------------------------------------------------------

  return (
    STORAGE_BUCKET ||
    STORAGE_BUCKETS.MEDIA
  );
}

// ============================================================
// BACKWARD COMPATIBILITY
// ============================================================
//
// L'ancien code appelait resolveMediaBucket().
//
// On conserve donc cette fonction.
// ============================================================

export function resolveMediaBucket(
  path,
  explicitBucket = null
) {
  return resolveStorageBucket(
    path,
    explicitBucket
  );
}

// ============================================================
// GET URL
// ============================================================

function ensureNormalizedPath(
  path
) {
  const normalized =
    normalizePath(
      path
    );

  if (
    !normalized
  ) {
    return null;
  }

  return normalized;
}

// ============================================================
// PUBLIC URL
// ============================================================

export function publicMediaUrl(
  path,
  bucket = null
) {
  if (
    !path
  ) {
    return null;
  }

  if (
    isHttpUrl(
      path
    )
  ) {
    return path;
  }

  const normalizedPath =
    ensureNormalizedPath(
      path
    );

  if (
    !normalizedPath
  ) {
    return null;
  }

  /*
   * IMPORTANT :
   *
   * bucket = null signifie :
   * détecte automatiquement le bucket.
   *
   * Cela corrige notamment :
   *
   * eventId/cover.jpeg
   * →
   * event-covers
   */

  const resolvedBucket =
    resolveStorageBucket(
      normalizedPath,
      bucket
    );

  const {
    data,
  } =
    supabase.storage
      .from(
        resolvedBucket
      )
      .getPublicUrl(
        normalizedPath
      );

  return (
    data?.publicUrl ||
    null
  );
}

// ============================================================
// SIGNED URL
// ============================================================

export async function signedMediaUrl(
  path,
  {
    bucket = null,

    expiresIn =
      3600,
  } = {}
) {
  if (
    !path
  ) {
    return null;
  }

  if (
    isHttpUrl(
      path
    )
  ) {
    return path;
  }

  const normalizedPath =
    ensureNormalizedPath(
      path
    );

  if (
    !normalizedPath
  ) {
    return null;
  }

  /*
   * FIX PRINCIPAL :
   *
   * L'ancien code avait :
   *
   * bucket = STORAGE_BUCKETS.MEDIA
   *
   * ce qui forçait event-media avant la détection.
   *
   * Maintenant :
   *
   * bucket = null
   *
   * permet à resolveStorageBucket() de déterminer
   * automatiquement event-covers pour cover.jpeg.
   */

  const resolvedBucket =
    resolveStorageBucket(
      normalizedPath,
      bucket
    );

  try {
    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          resolvedBucket
        )
        .createSignedUrl(
          normalizedPath,
          expiresIn
        );

    if (
      error
    ) {
      console.warn(
        '[Everia] signedMediaUrl error:',
        {
          bucket:
            resolvedBucket,

          path:
            normalizedPath,

          message:
            error.message,
        }
      );

      return null;
    }

    return (
      data?.signedUrl ||
      null
    );
  } catch (
    error
  ) {
    console.warn(
      '[Everia] signedMediaUrl exception:',
      {
        bucket:
          resolvedBucket,

        path:
          normalizedPath,

        message:
          error?.message ||
          String(
            error
          ),
      }
    );

    return null;
  }
}

// ============================================================
// MEDIA THUMBNAIL
// ============================================================

export function mediaThumbnail(
  media
) {
  if (
    !media
  ) {
    return null;
  }

  /*
   * Event cover :
   *
   * media = {
   *   display_path: "eventId/cover.jpeg"
   * }
   *
   * Le bucket sera automatiquement résolu vers
   * event-covers.
   */

  const path =
    media.thumbnail_path ||
    media.display_path ||
    media.original_path ||
    media.cover_path;

  if (
    !path
  ) {
    return null;
  }

  /*
   * Ne FORCE PAS event-media ici.
   */

  return publicMediaUrl(
    path,
    media.bucket ||
      null
  );
}

// ============================================================
// MEDIA FULL URL
// ============================================================

export function mediaFullUrl(
  media
) {
  if (
    !media
  ) {
    return null;
  }

  const path =
    media.display_path ||
    media.original_path ||
    media.cover_path;

  if (
    !path
  ) {
    return null;
  }

  return publicMediaUrl(
    path,
    media.bucket ||
      null
  );
}

// ============================================================
// EVENT COVER
// ============================================================

export function eventCoverUrl(
  path
) {
  if (
    !path
  ) {
    return null;
  }

  /*
   * Ici on force volontairement le bucket.
   *
   * Cette fonction est dédiée exclusivement aux covers.
   */

  return publicMediaUrl(
    path,
    STORAGE_BUCKETS.COVERS
  );
}

// ============================================================
// SIGNED EVENT COVER
// ============================================================

export async function signedEventCoverUrl(
  path,
  expiresIn = 3600
) {
  if (
    !path
  ) {
    return null;
  }

  return signedMediaUrl(
    path,
    {
      bucket:
        STORAGE_BUCKETS.COVERS,

      expiresIn,
    }
  );
}

// ============================================================
// AVATAR
// ============================================================

export function avatarUrl(
  path
) {
  if (
    !path
  ) {
    return null;
  }

  return publicMediaUrl(
    path,
    STORAGE_BUCKETS.AVATARS
  );
}

// ============================================================
// SIGNED AVATAR
// ============================================================

export async function signedAvatarUrl(
  path,
  expiresIn = 3600
) {
  if (
    !path
  ) {
    return null;
  }

  return signedMediaUrl(
    path,
    {
      bucket:
        STORAGE_BUCKETS.AVATARS,

      expiresIn,
    }
  );
}

// ============================================================
// REPLAY URL
// ============================================================

export function replayUrl(
  path
) {
  if (
    !path
  ) {
    return null;
  }

  return publicMediaUrl(
    path,
    STORAGE_BUCKETS.REPLAYS
  );
}

// ============================================================
// SIGNED REPLAY URL
// ============================================================

export async function signedReplayUrl(
  path,
  expiresIn = 3600
) {
  if (
    !path
  ) {
    return null;
  }

  return signedMediaUrl(
    path,
    {
      bucket:
        STORAGE_BUCKETS.REPLAYS,

      expiresIn,
    }
  );
}

// ============================================================
// EXPORT URL
// ============================================================

export function exportUrl(
  path
) {
  if (
    !path
  ) {
    return null;
  }

  return publicMediaUrl(
    path,
    STORAGE_BUCKETS.EXPORTS
  );
}

// ============================================================
// SIGNED EXPORT URL
// ============================================================

export async function signedExportUrl(
  path,
  expiresIn = 3600
) {
  if (
    !path
  ) {
    return null;
  }

  return signedMediaUrl(
    path,
    {
      bucket:
        STORAGE_BUCKETS.EXPORTS,

      expiresIn,
    }
  );
}

// ============================================================
// UPLOAD MEDIA
// ============================================================

export async function uploadMediaFile({
  eventId,
  uploaderId,
  uri,
  fileName,
  contentType,
  bucket =
    STORAGE_BUCKETS.MEDIA,
}) {
  if (
    !isValidUuid(
      eventId
    )
  ) {
    throw new Error(
      'eventId invalide.'
    );
  }

  /*
   * Un uploader peut être absent dans certains workflows
   * invités. On ne bloque pas inutilement le média si le
   * bucket utilisé est explicitement celui des covers.
   */

  if (
    bucket ===
      STORAGE_BUCKETS.MEDIA &&
    !isValidUuid(
      uploaderId
    )
  ) {
    throw new Error(
      'uploaderId invalide.'
    );
  }

  if (
    !uri
  ) {
    throw new Error(
      'uri requise.'
    );
  }

  const originalName =
    fileName ||
    uri
      .split('/')
      .pop() ||
    `upload-${Date.now()}`;

  const safeFileName =
    originalName
      .replace(
        /[^a-zA-Z0-9._-]/g,
        '-'
      )
      .replace(
        /-+/g,
        '-'
      );

  let path;

  // ----------------------------------------------------------
  // EVENT MEDIA
  // ----------------------------------------------------------

  if (
    bucket ===
    STORAGE_BUCKETS.MEDIA
  ) {
    path =
      `${eventId}/${uploaderId}/${Date.now()}-${safeFileName}`;
  }

  // ----------------------------------------------------------
  // EVENT COVERS
  // ----------------------------------------------------------

  else if (
    bucket ===
    STORAGE_BUCKETS.COVERS
  ) {
    path =
      `${eventId}/${safeFileName}`;
  }

  // ----------------------------------------------------------
  // OTHER BUCKETS
  // ----------------------------------------------------------

  else if (
    bucket ===
    STORAGE_BUCKETS.AVATARS
  ) {
    const ownerId =
      uploaderId ||
      'anonymous';

    path =
      `${ownerId}/${Date.now()}-${safeFileName}`;
  }

  else {
    path =
      `${eventId}/${Date.now()}-${safeFileName}`;
  }

  const response =
    await fetch(
      uri
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Impossible de lire le fichier local (${response.status}).`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const {
    error,
  } =
    await supabase.storage
      .from(
        bucket
      )
      .upload(
        path,
        arrayBuffer,
        {
          contentType:
            contentType ||
            'application/octet-stream',

          cacheControl:
            '3600',

          upsert:
            false,
        }
      );

  if (
    error
  ) {
    console.error(
      '[Everia] Storage upload error:',
      {
        bucket,
        path,
        error,
      }
    );

    throw error;
  }

  return path;
}

// ============================================================
// EVENT MEDIA UPLOAD
// ============================================================

export async function uploadEventMediaFile({
  eventId,
  uploaderId,
  uri,
  fileName,
  contentType,
}) {
  return uploadMediaFile({
    eventId,
    uploaderId,
    uri,
    fileName,
    contentType,

    bucket:
      STORAGE_BUCKETS.MEDIA,
  });
}

// ============================================================
// EVENT COVER UPLOAD
// ============================================================

export async function uploadEventCoverFile({
  eventId,
  uri,
  fileName,
  contentType,
}) {
  if (
    !isValidUuid(
      eventId
    )
  ) {
    throw new Error(
      'eventId invalide.'
    );
  }

  if (
    !uri
  ) {
    throw new Error(
      'uri requise.'
    );
  }

  const originalName =
    fileName ||
    uri
      .split('/')
      .pop() ||
    `cover-${Date.now()}.jpg`;

  const safeFileName =
    originalName
      .replace(
        /[^a-zA-Z0-9._-]/g,
        '-'
      )
      .replace(
        /-+/g,
        '-'
      );

  const path =
    `${eventId}/${safeFileName}`;

  const response =
    await fetch(
      uri
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Impossible de lire la cover locale (${response.status}).`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const {
    error,
  } =
    await supabase.storage
      .from(
        STORAGE_BUCKETS.COVERS
      )
      .upload(
        path,
        arrayBuffer,
        {
          contentType:
            contentType ||
            'image/jpeg',

          cacheControl:
            '3600',

          upsert:
            true,
        }
      );

  if (
    error
  ) {
    console.error(
      '[Everia] Event cover upload error:',
      {
        bucket:
          STORAGE_BUCKETS.COVERS,

        path,

        error,
      }
    );

    throw error;
  }

  return path;
}

// ============================================================
// REMOVE MEDIA
// ============================================================

export async function removeMediaFile(
  path,
  bucket = null
) {
  if (
    !path
  ) {
    return;
  }

  const normalizedPath =
    normalizePath(
      path
    );

  if (
    !normalizedPath
  ) {
    return;
  }

  /*
   * Même principe que les URLs :
   * si aucun bucket n'est fourni, on le détecte.
   */

  const resolvedBucket =
    resolveStorageBucket(
      normalizedPath,
      bucket
    );

  const {
    error,
  } =
    await supabase.storage
      .from(
        resolvedBucket
      )
      .remove([
        normalizedPath,
      ]);

  if (
    error
  ) {
    throw error;
  }
}

// ============================================================
// REMOVE EVENT COVER
// ============================================================

export async function removeEventCover(
  path
) {
  if (
    !path
  ) {
    return;
  }

  return removeMediaFile(
    path,
    STORAGE_BUCKETS.COVERS
  );
}

// ============================================================
// STORAGE DEBUG
// ============================================================

export function getStorageInfo(
  path,
  explicitBucket = null
) {
  const normalizedPath =
    normalizePath(
      path
    );

  return {
    path:
      normalizedPath,

    fileName:
      fileNameFromPath(
        normalizedPath
      ),

    extension:
      extensionFromPath(
        normalizedPath
      ),

    bucket:
      resolveStorageBucket(
        normalizedPath,
        explicitBucket
      ),

    isUrl:
      isHttpUrl(
        normalizedPath
      ),
  };
}
