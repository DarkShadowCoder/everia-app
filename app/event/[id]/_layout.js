// app/event/[id]/_layout.js
// ------------------------------------------------------------
// Charge l'événement courant + l'appartenance de l'utilisateur dans
// eventStore dès l'entrée dans le sous-arbre /event/[id]/*, pour que
// tous les écrans enfants (galerie, moments, défis...) y aient accès
// sans le recharger à chaque écran.
// ------------------------------------------------------------

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import theme from '@/theme';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useAuthStore } from '@/store/authStore';
import { useEventStore } from '@/store/eventStore';

export default function EventLayout() {
  const { id } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);
  const { event, isLoading, loadEvent } = useEventStore();

  useEffect(() => {
    if (id) loadEvent(id, user?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  if (isLoading && (!event || event.id !== id)) {
    return (
      <View style={[StyleSheet.absoluteFillObject, styles.loading]}>
        <LoadingOverlay dark fullscreen label="Chargement de l'événement..." />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="gallery" />
      <Stack.Screen name="media/[mediaId]" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="moments" />
      <Stack.Screen name="moment/[momentId]" />
      <Stack.Screen name="people" />
      <Stack.Screen name="challenges" />
      <Stack.Screen name="challenge/[challengeId]" />
      <Stack.Screen name="gamification" />
      <Stack.Screen name="live" />
      <Stack.Screen name="guestbook" />
      <Stack.Screen name="my-experience" />
      <Stack.Screen name="replay" />
      <Stack.Screen name="capture" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="invite" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { backgroundColor: theme.colors.darkBackground },
});
