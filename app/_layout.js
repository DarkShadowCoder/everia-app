// app/_layout.js
// ============================================================
// EVERIA — ROOT LAYOUT
// ============================================================

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AppState,
} from 'react-native';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  Stack,
} from 'expo-router';

import * as SplashScreen from
  'expo-splash-screen';

import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import {
  StripeProvider,
} from '@stripe/stripe-react-native';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import {
  useEveriaFonts,
} from '@/theme/fonts';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  STRIPE_PUBLISHABLE_KEY,
} from '@/constants/config';

import theme from '@/theme';

import Toast from
  '@/components/ui/Toast';

import {
  resumeMyMediaJobs,
} from '@/lib/mediaProcessing';

import {
  configureNotificationHandler,
  configureNotificationChannel,
} from '@/lib/notifications';

import {
  usePushNotifications,
} from '@/hooks/usePushNotifications';

// ============================================================
// SPLASH
// ============================================================

SplashScreen
  .preventAutoHideAsync()
  .catch(
    () => {}
  );

// ============================================================
// GLOBAL NOTIFICATION CONFIG
// ============================================================

configureNotificationHandler();

void configureNotificationChannel();

// ============================================================
// ROOT
// ============================================================

export default function RootLayout() {
  // ==========================================================
  // FONTS
  // ==========================================================

  const [
    fontsLoaded,
  ] =
    useEveriaFonts();

  // ==========================================================
  // AUTH
  // ==========================================================

  const init =
    useAuthStore(
      (
        state
      ) =>
        state.init
    );

  const isInitialized =
    useAuthStore(
      (
        state
      ) =>
        state.isInitialized
    );

  const user =
    useAuthStore(
      (
        state
      ) =>
        state.user
    );

  // ==========================================================
  // APP READY
  // ==========================================================

  const [
    appReady,
    setAppReady,
  ] =
    useState(
      false
    );

  // ==========================================================
  // PUSH NOTIFICATIONS
  // ==========================================================

  usePushNotifications(
    user?.id ||
      null
  );

  // ==========================================================
  // INIT AUTH
  // ==========================================================

  useEffect(
    () => {
      void init();
    },
    [
      init,
    ]
  );

  // ==========================================================
  // MEDIA JOB RESUME
  // ==========================================================

  const resumeMediaPipeline =
    useCallback(
      async () => {
        if (
          !user?.id
        ) {
          return;
        }

        /*
         * IMPORTANT :
         *
         * resumeMyMediaJobs ne fait plus un appel
         * "drain" global à l'Edge Function.
         *
         * Elle récupère uniquement les jobs de l'utilisateur.
         */

        await resumeMyMediaJobs(
          5
        );
      },
      [
        user?.id,
      ]
    );

  // ==========================================================
  // FIRST APP RESUME
  // ==========================================================

  useEffect(
    () => {
      if (
        !isInitialized ||
        !user?.id
      ) {
        return;
      }

      void resumeMediaPipeline();
    },
    [
      isInitialized,
      user?.id,
      resumeMediaPipeline,
    ]
  );

  // ==========================================================
  // APP FOREGROUND
  // ==========================================================

  useEffect(
    () => {
      if (
        !user?.id
      ) {
        return undefined;
      }

      const subscription =
        AppState.addEventListener(
          'change',
          (
            state
          ) => {
            if (
              state ===
              'active'
            ) {
              void resumeMediaPipeline();
            }
          }
        );

      return () => {
        subscription?.remove();
      };
    },
    [
      user?.id,
      resumeMediaPipeline,
    ]
  );

  // ==========================================================
  // APP READY
  // ==========================================================

  useEffect(
    () => {
      if (
        fontsLoaded &&
        isInitialized
      ) {
        setAppReady(
          true
        );
      }
    },
    [
      fontsLoaded,
      isInitialized,
    ]
  );

  // ==========================================================
  // HIDE SPLASH
  // ==========================================================

  const onLayoutRootView =
    useCallback(
      async () => {
        if (
          appReady
        ) {
          await SplashScreen
            .hideAsync();
        }
      },
      [
        appReady,
      ]
    );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    !appReady
  ) {
    return null;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
      }}
      onLayout={
        onLayoutRootView
      }
    >
      <SafeAreaProvider>
        <StripeProvider
          publishableKey={
            STRIPE_PUBLISHABLE_KEY ||
            ''
          }
          merchantIdentifier="merchant.com.everia.app"
        >
          <StatusBar
            style="light"
          />

          <Stack
            screenOptions={{
              headerShown:
                false,

              contentStyle: {
                backgroundColor:
                  theme.colors
                    .darkBackground,
              },
            }}
          >
            <Stack.Screen
              name="index"
            />

            <Stack.Screen
              name="onboarding"
            />

            <Stack.Screen
              name="(auth)"
            />

            <Stack.Screen
              name="(tabs)"
            />

            <Stack.Screen
              name="join"
              options={{
                presentation:
                  'modal',
              }}
            />

            <Stack.Screen
              name="create-event"
              options={{
                presentation:
                  'modal',
              }}
            />

            <Stack.Screen
              name="event/[id]"
            />

            <Stack.Screen
              name="organizer/[id]"
            />

            <Stack.Screen
              name="subscription/index"
              options={{
                presentation:
                  'modal',
              }}
            />

            <Stack.Screen
              name="notifications"
              options={{
                presentation:
                  'modal',
              }}
            />

            <Stack.Screen
              name="search"
              options={{
                presentation:
                  'modal',
              }}
            />
          </Stack>

          <Toast />
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}