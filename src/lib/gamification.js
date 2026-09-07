// src/lib/gamification.js
// ============================================================
// EVERIA — Gamification Service
// ============================================================

import {
  supabase,
} from '@/lib/supabase';

import {
  fetchProfilesByIds,
} from '@/lib/profiles';

export const LEVEL_SIZE = 250;

export function levelFromPoints(
  points = 0
) {
  let remaining =
    Math.max(
      0,
      Number(points) || 0
    );

  let level = 1;
  let threshold =
    LEVEL_SIZE;

  while (
    remaining >=
    threshold
  ) {
    remaining -= threshold;
    level += 1;
    threshold =
      level * LEVEL_SIZE;
  }

  return {
    level,
    progress:
      threshold > 0
        ? remaining /
          threshold
        : 0,
    currentLevelPoints:
      remaining,
    levelThreshold:
      threshold,
    pointsToNext:
      Math.max(
        0,
        threshold -
          remaining
      ),
  };
}

export async function getEventParticipation(
  eventId,
  userId
) {
  if (
    !eventId ||
    !userId
  ) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'event_participation_profiles'
    )
    .select('*')
    .eq(
      'event_id',
      eventId
    )
    .eq(
      'user_id',
      userId
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getEventLeaderboard(
  eventId,
  limit = 30
) {
  if (!eventId) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'event_participation_profiles'
    )
    .select('*')
    .eq(
      'event_id',
      eventId
    )
    .order(
      'participation_score',
      {
        ascending: false,
      }
    )
    .order(
      'points',
      {
        ascending: false,
      }
    )
    .limit(limit);

  if (error) {
    throw error;
  }

  const profiles =
    await fetchProfilesByIds(
      (data || []).map(
        (row) =>
          row.user_id
      )
    );

  return (
    data || []
  ).map(
    (
      row,
      index
    ) => ({
      ...row,
      rank:
        index + 1,
      profile:
        profiles[
          row.user_id
        ] || null,
    })
  );
}

export async function getEventBadges(
  eventId,
  userId
) {
  if (
    !eventId ||
    !userId
  ) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'user_badges'
    )
    .select(
      `
        *,
        badges(*)
      `
    )
    .eq(
      'event_id',
      eventId
    )
    .eq(
      'user_id',
      userId
    )
    .order(
      'unlocked_at',
      {
        ascending: false,
      }
    );

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getGamificationSnapshot(
  eventId,
  userId
) {
  const [
    stats,
    badges,
    leaderboard,
  ] = await Promise.all([
    getEventParticipation(
      eventId,
      userId
    ),

    getEventBadges(
      eventId,
      userId
    ),

    getEventLeaderboard(
      eventId
    ),
  ]);

  return {
    stats,
    badges,
    leaderboard,
  };
}