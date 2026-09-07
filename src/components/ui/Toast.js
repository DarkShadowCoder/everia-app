// src/components/ui/Toast.js
// Toast global connecté au uiStore, à monter une seule fois à la
// racine de l'app (voir app/_layout.js).
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import { useUIStore } from '@/store/uiStore';

const ICONS = { success: 'checkmark-circle', error: 'close-circle', warning: 'warning', info: 'information-circle' };

export default function Toast() {
  const toast = useUIStore((s) => s.toast);
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    if (toast) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    } else {
      Animated.timing(translateY, { toValue: -80, duration: 200, useNativeDriver: true }).start();
    }
  }, [toast]);

  if (!toast) return null;
  const spec = theme.toast[toast.type] || theme.toast.info;

  return (
    <SafeAreaView pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.toast, { backgroundColor: spec.backgroundColor, borderRadius: theme.toast.radius, transform: [{ translateY }] }]}>
        <Ionicons name={ICONS[toast.type] || ICONS.info} size={18} color={spec.textColor} style={{ marginRight: 8 }} />
        <Text style={[styles.text, { color: spec.textColor }]} numberOfLines={2}>
          {toast.message}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: theme.zIndex.toast },
  toast: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginHorizontal: 16, paddingVertical: 12, paddingHorizontal: 16, ...theme.shadows.lg },
  text: { flex: 1, fontFamily: theme.typography.families.bodyMedium, fontSize: 13 },
});
