// src/lib/peopleEngine.js
// ============================================================
// EVERIA — People Engine
// ============================================================

import {
  supabase,
} from '@/lib/supabase';

const FUNCTION_NAME =
  'people-engine';

async function invoke(
  action,
  payload = {}
) {
  const {
    data,
    error,
  } = await supabase.functions.invoke(
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
    throw new Error(
      data.error
    );
  }

  return data;
}

export async function bootstrapEventPeople(
  eventId
) {
  if (!eventId) {
    return {
      people: [],
    };
  }

  return invoke(
    'bootstrap',
    {
      eventId,
    }
  );
}

export async function tagPerson({
  personId,
  mediaId,
  confirmed = true,
}) {
  return invoke(
    'tag',
    {
      personId,
      mediaId,
      confirmed,
    }
  );
}

export async function untagPerson({
  personId,
  mediaId,
}) {
  return invoke(
    'untag',
    {
      personId,
      mediaId,
    }
  );
}

export async function getPeopleForEvent(
  eventId
) {
  if (!eventId) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
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
        nullsFirst: false,
      }
    );

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getPersonMedia(
  personId
) {
  if (!personId) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      'media_people'
    )
    .select(
      'media(*)'
    )
    .eq(
      'person_id',
      personId
    );

  if (error) {
    throw error;
  }

  return (
    data || []
  )
    .map(
      (row) =>
        row.media
    )
    .filter(Boolean);
}