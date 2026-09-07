// app/onboarding.js
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import Logo from '@/components/brand/Logo';
import Button from '@/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'images-outline',
    title: 'Une mémoire vécue à plusieurs',
    body: "Chaque invité capture sa propre perspective. Everia les rassemble en une seule mémoire vivante de votre événement.",
  },
  {
    icon: 'sparkles-outline',
    title: 'Des Moments, pas juste des photos',
    body: 'Everia regroupe automatiquement les meilleurs instants — arrivée, cérémonie, fête — en Moments à revivre.',
  },
  {
    icon: 'trophy-outline',
    title: 'Des défis qui animent la soirée',
    body: 'Transformez vos invités en participants actifs avec des défis photo et vidéo gamifiés.',
  },
  {
    icon: 'film-outline',
    title: 'Un Replay pour ne jamais oublier',
    body: 'À la fin de l’événement, Everia génère un Best Of et un Replay personnalisés pour chacun.',
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  return (
    <LinearGradient colors={theme.gradients.darkLuxury} style={styles.container}>
      <View style={styles.header}>
        <Logo variant="mark" size={40} />
        <Text style={styles.skip} onPress={() => router.replace('/(auth)/welcome')}>Passer</Text>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={40} color={theme.colors.champagne} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button title={index === SLIDES.length - 1 ? 'Commencer' : 'Suivant'} onPress={next} variant="gold" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.layout.screenHorizontal, marginBottom: 20 },
  skip: { color: theme.colors.textOnDark, opacity: 0.6, fontFamily: theme.typography.families.bodyMedium, fontSize: 13 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xxxl },
  iconWrap: { width: 84, height: 84, borderRadius: 28, backgroundColor: 'rgba(217,184,120,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xxl },
  title: { ...theme.typography.styles.h1Dark, textAlign: 'center', marginBottom: theme.spacing.md },
  body: { color: theme.colors.textOnDark, opacity: 0.7, fontFamily: theme.typography.families.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  footer: { paddingHorizontal: theme.layout.screenHorizontal, paddingBottom: 40, paddingTop: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: theme.spacing.xl },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { backgroundColor: theme.colors.champagne, width: 20 },
});
