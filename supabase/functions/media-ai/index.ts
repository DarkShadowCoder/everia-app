// supabase/functions/media-ai/index.js
// ============================================================
// EVERIA — GEMINI AI STORY ENGINE
//
// AI provider:
//   Google Gemini 2.5 Flash-Lite
//
// Pipeline:
//   media
//      ↓
//   Gemini Vision
//      ↓
//   moderation / safety classification
//      ↓
//   labels
//      ↓
//   moments
//      ↓
//   automatic Best Of
//      ↓
//   replay source
//      ↓
//   personalization
//
// Fallback:
//   Si Gemini est indisponible ou quota dépassé,
//   Everia continue avec un moteur local déterministe.
//
// IMPORTANT:
// - La clé Gemini reste uniquement côté Supabase.
// - Le client mobile ne reçoit jamais GEMINI_API_KEY.
// - L'IA ne fait pas d'identification nominative.
// ============================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// ============================================================
// ENV
// ============================================================

const SUPABASE_URL =
  Deno.env.get('SUPABASE_URL');

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get(
    'SUPABASE_SERVICE_ROLE_KEY'
  );

const SUPABASE_ANON_KEY =
  Deno.env.get(
    'SUPABASE_ANON_KEY'
  );

const GEMINI_API_KEY =
  Deno.env.get(
    'GEMINI_API_KEY'
  );

const GEMINI_MODEL =
  Deno.env.get(
    'GEMINI_MODEL'
  ) ||
  'gemini-2.5-flash-lite';

const INTERNAL_WORKER_SECRET =
  Deno.env.get(
    'EVERIA_INTERNAL_WORKER_SECRET'
  );

const MEDIA_BUCKET =
  Deno.env.get(
    'EVERIA_MEDIA_BUCKET'
  ) ||
  'event-media';

const MAX_STORY_MEDIA =
  200;

const BEST_OF_LIMIT =
  24;

const MOMENT_WINDOW_MINUTES =
  20;

const BEST_OF_MIN_SCORE =
  0.45;

const MAX_GEMINI_MEDIA_BYTES =
  12 * 1024 * 1024;

// ============================================================
// VALIDATION
// ============================================================

if (!SUPABASE_URL) {
  throw new Error(
    'SUPABASE_URL manquant.'
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY manquant.'
  );
}

const supabaseAdmin =
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
    [
      'authorization',
      'x-client-info',
      'apikey',
      'content-type',
      'x-everia-worker-secret',
    ].join(', '),

  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
};

// ============================================================
// JSON RESPONSE
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
// UTILS
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

function safeNumber(
  value,
  fallback = 0
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
}

function clamp(
  value,
  min = 0,
  max = 1
) {
  return Math.max(
    min,
    Math.min(
      max,
      safeNumber(
        value
      )
    )
  );
}

function unique(
  values
) {
  return [
    ...new Set(
      (
        values ||
        []
      )
        .map(
          (
            value
          ) =>
            String(
              value
            ).trim()
        )
        .filter(Boolean)
    ),
  ];
}

function mediaTimeMs(
  media
) {
  const raw =
    media.captured_at ||
    media.uploaded_at ||
    media.created_at;

  const time =
    new Date(
      raw
    ).getTime();

  return Number.isFinite(
    time
  )
    ? time
    : 0;
}

function mediaDate(
  media
) {
  return (
    media.captured_at ||
    media.uploaded_at ||
    media.created_at
  );
}

function isImage(
  media
) {
  return (
    media.media_type ===
      'photo' ||
    media.mime_type?.startsWith(
      'image/'
    )
  );
}

function isVideo(
  media
) {
  return (
    media.media_type ===
      'video' ||
    media.mime_type?.startsWith(
      'video/'
    )
  );
}

function mediaScene(
  media
) {
  return (
    media
      ?.processing_metadata
      ?.ai
      ?.scene ||
    'general'
  )
    .toString()
    .trim()
    .toLowerCase();
}

function mediaUploaderKey(
  media
) {
  return (
    media.uploader_user_id ||
    media.uploader_guest_id ||
    `media:${media.id}`
  );
}

// ============================================================
// QUALITY
// ============================================================

function qualityScore(
  media
) {
  const ai =
    media
      ?.processing_metadata
      ?.ai ||
    {};

  const quality =
    clamp(
      ai.quality_score,
      0,
      1
    );

  const aesthetic =
    clamp(
      ai.aesthetic_score,
      0,
      1
    );

  const width =
    safeNumber(
      media.width
    );

  const height =
    safeNumber(
      media.height
    );

  let resolution =
    0.55;

  if (
    width > 0 &&
    height > 0
  ) {
    resolution =
      clamp(
        (
          width *
          height
        ) /
          12000000,
        0,
        1
      );
  }

  return clamp(
    quality *
      0.50 +
    aesthetic *
      0.35 +
    resolution *
      0.15
  );
}

// ============================================================
// ENGAGEMENT
// ============================================================

function relationCount(
  relation
) {
  if (
    Array.isArray(
      relation
    )
  ) {
    return safeNumber(
      relation[0]?.count
    );
  }

  return safeNumber(
    relation?.count
  );
}

function engagementScore(
  media
) {
  const likes =
    relationCount(
      media.media_reactions
    );

  const comments =
    relationCount(
      media.comments
    );

  const likeScore =
    1 -
    Math.exp(
      -likes / 4
    );

  const commentScore =
    1 -
    Math.exp(
      -comments / 2
    );

  return clamp(
    likeScore *
      0.65 +
    commentScore *
      0.35
  );
}

// ============================================================
// BEST OF SCORE
// ============================================================

