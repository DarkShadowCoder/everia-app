// supabase/functions/send-notification/index.js
// ------------------------------------------------------------
// Supabase Database Webhook -> Expo Push Service
// ------------------------------------------------------------

import {
  serve,
} from 'https://deno.land/std@0.224.0/http/server.ts';

import {
  createClient,
} from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// ============================================================
// ENV
// ============================================================

const SUPABASE_URL =
  Deno.env.get(
    'SUPABASE_URL'
  );

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get(
    'SUPABASE_SERVICE_ROLE_KEY'
  );

const EVERIA_WEBHOOK_SECRET =
  Deno.env.get(
    'EVERIA_WEBHOOK_SECRET'
  );

const EXPO_PUSH_URL =
  'https://exp.host/--/api/v2/push/send';

const BATCH_SIZE =
  100;

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error(
    'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants.'
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
    'authorization, x-client-info, apikey, content-type, x-everia-webhook-secret',

  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
};

// ============================================================
// JSON
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
// TOKEN
// ============================================================

function isValidExpoToken(
  token
) {
  return (
    typeof token ===
      'string' &&
    /^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(
      token.trim()
    )
  );
}

// ============================================================
// WEBHOOK
// ============================================================

function extractNotificationId(
  payload
) {
  return (
    payload?.record?.id ||
    payload?.notification?.id ||
    payload?.notificationId ||
    payload?.id ||
    null
  );
}

// ============================================================
// LOAD NOTIFICATION
// ============================================================

async function loadNotification(
  notificationId
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        'notifications'
      )
      .select('*')
      .eq(
        'id',
        notificationId
      )
      .single();

  if (
    error
  ) {
    throw error;
  }

  return data;
}

// ============================================================
// DEVICES
// ============================================================

async function loadDevices(
  userId
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        'user_devices'
      )
      .select(
        'id, push_token, platform, is_active, metadata'
      )
      .eq(
        'user_id',
        userId
      )
      .eq(
        'is_active',
        true
      )
      .not(
        'push_token',
        'is',
        null
      );

  if (
    error
  ) {
    throw error;
  }

  const seen =
    new Set();

  return (
    data ||
    []
  ).filter(
    (
      device
    ) => {
      const token =
        device?.push_token?.trim();

      if (
        !isValidExpoToken(
          token
        )
      ) {
        return false;
      }

      if (
        seen.has(
          token
        )
      ) {
        return false;
      }

      seen.add(
        token
      );

      return true;
    }
  );
}

// ============================================================
// SEND EXPO
// ============================================================

async function sendExpoMessages(
  messages
) {
  if (
    !messages.length
  ) {
    return [];
  }

  const response =
    await fetch(
      EXPO_PUSH_URL,
      {
        method:
          'POST',

        headers: {
          Accept:
            'application/json',

          'Accept-Encoding':
            'gzip, deflate',

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            messages
          ),
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
    throw new Error(
      body?.errors
        ?.map?.(
          (
            item
          ) =>
            item?.message
        )
        .filter(Boolean)
        .join('; ') ||
        `Expo Push HTTP ${response.status}`
    );
  }

  return Array.isArray(
    body?.data
  )
    ? body.data
    : [];
}

// ============================================================
// DEACTIVATE INVALID
// ============================================================

async function deactivateInvalidTokens(
  deviceIds
) {
  if (
    !deviceIds.length
  ) {
    return;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        'user_devices'
      )
      .update({
        is_active:
          false,

        updated_at:
          new Date().toISOString(),
      })
      .in(
        'id',
        deviceIds
      );

  if (
    error
  ) {
    console.warn(
      '[Everia] Unable to deactivate invalid push tokens:',
      error
    );
  }
}

// ============================================================
// UPDATE NOTIFICATION
// ============================================================

async function updateNotificationPushState(
  notification,
  patch
) {
  const nextData = {
    ...(notification?.data ||
      {}),

    push: {
      ...(
        notification?.data
          ?.push || {}
      ),

      ...patch,
    },
  };

  const {
    dbPatch,
  } =
    patch;

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        'notifications'
      )
      .update({
        ...dbPatch,

        data:
          nextData,
      })
      .eq(
        'id',
        notification.id
      );

  if (
    error
  ) {
    throw error;
  }
}

// ============================================================
// DISPATCH
// ============================================================

