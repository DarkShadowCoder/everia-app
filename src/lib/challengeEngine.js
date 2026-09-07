// src/lib/challengeEngine.js
// ============================================================
// EVERIA — Challenge Engine
// ============================================================

import { supabase } from '@/lib/supabase';

const FUNCTION_NAME = 'challenge-engine';

async function invoke(action, payload = {}) {
  const { data, error } = await supabase.functions.invoke(
    FUNCTION_NAME,
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
    throw new Error(data.error);
  }

  return data;
}

export async function listEventChallenges(
  eventId,
  userId = null
) {
  if (!eventId) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from('challenges')
    .select('*')
    .eq('event_id', eventId)
    .order('is_featured', {
      ascending: false,
    })
    .order('created_at', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  const challenges = data || [];

  if (!userId || !challenges.length) {
    return challenges;
  }

  const challengeIds =
    challenges.map(
      (item) => item.id
    );

  const {
    data: submissions,
    error: submissionError,
  } = await supabase
    .from('challenge_submissions')
    .select('*')
    .in(
      'challenge_id',
      challengeIds
    )
    .eq(
      'user_id',
      userId
    )
    .order(
      'submitted_at',
      {
        ascending: false,
      }
    );

  if (submissionError) {
    throw submissionError;
  }

  const latestByChallenge = {};

  (submissions || []).forEach(
    (submission) => {
      if (
        !latestByChallenge[
          submission.challenge_id
        ]
      ) {
        latestByChallenge[
          submission.challenge_id
        ] = submission;
      }
    }
  );

  return challenges.map(
    (challenge) => ({
      ...challenge,
      mySubmission:
        latestByChallenge[
          challenge.id
        ] || null,
    })
  );
}

export async function getChallenge(
  challengeId,
  userId = null
) {
  if (!challengeId) {
    throw new Error(
      'challengeId requis.'
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('challenges')
    .select('*')
    .eq(
      'id',
      challengeId
    )
    .single();

  if (error) {
    throw error;
  }

  let submissions = [];

  if (userId) {
    const {
      data: rows,
      error: rowsError,
    } = await supabase
      .from(
        'challenge_submissions'
      )
      .select('*')
      .eq(
        'challenge_id',
        challengeId
      )
      .eq(
        'user_id',
        userId
      )
      .order(
        'submitted_at',
        {
          ascending: false,
        }
      );

    if (rowsError) {
      throw rowsError;
    }

    submissions =
      rows || [];
  }

  return {
    ...data,
    mySubmission:
      submissions[0] ||
      null,
    mySubmissions:
      submissions,
  };
}

export async function submitChallenge({
  challengeId,
  mediaId = null,
  textResponse = null,
  teamId = null,
}) {
  return invoke(
    'submit',
    {
      challengeId,
      mediaId,
      textResponse,
      teamId,
    }
  );
}

export async function reviewChallenge({
  submissionId,
  decision,
  reason = null,
}) {
  return invoke(
    'review',
    {
      submissionId,
      decision,
      reason,
    }
  );
}

export async function createChallenge(
  payload
) {
  return invoke(
    'create',
    payload
  );
}

export async function updateChallenge(
  challengeId,
  payload
) {
  return invoke(
    'update',
    {
      challengeId,
      ...payload,
    }
  );
}

export async function publishChallenge(
  challengeId
) {
  return invoke(
    'publish',
    {
      challengeId,
    }
  );
}

export async function deleteChallenge(
  challengeId
) {
  return invoke(
    'delete',
    {
      challengeId,
    }
  );
}

export async function seedEventChallenges(
  eventId
) {
  return invoke(
    'seed',
    {
      eventId,
    }
  );
}

export async function getChallengeStats(
  eventId
) {
  return invoke(
    'stats',
    {
      eventId,
    }
  );
}