function bestOfScore(
  media
) {
  const quality =
    qualityScore(
      media
    );

  const engagement =
    engagementScore(
      media
    );

  const ai =
    media
      ?.processing_metadata
      ?.ai ||
    {};

  const contextualStrength =
    ai.moment_hint
      ? 1
      : 0.65;

  const sceneStrength =
    ai.scene
      ? 1
      : 0.5;

  const typeStrength =
    isImage(
      media
    )
      ? 1
      : 0.92;

  return clamp(
    quality *
      0.46 +
    engagement *
      0.18 +
    contextualStrength *
      0.18 +
    sceneStrength *
      0.08 +
    typeStrength *
      0.10
  );
}

// ============================================================
// AUTHENTICATION
// ============================================================

function isWorkerRequest(
  request
) {
  if (
    !INTERNAL_WORKER_SECRET
  ) {
    return false;
  }

  return (
    request.headers.get(
      'x-everia-worker-secret'
    ) ===
    INTERNAL_WORKER_SECRET
  );
}

async function authenticate(
  request
) {
  if (
    isWorkerRequest(
      request
    )
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

  const authClient =
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
    await authClient.auth.getUser();

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
// LOAD MEDIA
// ============================================================

async function loadMedia(
  mediaId
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        'media'
      )
      .select(
        '*'
      )
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
// LOAD EVENT
// ============================================================

async function loadEvent(
  eventId
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        'events'
      )
      .select(
        `
          id,
          owner_id,
          name,
          status,
          require_media_approval,
          ai_settings
        `
      )
      .eq(
        'id',
        eventId
      )
      .single();

  if (
    error ||
    !data
  ) {
    throw new Error(
      'Événement introuvable.'
    );
  }

  return data;
}

// ============================================================
// MEDIA AUTHORIZATION
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
    await supabaseAdmin
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

async function createSignedUrl(
  media
) {
  const path =
    media.display_path ||
    media.thumbnail_path ||
    media.original_path;

  if (
    !path
  ) {
    throw new Error(
      'Aucun chemin média disponible.'
    );
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin.storage
      .from(
        MEDIA_BUCKET
      )
      .createSignedUrl(
        path,
        600
      );

  if (
    error ||
    !data?.signedUrl
  ) {
    throw new Error(
      `URL signée impossible pour ${path}.`
    );
  }

  return {
    path,

    url:
      data.signedUrl,
  };
}

// ============================================================
// FETCH BYTES
// ============================================================

async function fetchRemoteMedia(
  url,
  fallbackMime
) {
  const response =
    await fetch(
      url
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Impossible de télécharger le média (${response.status}).`
    );
  }

  const contentType =
    response.headers.get(
      'content-type'
    ) ||
    fallbackMime ||
    'image/jpeg';

  const arrayBuffer =
    await response.arrayBuffer();

  if (
    arrayBuffer.byteLength >
    MAX_GEMINI_MEDIA_BYTES
  ) {
    throw new Error(
      'Le média est trop volumineux pour l’analyse Gemini inline.'
    );
  }

  return {
    bytes:
      new Uint8Array(
        arrayBuffer
      ),

    mimeType:
      contentType.split(
        ';'
      )[0],
  };
}

// ============================================================
// BASE64
// ============================================================

function bytesToBase64(
  bytes
) {
  let binary =
    '';

  const chunkSize =
    0x8000;

  for (
    let index = 0;
    index <
      bytes.length;
    index +=
      chunkSize
  ) {
    binary += String.fromCharCode(
      ...bytes.subarray(
        index,
        Math.min(
          index +
            chunkSize,
          bytes.length
        )
      )
    );
  }

  return btoa(
    binary
  );
}

// ============================================================
// GEMINI SCHEMA
// ============================================================

const MEDIA_ANALYSIS_SCHEMA =
  {
    type:
      'object',

    properties: {
      labels: {
        type:
          'array',

        items: {
          type:
            'string',
        },
      },

      scene: {
        type:
          'string',
      },

      activities: {
        type:
          'array',

        items: {
          type:
            'string',
        },
      },

      summary: {
        type:
          'string',
      },

      moment_hint: {
        type:
          'string',
      },

      people_count: {
        type:
          'integer',
      },

      quality_score: {
        type:
          'number',
      },

      aesthetic_score: {
        type:
          'number',
      },

      safe_for_event: {
        type:
          'boolean',
      },

      safety_reason: {
        type:
          'string',
      },
    },

    required: [
      'labels',
      'scene',
      'activities',
      'summary',
      'moment_hint',
      'people_count',
      'quality_score',
      'aesthetic_score',
      'safe_for_event',
      'safety_reason',
    ],
  };

// ============================================================
// GEMINI CALL
// ============================================================

async function callGemini(
  media,
  mediaUrl
) {
  if (
    !GEMINI_API_KEY
  ) {
    throw new Error(
      'GEMINI_API_KEY manquant.'
    );
  }

  const remote =
    await fetchRemoteMedia(
      mediaUrl,
      media.mime_type
    );

  const base64 =
    bytesToBase64(
      remote.bytes
    );

  const prompt = `
Tu es le moteur de compréhension visuelle d'Everia.

Analyse ce média pour construire automatiquement :
1. des catégories de recherche,
2. une timeline de moments,
3. une sélection Best Of,
4. un résumé de souvenir.

Règles strictes :
- Ne tente jamais d'identifier une personne par son nom.
- Ne déduis aucune identité personnelle.
- people_count = nombre approximatif de personnes visibles.
- Ne décris que des éléments visuellement raisonnables.
- scene doit être courte.
- moment_hint doit être utilisable comme titre de moment.
- quality_score et aesthetic_score vont de 0 à 1.
- safe_for_event indique si le média semble acceptable pour une galerie événementielle générale.
- safety_reason explique très brièvement cette décision.

Contexte :
Type média : ${
    media.media_type
  }
Nom fichier : ${
    media.file_name ||
    ''
  }
Date capture : ${
    media.captured_at ||
    ''
  }
`;

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent`;

  const response =
    await fetch(
      endpoint,
      {
        method:
          'POST',

        headers: {
          'x-goog-api-key':
            GEMINI_API_KEY,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      prompt,
                  },

                  {
                    inline_data:
                      {
                        mime_type:
                          remote.mimeType,

                        data:
                          base64,
                      },
                  },
                ],
              },
            ],

            generationConfig:
              {
                temperature:
                  0.15,

                responseMimeType:
                  'application/json',

                responseSchema:
                  MEDIA_ANALYSIS_SCHEMA,
              },

            safetySettings: [
              {
                category:
                  'HARM_CATEGORY_HARASSMENT',

                threshold:
                  'BLOCK_MEDIUM_AND_ABOVE',
              },

              {
                category:
                  'HARM_CATEGORY_HATE_SPEECH',

                threshold:
                  'BLOCK_MEDIUM_AND_ABOVE',
              },

              {
                category:
                  'HARM_CATEGORY_SEXUALLY_EXPLICIT',

                threshold:
                  'BLOCK_MEDIUM_AND_ABOVE',
              },

              {
                category:
                  'HARM_CATEGORY_DANGEROUS_CONTENT',

                threshold:
                  'BLOCK_MEDIUM_AND_ABOVE',
              },
            ],
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
    const message =
      body?.error?.message ||
      `Gemini HTTP ${response.status}`;

    throw new Error(
      message
    );
  }

  const candidate =
    body?.candidates?.[0];

  if (
    !candidate
  ) {
    throw new Error(
      'Gemini n’a retourné aucun candidat.'
    );
  }

  const text =
    candidate?.content?.parts
      ?.map(
        (
          part
        ) =>
          part.text
      )
      .filter(Boolean)
      .join('')
      .trim();

  if (
    !text
  ) {
    throw new Error(
      'Gemini n’a retourné aucun JSON.'
    );
  }

  let analysis;

  try {
    analysis =
      JSON.parse(
        text
      );
  } catch {
    throw new Error(
      'Réponse Gemini JSON invalide.'
    );
  }

  return analysis;
}

// ============================================================
// FALLBACK ANALYSIS
// ============================================================

function createFallbackAnalysis(
  media
) {
  const width =
    safeNumber(
      media.width
    );

  const height =
    safeNumber(
      media.height
    );

  const resolution =
    width > 0 &&
    height > 0
      ? clamp(
          (
            width *
            height
          ) /
            12000000
        )
      : 0.55;

  const labels =
    unique([
      isImage(
        media
      )
        ? 'photo'
        : 'video',

      media.file_name
        ?.toLowerCase()
        .includes(
          'wedding'
        )
        ? 'wedding'
        : null,

      media.file_name
        ?.toLowerCase()
        .includes(
          'party'
        )
        ? 'party'
        : null,
    ]);

  return {
    labels,

    scene:
      'event',

    activities:
      [],

    summary:
      'Souvenir événementiel',

    moment_hint:
      'Moment partagé',

    people_count:
      0,

    quality_score:
      resolution,

    aesthetic_score:
      resolution,

    safe_for_event:
      true,

    safety_reason:
      'Classification locale de secours.',
  };
}

// ============================================================
// SAVE AI RESULT
// ============================================================

async function saveAIResult({
  media,
  event,
  analysis,
  provider,
}) {
  const now =
    new Date().toISOString();

  const labels =
    unique([
      ...(analysis.labels ||
        []),

      analysis.scene,

      ...(analysis.activities ||
        []),

      analysis.moment_hint,
    ]);

  const peopleCount =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          safeNumber(
            analysis.people_count
          )
        )
      )
    );

  const safe =
    analysis.safe_for_event !==
    false;

  let moderationStatus =
    event.require_media_approval
      ? 'safe'
      : 'approved';

  if (
    !safe
  ) {
    moderationStatus =
      'review';
  }

  const ai =
    {
      status:
        provider ===
        'gemini'
          ? 'completed'
          : 'fallback',

      provider,

      model:
        provider ===
        'gemini'
          ? GEMINI_MODEL
          : 'local-fallback',

      analysed_at:
        now,

      scene:
        analysis.scene ||
        'event',

      activities:
        unique(
          analysis.activities ||
            []
        ),

      summary:
        analysis.summary ||
        '',

      moment_hint:
        analysis.moment_hint ||
        'Moment partagé',

      people_count:
        peopleCount,

      quality_score:
        clamp(
          analysis.quality_score
        ),

      aesthetic_score:
        clamp(
          analysis.aesthetic_score
        ),

      safety: {
        safe_for_event:
          safe,

        reason:
          analysis.safety_reason ||
          '',
      },

      identity_detection:
        {
          status:
            'not_performed',

          reason:
            'Everia ne réalise pas d’identification nominative dans ce moteur.',
        },
    };

  const previousMetadata =
    media.processing_metadata ||
    {};

  const processingMetadata =
    {
      ...previousMetadata,

      ai,

      story_pipeline:
        {
          version:
            '4.0.0',

          provider,

          updated_at:
            now,
        },
    };

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        'media'
      )
      .update({
        ai_labels:
          labels,

        moderation_status:
          moderationStatus,

        moderation_result:
          {
            provider,

            flagged:
              !safe,

            reason:
              analysis.safety_reason ||
              null,

            checked_at:
              now,
          },

        processing_metadata:
          processingMetadata,

        processing_error:
          null,

        processed_at:
          media.processed_at ||
          now,

        updated_at:
          now,
      })
      .eq(
        'id',
        media.id
      )
      .select(
        '*'
      )
      .single();

  if (
    error
  ) {
    throw error;
  }

  if (
    !safe
  ) {
    await supabaseAdmin
      .from(
        'media_moderation_actions'
      )
      .insert({
        media_id:
          media.id,

        actor_user_id:
          null,

        action:
          'flagged_by_ai',

        reason:
          analysis.safety_reason ||
          'Média signalé par le moteur IA.',

        automated:
          true,

        confidence:
          0.85,

        metadata:
          {
            provider,

            model:
              ai.model,
          },
      });
  }

  return data;
}

