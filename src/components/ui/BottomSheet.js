// src/components/ui/BottomSheet.js
// Feuille modale glissant depuis le bas — utilisée pour les
// commentaires, réactions, options de menu, filtres, etc.
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '@/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BottomSheet({ visible, onClose, children, dark = true, maxHeightRatio = 0.85 }) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={StyleSheet.absoluteFillObject}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.modal.overlay, opacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            dark ? theme.modal.darkSheet : theme.modal.sheet,
            { maxHeight: SCREEN_HEIGHT * maxHeightRatio, transform: [{ translateY }] },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: dark ? 'rgba(255,255,255,0.2)' : theme.modal.handle.backgroundColor }]} />
          <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
            {children}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 10 },
  handle: { width: theme.modal.handle.width, height: theme.modal.handle.height, borderRadius: theme.modal.handle.borderRadius, alignSelf: 'center', marginBottom: 8 },
});
