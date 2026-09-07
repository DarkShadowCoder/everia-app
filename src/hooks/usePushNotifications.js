// src/hooks/usePushNotifications.js
// ============================================================
// EVERIA — PUSH NOTIFICATION HOOK
// ============================================================

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import * as Notifications from
  'expo-notifications';

import {
  router,
} from 'expo-router';

import {
  registerPushDevice,
  markNotificationRead,
  normalizeNotificationRoute,
  getNotificationData,
  getNotificationId,
  isExpoGo,
} from '@/lib/notifications';

// ============================================================
// HOOK
// ============================================================

export function usePushNotifications(
  userId
) {
  const [
    registration,
    setRegistration,
  ] = useState({
    enabled:
      false,

    supported:
      false,

    reason:
      null,
  });

  const [
    lastNotification,
    setLastNotification,
  ] =
    useState(
      null
    );

  const receivedSubscription =
    useRef(
      null
    );

  const responseSubscription =
    useRef(
      null
    );

  const mounted =
    useRef(
      true
    );

  // ==========================================================
  // SETUP
  // ==========================================================

  useEffect(
    () => {
      mounted.current =
        true;

      let cancelled =
        false;

      async function setup() {
        /*
         * Expo Go :
         *
         * Nous installons les listeners mais nous ne tentons
         * pas de générer un token distant.
         */

        if (
          isExpoGo()
        ) {
          if (
            !cancelled
          ) {
            setRegistration({
              enabled:
                false,

              supported:
                false,

              reason:
                'expo_go_remote_push_not_supported',
            });
          }

          return;
        }

        if (
          !userId
        ) {
          return;
        }

        try {
          const result =
            await registerPushDevice(
              userId
            );

          if (
            !cancelled &&
            mounted.current
          ) {
            setRegistration(
              result
            );
          }
        } catch (
          error
        ) {
          /*
           * Le push ne doit jamais casser l'application.
           */

          console.warn(
            '[Everia] Push setup error:',
            error?.message ||
              error
          );

          if (
            !cancelled &&
            mounted.current
          ) {
            setRegistration({
              enabled:
                false,

              supported:
                false,

              reason:
                'push_setup_failed',

              error,
            });
          }
        }
      }

      setup();

      return () => {
        cancelled =
          true;

        mounted.current =
          false;

        receivedSubscription
          .current
          ?.remove();

        responseSubscription
          .current
          ?.remove();

        receivedSubscription
          .current =
          null;

        responseSubscription
          .current =
          null;
      };
    },
    [
      userId,
    ]
  );

  // ==========================================================
  // LISTENERS
  // ==========================================================

  useEffect(
    () => {
      if (
        receivedSubscription
          .current
      ) {
        receivedSubscription
          .current
          .remove();

        receivedSubscription
          .current =
          null;
      }

      if (
        responseSubscription
          .current
      ) {
        responseSubscription
          .current
          .remove();

        responseSubscription
          .current =
          null;
      }

      receivedSubscription
        .current =
        Notifications
          .addNotificationReceivedListener(
            (
              notification
            ) => {
              if (
                !mounted.current
              ) {
                return;
              }

              setLastNotification(
                notification
              );
            }
          );

      responseSubscription
        .current =
        Notifications
          .addNotificationResponseReceivedListener(
            async (
              response
            ) => {
              try {
                const notification =
                  response
                    ?.notification;

                const data =
                  getNotificationData(
                    notification
                  );

                const notificationId =
                  getNotificationId(
                    notification
                  );

                if (
                  notificationId
                ) {
                  await markNotificationRead(
                    notificationId
                  ).catch(
                    (
                      error
                    ) => {
                      console.warn(
                        '[Everia] Unable to mark push notification as read:',
                        error?.message ||
                          error
                      );
                    }
                  );
                }

                const route =
                  normalizeNotificationRoute(
                    {
                      deep_link:
                        data?.deep_link,

                      data,
                    }
                  );

                if (
                  route
                ) {
                  router.push(
                    route
                  );

                  return;
                }

                if (
                  data?.event_id
                ) {
                  router.push(
                    `/event/${data.event_id}`
                  );
                }
              } catch (
                error
              ) {
                console.warn(
                  '[Everia] Push response handling failed:',
                  error?.message ||
                    error
                );
              }
            }
          );

      /*
       * Notification qui a ouvert l'application depuis
       * un état complètement fermé.
       */

      Notifications
        .getLastNotificationResponseAsync()
        .then(
          async (
            response
          ) => {
            if (
              !response ||
              !mounted.current
            ) {
              return;
            }

            try {
              const notification =
                response
                  ?.notification;

              const data =
                getNotificationData(
                  notification
                );

              const notificationId =
                getNotificationId(
                  notification
                );

              if (
                notificationId
              ) {
                await markNotificationRead(
                  notificationId
                ).catch(
                  () => {}
                );
              }

              const route =
                normalizeNotificationRoute(
                  {
                    deep_link:
                      data?.deep_link,

                    data,
                  }
                );

              if (
                route
              ) {
                setTimeout(
                  () => {
                    if (
                      mounted.current
                    ) {
                      router.push(
                        route
                      );
                    }
                  },
                  300
                );

                return;
              }

              if (
                data?.event_id
              ) {
                setTimeout(
                  () => {
                    if (
                      mounted.current
                    ) {
                      router.push(
                        `/event/${data.event_id}`
                      );
                    }
                  },
                  300
                );
              }
            } catch (
              error
            ) {
              console.warn(
                '[Everia] Initial notification handling failed:',
                error?.message ||
                  error
              );
            }
          }
        );

      return () => {
        receivedSubscription
          .current
          ?.remove();

        responseSubscription
          .current
          ?.remove();

        receivedSubscription
          .current =
          null;

        responseSubscription
          .current =
          null;
      };
    },
    []
  );

  return {
    ...registration,

    lastNotification,
  };
}

export default usePushNotifications;