// src/components/ui/ScreenContainer.js
// Conteneur d'écran standard Everia.
// Gère la Safe Area, le fond, le scroll et l'espace réservé
// à la barre de navigation flottante.

import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import theme from '@/theme';

export default function ScreenContainer({
  children,
  scroll = false,

  background = theme.colors.background,

  edges = ['top', 'bottom'],

  contentContainerStyle,

  style,

  refreshing,

  onRefresh,

  noPadding = false,

  // Espace supplémentaire permettant de ne jamais placer
  // le dernier élément sous la barre de navigation flottante.
  floatingTabBarSpace = true,
}) {
  const insets = useSafeAreaInsets();

  const isGradient =
    typeof background === 'string' &&
    background.startsWith('gradient-');

  const gradientColors =
    background === 'gradient-dark'
      ? theme.gradients.darkLuxury
      : background === 'gradient-luxury'
        ? theme.gradients.plumGold
        : theme.gradients.darkLuxury;

  /*
   * La barre flottante fait environ 72 px de hauteur.
   * Elle est positionnée à quelques pixels du bas.
   *
   * On ajoute donc une marge de sécurité suffisante afin que
   * les derniers éléments restent complètement accessibles.
   */
  const floatingBottomSpace = floatingTabBarSpace
    ? Math.max(insets.bottom + 90, 104)
    : 0;

  const Content = scroll ? ScrollView : View;

  const contentProps = scroll
    ? {
        contentContainerStyle: [
          !noPadding && styles.padding,

          {
            flexGrow: 1,

            // Espace pour la navigation flottante.
            paddingBottom: floatingBottomSpace,
          },

          contentContainerStyle,
        ],

        // Scrollbar verticale invisible.
        showsVerticalScrollIndicator: false,

        // Scroll plus naturel sur iOS.
        alwaysBounceVertical: false,

        // Évite certains problèmes d'interaction avec le clavier.
        keyboardShouldPersistTaps: 'handled',

        refreshControl:
          onRefresh != null ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          ) : undefined,
      }
    : {
        style: [
          !noPadding && styles.padding,

          {
            flex: 1,

            // Pour les écrans avec FlatList / SectionList,
            // la zone disponible est diminuée afin que la
            // navigation flottante ne masque pas les éléments.
            paddingBottom: floatingBottomSpace,
          },

          contentContainerStyle,
        ],
      };

  const body = (
    <Content {...contentProps}>
      {children}
    </Content>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.flex,
        !isGradient && {
          backgroundColor: background,
        },
        style,
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={gradientColors}
          style={styles.flex}
        >
          {body}
        </LinearGradient>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  padding: {
    paddingHorizontal: theme.layout.screenHorizontal,
  },
});