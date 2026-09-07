// src/hooks/useMediaUpload.js
// ============================================================
// EVERIA — Media Upload Hook
//
// Pipeline :
//
// SELECT / CAMERA
//      ↓
// VALIDATION
//      ↓
// STORAGE
//      ↓
// MEDIA RECORD
//      ↓
// PROCESSING JOB
//      ↓
// EDGE FUNCTION
//      ↓
// READY
//
// L'upload et le traitement sont deux opérations distinctes.
// Le mobile ne reste donc pas bloqué pendant le traitement.
// ============================================================

import {
  useCallback,
  useState,
} from 'react';

import * as FileSystem from 'expo-file-system';

import {
  supabase,
} from '@/lib/supabase';

import {
  uploadEventMediaFile,
} from '@/lib/storage';

import {
  processMedia,
  getMediaProcessingJob,
} from '@/lib/mediaProcessing';

// ============================================================
// HELPERS
// ============================================================

function normalizeAssetType(
  asset
) {
  if (
    asset?.type ===
    'video'
  ) {
    return 'video';
  }

  if (
    asset?.type ===
    'audio'
  ) {
    return 'audio';
  }

  return 'photo';
}

function getContentType(
  mediaType,
  fileName
) {
  const extension =
    fileName
      ?.split('.')
      .pop()
      ?.toLowerCase();

  if (
    mediaType ===
    'video'
  ) {
    if (
      extension ===
      'mov'
    ) {
      return 'video/quicktime';
    }

    if (
      extension ===
      'webm'
    ) {
      return 'video/webm';
    }

    return 'video/mp4';
  }

  if (
    mediaType ===
    'audio'
  ) {
    if (
      extension ===
      'wav'
    ) {
      return 'audio/wav';
    }

    return 'audio/m4a';
  }

  if (
    extension ===
    'png'
  ) {
    return 'image/png';
  }

  if (
    extension ===
    'webp'
  ) {
    return 'image/webp';
  }

  if (
    extension ===
    'heic'
  ) {
    return 'image/heic';
  }

  return 'image/jpeg';
}

function normalizeError(
  error,
  fallback
) {
  return (
    error?.message ||
    fallback
  );
}

// ============================================================
// HOOK
// ============================================================

