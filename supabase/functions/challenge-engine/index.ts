// supabase/functions/challenge-engine/index.js
// ============================================================
// EVERIA — Challenge Engine
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

const admin =
  createClient(
    SUPABASE_URL,
    SERVICE_ROLE_KEY,
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

async function getMembership(
  eventId,
  userId
) {
  const {
    data,
    error,
  } =
    await admin
      .from(
        'event_members'
      )
      .select(
        'id,role,status'
      )
      .eq(
        'event_id',
        eventId
      )
      .eq(
        'user_id',
        userId
      )
      .limit(1)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function canManage(
  membership,
  ownerId,
  userId
) {
  if (
    ownerId ===
    userId
  ) {
    return true;
  }

  return (
    ['owner','admin','organizer','moderator'].includes(
      String(
        membership?.role ||
          ''
      ).toLowerCase()
    ) &&
    String(
      membership?.status ||
        ''
    ).toLowerCase() ===
      'joined'
  );
}

async function getChallenge(
  challengeId
) {
  const {
    data,
    error,
  } =
    await admin
      .from(
        'challenges'
      )
      .select('*')
      .eq(
        'id',
        challengeId
      )
      .single();

  if (error) {
    throw error;
  }

  return data;
}

async function validateSubmission(
  challenge,
  submission
) {
  const method =
    String(
      challenge
        .validation_method ||
        'manual'
    );

  const rules =
    challenge.rules ||
    {};

  const aiRules =
    challenge
      .ai_validation_rules ||
    {};

  let media =
    null;

  if (
    submission.media_id
  ) {
    const {
      data,
      error,
    } =
      await admin
        .from(
          'media'
        )
        .select(
          `
            id,
            event_id,
            media_type,
            status,
            processing_metadata,
            ai_labels
          `
        )
        .eq(
          'id',
          submission.media_id
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    media = data;
  }

  if (
    challenge.challenge_type ===
      'photo' &&
    media?.media_type !==
      'photo'
  ) {
    return {
      status:
        'rejected',

      reason:
        'Une photo est requise.',
    };
  }

  if (
    challenge.challenge_type ===
      'video' &&
    media?.media_type !==
      'video'
  ) {
    return {
      status:
        'rejected',

      reason:
        'Une vidéo est requise.',
    };
  }

  const minPeople =
    Number(
      rules.min_people ||
        aiRules.min_people ||
        0
    );

  if (
    minPeople > 0
  ) {
    const peopleCount =
      Number(
        media
          ?.processing_metadata
          ?.ai
          ?.people_count ||
          0
      );

    if (
      peopleCount <
      minPeople
    ) {
      return {
        status:
          ['ai','hybrid'].includes(
            method
          )
            ? 'submitted'
            : 'rejected',

        reason:
          `Le média doit montrer au moins ${minPeople} personne(s).`,
      };
    }
  }

  const requiredLabels =
    [
      ...(Array.isArray(
        rules.required_labels
      )
        ? rules.required_labels
        : []),

      ...(Array.isArray(
        aiRules.required_labels
      )
        ? aiRules.required_labels
        : []),
    ].map(
      (value) =>
        String(
          value
        ).toLowerCase()
    );

  if (
    requiredLabels.length
  ) {
    const labels =
      [
        ...(Array.isArray(
          media?.ai_labels
        )
          ? media.ai_labels
          : []),

        ...(Array.isArray(
          media
            ?.processing_metadata
            ?.ai
            ?.labels
        )
          ? media
              .processing_metadata
              .ai
              .labels
          : []),
      ].map(
        (value) =>
          String(
            value
          ).toLowerCase()
      );

    const missing =
      requiredLabels.filter(
        (required) =>
          !labels.some(
            (label) =>
              label.includes(
                required
              )
          )
      );

    if (
      missing.length
    ) {
      return {
        status:
          ['ai','hybrid'].includes(
            method
          )
            ? 'submitted'
            : 'rejected',

        reason:
          `Condition IA non confirmée : ${missing.join(', ')}.`,
      };
    }
  }

  if (
    method ===
      'manual' ||
    method ===
      'community'
  ) {
    return {
      status:
        'submitted',

      reason:
        'Validation humaine requise.',
    };
  }

  if (
    [
      'ai',
      'rule',
      'rules',
      'hybrid',
    ].includes(
      method
    )
  ) {
    return {
      status:
        'approved',

      reason:
        'Conditions du défi validées automatiquement.',
    };
  }

  return {
    status:
      'submitted',

    reason:
      'Validation requise.',
  };
}

async function refreshGamification(
  eventId,
  userId
) {
  await admin.rpc(
    'refresh_gamification_from_event',
    {
      p_event_id:
        eventId,

      p_user_id:
        userId,
    }
  );
}

async function submit(
  user,
  body
) {
  const {
    data,
    error,
  } =
    await admin.rpc(
      'submit_challenge',
      {
        p_challenge_id:
          body.challengeId,

        p_media_id:
          body.mediaId ||
          null,

        p_text_response:
          body.textResponse ||
          null,

        p_team_id:
          body.teamId ||
          null,
      }
    );

  if (error) {
    throw error;
  }

  const challenge =
    await getChallenge(
      body.challengeId
    );

  const evaluation =
    await validateSubmission(
      challenge,
      data
    );

  let finalSubmission =
    data;

  if (
    [
      'approved',
      'rejected',
    ].includes(
      evaluation.status
    )
  ) {
    const {
      data:
        updated,
      error:
        updateError,
    } =
      await admin
        .from(
          'challenge_submissions'
        )
        .update({
          status:
            evaluation.status,

          reviewed_at:
            new Date().toISOString(),

          validation_reason:
            evaluation.reason,

          validation_score:
            evaluation.status ===
            'approved'
              ? 1
              : 0,

          ai_result:
            {
              engine:
                'challenge-engine',

              automatic:
                true,

              reason:
                evaluation.reason,
            },
        })
        .eq(
          'id',
          data.id
        )
        .select('*')
        .single();

    if (updateError) {
      throw updateError;
    }

    finalSubmission =
      updated;
  }

  if (
    finalSubmission.status ===
    'approved'
  ) {
    await refreshGamification(
      challenge.event_id,
      user.id
    );
  }

  return {
    submission:
      finalSubmission,

    challenge,
  };
}

async function review(
  user,
  body
) {
  const {
    data:
      submission,
    error,
  } =
    await admin
      .from(
        'challenge_submissions'
      )
      .select(
        `
          *,
          challenges(
            event_id,
            created_by
          )
        `
      )
      .eq(
        'id',
        body.submissionId
      )
      .single();

  if (error) {
    throw error;
  }

  const eventId =
    submission
      .challenges
      ?.event_id;

  const {
    data: event,
    error:
      eventError,
  } =
    await admin
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

  if (eventError) {
    throw eventError;
  }

  const membership =
    await getMembership(
      eventId,
      user.id
    );

  if (
    !canManage(
      membership,
      event.owner_id,
      user.id
    )
  ) {
    throw new Error(
      'FORBIDDEN'
    );
  }

  const decision =
    body.decision ===
    'approved'
      ? 'approved'
      : 'rejected';

  const {
    data: updated,
    error:
      updateError,
  } =
    await admin
      .from(
        'challenge_submissions'
      )
      .update({
        status:
          decision,

        reviewed_at:
          new Date().toISOString(),

        reviewed_by:
          user.id,

        validation_reason:
          body.reason ||
          (
            decision ===
            'approved'
              ? 'Validation par l’organisateur.'
              : 'Soumission non validée.'
          ),

        validation_score:
          decision ===
          'approved'
            ? 1
            : 0,
      })
      .eq(
        'id',
        submission.id
      )
      .select('*')
      .single();

  if (updateError) {
    throw updateError;
  }

  if (
    decision ===
      'approved' &&
    submission.user_id
  ) {
    await refreshGamification(
      eventId,
      submission.user_id
    );
  }

  return {
    submission:
      updated,
  };
}

async function create(
  user,
  body
) {
  const {
    data: event,
    error,
  } =
    await admin
      .from('events')
      .select(
        'id,owner_id'
      )
      .eq(
        'id',
        body.eventId
      )
      .single();

  if (error) {
    throw error;
  }

  const membership =
    await getMembership(
      body.eventId,
      user.id
    );

  if (
    !canManage(
      membership,
      event.owner_id,
      user.id
    )
  ) {
    throw new Error(
      'FORBIDDEN'
    );
  }

  if (
    !body.title?.trim()
  ) {
    throw new Error(
      'Le titre du défi est requis.'
    );
  }

  const payload = {
    event_id:
      body.eventId,

    created_by:
      user.id,

    title:
      body.title.trim(),

    description:
      body.description ||
      null,

    challenge_type:
      body.challengeType ||
      'photo',

    scope:
      body.scope ||
      'individual',

    validation_method:
      body.validationMethod ||
      'manual',

    status:
      body.status ||
      'draft',

    starts_at:
      body.startsAt ||
      null,

    ends_at:
      body.endsAt ||
      null,

    max_attempts:
      body.maxAttempts
        ? Number(
            body.maxAttempts
          )
        : null,

    reward_points:
      Number(
        body.rewardPoints ||
          25
      ),

    difficulty:
      Math.max(
        1,
        Math.min(
          5,
          Number(
            body.difficulty ||
              1
          )
        )
      ),

    is_personalized:
      !!body.isPersonalized,

    is_featured:
      !!body.isFeatured,

    rules:
      body.rules ||
      {},

    ai_validation_rules:
      body.aiValidationRules ||
      {},

    metadata:
      body.metadata ||
      {},
  };

  const {
    data,
    error:
      insertError,
  } =
    await admin
      .from(
        'challenges'
      )
      .insert(
        payload
      )
      .select('*')
      .single();

  if (insertError) {
    throw insertError;
  }

  return {
    challenge:
      data,
  };
}

async function update(
  user,
  body
) {
  const challenge =
    await getChallenge(
      body.challengeId
    );

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
        challenge.event_id
      )
      .single();

  if (error) {
    throw error;
  }

  const membership =
    await getMembership(
      challenge.event_id,
      user.id
    );

  if (
    !canManage(
      membership,
      event.owner_id,
      user.id
    )
  ) {
    throw new Error(
      'FORBIDDEN'
    );
  }

  const patch = {
    updated_at:
      new Date().toISOString(),
  };

  [
    'title',
    'description',
    'starts_at',
    'ends_at',
    'max_attempts',
    'reward_points',
    'difficulty',
    'is_featured',
    'is_personalized',
    'rules',
    'ai_validation_rules',
  ].forEach(
    (key) => {
      if (
        body[key] !==
        undefined
      ) {
        patch[key] =
          body[key];
      }
    }
  );

  if (
    body.status
  ) {
    patch.status =
      body.status;
  }

  if (
    body.challengeType
  ) {
    patch.challenge_type =
      body.challengeType;
  }

  if (
    body.validationMethod
  ) {
    patch.validation_method =
      body.validationMethod;
  }

  if (
    body.scope
  ) {
    patch.scope =
      body.scope;
  }

  const {
    data,
    error:
      updateError,
  } =
    await admin
      .from(
        'challenges'
      )
      .update(
        patch
      )
      .eq(
        'id',
        challenge.id
      )
      .select('*')
      .single();

  if (updateError) {
    throw updateError;
  }

  return {
    challenge:
      data,
  };
}

async function publish(
  user,
  body
) {
  return update(
    user,
    {
      challengeId:
        body.challengeId,

      status:
        'active',
    }
  );
}

async function remove(
  user,
  body
) {
  const challenge =
    await getChallenge(
      body.challengeId
    );

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
        challenge.event_id
      )
      .single();

  if (error) {
    throw error;
  }

  const membership =
    await getMembership(
      challenge.event_id,
      user.id
    );

  if (
    !canManage(
      membership,
      event.owner_id,
      user.id
    )
  ) {
    throw new Error(
      'FORBIDDEN'
    );
  }

  const {
    error:
      deleteError,
  } =
    await admin
      .from(
        'challenges'
      )
      .delete()
      .eq(
        'id',
        challenge.id
      );

  if (deleteError) {
    throw deleteError;
  }

  return {
    deleted:
      true,
  };
}

async function seed(
  user,
  body
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
        body.eventId
      )
      .single();

  if (error) {
    throw error;
  }

  const membership =
    await getMembership(
      body.eventId,
      user.id
    );

  if (
    !canManage(
      membership,
      event.owner_id,
      user.id
    )
  ) {
    throw new Error(
      'FORBIDDEN'
    );
  }

  const defaults = [
    {
      title:
        'Le moment le plus drôle',

      description:
        'Capturez le moment qui vous fait le plus rire.',

      challenge_type:
        'photo',

      reward_points:
        25,

      difficulty:
        2,

      validation_method:
        'manual',
    },

    {
      title:
        'Une rencontre',

      description:
        'Prenez une photo avec quelqu’un que vous venez de rencontrer.',

      challenge_type:
        'photo',

      reward_points:
        30,

      difficulty:
        3,

      validation_method:
        'ai',

      rules:
        {
          min_people:
            2,
        },
    },

    {
      title:
        'La piste de danse',

      description:
        'Capturez le meilleur mouvement de danse.',

      challenge_type:
        'video',

      reward_points:
        35,

      difficulty:
        3,

      validation_method:
        'manual',
    },
  ];

  const rows =
    defaults.map(
      (item) => ({
        ...item,

        event_id:
          body.eventId,

        created_by:
          user.id,

        status:
          'active',

        scope:
          'individual',

        rules:
          item.rules ||
          {},

        ai_validation_rules:
          item.rules ||
          {},
      })
    );

  const {
    data,
    error:
      insertError,
  } =
    await admin
      .from(
        'challenges'
      )
      .insert(
        rows
      )
      .select('*');

  if (insertError) {
    throw insertError;
  }

  return {
    challenges:
      data || [],
  };
}

