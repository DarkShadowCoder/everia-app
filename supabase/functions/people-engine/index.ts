// supabase/functions/people-engine/index.js
// ============================================================
// EVERIA — People Engine
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

async function assertEventMember(
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
        'id,status,role'
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

  if (
    !data ||
    data.status !==
      'joined'
  ) {
    throw new Error(
      'NOT_EVENT_MEMBER'
    );
  }

  return data;
}

async function bootstrap(
  user,
  eventId
) {
  await assertEventMember(
    eventId,
    user.id
  );

  const {
    data: members,
    error,
  } =
    await admin
      .from(
        'event_members'
      )
      .select(
        'user_id,display_name,status'
      )
      .eq(
        'event_id',
        eventId
      )
      .eq(
        'status',
        'joined'
      )
      .not(
        'user_id',
        'is',
        null
      );

  if (error) {
    throw error;
  }

  const userIds =
    [
      ...new Set(
        (
          members ||
          []
        )
          .map(
            (item) =>
              item.user_id
          )
          .filter(Boolean)
      ),
    ];

  if (!userIds.length) {
    return {
      people: [],
    };
  }

  const {
    data: profiles,
    error:
      profileError,
  } =
    await admin
      .from('profiles')
      .select(
        'id,display_name,avatar_path'
      )
      .in(
        'id',
        userIds
      );

  if (profileError) {
    throw profileError;
  }

  const profileMap =
    Object.fromEntries(
      (
        profiles ||
        []
      ).map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  const rows =
    userIds.map(
      (userId) => ({
        event_id:
          eventId,

        user_id:
          userId,

        guest_id:
          null,

        type:
          'user',

        display_name:
          profileMap[
            userId
          ]?.display_name ||
          members.find(
            (member) =>
              member.user_id ===
              userId
          )?.display_name ||
          'Participant',

        avatar_path:
          profileMap[
            userId
          ]?.avatar_path ||
          null,

        source:
          'event_member',

        is_claimed:
          userId ===
          user.id,

        privacy_status:
          'event',

        metadata:
          {
            source:
              'people-engine-bootstrap',
          },
      })
    );

  for (
    const row of rows
  ) {
    const {
      data:
        existing,
      error:
        lookupError,
    } =
      await admin
        .from(
          'people'
        )
        .select(
          'id'
        )
        .eq(
          'event_id',
          eventId
        )
        .eq(
          'user_id',
          row.user_id
        )
        .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (!existing) {
      const {
        error:
          insertError,
      } =
        await admin
          .from(
            'people'
          )
          .insert(
            row
          );

      if (
        insertError
      ) {
        throw insertError;
      }
    }
  }

  const {
    data: people,
    error:
      peopleError,
  } =
    await admin
      .from('people')
      .select('*')
      .eq(
        'event_id',
        eventId
      )
      .order(
        'display_name',
        {
          ascending: true,
        }
      );

  if (peopleError) {
    throw peopleError;
  }

  return {
    people:
      people || [],
  };
}

async function tag(
  user,
  body
) {
  const {
    data: person,
    error,
  } =
    await admin
      .from('people')
      .select('*')
      .eq(
        'id',
        body.personId
      )
      .single();

  if (error) {
    throw error;
  }

  await assertEventMember(
    person.event_id,
    user.id
  );

  const {
    data: media,
    error:
      mediaError,
  } =
    await admin
      .from('media')
      .select(
        'id,event_id,deleted_at'
      )
      .eq(
        'id',
        body.mediaId
      )
      .single();

  if (mediaError) {
    throw mediaError;
  }

  if (
    media.event_id !==
      person.event_id ||
    media.deleted_at
  ) {
    throw new Error(
      'INVALID_MEDIA'
    );
  }

  const {
    data,
    error:
      relationError,
  } =
    await admin
      .from(
        'media_people'
      )
      .upsert(
        {
          media_id:
            media.id,

          person_id:
            person.id,

          confirmed:
            body.confirmed !==
            false,

          confidence:
            1,

          source:
            'user',
        },
        {
          onConflict:
            'media_id,person_id',
        }
      )
      .select('*')
      .single();

  if (relationError) {
    throw relationError;
  }

  await admin.rpc(
    'refresh_gamification_from_event',
    {
      p_event_id:
        person.event_id,

      p_user_id:
        user.id,
    }
  );

  return {
    relation:
      data,
  };
}

async function untag(
  user,
  body
) {
  const {
    data: person,
    error,
  } =
    await admin
      .from('people')
      .select(
        'event_id'
      )
      .eq(
        'id',
        body.personId
      )
      .single();

  if (error) {
    throw error;
  }

  await assertEventMember(
    person.event_id,
    user.id
  );

  const {
    error:
      deleteError,
  } =
    await admin
      .from(
        'media_people'
      )
      .delete()
      .eq(
        'person_id',
        body.personId
      )
      .eq(
        'media_id',
        body.mediaId
      );

  if (deleteError) {
    throw deleteError;
  }

  await admin.rpc(
    'refresh_gamification_from_event',
    {
      p_event_id:
        person.event_id,

      p_user_id:
        user.id,
    }
  );

  return {
    deleted:
      true,
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
        case 'bootstrap':
          result =
            await bootstrap(
              user,
              body.eventId
            );
          break;

        case 'tag':
          result =
            await tag(
              user,
              body
            );
          break;

        case 'untag':
          result =
            await untag(
              user,
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
        '[Everia] people-engine:',
        error
      );

      return json(
        {
          error:
            error?.message ||
            'PEOPLE_ENGINE_ERROR',
        },
        400
      );
    }
  }
);