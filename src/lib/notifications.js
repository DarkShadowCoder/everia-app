// src/lib/notifications.js
// ============================================================
// EVERIA — PUSH NOTIFICATIONS
// ============================================================
//
// Compatible avec :
// - Expo SDK 52
// - Expo Go : mode dégradé, sans push distant fiable
// - Development Build : push distant réel
// - Android physique
// - Android emulator avec Google Play Services
// - iOS
//
// Architecture :
//
// Mobile
//   ↓
// ExpoPushToken
//   ↓
// user_devices
//   ↓
// notifications
//   ↓
// Supabase Webhook
//   ↓
// send-notification
//   ↓
// Expo Push Service
//   ↓
// FCM / APNs
//
// IMPORTANT :
// Aucun secret serveur ne doit être présent dans ce fichier.
// ============================================================

import {
  Platform,
} from 'react-native';

import AsyncStorage from
  '@react-native-async-storage/async-storage';

import * as Notifications from
  'expo-notifications';

import * as Device from
  'expo-device';

import Constants from
  'expo-constants';

import {
  supabase,
} from '@/lib/supabase';

import {
  EAS_PROJECT_ID,
  APP_VERSION,
} from '@/constants/config';

// ============================================================
// CONSTANTS
// ============================================================

const DEVICE_ID_STORAGE_KEY =
  '@everia/push_device_id';

const ANDROID_CHANNEL_ID =
  'everia-default';

const ANDROID_CHANNEL_NAME =
  'Everia';

const ANDROID_CHANNEL_DESCRIPTION =
  'Notifications Everia';

let notificationHandlerConfigured =
  false;

// ============================================================
// ENVIRONMENT
// ============================================================

export function isExpoGo() {
  /*
   * SDK 52 expose généralement appOwnership = "expo"
   * dans Expo Go.
   *
   * executionEnvironment permet de gérer les versions
   * plus récentes d'Expo.
   */

  return (
    Constants?.appOwnership ===
      'expo' ||
    Constants?.executionEnvironment ===
      'storeClient'
  );
}

export function isPhysicalDevice() {
  return !!Device.isDevice;
}

export function isRemotePushSupported() {
  /*
   * Expo Go n'est volontairement pas considéré comme
   * environnement fiable pour le push distant.
   */

  if (
    isExpoGo()
  ) {
    return false;
  }

  /*
   * Un simulateur / émulateur sans infrastructure native
   * appropriée ne peut pas générer un token push.
   */

  if (
    !Device.isDevice
  ) {
    return false;
  }

  return true;
}

// ============================================================
// HANDLER
// ============================================================

export function configureNotificationHandler() {
  if (
    notificationHandlerConfigured
  ) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification:
      async () => ({
        shouldShowAlert:
          true,

        shouldPlaySound:
          true,

        shouldSetBadge:
          true,
      }),
  });

  notificationHandlerConfigured =
    true;
}

// ============================================================
// ANDROID CHANNEL
// ============================================================

export async function configureNotificationChannel() {
  if (
    Platform.OS !==
    'android'
  ) {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(
      ANDROID_CHANNEL_ID,
      {
        name:
          ANDROID_CHANNEL_NAME,

        description:
          ANDROID_CHANNEL_DESCRIPTION,

        importance:
          Notifications.AndroidImportance.MAX,

        sound:
          'default',

        vibrationPattern:
          [
            0,
            250,
            250,
            250,
          ],

        enableVibrate:
          true,

        enableLights:
          true,

        lockscreenVisibility:
          Notifications
            .AndroidNotificationVisibility
            .PUBLIC,
      }
    );
  } catch (
    error
  ) {
    console.warn(
      '[Everia] Android notification channel error:',
      error
    );
  }
}

// ============================================================
// PROJECT ID
// ============================================================

