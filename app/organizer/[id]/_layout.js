// app/organizer/[id]/_layout.js

import React, {
  useEffect,
} from 'react';

import {
  View,
} from 'react-native';

import {
  Stack,
  router,
  useLocalSearchParams,
} from 'expo-router';

import theme from '@/theme';

import LoadingOverlay from '@/components/ui/LoadingOverlay';
import EmptyState from '@/components/ui/EmptyState';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  useEventStore,
  selectIsOrganizer,
} from '@/store/eventStore';

export default function OrganizerLayout() {
  const {
    id,
  } =
    useLocalSearchParams();

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const {
    event,
    membership,
    isLoading,
    loadEvent,
  } =
    useEventStore();

  const isOrganizer =
    useEventStore(
      selectIsOrganizer
    );

  useEffect(
    () => {
      if (
        id &&
        (
          !event ||
          event.id !== id
        )
      ) {
        loadEvent(
          id,
          user?.id
        );
      }
    },
    [
      id,
      user?.id,
    ]
  );

  if (
    isLoading ||
    !membership
  ) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            theme.colors
              .background,
        }}
      >
        <LoadingOverlay
          fullscreen
          label="Vérification des accès..."
        />
      </View>
    );
  }

  if (!isOrganizer) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            theme.colors
              .background,
          justifyContent:
            'center',
        }}
      >
        <EmptyState
          icon="lock-closed-outline"
          title="Accès réservé"
          subtitle="Cette section est réservée aux organisateurs de l'événement."
          actionLabel="Retour"
          onAction={() =>
            router.back()
          }
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown:
          false,

        contentStyle: {
          backgroundColor:
            theme.organizer
              .dashboard
              .backgroundColor,
        },
      }}
    >
      <Stack.Screen
        name="dashboard"
      />

      <Stack.Screen
        name="participants"
      />

      <Stack.Screen
        name="moderation"
      />

      <Stack.Screen
        name="analytics"
      />

      <Stack.Screen
        name="customize"
      />

      <Stack.Screen
        name="challenges"
      />
    </Stack>
  );
}