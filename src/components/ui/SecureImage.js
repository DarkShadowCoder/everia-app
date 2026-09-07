// src/components/ui/SecureImage.js
// ============================================================
// EVERIA — Secure Image Adapter
//
// Toutes les images Supabase Storage privées sont résolues via
// une URL temporaire signée avant d'être affichées.
//
// Le composant conserve la compatibilité avec l'API actuelle
// de expo-image.
//
// Exemple existant conservé :
//
// <Image
//   source={{
//     uri: mediaThumbnail(media),
//   }}
// />
//
// Aucun changement n'est nécessaire dans les écrans utilisant
// déjà expo-image : Metro redirige automatiquement leur import
// vers ce composant.
// ============================================================

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Image as ExpoImage,
} from 'expo-image';

import {
  SUPABASE_URL,
} from '@/constants/config';

import {
  signedMediaUrl,
} from '@/lib/storage';

// ============================================================
// CONSTANTS
// ============================================================

const SIGNED_URL_TTL =
  55 * 60;

const signedUrlCache =
  new Map();

// ============================================================
// SOURCE NORMALIZATION
// ============================================================

function normalizeSource(
  source
) {
  if (!source) {
    return {
      original:
        source,
      uri:
        null,
      storage:
        null,
    };
  }

  if (
    typeof source ===
    'number'
  ) {
    return {
      original:
        source,
      uri:
        null,
      storage:
        null,
    };
  }

  if (
    typeof source ===
    'string'
  ) {
    return {
      original:
        source,

      uri:
        source,

      storage:
        parseSupabaseStorageUrl(
          source
        ),
    };
  }

  if (
    typeof source ===
      'object' &&
    source.uri
  ) {
    return {
      original:
        source,

      uri:
        source.uri,

      storage:
        parseSupabaseStorageUrl(
          source.uri
        ),
    };
  }

  return {
    original:
      source,

    uri:
      null,

    storage:
      null,
  };
}

// ============================================================
// SUPABASE STORAGE URL PARSER
// ============================================================

function parseSupabaseStorageUrl(
  uri
) {
  if (
    !uri ||
    !SUPABASE_URL
  ) {
    return null;
  }

  /*
   * Les sources locales ne doivent jamais passer par Storage.
   */
  if (
    uri.startsWith(
      'file://'
    ) ||
    uri.startsWith(
      'data:'
    ) ||
    uri.startsWith(
      'blob:'
    )
  ) {
    return null;
  }

  let url;

  try {
    url = new URL(
      uri
    );
  } catch {
    return null;
  }

  let supabaseOrigin;

  try {
    supabaseOrigin =
      new URL(
        SUPABASE_URL
      ).origin;
  } catch {
    return null;
  }

  /*
   * Une URL externe ne doit jamais être resignée.
   */
  if (
    url.origin !==
    supabaseOrigin
  ) {
    return null;
  }

  const pathname =
    url.pathname;

  const publicPrefix =
    '/storage/v1/object/public/';

  const signedPrefix =
    '/storage/v1/object/sign/';

  /*
   * L'URL est déjà signée.
   */
  if (
    pathname.startsWith(
      signedPrefix
    )
  ) {
    return {
      alreadySigned:
        true,

      bucket:
        null,

      path:
        null,
    };
  }

  /*
   * L'URL ne correspond pas au système Storage public de
   * Supabase. On la laisse telle quelle.
   */
  if (
    !pathname.startsWith(
      publicPrefix
    )
  ) {
    return null;
  }

  const remainder =
    pathname.slice(
      publicPrefix.length
    );

  const separatorIndex =
    remainder.indexOf(
      '/'
    );

  if (
    separatorIndex <=
    0
  ) {
    return null;
  }

  const bucket =
    decodeURIComponent(
      remainder.slice(
        0,
        separatorIndex
      )
    );

  const path =
    decodeURIComponent(
      remainder.slice(
        separatorIndex + 1
      )
    );

  if (
    !bucket ||
    !path
  ) {
    return null;
  }

  return {
    alreadySigned:
      false,

    bucket,

    path,
  };
}

// ============================================================
// CACHE
// ============================================================

function getCacheKey(
  bucket,
  path
) {
  return `${bucket}:${path}`;
}

function getCachedUrl(
  bucket,
  path
) {
  const key =
    getCacheKey(
      bucket,
      path
    );

  const cached =
    signedUrlCache.get(
      key
    );

  if (!cached) {
    return null;
  }

  /*
   * Petite marge de sécurité avant expiration.
   */
  if (
    cached.expiresAt <=
    Date.now()
  ) {
    signedUrlCache.delete(
      key
    );

    return null;
  }

  return cached.url;
}

function setCachedUrl(
  bucket,
  path,
  url
) {
  if (!url) {
    return;
  }

  const key =
    getCacheKey(
      bucket,
      path
    );

  signedUrlCache.set(
    key,
    {
      url,

      expiresAt:
        Date.now() +
        SIGNED_URL_TTL *
          1000,
    }
  );
}

// ============================================================
// SECURE IMAGE
// ============================================================

export function Image({
  source,
  ...props
}) {
  const normalized =
    useMemo(
      () =>
        normalizeSource(
          source
        ),
      [source]
    );

  const storage =
    normalized.storage;

  const cachedUrl =
    storage &&
    !storage.alreadySigned
      ? getCachedUrl(
          storage.bucket,
          storage.path
        )
      : null;

  const initialUri =
    storage?.alreadySigned
      ? normalized.uri
      : cachedUrl;

  const [
    resolvedUri,
    setResolvedUri,
  ] = useState(
    initialUri
  );

  useEffect(() => {
    let mounted =
      true;

    /*
     * Réinitialisation lorsqu'une nouvelle source est fournie.
     */
    setResolvedUri(
      storage?.alreadySigned
        ? normalized.uri
        : cachedUrl
    );

    /*
     * Image locale, data URL, URL externe, etc.
     */
    if (
      !storage ||
      storage.alreadySigned
    ) {
      return () => {
        mounted =
          false;
      };
    }

    /*
     * URL déjà présente dans le cache.
     */
    if (cachedUrl) {
      return () => {
        mounted =
          false;
      };
    }

    const resolve =
      async () => {
        try {
          const signedUrl =
            await signedMediaUrl(
              storage.path,
              {
                bucket:
                  storage.bucket,

                expiresIn:
                  SIGNED_URL_TTL,
              }
            );

          if (
            !mounted
          ) {
            return;
          }

          if (
            signedUrl
          ) {
            setCachedUrl(
              storage.bucket,
              storage.path,
              signedUrl
            );

            setResolvedUri(
              signedUrl
            );
          }
        } catch (
          error
        ) {
          if (
            __DEV__
          ) {
            console.warn(
              '[Everia] SecureImage resolution failed:',
              error
            );
          }
        }
      };

    resolve();

    return () => {
      mounted =
        false;
    };
  }, [
    cachedUrl,
    normalized.uri,
    storage,
  ]);

  /*
   * Tant que l'URL signée n'est pas encore résolue :
   *
   * - si l'image est locale/externe : on l'affiche immédiatement ;
   * - si c'est Storage privé : on attend l'URL signée.
   */
  let nextSource =
    normalized.original;

  if (
    resolvedUri
  ) {
    nextSource = {
      uri:
        resolvedUri,
    };
  } else if (
    storage &&
    !storage.alreadySigned
  ) {
    nextSource =
      undefined;
  }

  return (
    <ExpoImage
      {...props}
      source={
        nextSource
      }
    />
  );
}

export default Image;