export function useMediaUpload({
  eventId,
  uploaderId,
  albumId,
} = {}) {
  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    processingError,
    setProcessingError,
  ] = useState(null);

  const [
    currentMedia,
    setCurrentMedia,
  ] = useState(null);

  // ==========================================================
  // SESSION
  // ==========================================================

  const getAuthenticatedUser =
    useCallback(
      async () => {
        const {
          data,
          error:
            sessionError,
        } =
          await supabase.auth
            .getSession();

        if (
          sessionError
        ) {
          throw sessionError;
        }

        const currentUser =
          data?.session
            ?.user;

        if (
          !currentUser?.id
        ) {
          throw new Error(
            'Votre session a expiré. Veuillez vous reconnecter.'
          );
        }

        return currentUser;
      },
      []
    );

  // ==========================================================
  // UPLOAD ONE ASSET
  // ==========================================================

  const uploadAsset =
    useCallback(
      async (
        asset
      ) => {
        if (!eventId) {
          throw new Error(
            'eventId est requis pour envoyer ce média.'
          );
        }

        if (!uploaderId) {
          throw new Error(
            'Utilisateur non authentifié.'
          );
        }

        if (!asset?.uri) {
          throw new Error(
            'Le fichier sélectionné est invalide.'
          );
        }

        setIsUploading(
          true
        );

        setError(
          null
        );

        setProcessingError(
          null
        );

        setProgress(
          0
        );

        try {
          // ----------------------------------------------------
          // AUTH
          // ----------------------------------------------------

          const currentUser =
            await getAuthenticatedUser();

          if (
            currentUser.id !==
            uploaderId
          ) {
            throw new Error(
              'L’utilisateur courant ne correspond pas à l’utilisateur d’upload.'
            );
          }

          setProgress(
            0.05
          );

          // ----------------------------------------------------
          // MEDIA TYPE
          // ----------------------------------------------------

          const mediaType =
            normalizeAssetType(
              asset
            );

          const fileName =
            asset.fileName ||
            asset.uri
              .split('/')
              .pop() ||
            `media-${Date.now()}`;

          const contentType =
            getContentType(
              mediaType,
              fileName
            );

          // ----------------------------------------------------
          // FILE INFO
          // ----------------------------------------------------

          let fileSize =
            null;

          try {
            const info =
              await FileSystem.getInfoAsync(
                asset.uri
              );

            fileSize =
              typeof info?.size ===
              'number'
                ? info.size
                : null;
          } catch (
            infoError
          ) {
            console.warn(
              '[Everia] Unable to read file size:',
              infoError
            );
          }

          setProgress(
            0.15
          );

          // ----------------------------------------------------
          // STORAGE
          // ----------------------------------------------------

          const storagePath =
            await uploadEventMediaFile(
              {
                eventId,

                uploaderId:
                  currentUser.id,

                uri:
                  asset.uri,

                fileName,

                contentType,
              }
            );

          setProgress(
            0.70
          );

          // ----------------------------------------------------
          // MEDIA RECORD
          // ----------------------------------------------------

          const uploadedAt =
            new Date()
              .toISOString();

          const {
            data: media,
            error:
              insertError,
          } =
            await supabase
              .from('media')
              .insert({
                event_id:
                  eventId,

                album_id:
                  albumId ??
                  null,

                uploader_user_id:
                  currentUser.id,

                uploader_guest_id:
                  null,

                media_type:
                  mediaType,

                /*
                 * Le traitement n'a pas encore eu lieu.
                 */
                status:
                  'pending',

                original_path:
                  storagePath,

                display_path:
                  null,

                thumbnail_path:
                  null,

                file_name:
                  fileName,

                mime_type:
                  contentType,

                file_size_bytes:
                  fileSize,

                width:
                  asset.width ??
                  null,

                height:
                  asset.height ??
                  null,

                duration_ms:
                  typeof asset.duration ===
                    'number'
                    ? Math.round(
                        asset.duration
                      )
                    : null,

                captured_at:
                  uploadedAt,

                uploaded_at:
                  uploadedAt,

                processing_metadata:
                  {},
              })
              .select()
              .single();

          if (
            insertError
          ) {
            // --------------------------------------------------
            // CLEAN STORAGE
            // --------------------------------------------------

            try {
              await supabase.storage
                .from(
                  'event-media'
                )
                .remove([
                  storagePath,
                ]);
            } catch (
              cleanupError
            ) {
              console.warn(
                '[Everia] Failed to cleanup orphan media:',
                cleanupError
              );
            }

            throw insertError;
          }

          setCurrentMedia(
            media
          );

          setProgress(
            0.80
          );

          // ----------------------------------------------------
          // PROCESSING JOB
          // ----------------------------------------------------
          //
          // Le trigger SQL créé dans la migration génère
          // automatiquement media_processing_jobs.
          //
          // On le lit uniquement pour pouvoir déclencher
          // immédiatement le worker.
          // ----------------------------------------------------

          let job = null;

          try {
            job =
              await getMediaProcessingJob(
                media.id
              );
          } catch (
            jobLookupError
          ) {
            console.warn(
              '[Everia] Processing job lookup failed:',
              jobLookupError
            );
          }

          // ----------------------------------------------------
          // ASYNCHRONOUS PROCESSING
          // ----------------------------------------------------

          setProcessing(
            true
          );

          /*
           * Important :
           *
           * Le traitement n'est PAS attendu.
           *
           * Le mobile considère l'upload terminé dès que le
           * record media existe.
           */
          void processMedia(
            media.id
          )
            .then(
              () => {
                setProcessing(
                  false
                );
              }
            )
            .catch(
              (processingErr) => {
                console.warn(
                  '[Everia] Async media processing error:',
                  processingErr
                );

                setProcessingError(
                  normalizeError(
                    processingErr,
                    'Le traitement du média a échoué.'
                  )
                );

                setProcessing(
                  false
                );
              }
            );

          /*
           * job est volontairement conservé pour les logs/debug
           * sans influencer l'upload.
           */
          if (job) {
            console.log(
              '[Everia] Media processing job queued:',
              {
                jobId:
                  job.id,

                mediaId:
                  media.id,
              }
            );
          }

          setProgress(
            1
          );

          return media;
        } catch (
          uploadError
        ) {
          const message =
            normalizeError(
              uploadError,
              "Échec de l'envoi du média."
            );

          setError(
            message
          );

          throw uploadError;
        } finally {
          setIsUploading(
            false
          );
        }
      },
      [
        albumId,
        eventId,
        getAuthenticatedUser,
        uploaderId,
      ]
    );

  // ==========================================================
  // MULTIPLE UPLOAD
  // ==========================================================

  const uploadMultiple =
    useCallback(
      async (
        assets
      ) => {
        if (
          !Array.isArray(
            assets
          ) ||
          !assets.length
        ) {
          return [];
        }

        const results =
          [];

        setError(
          null
        );

        for (
          let index = 0;
          index <
          assets.length;
          index += 1
        ) {
          const asset =
            assets[index];

          /*
           * La progression représente ici la position dans
           * la queue d'upload.
           */
          setProgress(
            index /
              assets.length
          );

          // eslint-disable-next-line no-await-in-loop
          const result =
            await uploadAsset(
              asset
            );

          results.push(
            result
          );

          setProgress(
            (index + 1) /
              assets.length
          );
        }

        return results;
      },
      [
        uploadAsset,
      ]
    );

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    uploadAsset,

    uploadMultiple,

    progress,

    isUploading,

    processing,

    error,

    processingError,

    currentMedia,
  };
}