function getProjectId() {
  const configProjectId =
    Constants?.expoConfig
      ?.extra
      ?.eas
      ?.projectId;

  const easConfigProjectId =
    Constants?.easConfig
      ?.projectId;

  /*
   * On refuse explicitement le placeholder
   * REPLACE_WITH_EAS_PROJECT_ID.
   */

  const candidates = [
    EAS_PROJECT_ID,

    configProjectId,

    easConfigProjectId,
  ];

  return (
    candidates
      .map(
        (
          value
        ) =>
          typeof value ===
          'string'
            ? value.trim()
            : value
      )
      .find(
        (
          value
        ) =>
          !!value &&
          value !==
            'REPLACE_WITH_EAS_PROJECT_ID'
      ) ||
    null
  );
}

// ============================================================
// PERMISSION
// ============================================================

export async function getPushPermissionStatus() {
  try {
    return await Notifications.getPermissionsAsync();
  } catch (
    error
  ) {
    console.warn(
      '[Everia] Permission status error:',
      error
    );

    return {
      status:
        'undetermined',
    };
  }
}

// ============================================================
// REQUEST PERMISSION
// ============================================================

export async function requestPushPermission() {
  if (
    isExpoGo()
  ) {
    return {
      status:
        'undetermined',

      granted:
        false,

      skipped:
        true,

      reason:
        'expo_go_remote_push_not_supported',
    };
  }

  if (
    Platform.OS ===
      'android'
  ) {
    await configureNotificationChannel();
  }

  try {
    const current =
      await Notifications.getPermissionsAsync();

    if (
      current.status ===
      'granted'
    ) {
      return current;
    }

    return await Notifications.requestPermissionsAsync();
  } catch (
    error
  ) {
    console.warn(
      '[Everia] Push permission request failed:',
      error
    );

    return {
      status:
        'denied',

      granted:
        false,

      error,
    };
  }
}

// ============================================================
// ERROR CLASSIFICATION
// ============================================================

function classifyPushError(
  error
) {
  const message =
    String(
      error?.message ||
        error ||
        ''
    );

  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      'missing_instanceid_service'
    )
  ) {
    return {
      code:
        'MISSING_INSTANCEID_SERVICE',

      reason:
        'google_play_services_missing',
    };
  }

  if (
    normalized.includes(
      'service_not_available'
    )
  ) {
    return {
      code:
        'SERVICE_NOT_AVAILABLE',

      reason:
        'push_service_unavailable',
    };
  }

  if (
    normalized.includes(
      'projectid'
    ) ||
    normalized.includes(
      'project id'
    )
  ) {
    return {
      code:
        'PROJECT_ID_MISSING',

      reason:
        'project_id_missing',
    };
  }

  if (
    normalized.includes(
      'permission'
    )
  ) {
    return {
      code:
        'PERMISSION_DENIED',

      reason:
        'permission_denied',
    };
  }

  return {
    code:
      'PUSH_TOKEN_ERROR',

    reason:
      'push_token_generation_failed',
  };
}

// ============================================================
// EXPO TOKEN
// ============================================================

export async function getExpoPushToken() {
  configureNotificationHandler();

  await configureNotificationChannel();

  /*
   * Expo Go : on ne tente même pas l'appel natif.
   * Cela supprime le warning et l'erreur MISSING_INSTANCEID_SERVICE
   * dans l'environnement de développement Expo Go.
   */

  if (
    isExpoGo()
  ) {
    return {
      token:
        null,

      supported:
        false,

      reason:
        'expo_go_remote_push_not_supported',
    };
  }

  /*
   * Android emulator / simulator
   */

  if (
    !Device.isDevice
  ) {
    return {
      token:
        null,

      supported:
        false,

      reason:
        'not_a_physical_device',
    };
  }

  const projectId =
    getProjectId();

  if (
    !projectId
  ) {
    return {
      token:
        null,

      supported:
        false,

      reason:
        'project_id_missing',
    };
  }

  const permission =
    await requestPushPermission();

  if (
    permission?.status !==
    'granted'
  ) {
    return {
      token:
        null,

      supported:
        false,

      reason:
        'permission_denied',

      permission,
    };
  }

  try {
    const result =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const token =
      result?.data ||
      null;

    if (
      !token
    ) {
      return {
        token:
          null,

        supported:
          false,

        reason:
          'empty_token',
      };
    }

    return {
      token,

      supported:
        true,

      reason:
        'success',
    };
  } catch (
    error
  ) {
    const classification =
      classifyPushError(
        error
      );

    console.warn(
      '[Everia] Expo Push Token unavailable:',
      classification.code
    );

    return {
      token:
        null,

      supported:
        false,

      reason:
        classification.reason,

      code:
        classification.code,

      error,
    };
  }
}