// ============================================================
// FETCH STORY MEDIA
// ============================================================

async function fetchStoryMedia(
  eventId
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        'media'
      )
      .select(
        `
          id,
          event_id,
          uploader_user_id,
          uploader_guest_id,
          media_type,
          status,
          moderation_status,
          captured_at,
          uploaded_at,
          created_at,
          width,
          height,
          ai_labels,
          processing_metadata,
          media_reactions(count),
          comments(count)
        `
      )
      .eq(
        'event_id',
        eventId
      )
      .is(
        'deleted_at',
        null
      )
      .in(
        'status',
        [
          'ready',
          'published',
        ]
      )
      .in(
        'moderation_status',
        [
          'safe',
          'approved',
        ]
      )
      .order(
        'captured_at',
        {
          ascending:
            true,

          nullsFirst:
            false,
        }
      )
      .limit(
        MAX_STORY_MEDIA
      );

  if (
    error
  ) {
    throw error;
  }

  return (
    data ||
    []
  );
}

// ============================================================
// MOMENT TITLE
// ============================================================

function chooseMomentTitle(
  group
) {
  const values =
    group.flatMap(
      (
        media
      ) => [
        media
          ?.processing_metadata
          ?.ai
          ?.moment_hint,

        media
          ?.processing_metadata
          ?.ai
          ?.scene,
      ]
    ).filter(Boolean);

  if (
    !values.length
  ) {
    return 'Moment partagé';
  }

  const frequency =
    new Map();

  values.forEach(
    (
      value
    ) => {
      const key =
        String(
          value
        ).trim();

      frequency.set(
        key,
        (
          frequency.get(
            key
          ) ||
          0
        ) + 1
      );
    }
  );

  return [
    ...frequency.entries(),
  ].sort(
    (
      a,
      b
    ) =>
      b[1] -
      a[1]
  )[0][0];
}