async function dispatchNotification(
  notification
) {
  const devices =
    await loadDevices(
      notification.user_id
    );

  if (
    !devices.length
  ) {
    const now =
      new Date().toISOString();

    await updateNotificationPushState(
      notification,
      {
        dbPatch: {
          status:
            'sent',

          sent_at:
            now,

          error_message:
            null,
        },

        provider:
          'expo',

        result:
          'no_active_device',

        sent_at:
          now,
      }
    );

    return {
      sent:
        0,

      invalid:
        0,

      reason:
        'no_active_device',
    };
  }

  const notificationPayload = {
    title:
      notification.title,

    body:
      notification.body ||
      undefined,

    sound:
      'default',

    channelId:
      'everia-default',

    data: {
      notification_id:
        notification.id,

      event_id:
        notification.event_id ||
        null,

      deep_link:
        notification.deep_link ||
        null,

      type:
        notification.type ||
        'system',

      ...(notification.data ||
        {}),
    },
  };

  const allTickets =
    [];

  const invalidDeviceIds =
    [];

  for (
    let index = 0;
    index <
      devices.length;
    index +=
      BATCH_SIZE
  ) {
    const chunk =
      devices.slice(
        index,
        index +
          BATCH_SIZE
      );

    const messages =
      chunk.map(
        (
          device
        ) => ({
          to:
            device.push_token,

          ...notificationPayload,
        })
      );

    // eslint-disable-next-line no-await-in-loop
    const tickets =
      await sendExpoMessages(
        messages
      );

    tickets.forEach(
      (
        ticket,
        ticketIndex
      ) => {
        const device =
          chunk[
            ticketIndex
          ];

        allTickets.push({
          device_id:
            device?.id ||
            null,

          ticket_id:
            ticket?.id ||
            null,

          status:
            ticket?.status ||
            'error',

          message:
            ticket?.message ||
            null,

          details:
            ticket?.details ||
            null,
        });

        if (
          ticket
            ?.details
            ?.error ===
            'DeviceNotRegistered' &&
          device?.id
        ) {
          invalidDeviceIds.push(
            device.id
          );
        }
      }
    );
  }

  await deactivateInvalidTokens(
    invalidDeviceIds
  );

  const successCount =
    allTickets.filter(
      (
        ticket
      ) =>
        ticket.status ===
        'ok'
    ).length;

  const errorCount =
    allTickets.length -
    successCount;

  const now =
    new Date().toISOString();

  await updateNotificationPushState(
    notification,
    {
      dbPatch: {
        status:
          successCount >
          0
            ? 'sent'
            : 'failed',

        sent_at:
          now,

        failed_at:
          successCount >
          0
            ? null
            : now,

        error_message:
          successCount >
          0
            ? null
            : allTickets
                .map(
                  (
                    ticket
                  ) =>
                    ticket.message
                )
                .filter(
                  Boolean
                )
                .join(
                  '; '
                ) ||
              'Expo n’a accepté aucun push.',
      },

      provider:
        'expo',

      result: {
        success_count:
          successCount,

        error_count:
          errorCount,

        invalid_device_count:
          invalidDeviceIds.length,

        tickets:
          allTickets,

        sent_at:
          now,
      },
    }
  );

  return {
    sent:
      successCount,

    failed:
      errorCount,

    invalid:
      invalidDeviceIds.length,
  };
}

// ============================================================
// SERVER
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

    if (
      !EVERIA_WEBHOOK_SECRET
    ) {
      return json(
        {
          error:
            'EVERIA_WEBHOOK_SECRET manquant.',
        },
        500
      );
    }

    const providedSecret =
      request.headers.get(
        'x-everia-webhook-secret'
      ) || '';

    if (
      providedSecret !==
      EVERIA_WEBHOOK_SECRET
    ) {
      return json(
        {
          error:
            'Signature webhook invalide.',
        },
        401
      );
    }

    try {
      const payload =
        await request
          .json();

      const notificationId =
        extractNotificationId(
          payload
        );

      if (
        !notificationId
      ) {
        return json(
          {
            error:
              'notification_id manquant.',
          },
          400
        );
      }

      const notification =
        await loadNotification(
          notificationId
        );

      const result =
        await dispatchNotification(
          notification
        );

      return json({
        ok:
          true,

        notificationId,

        ...result,
      });
    } catch (
      error
    ) {
      console.error(
        '[Everia] send-notification error:',
        error
      );

      return json(
        {
          error:
            error?.message ||
            'Erreur d’envoi push.',
        },
        500
      );
    }
  }
);