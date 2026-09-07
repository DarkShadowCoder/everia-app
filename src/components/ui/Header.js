// src/components/ui/Header.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import theme from '@/theme';
import IconButton from './IconButton';

export default function Header({
  title,
  subtitle,
  onBack,
  showBack = true,
  transparent = false,
  dark = false,
  rightActions, // array of { icon, onPress, badge }
  style,
}) {
  const router = useRouter();
  const textColor = dark || transparent ? theme.colors.white : theme.colors.textPrimary;

  return (
    <View
      style={[
        styles.container,
        !transparent && { backgroundColor: dark ? theme.colors.darkSurface : theme.navigation.header.backgroundColor },
        !transparent && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: dark ? theme.colors.borderDark : theme.navigation.header.borderBottomColor },
        style,
      ]}
    >
      <View style={styles.side}>
        {showBack ? (
          <IconButton icon="chevron-back" onPress={onBack || (() => router.back())} variant={transparent ? 'glass' : 'ghost'} color={transparent ? theme.colors.primaryDark : theme.colors.primary} />
        ) : null}
      </View>
      <View style={styles.center}>
        {title ? (
          <Text numberOfLines={1} style={[styles.title, { color: textColor }]}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color: textColor, opacity: 0.65 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, styles.rightSide]}>
        {(rightActions || []).map((action, idx) => (
          <IconButton
            key={idx}
            icon={action.icon}
            onPress={action.onPress}
            badge={action.badge}
            variant={transparent ? 'glass' : 'ghost'}
            color={transparent ? theme.colors.primaryDark : theme.colors.primary}
            style={idx > 0 ? { marginLeft: 6 } : undefined}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', height: theme.layout.headerHeight, paddingHorizontal: theme.spacing.sm },
  side: { width: 44, flexDirection: 'row' },
  rightSide: { justifyContent: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
  title: { fontFamily: theme.typography.families.bodySemiBold, fontSize: 16 },
  subtitle: { fontFamily: theme.typography.families.body, fontSize: 11, marginTop: 1 },
});