// ============================================================
// MOMENT CONFIDENCE
// ============================================================

function momentConfidence(
  group,
  representative
) {
  const groupStrength =
    Math.min(
      0.35,
      group.length /
        30
    );

  const qualityStrength =
    qualityScore(
      representative
    ) *
    0.20;

  const aiStrength =
    representative
      ?.processing_metadata
      ?.ai
      ?.status ===
    'completed'
      ? 0.25
      : 0.10;

  return clamp(
    0.35 +
      groupStrength +
      qualityStrength +
      aiStrength
  );
}

// ============================================================
// MOMENT KEY
// ============================================================

function momentKey(
  media
) {
  const bucket =
    Math.floor(
      mediaTimeMs(
        media
      ) /
        (
          MOMENT_WINDOW_MINUTES *
          60 *
          1000
        )
    );

  return `${bucket}:${mediaScene(
    media
  )}`;
}

// ============================================================
// GENERATE MOMENTS
// ============================================================

async function generateMoments(
  eventId,
  mediaRows
) {
  const groups =
    new Map();

  for (
    const media of
      mediaRows
  ) {
    const key =
      momentKey(
        media
      );

    if (
      !groups.has(
        key
      )
    ) {
      groups.set(
        key,
        []
      );
    }

    groups
      .get(
        key
      )
      .push(
        media
      );
  }

  const moments =
    [];

  let sortOrder =
    0;

  for (
    const [
      clusterKey,
      group,
    ] of groups.entries()
  ) {
    if (
      group.length <
      2
    ) {
      continue;
    }

    group.sort(
      (
        a,
        b
      ) =>
        mediaTimeMs(
          a
        ) -
        mediaTimeMs(
          b
        )
    );

    const representative =
      [
        ...group,
      ].sort(
        (
          a,
          b
        ) =>
          bestOfScore(
            b
          ) -
          bestOfScore(
            a
          )
      )[0];

    const timestamps =
      group
        .map(
          mediaTimeMs
        )
        .filter(
          (
            value
          ) =>
            value >
            0
        );

    const startsAt =
      timestamps.length
        ? new Date(
            Math.min(
              ...timestamps
            )
          ).toISOString()
        : isoDate(
            mediaDate(
              group[0]
            )
          );

    const endsAt =
      timestamps.length
        ? new Date(
            Math.max(
              ...timestamps
            )
          ).toISOString()
        : startsAt;

    const confidence =
      momentConfidence(
        group,
        representative
      );

    const {
      data:
        existing,
      error:
        existingError,
    } =
      await supabaseAdmin
        .from(
          'moments'
        )
        .select(
          '*'
        )
        .eq(
          'event_id',
          eventId
        )
        .contains(
          'metadata',
          {
            cluster_key:
              clusterKey,
          }
        )
        .maybeSingle();

    if (
      existingError
    ) {
      throw existingError;
    }

    const payload =
      {
        title:
          chooseMomentTitle(
            group
          ),

        starts_at:
          startsAt,

        ends_at:
          endsAt,

        representative_media_id:
          representative.id,

        confidence,

        ai_summary:
          representative
            ?.processing_metadata
            ?.ai
            ?.summary ||
          'Moment détecté automatiquement par Everia.',

        ai_labels:
          unique(
            group.flatMap(
              (
                media
              ) =>
                media.ai_labels ||
                []
            )
          ),

        metadata:
          {
            cluster_key:
              clusterKey,

            media_count:
              group.length,

            uploaders_count:
              new Set(
                group.map(
                  mediaUploaderKey
                )
              ).size,

            dominant_scene:
              mediaScene(
                representative
              ),

            generated_by:
              'everia_ai_story_engine',

            generated_at:
              new Date().toISOString(),
          },

        source:
          'ai',

        sort_order:
          sortOrder,

        updated_at:
          new Date().toISOString(),
      };

    let moment =
      null;

    if (
      existing
    ) {
      const {
        data:
          updated,
        error:
          updateError,
      } =
        await supabaseAdmin
          .from(
            'moments'
          )
          .update(
            payload
          )
          .eq(
            'id',
            existing.id
          )
          .select(
            '*'
          )
          .single();

      if (
        updateError
      ) {
        throw updateError;
      }

      moment =
        updated;
    } else {
      const {
        data:
          created,
        error:
          createError,
      } =
        await supabaseAdmin
          .from(
            'moments'
          )
          .insert({
            event_id:
              eventId,

            ...payload,

            status:
              'detected',
          })
          .select(
            '*'
          )
          .single();

      if (
        createError
      ) {
        throw createError;
      }

      moment =
        created;
    }

    sortOrder +=
      1;

    const relations =
      group.map(
        (
          media
        ) => ({
          moment_id:
            moment.id,

          media_id:
            media.id,

          relevance_score:
            clamp(
              bestOfScore(
                media
              )
            ),

          is_primary:
            media.id ===
            representative.id,
        })
      );

    const {
      error:
        relationError,
    } =
      await supabaseAdmin
        .from(
          'moment_media'
        )
        .upsert(
          relations,
          {
            onConflict:
              'moment_id,media_id',
          }
        );

    if (
      relationError
    ) {
      throw relationError;
    }

    moments.push(
      {
        id:
          moment.id,

        title:
          moment.title,

        mediaCount:
          group.length,

        confidence:
          moment.confidence,
      }
    );
  }

  return moments;
}

