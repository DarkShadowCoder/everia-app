// src/lib/replayEngine.js
// ============================================================
// EVERIA — Replay Engine
// ============================================================

import {
  supabase,
} from '@/lib/supabase';

import {
  refreshEventStory,
} from '@/lib/storyEngine';

import {
  signedMediaUrl,
} from '@/lib/storage';

export async function getReplay(
  eventId,
  kind = 'best_of',
  userId = null
) {
  if (!eventId) {
    return null;
  }

  let query =
    supabase
      .from('replays')
      .select('*')
      .eq(
        'event_id',
        eventId
      )
      .eq(
        'kind',
        kind
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )
      .limit(1);

  if (
    kind === 'personal'
  ) {
    query =
      query.eq(
        'owner_user_id',
        userId
      );
  }

  const {
    data,
    error,
  } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getReplayItems(
  replayId
) {
  if (!replayId) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'replay_items'
    )
    .select(
      `
        *,
        media(*)
      `
    )
    .eq(
      'replay_id',
      replayId
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

  return (
    data || []
  ).filter(
    (item) =>
      item.media ||
      item.text_content
  );
}

export async function prepareReplay(
  eventId,
  {
    kind = 'best_of',
    ownerUserId = null,
  } = {}
) {
  return refreshEventStory(
    eventId,
    {
      kind,
      ownerUserId,
    }
  );
}

export async function renderReplay(
  replayId
) {
  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      'replay-render',
      {
        body: {
          action:
            'render',
          replayId,
        },
      }
    );

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(
      data.error
    );
  }

  return data;
}

export async function regenerateAndRenderReplay(
  eventId,
  options = {}
) {
  const story =
    await prepareReplay(
      eventId,
      options
    );

  const replayId =
    story?.replay?.id ||
    story?.replayId;

  if (!replayId) {
    throw new Error(
      'Replay non généré.'
    );
  }

  return renderReplay(
    replayId
  );
}

export async function getSignedReplayUrl(
  outputPath,
  expiresIn = 3600
) {
  if (!outputPath) {
    return null;
  }

  return signedMediaUrl(
    outputPath,
    {
      bucket:
        'replays',
      expiresIn,
    }
  );
}