// ============================================================
// DEVICE ID
// ============================================================

export async function getRegisteredDeviceId() {
  const existing =
    await AsyncStorage.getItem(
      DEVICE_ID_STORAGE_KEY
    );

  if (
    existing
  ) {
    return existing;
  }

  const deviceId =
    [
      Platform.OS,
      Date.now(),
      Math.random()
        .toString(36)
        .slice(
          2,
          12
        ),
    ].join(
      '-'
    );

  await AsyncStorage.setItem(
    DEVICE_ID_STORAGE_KEY,
    deviceId
  );

  return deviceId;
}

// ============================================================
// FIND DEVICE
// ============================================================

async function findExistingDevice(
  userId,
  deviceId
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        'user_devices'
      )
      .select(
        '*'
      )
      .eq(
        'user_id',
        userId
      )
      .eq(
        'metadata->>device_id',
        deviceId
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data;
}

// ============================================================
// REGISTER DEVICE
// ============================================================

export async function registerPushDevice(
  userId
) {
  if (
    !userId
  ) {
    return {
      enabled:
        false,

      reason:
        'missing_user',

      token:
        null,

      device:
        null,
    };
  }

  try {
    configureNotificationHandler();

    await configureNotificationChannel();

    /*
     * Expo Go :
     *
     * On continue normalement dans l'application,
     * mais on n'essaie pas de créer un token push distant.
     */

    if (
      isExpoGo()
    ) {
      return {
        enabled:
          false,

        supported:
          false,

        reason:
          'expo_go_remote_push_not_supported',

        token:
          null,

        device:
          null,
      };
    }

    const tokenResult =
      await getExpoPushToken();

    if (
      !tokenResult.supported ||
      !tokenResult.token
    ) {
      /*
       * Très important :
       * une erreur push ne doit JAMAIS empêcher Everia
       * de fonctionner normalement.
       */

      return {
        enabled:
          false,

        supported:
          false,

        reason:
          tokenResult.reason,

        code:
          tokenResult.code ||
          null,

        token:
          null,

        device:
          null,
      };
    }

    const deviceId =
      await getRegisteredDeviceId();

    const now =
      new Date().toISOString();

    const existing =
      await findExistingDevice(
        userId,
        deviceId
      );

    const metadata = {
      ...(existing?.metadata ||
        {}),

      device_id:
        deviceId,

      expo_push_token:
        tokenResult.token,

      device_model:
        Device.modelName ||
        null,

      device_brand:
        Device.brand ||
        null,

      device_year_class:
        Device.deviceYearClass ||
        null,

      last_registration_at:
        now,
    };

    const payload = {
      user_id:
        userId,

      platform:
        Platform.OS,

      device_name:
        Device.deviceName ||
        Device.modelName ||
        'Unknown device',

      app_version:
        Constants?.expoConfig
          ?.version ||
        APP_VERSION ||
        null,

      os_version:
        Device.osVersion ||
        null,

      push_token:
        tokenResult.token,

      last_seen_at:
        now,

      is_active:
        true,

      metadata,

      updated_at:
        now,
    };

    let device =
      null;

    if (
      existing?.id
    ) {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'user_devices'
          )
          .update(
            payload
          )
          .eq(
            'id',
            existing.id
          )
          .eq(
            'user_id',
            userId
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

      device =
        data;
    } else {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            'user_devices'
          )
          .insert(
            payload
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

      device =
        data;
    }

    return {
      enabled:
        true,

      supported:
        true,

      reason:
        'registered',

      token:
        tokenResult.token,

      device,
    };
  } catch (
    error
  ) {
    /*
     * Aucun crash de l'application.
     */

    console.warn(
      '[Everia] Push registration failed safely:',
      error?.message ||
        error
    );

    return {
      enabled:
        false,

      supported:
        false,

      reason:
        'registration_failed',

      error,

      token:
        null,

      device:
        null,
    };
  }
}