// ============================================================
// SELECT BEST OF
// ============================================================

function selectBestOf(
  mediaRows
) {
  const scored =
    mediaRows
      .map(
        (
          media
        ) => ({
          media,

          score:
            bestOfScore(
              media
            ),
        })
      )
      .filter(
        (
          item
        ) =>
          item.score >=
          BEST_OF_MIN_SCORE
      )
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      );

  const selected =
    [];

  const uploaders =
    new Set();

  const scenes =
    new Set();

  const timeBuckets =
    new Set();

  const mediaTypeCounts =
    {
      photo:
        0,

      video:
        0,
    };

  // ----------------------------------------------------------
  // DIVERSITY PASS
  // ----------------------------------------------------------

  for (
    const item of
      scored
  ) {
    if (
      selected.length >=
      BEST_OF_LIMIT
    ) {
      break;
    }

    const media =
      item.media;

    const uploader =
      mediaUploaderKey(
        media
      );

    const scene =
      mediaScene(
        media
      );

    const bucket =
      Math.floor(
        mediaTimeMs(
          media
        ) /
          (
            MOMENT_WINDOW_MINUTES *
            60 *
            1000
          )
      );

    const type =
      isVideo(
        media
      )
        ? 'video'
        : 'photo';

    const uploaderAlreadyUsed =
      uploaders.has(
        uploader
      );

    const sceneAlreadyUsed =
      scenes.has(
        scene
      );

    const bucketAlreadyUsed =
      timeBuckets.has(
        bucket
      );

    let adjustedScore =
      item.score;

    if (
      uploaderAlreadyUsed
    ) {
      adjustedScore *=
        0.72;
    }

    if (
      sceneAlreadyUsed
    ) {
      adjustedScore +=
        0.01;
    } else {
      adjustedScore +=
        0.08;
    }

    if (
      bucketAlreadyUsed
    ) {
      adjustedScore +=
        0;
    } else {
      adjustedScore +=
        0.07;
    }

    if (
      mediaTypeCounts[
        type
      ] ===
        0
    ) {
      adjustedScore +=
        0.05;
    }

    if (
      adjustedScore <
      BEST_OF_MIN_SCORE
    ) {
      continue;
    }

    if (
      uploaderAlreadyUsed &&
      selected.length <
        8 &&
      uploaders.size <
        4
    ) {
      continue;
    }

    selected.push({
      media,

      score:
        clamp(
          adjustedScore
        ),
    });

    uploaders.add(
      uploader
    );

    scenes.add(
      scene
    );

    timeBuckets.add(
      bucket
    );

    mediaTypeCounts[
      type
    ] +=
      1;
  }

  // ----------------------------------------------------------
  // FILL
  // ----------------------------------------------------------

  if (
    selected.length <
    BEST_OF_LIMIT
  ) {
    for (
      const item of
        scored
    ) {
      if (
        selected.length >=
        BEST_OF_LIMIT
      ) {
        break;
      }

      if (
        selected.some(
          (
            selectedItem
          ) =>
            selectedItem.media.id ===
            item.media.id
        )
      ) {
        continue;
      }

      selected.push(
        item
      );
    }
  }

  // ----------------------------------------------------------
  // CHRONOLOGICAL ORDER
  // ----------------------------------------------------------

  selected.sort(
    (
      a,
      b
    ) =>
      mediaTimeMs(
        a.media
      ) -
      mediaTimeMs(
        b.media
      )
  );

  return selected;
}

