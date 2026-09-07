// app/index.js
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import theme from '@/theme';
import Logo from '@/components/brand/Logo';
import { useAuthStore } from '@/store/authStore';

export default function SplashRedirect() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const { session, profile, isInitialized } = useAuthStore();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 6 }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const timer = setTimeout(() => {
      if (!session) {
        router.replace('/onboarding');
      } else if (!profile?.is_onboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }, 1100);
    return () => clearTimeout(timer);
  }, [isInitialized, session, profile]);

  return (
    <LinearGradient colors={theme.gradients.darkLuxury} style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Logo variant="full" size={180} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