// ============================================================
// DEVICE HEARTBEAT
// ============================================================

export async function touchPushDevice(
  userId
) {
  if (
    !userId ||
    isExpoGo()
  ) {
    return;
  }

  try {
    const deviceId =
      await getRegisteredDeviceId();

    await supabase
      .from(
        'user_devices'
      )
      .update({
        last_seen_at:
          new Date().toISOString(),

        is_active:
          true,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'user_id',
        userId
      )
      .eq(
        'metadata->>device_id',
        deviceId
      );
  } catch (
    error
  ) {
    console.warn(
      '[Everia] Device heartbeat failed:',
      error
    );
  }
}

// ============================================================
// UNREGISTER DEVICE
// ============================================================

export async function unregisterPushDevice(
  userId
) {
  if (
    !userId
  ) {
    return {
      success:
        false,
    };
  }

  try {
    const deviceId =
      await getRegisteredDeviceId();

    const {
      error,
    } =
      await supabase
        .from(
          'user_devices'
        )
        .update({
          is_active:
            false,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'user_id',
          userId
        )
        .eq(
          'metadata->>device_id',
          deviceId
        );

    if (
      error
    ) {
      throw error;
    }

    return {
      success:
        true,
    };
  } catch (
    error
  ) {
    console.warn(
      '[Everia] Unable to unregister push device:',
      error
    );

    return {
      success:
        false,

      error,
    };
  }
}

// ============================================================
// DEACTIVATE TOKEN
// ============================================================

export async function deactivatePushToken(
  userId,
  pushToken
) {
  if (
    !userId ||
    !pushToken
  ) {
    return;
  }

  const {
    error,
  } =
    await supabase
      .from(
        'user_devices'
      )
      .update({
        is_active:
          false,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'user_id',
        userId
      )
      .eq(
        'push_token',
        pushToken
      );

  if (
    error
  ) {
    console.warn(
      '[Everia] Token deactivation failed:',
      error
    );
  }
}

// ============================================================
// LIST NOTIFICATIONS
// ============================================================

export async function listNotifications(
  userId,
  limit = 100
) {
  if (
    !userId
  ) {
    return [];
  }

  const safeLimit =
    Math.min(
      Math.max(
        Number(limit) ||
          100,
        1
      ),
      100
    );

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'notifications'
      )
      .select(
        '*'
      )
      .eq(
        'user_id',
        userId
      )
      .order(
        'created_at',
        {
          ascending:
            false,
        }
      )
      .limit(
        safeLimit
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
// UNREAD COUNT
// ============================================================

export async function getUnreadNotificationCount(
  userId
) {
  if (
    !userId
  ) {
    return 0;
  }

  const {
    count,
    error,
  } =
    await supabase
      .from(
        'notifications'
      )
      .select(
        'id',
        {
          count:
            'exact',

          head:
            true,
        }
      )
      .eq(
        'user_id',
        userId
      )
      .is(
        'read_at',
        null
      );

  if (
    error
  ) {
    throw error;
  }

  return Number(
    count || 0
  );
}

// ============================================================
// MARK ONE READ
// ============================================================

export async function markNotificationRead(
  notificationId
) {
  if (
    !notificationId
  ) {
    return false;
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'mark_notification_read',
      {
        p_notification_id:
          notificationId,
      }
    );

  if (
    !error
  ) {
    return data !== false;
  }

  /*
   * Fallback.
   *
   * RLS doit protéger cette opération.
   */

  const {
    error:
      updateError,
  } =
    await supabase
      .from(
        'notifications'
      )
      .update({
        read_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        notificationId
      );

  if (
    updateError
  ) {
    throw error;
  }

  return true;
}

// ============================================================
// MARK ALL READ
// ============================================================

export async function markAllNotificationsRead(
  userId
) {
  if (
    !userId
  ) {
    return 0;
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'mark_all_notifications_read'
    );

  if (
    !error
  ) {
    return Number(
      data || 0
    );
  }

  const {
    data:
      updated,
    error:
      updateError,
  } =
    await supabase
      .from(
        'notifications'
      )
      .update({
        read_at:
          new Date().toISOString(),
      })
      .eq(
        'user_id',
        userId
      )
      .is(
        'read_at',
        null
      )
      .select(
        'id'
      );

  if (
    updateError
  ) {
    throw error;
  }

  return (
    updated?.length ||
    0
  );
}

// ============================================================
// DEEP LINK
// ============================================================

export function getNotificationDeepLink(
  notification
) {
  if (
    !notification
  ) {
    return null;
  }

  return (
    notification.deep_link ||
    notification.data?.deep_link ||
    notification.data?.deepLink ||
    null
  );
}

export function normalizeNotificationRoute(
  notification
) {
  const deepLink =
    getNotificationDeepLink(
      notification
    );

  if (
    typeof deepLink !==
    'string'
  ) {
    return null;
  }

  const value =
    deepLink.trim();

  if (
    !value
  ) {
    return null;
  }

  if (
    value.startsWith(
      '/'
    )
  ) {
    return value;
  }

  if (
    value.startsWith(
      'everia://'
    )
  ) {
    return value.replace(
      /^everia:\/\//,
      '/'
    );
  }

  if (
    value.startsWith(
      'everia:/'
    )
  ) {
    return value.replace(
      /^everia:/,
      ''
    );
  }

  return null;
}

// ============================================================
// DATA
// ============================================================

export function getNotificationData(
  notification
) {
  return (
    notification?.request
      ?.content
      ?.data ||
    notification?.data ||
    {}
  );
}

export function getNotificationId(
  notification
) {
  const data =
    getNotificationData(
      notification
    );

  return (
    notification?.id ||
    notification?.notification_id ||
    data?.notification_id ||
    null
  );
}

export function getNotificationEventId(
  notification
) {
  const data =
    getNotificationData(
      notification
    );

  return (
    notification?.event_id ||
    data?.event_id ||
    null
  );
}

export function getNotificationType(
  notification
) {
  const data =
    getNotificationData(
      notification
    );

  return (
    notification?.type ||
    data?.type ||
    'system'
  );
}

// ============================================================
// ROUTE BUILDERS
// ============================================================

export function buildEventNotificationRoute(
  eventId
) {
  return eventId
    ? `/event/${eventId}`
    : null;
}

export function buildMediaNotificationRoute(
  eventId,
  mediaId
) {
  if (
    !eventId ||
    !mediaId
  ) {
    return null;
  }

  return `/event/${eventId}/media/${mediaId}`;
}

export function buildMomentNotificationRoute(
  eventId,
  momentId
) {
  if (
    !eventId ||
    !momentId
  ) {
    return null;
  }

  return `/event/${eventId}/moment/${momentId}`;
}

export function buildReplayNotificationRoute(
  eventId
) {
  return eventId
    ? `/event/${eventId}/replay`
    : null;
}

// ============================================================
// INITIAL RESPONSE
// ============================================================

export async function getInitialNotificationResponse() {
  try {
    return await Notifications
      .getLastNotificationResponseAsync();
  } catch (
    error
  ) {
    console.warn(
      '[Everia] Initial notification error:',
      error
    );

    return null;
  }
}

// ============================================================
// LISTENERS
// ============================================================

export function addNotificationReceivedListener(
  callback
) {
  if (
    typeof callback !==
    'function'
  ) {
    return {
      remove() {},
    };
  }

  return Notifications
    .addNotificationReceivedListener(
      callback
    );
}

export function addNotificationResponseListener(
  callback
) {
  if (
    typeof callback !==
    'function'
  ) {
    return {
      remove() {},
    };
  }

  return Notifications
    .addNotificationResponseReceivedListener(
      callback
    );
}

// ============================================================
// LOCAL TEST
// ============================================================

export async function scheduleLocalNotification({
  title,
  body,
  data = {},
  seconds = 1,
}) {
  configureNotificationHandler();

  await configureNotificationChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title:
        title ||
        'Everia',

      body:
        body ||
        '',

      data,

      sound:
        'default',
    },

    trigger: {
      seconds:
        Math.max(
          Number(
            seconds
          ) || 1,
          1
        ),
    },
  });
}

// ============================================================
// LOCAL NOTIFICATION CLEANUP
// ============================================================

export async function cancelAllScheduledNotifications() {
  return Notifications
    .cancelAllScheduledNotificationsAsync();
}

// ============================================================
// BADGE
// ============================================================

export async function setNotificationBadgeCount(
  count
) {
  try {
    await Notifications
      .setBadgeCountAsync(
        Math.max(
          0,
          Number(
            count
          ) || 0
        )
      );
  } catch (
    error
  ) {
    console.warn(
      '[Everia] Badge update failed:',
      error
    );
  }
}

export async function clearNotificationBadge() {
  return setNotificationBadgeCount(
    0
  );
}

// ============================================================
// COMPLETE SETUP
// ============================================================

export async function setupPushNotifications(
  userId
) {
  configureNotificationHandler();

  await configureNotificationChannel();

  if (
    isExpoGo()
  ) {
    return {
      enabled:
        false,

      supported:
        false,

      reason:
        'expo_go_remote_push_not_supported',
    };
  }

  return registerPushDevice(
    userId
  );
}

// ============================================================
// SAFE SETUP
// ============================================================

export async function safeSetupPushNotifications(
  userId
) {
  try {
    return await setupPushNotifications(
      userId
    );
  } catch (
    error
  ) {
    console.warn(
      '[Everia] Safe push setup error:',
      error
    );

    return {
      enabled:
        false,

      supported:
        false,

      reason:
        'push_setup_failed',

      error,
    };
  }
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  isExpoGo,

  isPhysicalDevice,

  isRemotePushSupported,

  configureNotificationHandler,

  configureNotificationChannel,

  getPushPermissionStatus,

  requestPushPermission,

  getExpoPushToken,

  getRegisteredDeviceId,

  registerPushDevice,

  setupPushNotifications,

  safeSetupPushNotifications,

  touchPushDevice,

  unregisterPushDevice,

  deactivatePushToken,

  listNotifications,

  getUnreadNotificationCount,

  markNotificationRead,

  markAllNotificationsRead,

  getNotificationDeepLink,

  normalizeNotificationRoute,

  getNotificationData,

  getNotificationId,

  getNotificationEventId,

  getNotificationType,

  buildEventNotificationRoute,

  buildMediaNotificationRoute,

  buildMomentNotificationRoute,

  buildReplayNotificationRoute,

  getInitialNotificationResponse,

  addNotificationReceivedListener,

  addNotificationResponseListener,

  scheduleLocalNotification,

  cancelAllScheduledNotifications,

  setNotificationBadgeCount,

  clearNotificationBadge,
};