// ============================================================
// PERSIST HIGHLIGHT
// ============================================================

async function persistBestOf(
  eventId,
  selected
) {
  if (
    !selected.length
  ) {
    return null;
  }

  const now =
    new Date().toISOString();

  const bestMedia =
    [
      ...selected,
    ].sort(
      (
        a,
        b
      ) =>
        b.score -
        a.score
    )[0]
      ?.media;

  const {
    data:
      existing,
    error:
      findError,
  } =
    await supabaseAdmin
      .from(
        'highlights'
      )
      .select(
        '*'
      )
      .eq(
        'event_id',
        eventId
      )
      .eq(
        'selection_method',
        'automatic_ai'
      )
      .order(
        'rank',
        {
          ascending:
            true,
        }
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    findError
  ) {
    throw findError;
  }

  const metadata =
    {
      generated_by:
        'everia_ai_story_engine',

      algorithm:
        'quality_diversity_engagement',

      provider:
        'gemini_or_local_fallback',

      generated_at:
        now,

      media_count:
        selected.length,

      cover_media_id:
        bestMedia?.id ||
        null,
    };

  let highlight =
    existing;

  if (
    highlight
  ) {
    const {
      data:
        updated,
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          'highlights'
        )
        .update({
          name:
            'Best Of',

          description:
            'Sélection automatique des souvenirs les plus forts de l’événement.',

          selection_method:
            'automatic_ai',

          rank:
            0,

          media_count:
            selected.length,

          metadata,

          updated_at:
            now,
        })
        .eq(
          'id',
          highlight.id
        )
        .select(
          '*'
        )
        .single();

    if (
      updateError
    ) {
      throw updateError;
    }

    highlight =
      updated;
  } else {
    const {
      data:
        created,
      error:
        createError,
    } =
      await supabaseAdmin
        .from(
          'highlights'
        )
        .insert({
          event_id:
            eventId,

          user_id:
            null,

          name:
            'Best Of',

          description:
            'Sélection automatique des souvenirs les plus forts de l’événement.',

          selection_method:
            'automatic_ai',

          rank:
            0,

          media_count:
            selected.length,

          metadata,
        })
        .select(
          '*'
        )
        .single();

    if (
      createError
    ) {
      throw createError;
    }

    highlight =
      created;
  }

  await supabaseAdmin
    .from(
      'highlight_media'
    )
    .delete()
    .eq(
      'highlight_id',
      highlight.id
    );

  const rows =
    selected.map(
      (
        item,
        index
      ) => ({
        highlight_id:
          highlight.id,

        media_id:
          item.media.id,

        sort_order:
          index,

        score:
          item.score,
      })
    );

  const {
    error:
      relationError,
  } =
    await supabaseAdmin
      .from(
        'highlight_media'
      )
      .insert(
        rows
      );

  if (
    relationError
  ) {
    throw relationError;
  }

  return {
    ...highlight,

    media:
      selected.map(
        (
          item
        ) =>
          item.media
      ),
  };
}

// ============================================================
// PERSIST REPLAY SOURCE
// ============================================================

async function persistBestOfReplay(
  eventId,
  selected
) {
  if (
    !selected.length
  ) {
    return null;
  }

  const now =
    new Date().toISOString();

  const cover =
    [
      ...selected,
    ].sort(
      (
        a,
        b
      ) =>
        b.score -
        a.score
    )[0]
      ?.media;

  const {
    data:
      existing,
    error:
      findError,
  } =
    await supabaseAdmin
      .from(
        'replays'
      )
      .select(
        '*'
      )
      .eq(
        'event_id',
        eventId
      )
      .eq(
        'kind',
        'best_of'
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
    findError
  ) {
    throw findError;
  }

  let replay =
    existing;

  const storyConfig =
    {
      source:
        'automatic_ai',

      ai_provider:
        GEMINI_API_KEY
          ? 'gemini'
          : 'local_fallback',

      algorithm:
        'quality_diversity_engagement',

      version:
        '4.0.0',

      media_count:
        selected.length,

      generated_at:
        now,
    };

  if (
    replay
  ) {
    const {
      data:
        updated,
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          'replays'
        )
        .update({
          status:
            'draft',

          title:
            'Best Of',

          description:
            'Les meilleurs instants de votre événement sélectionnés automatiquement.',

          cover_media_id:
            cover?.id ||
            null,

          story_config:

            storyConfig,

          processing_result:
            {
              selection_ready:
                true,

              video_ready:
                false,

              generated_at:
                now,
            },

          updated_at:
            now,
        })
        .eq(
          'id',
          replay.id
        )
        .select(
          '*'
        )
        .single();

    if (
      updateError
    ) {
      throw updateError;
    }

    replay =
      updated;
  } else {
    const {
      data:
        created,
      error:
        createError,
    } =
      await supabaseAdmin
        .from(
          'replays'
        )
        .insert({
          event_id:
            eventId,

          owner_user_id:
            null,

          kind:
            'best_of',

          status:
            'draft',

          title:
            'Best Of',

          description:
            'Les meilleurs instants de votre événement sélectionnés automatiquement.',

          cover_media_id:
            cover?.id ||
            null,

          output_path:
            null,

          thumbnail_path:
            null,

          requested_at:
            now,

          music:
            {},

          story_config:
            storyConfig,

          processing_result:
            {
              selection_ready:
                true,

              video_ready:
                false,

              generated_at:
                now,
            },

          metadata:
            {
              generated_by:
                'everia_ai_story_engine',
            },
        })
        .select(
          '*'
        )
        .single();

    if (
      createError
    ) {
      throw createError;
    }

    replay =
      created;
  }

  await supabaseAdmin
    .from(
      'replay_items'
    )
    .delete()
    .eq(
      'replay_id',
      replay.id
    );

  const items =
    selected.map(
      (
        entry,
        index
      ) => ({
        replay_id:
          replay.id,

        media_id:
          entry.media.id,

        moment_id:
          null,

        text_content:
          null,

        item_type:
          isVideo(
            entry.media
          )
            ? 'video'
            : 'media',

        sort_order:
          index,

        start_ms:
          null,

        duration_ms:
          isVideo(
            entry.media
          )
            ? 4500
            : 3000,

        metadata:
          {
            score:
              entry.score,

            selection_source:
              'automatic_ai',

            generated_at:
              now,
          },
      })
    );

  const {
    error:
      itemError,
  } =
    await supabaseAdmin
      .from(
        'replay_items'
      )
      .insert(
        items
      );

  if (
    itemError
  ) {
    throw itemError;
  }

  return {
    ...replay,

    media_count:
      selected.length,
  };
}

