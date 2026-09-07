// src/lib/storyEngine.js
// ============================================================
// EVERIA — Story Engine
// ============================================================

import {
  supabase,
} from '@/lib/supabase';

const AI_FUNCTION =
  'media-ai';

async function invoke(
  action,
  payload = {}
) {
  const {
    data,
    error,
  } = await supabase.functions.invoke(
    AI_FUNCTION,
    {
      body: {
        action,
        ...payload,
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

export async function refreshEventStory(
  eventId,
  options = {}
) {
  if (!eventId) {
    throw new Error(
      'eventId est requis.'
    );
  }

  return invoke(
    'refresh_story',
    {
      eventId,
      kind:
        options.kind ||
        'best_of',
      ownerUserId:
        options.ownerUserId ||
        null,
    }
  );
}

export async function analyzeMedia(
  mediaId
) {
  if (!mediaId) {
    throw new Error(
      'mediaId est requis.'
    );
  }

  return invoke(
    'analyze',
    {
      mediaId,
    }
  );
}

export async function getAutomaticMoments(
  eventId
) {
  if (!eventId) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from('moments')
    .select(
      `
        *,
        moment_media(count)
      `
    )
    .eq(
      'event_id',
      eventId
    )
    .eq(
      'source',
      'ai'
    )
    .order(
      'starts_at',
      {
        ascending: true,
      }
    );

  if (error) {
    throw error;
  }

  return (
    data || []
  ).map(
    (moment) => ({
      ...moment,
      media_count:
        Number(
          moment
            .moment_media?.[0]
            ?.count || 0
        ),
    })
  );
}

export async function getAutomaticBestOf(
  eventId
) {
  if (!eventId) {
    return null;
  }

  const {
    data:
      highlight,
    error:
      highlightError,
  } = await supabase
    .from(
      'highlights'
    )
    .select('*')
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
        ascending: true,
      }
    )
    .limit(1)
    .maybeSingle();

  if (highlightError) {
    throw highlightError;
  }

  if (!highlight) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'highlight_media'
    )
    .select(
      'media(*)'
    )
    .eq(
      'highlight_id',
      highlight.id
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

  return {
    ...highlight,
    media:
      (data || [])
        .map(
          (row) =>
            row.media
        )
        .filter(Boolean),
  };
}

export async function getAutomaticBestOfReplay(
  eventId
) {
  if (!eventId) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'replays'
    )
    .select('*')
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
        ascending: false,
      }
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}