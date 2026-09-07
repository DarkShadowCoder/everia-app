// src/store/authStore.js
// ------------------------------------------------------------
// État d'authentification global.
// ------------------------------------------------------------

import {
  create,
} from 'zustand';

import * as WebBrowser from 'expo-web-browser';

import * as Linking from 'expo-linking';

import {
  supabase,
} from '@/lib/supabase';

import {
  APP_SCHEME,
} from '@/constants/config';

import {
  unregisterPushDevice,
} from '@/lib/notifications';

WebBrowser.maybeCompleteAuthSession();

// ============================================================
// STORE
// ============================================================

export const useAuthStore =
  create(
    (
      set,
      get
    ) => ({
      isInitialized:
        false,

      isLoading:
        false,

      session:
        null,

      user:
        null,

      profile:
        null,

      error:
        null,

      // ======================================================
      // INIT
      // ======================================================

      init:
        async () => {
          const {
            data: {
              session,
            },
          } =
            await supabase.auth.getSession();

          set({
            session,

            user:
              session?.user ??
              null,

            isInitialized:
              true,
          });

          if (
            session?.user
          ) {
            await get().refreshProfile();
          }

          supabase.auth.onAuthStateChange(
            async (
              _event,
              newSession
            ) => {
              set({
                session:
                  newSession,

                user:
                  newSession?.user ??
                  null,
              });

              if (
                newSession?.user
              ) {
                await get().refreshProfile();
              } else {
                set({
                  profile:
                    null,
                });
              }
            }
          );
        },

      // ======================================================
      // PROFILE
      // ======================================================

      refreshProfile:
        async () => {
          const userId =
            get().user?.id;

          if (
            !userId
          ) {
            return;
          }

          const {
            data,
          } =
            await supabase
              .from(
                'profiles'
              )
              .select('*')
              .eq(
                'id',
                userId
              )
              .maybeSingle();

          set({
            profile:
              data,
          });
        },

      // ======================================================
      // EMAIL LOGIN
      // ======================================================

      signInWithEmail:
        async (
          email,
          password
        ) => {
          set({
            isLoading:
              true,

            error:
              null,
          });

          const {
            error,
          } =
            await supabase.auth.signInWithPassword(
              {
                email,

                password,
              }
            );

          set({
            isLoading:
              false,

            error:
              error?.message ??
              null,
          });

          return {
            error,
          };
        },

      // ======================================================
      // REGISTER
      // ======================================================

      signUpWithEmail:
        async (
          email,
          password,
          displayName
        ) => {
          set({
            isLoading:
              true,

            error:
              null,
          });

          const {
            data,
            error,
          } =
            await supabase.auth.signUp({
              email,

              password,

              options: {
                data: {
                  display_name:
                    displayName,
                },
              },
            });

          set({
            isLoading:
              false,

            error:
              error?.message ??
              null,
          });

          return {
            data,

            error,
          };
        },

      // ======================================================
      // OAUTH
      // ======================================================

      signInWithOAuth:
        async (
          provider
        ) => {
          set({
            isLoading:
              true,

            error:
              null,
          });

          const redirectTo =
            Linking.createURL(
              'auth-callback',
              {
                scheme:
                  APP_SCHEME,
              }
            );

          const {
            data,
            error,
          } =
            await supabase.auth.signInWithOAuth(
              {
                provider,

                options: {
                  redirectTo,

                  skipBrowserRedirect:
                    true,
                },
              }
            );

          if (
            error
          ) {
            set({
              isLoading:
                false,

              error:
                error.message,
            });

            return {
              error,
            };
          }

          const result =
            await WebBrowser.openAuthSessionAsync(
              data.url,
              redirectTo
            );

          set({
            isLoading:
              false,
          });

          if (
            result.type ===
              'success' &&
            result.url
          ) {
            const {
              url,
            } =
              result;

            const params =
              Linking.parse(
                url
              ).queryParams;

            if (
              params?.access_token &&
              params?.refresh_token
            ) {
              await supabase.auth.setSession(
                {
                  access_token:
                    params.access_token,

                  refresh_token:
                    params.refresh_token,
                }
              );
            }
          }

          return {
            result,
          };
        },

      // ======================================================
      // GUEST
      // ======================================================

      joinAsGuest:
        async (
          displayName
        ) => {
          set({
            isLoading:
              true,

            error:
              null,
          });

          const {
            data,
            error,
          } =
            await supabase.auth.signInAnonymously(
              {
                options: {
                  data: {
                    display_name:
                      displayName,

                    is_guest:
                      true,
                  },
                },
              }
            );

          if (
            !error &&
            displayName
          ) {
            await supabase
              .from(
                'profiles'
              )
              .update({
                display_name:
                  displayName,
              })
              .eq(
                'id',
                data.user.id
              );
          }

          set({
            isLoading:
              false,

            error:
              error?.message ??
              null,
          });

          return {
            data,

            error,
          };
        },

      // ======================================================
      // ONBOARDING
      // ======================================================

      completeOnboarding:
        async () => {
          const userId =
            get().user?.id;

          if (
            !userId
          ) {
            return;
          }

          await supabase
            .from(
              'profiles'
            )
            .update({
              is_onboarded:
                true,
            })
            .eq(
              'id',
              userId
            );

          await get().refreshProfile();
        },

      // ======================================================
      // SIGN OUT
      // ======================================================

      signOut:
        async () => {
          const userId =
            get().user?.id;

          if (
            userId
          ) {
            try {
              await unregisterPushDevice(
                userId
              );
            } catch (
              error
            ) {
              console.warn(
                '[Everia] Unable to unregister push device:',
                error
              );
            }
          }

          await supabase.auth.signOut();

          set({
            session:
              null,

            user:
              null,

            profile:
              null,
          });
        },
    })
  );

// ============================================================
// SELECTORS
// ============================================================

export const selectIsAuthenticated =
  (
    state
  ) =>
    !!state.session;

export const selectIsGuest =
  (
    state
  ) =>
    !!state.user?.is_anonymous;