// ============================================================
// PERSONALIZATION
// ============================================================

async function updatePersonalization(
  media
) {
  if (
    !media.uploader_user_id
  ) {
    return {
      skipped:
        true,
    };
  }

  const {
    data:
      settings,
  } =
    await supabaseAdmin
      .from(
        'user_settings'
      )
      .select(
        'ai_personalization_enabled'
      )
      .eq(
        'user_id',
        media.uploader_user_id
      )
      .maybeSingle();

  if (
    settings?.ai_personalization_enabled ===
    false
  ) {
    return {
      skipped:
        true,
    };
  }

  const {
    data:
      existing,
  } =
    await supabaseAdmin
      .from(
        'personalized_items'
      )
      .select(
        'id'
      )
      .eq(
        'event_id',
        media.event_id
      )
      .eq(
        'user_id',
        media.uploader_user_id
      )
      .eq(
        'item_type',
        'media'
      )
      .eq(
        'item_id',
        media.id
      )
      .maybeSingle();

  if (
    existing?.id
  ) {
    return {
      skipped:
        true,

      reason:
        'already_exists',
    };
  }

  const score =
    bestOfScore(
      media
    );

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        'personalized_items'
      )
      .insert({
        event_id:
          media.event_id,

        user_id:
          media.uploader_user_id,

        item_type:
          'media',

        item_id:
          media.id,

        score,

        reason:
          'Souvenir provenant de votre participation à cet événement.',

        rank:
          Math.round(
            score *
              1000
          ),

        metadata:
          {
            source:
              'everia_ai_story_engine',

            score,
          },
      });

  if (
    error
  ) {
    throw error;
  }

  return {
    created:
      1,
  };
}

// ============================================================
// NOTIFICATION
// ============================================================

async function notifyMediaReady(
  media
) {
  if (
    !media.uploader_user_id
  ) {
    return null;
  }

  const {
    data:
      settings,
  } =
    await supabaseAdmin
      .from(
        'user_settings'
      )
      .select(
        'push_enabled'
      )
      .eq(
        'user_id',
        media.uploader_user_id
      )
      .maybeSingle();

  if (
    settings?.push_enabled ===
    false
  ) {
    return null;
  }

  const alreadyNotified =
    media
      ?.processing_metadata
      ?.ai
      ?.notification_sent_at;

  if (
    alreadyNotified
  ) {
    return null;
  }

  const deepLink =
    `/event/${media.event_id}/media/${media.id}`;

  const {
    data:
      notification,
    error,
  } =
    await supabaseAdmin
      .from(
        'notifications'
      )
      .insert({
        user_id:
          media.uploader_user_id,

        event_id:
          media.event_id,

        type:
          'media_approved',

        channel:
          'in_app',

        status:
          'queued',

        title:
          'Votre souvenir est prêt',

        body:
          'Everia vient d’intégrer votre média à votre expérience.',

        deep_link:
          deepLink,

        data:
          {
            media_id:
              media.id,

            source:
              'everia_story_engine',

            deep_link:
              deepLink,
          },
      })
      .select(
        '*'
      )
      .single();

  if (
    error
  ) {
    throw error;
  }

  await supabaseAdmin
    .from(
      'media'
    )
    .update({
      processing_metadata:
        {
          ...(
            media.processing_metadata ||
            {}
          ),

          ai:
            {
              ...(
                media
                  .processing_metadata
                  ?.ai ||
                {}
              ),

              notification_sent_at:
                new Date().toISOString(),
            },
        },
    })
    .eq(
      'id',
      media.id
    );

  return notification;
}

// ============================================================
// STORY GENERATION
// ============================================================

async function generateStory(
  eventId
) {
  const mediaRows =
    await fetchStoryMedia(
      eventId
    );

  if (
    !mediaRows.length
  ) {
    return {
      moments:
        [],

      bestOf:
        null,

      replay:
        null,
    };
  }

  const moments =
    await generateMoments(
      eventId,
      mediaRows
    );

  const selected =
    selectBestOf(
      mediaRows
    );

  const bestOf =
    await persistBestOf(
      eventId,
      selected
    );

  const replay =
    await persistBestOfReplay(
      eventId,
      selected
    );

  return {
    moments,

    bestOf:
      {
        id:
          bestOf?.id ||
          null,

        mediaCount:
          selected.length,

        mediaIds:
          selected.map(
            (
              item
            ) =>
              item.media.id
          ),
      },

    replay:
      {
        id:
          replay?.id ||
          null,

        mediaCount:
          selected.length,
      },
  };
}

