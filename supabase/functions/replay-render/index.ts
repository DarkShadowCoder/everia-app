// supabase/functions/replay-render/index.js
// ============================================================
// EVERIA — Replay Render Orchestrator
// ============================================================

import {
  createClient,
} from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL =
  Deno.env.get(
    'SUPABASE_URL'
  );

const SERVICE_ROLE_KEY =
  Deno.env.get(
    'SUPABASE_SERVICE_ROLE_KEY'
  );

const RENDERER_URL =
  Deno.env.get(
    'REPLAY_RENDERER_URL'
  );

const RENDERER_SECRET =
  Deno.env.get(
    'REPLAY_RENDERER_SECRET'
  );

const admin =
  createClient(
    SUPABASE_URL,
    SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,
      },
    }
  );

const corsHeaders = {
  'Access-Control-Allow-Origin':
    '*',

  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',

  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
};

function json(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
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

async function getUser(
  request
) {
  const authorization =
    request.headers.get(
      'Authorization'
    ) || '';

  if (
    !authorization.startsWith(
      'Bearer '
    )
  ) {
    return null;
  }

  const token =
    authorization.slice(
      7
    );

  const {
    data,
  } =
    await admin.auth.getUser(
      token
    );

  return data?.user ||
    null;
}

async function canRender(
  replay,
  userId
) {
  const {
    data: event,
    error,
  } =
    await admin
      .from('events')
      .select(
        'owner_id'
      )
      .eq(
        'id',
        replay.event_id
      )
      .single();

  if (error) {
    throw error;
  }

  if (
    replay.owner_user_id ===
    userId
  ) {
    return true;
  }

  if (
    event.owner_id ===
    userId
  ) {
    return true;
  }

  const {
    data: membership,
    error:
      membershipError,
  } =
    await admin
      .from(
        'event_members'
      )
      .select(
        'role,status'
      )
      .eq(
        'event_id',
        replay.event_id
      )
      .eq(
        'user_id',
        userId
      )
      .limit(1)
      .maybeSingle();

  if (
    membershipError
  ) {
    throw membershipError;
  }

  return (
    membership?.status ===
      'joined' &&
    [
      'owner',
      'admin',
      'organizer',
      'moderator',
    ].includes(
      String(
        membership?.role ||
          ''
      ).toLowerCase()
    )
  );
}

async function buildManifest(
  replay
) {
  const {
    data: items,
    error,
  } =
    await admin
      .from(
        'replay_items'
      )
      .select(
        `
          id,
          media_id,
          text_content,
          item_type,
          sort_order,
          duration_ms,
          metadata,
          media(*)
        `
      )
      .eq(
        'replay_id',
        replay.id
      )
      .order(
        'sort_order',
        {
          ascending: true,
        }
      );

  if (error) {
    throw error;
  }

  const manifest = [];

  for (
    const item of
      items || []
  ) {
    if (
      !item.media &&
      !item.text_content
    ) {
      continue;
    }

    const media =
      item.media;

    let signedUrl =
      null;

    let thumbnailUrl =
      null;

    if (media) {
      const path =
        media.display_path ||
        media.original_path;

      if (path) {
        const {
          data,
          error:
            signError,
        } =
          await admin
            .storage
            .from(
              'event-media'
            )
            .createSignedUrl(
              path,
              3600
            );

        if (signError) {
          throw signError;
        }

        signedUrl =
          data?.signedUrl ||
          null;
      }

      const thumbPath =
        media.thumbnail_path ||
        path;

      if (thumbPath) {
        const {
          data,
        } =
          await admin
            .storage
            .from(
              'event-media'
            )
            .createSignedUrl(
              thumbPath,
              3600
            );

        thumbnailUrl =
          data?.signedUrl ||
          null;
      }
    }

    manifest.push({
      id:
        item.id,

      type:
        media?.media_type ||
        item.item_type ||
        'media',

      url:
        signedUrl,

      thumbnailUrl,

      durationMs:
        Math.max(
          1500,
          Number(
            item.duration_ms ||
              (
                media?.media_type ===
                'video'
                  ? 4500
                  : 3000
              )
          )
        ),

      text:
        item.text_content ||
        null,

      metadata:
        item.metadata ||
        {},
    });
  }

  return manifest;
}

async function render(
  user,
  replayId
) {
  if (
    !RENDERER_URL ||
    !RENDERER_SECRET
  ) {
    throw new Error(
      'REPLAY_RENDERER_URL ou REPLAY_RENDERER_SECRET manquant.'
    );
  }

  const {
    data: replay,
    error,
  } =
    await admin
      .from(
        'replays'
      )
      .select('*')
      .eq(
        'id',
        replayId
      )
      .single();

  if (error) {
    throw error;
  }

  if (
    !(await canRender(
      replay,
      user.id
    ))
  ) {
    throw new Error(
      'FORBIDDEN'
    );
  }

  const manifest =
    await buildManifest(
      replay
    );

  if (
    !manifest.length
  ) {
    throw new Error(
      'REPLAY_EMPTY'
    );
  }

  const now =
    new Date().toISOString();

  await admin
    .from('replays')
    .update({
      render_requested_at:
        now,

      render_started_at:
        now,

      render_error:
        null,

      processing_result:
        {
          ...(replay.processing_result ||
            {}),

          render_status:
            'processing',

          render_started_at:
            now,
        },
    })
    .eq(
      'id',
      replay.id
    );

  const response =
    await fetch(
      `${RENDERER_URL.replace(
        /\/$/,
        ''
      )}/render`,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/json',

          'x-renderer-secret':
            RENDERER_SECRET,
        },

        body:
          JSON.stringify(
            {
              replayId:
                replay.id,

              eventId:
                replay.event_id,

              title:
                replay.title ||
                'Everia Replay',

              items:
                manifest,
            }
          ),
      }
    );

  const payload =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (
    !response.ok ||
    payload.error
  ) {
    const message =
      payload.error ||
      `Renderer HTTP ${response.status}`;

    await admin
      .from('replays')
      .update({
        render_error:
          message,

        processing_result:
          {
            ...(replay.processing_result ||
              {}),

            render_status:
              'failed',

            render_error:
              message,
          },
      })
      .eq(
        'id',
        replay.id
      );

    throw new Error(
      message
    );
  }

  const completedAt =
    new Date().toISOString();

  const {
    data: updated,
    error:
      updateError,
  } =
    await admin
      .from('replays')
      .update({
        status:
          'ready',

        output_path:
          payload.outputPath,

        thumbnail_path:
          payload.thumbnailPath ||
          null,

        duration_ms:
          payload.durationMs ||
          null,

        render_completed_at:
          completedAt,

        render_error:
          null,

        completed_at:
          completedAt,

        processing_result:
          {
            ...(replay.processing_result ||
              {}),

            render_status:
              'completed',

            video_ready:
              true,

            rendered_by:
              'everia-replay-renderer',

            duration_ms:
              payload.durationMs ||
              null,

            completed_at:
              completedAt,
          },

        metadata:
          {
            ...(replay.metadata ||
              {}),

            renderer:
              'ffmpeg',
          },

        updated_at:
          completedAt,
      })
      .eq(
        'id',
        replay.id
      )
      .select('*')
      .single();

  if (updateError) {
    throw updateError;
  }

  return {
    replay:
      updated,
  };
}

Deno.serve(
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

    try {
      const user =
        await getUser(
          request
        );

      if (!user) {
        return json(
          {
            error:
              'AUTH_REQUIRED',
          },
          401
        );
      }

      const body =
        await request.json();

      if (
        body.action !==
        'render'
      ) {
        return json(
          {
            error:
              'UNKNOWN_ACTION',
          },
          400
        );
      }

      const result =
        await render(
          user,
          body.replayId
        );

      return json(
        result
      );
    } catch (
      error
    ) {
      console.error(
        '[Everia] replay-render:',
        error
      );

      return json(
        {
          error:
            error?.message ||
            'REPLAY_RENDER_ERROR',
        },
        400
      );
    }
  }
);