async function stats(
  body
) {
  const {
    data: challenges,
    error,
  } =
    await admin
      .from(
        'challenges'
      )
      .select(
        'id,reward_points,status'
      )
      .eq(
        'event_id',
        body.eventId
      );

  if (error) {
    throw error;
  }

  const ids =
    (
      challenges ||
      []
    ).map(
      (item) =>
        item.id
    );

  if (!ids.length) {
    return {
      total: 0,
      active: 0,
      submissions: 0,
      approved: 0,
      pointsAwarded: 0,
    };
  }

  const {
    data:
      submissions,
    error:
      submissionsError,
  } =
    await admin
      .from(
        'challenge_submissions'
      )
      .select(
        'status,challenge_id'
      )
      .in(
        'challenge_id',
        ids
      );

  if (
    submissionsError
  ) {
    throw submissionsError;
  }

  const approved =
    (
      submissions ||
      []
    ).filter(
      (item) =>
        item.status ===
        'approved'
    );

  const pointsAwarded =
    approved.reduce(
      (
        total,
        submission
      ) => {
        const challenge =
          challenges.find(
            (item) =>
              item.id ===
              submission.challenge_id
          );

        return (
          total +
          Number(
            challenge?.reward_points ||
              0
          )
        );
      },
      0
    );

  return {
    total:
      challenges.length,

    active:
      challenges.filter(
        (item) =>
          item.status ===
          'active'
      ).length,

    submissions:
      (
        submissions ||
        []
      ).length,

    approved:
      approved.length,

    pointsAwarded,
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

      let result;

      switch (
        body.action
      ) {
        case 'submit':
          result =
            await submit(
              user,
              body
            );
          break;

        case 'review':
          result =
            await review(
              user,
              body
            );
          break;

        case 'create':
          result =
            await create(
              user,
              body
            );
          break;

        case 'update':
          result =
            await update(
              user,
              body
            );
          break;

        case 'publish':
          result =
            await publish(
              user,
              body
            );
          break;

        case 'delete':
          result =
            await remove(
              user,
              body
            );
          break;

        case 'seed':
          result =
            await seed(
              user,
              body
            );
          break;

        case 'stats':
          result =
            await stats(
              body
            );
          break;

        default:
          throw new Error(
            'UNKNOWN_ACTION'
          );
      }

      return json(
        result
      );
    } catch (
      error
    ) {
      console.error(
        '[Everia] challenge-engine:',
        error
      );

      return json(
        {
          error:
            error?.message ||
            'CHALLENGE_ENGINE_ERROR',
        },
        400
      );
    }
  }
);