// ============================================================
// ANALYZE MEDIA
// ============================================================

async function analyzeMedia(
  mediaId,
  auth
) {
  const media =
    await loadMedia(
      mediaId
    );

  const allowed =
    await authorizeMedia(
      auth,
      media
    );

  if (
    !allowed
  ) {
    throw new Error(
      'Accès refusé.'
    );
  }

  if (
    media.deleted_at
  ) {
    return {
      status:
        'skipped',

      reason:
        'media_deleted',
    };
  }

  if (
    ![
      'ready',
      'published',
    ].includes(
      media.status
    )
  ) {
    return {
      status:
        'waiting',

      reason:
        'media_not_ready',
    };
  }

  const event =
    await loadEvent(
      media.event_id
    );

  // ----------------------------------------------------------
  // AI DISABLED
  // ----------------------------------------------------------

  const explicitlyDisabled =
    event
      ?.ai_settings
      ?.enabled ===
    false;

  if (
    explicitlyDisabled
  ) {
    const fallback =
      createFallbackAnalysis(
        media
      );

    const updated =
      await saveAIResult({
        media,

        event,

        analysis:
          fallback,

        provider:
          'disabled-fallback',
      });

    const story =
      await generateStory(
        media.event_id
      );

    return {
      status:
        'ai_disabled',

      mediaId:
        updated.id,

      story,
    };
  }

  // ----------------------------------------------------------
  // GEMINI
  // ----------------------------------------------------------

  let analysis;

  let provider =
    'gemini';

  try {
    const source =
      await createSignedUrl(
        media
      );

    analysis =
      await callGemini(
        media,
        source.url
      );
  } catch (
    error
  ) {
    console.warn(
      '[Everia] Gemini unavailable, fallback enabled:',
      error?.message
    );

    analysis =
      createFallbackAnalysis(
        media
      );

    provider =
      'local-fallback';
  }

  // ----------------------------------------------------------
  // PERSIST
  // ----------------------------------------------------------

  const updatedMedia =
    await saveAIResult({
      media,

      event,

      analysis,

      provider,
    });

  // ----------------------------------------------------------
  // STORY
  // ----------------------------------------------------------

  const story =
    await generateStory(
      media.event_id
    );

  // ----------------------------------------------------------
  // PERSONALIZATION
  // ----------------------------------------------------------

  const personalization =
    await updatePersonalization(
      updatedMedia
    ).catch(
      (
        error
      ) => ({
        error:
          error?.message,
      })
    );

  // ----------------------------------------------------------
  // NOTIFICATION
  // ----------------------------------------------------------

  const notification =
    await notifyMediaReady(
      updatedMedia
    ).catch(
      (
        error
      ) => ({
        error:
          error?.message,
      })
    );

  // ----------------------------------------------------------
  // RESULT
  // ----------------------------------------------------------

  return {
    status:
      provider ===
      'gemini'
        ? 'completed'
        : 'completed_with_fallback',

    mediaId:
      updatedMedia.id,

    provider,

    labels:
      updatedMedia.ai_labels ||
      [],

    story,

    personalization,

    notification,
  };
}

// ============================================================
// REFRESH STORY
// ============================================================

async function refreshStory(
  eventId,
  auth
) {
  if (
    !isUuid(
      eventId
    )
  ) {
    throw new Error(
      'eventId invalide.'
    );
  }

  if (
    auth.type !==
    'worker'
  ) {
    const {
      data:
        event,
    } =
      await supabaseAdmin
        .from(
          'events'
        )
        .select(
          'owner_id'
        )
        .eq(
          'id',
          eventId
        )
        .single();

    if (
      !event
    ) {
      throw new Error(
        'Événement introuvable.'
      );
    }

    if (
      event.owner_id !==
      auth.user.id
    ) {
      const {
        data:
          membership,
      } =
        await supabaseAdmin
          .from(
            'event_members'
          )
          .select(
            'role, status'
          )
          .eq(
            'event_id',
            eventId
          )
          .eq(
            'user_id',
            auth.user.id
          )
          .maybeSingle();

      if (
        !membership ||
        membership.status !==
          'joined' ||
        ![
          'owner',
          'admin',
          'organizer',
        ].includes(
          membership.role
        )
      ) {
        throw new Error(
          'Accès refusé.'
        );
      }
    }
  }

  return generateStory(
    eventId
  );
}

// ============================================================
// HTTP
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
      const body =
        await request
          .json()
          .catch(
            () => ({})
          );

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

      const action =
        body.action ||
        'analyze';

      // --------------------------------------------------------
      // REFRESH STORY
      // --------------------------------------------------------

      if (
        action ===
        'refresh_story'
      ) {
        const story =
          await refreshStory(
            body.eventId,
            auth
          );

        return json({
          status:
            'completed',

          story,
        });
      }

      // --------------------------------------------------------
      // ANALYZE
      // --------------------------------------------------------

      const mediaId =
        body.mediaId ||
        body.media_id ||
        body?.record?.id;

      if (
        !isUuid(
          mediaId
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

      const result =
        await analyzeMedia(
          mediaId,
          auth
        );

      return json(
        result
      );
    } catch (
      error
    ) {
      console.error(
        '[Everia] media-ai error:',
        error
      );

      return json(
        {
          error:
            error?.message ||
            'Erreur du moteur IA.',
        },
        500
      );
    }
  }
);