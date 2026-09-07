// app/(tabs)/_layout.js
// Barre de navigation principale flottante.
// Home, Événements, Capture, Souvenirs, Profil.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import theme from '@/theme';
import { NAV_ICONS } from '@/constants/icons';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Espace minimum entre la barre flottante et le bord inférieur.
  const bottomOffset = Math.max(insets.bottom + 8, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // La barre disparaît automatiquement lorsque le clavier apparaît.
        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: theme.navigation.bottomTab.activeColor,
        tabBarInactiveTintColor: theme.navigation.bottomTab.inactiveColor,

        tabBarStyle: {
          position: 'absolute',

          left: 14,
          right: 14,
          bottom: bottomOffset,

          height: 72,

          backgroundColor: theme.navigation.bottomTab.backgroundColor,

          // Suppression complète de la séparation classique.
          borderTopWidth: 0,
          borderTopColor: 'transparent',

          // Forme flottante.
          borderRadius: 26,

          // Espacement interne.
          paddingTop: 7,
          paddingBottom: 7,

          // Ombre iOS.
          shadowColor: theme.colors.primaryDeep,
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.16,
          shadowRadius: 18,

          // Ombre Android.
          elevation: 16,

          // Autorise le bouton Capture à dépasser visuellement.
          overflow: 'visible',

          // Priorité d'affichage.
          zIndex: 100,
        },

        tabBarLabelStyle: {
          fontFamily: theme.typography.styles.tab.fontFamily,
          fontSize: 10,
          marginBottom: 1,
        },

        tabBarItemStyle: {
          paddingVertical: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={
                focused
                  ? NAV_ICONS.home.active
                  : NAV_ICONS.home.inactive
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: 'Événements',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={
                focused
                  ? NAV_ICONS.events.active
                  : NAV_ICONS.events.inactive
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="capture"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.fab}>
              <Ionicons
                name={NAV_ICONS.capture.active}
                size={24}
                color={theme.colors.white}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="memories"
        options={{
          title: 'Souvenirs',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={
                focused
                  ? NAV_ICONS.memories.active
                  : NAV_ICONS.memories.inactive
              }
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={
                focused
                  ? NAV_ICONS.profile.active
                  : NAV_ICONS.profile.inactive
              }
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: theme.components.floatingActionButton.width,
    height: theme.components.floatingActionButton.height,
    borderRadius: theme.components.floatingActionButton.borderRadius,

    backgroundColor: theme.colors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    // Le bouton Capture dépasse de la barre.
    marginTop: -24,

    ...theme.shadows.plum,

    // Ombre supplémentaire pour renforcer l'effet flottant.
    shadowColor: theme.colors.primaryDeep,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,

    elevation: 14,
  },
});