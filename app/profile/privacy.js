// app/profile/privacy.js
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import Header from '@/components/ui/Header';

const ITEMS = [
  { icon: 'eye-outline', title: 'Visibilité de mon profil', description: "Votre nom et photo sont visibles par les participants des événements que vous rejoignez." },
  { icon: 'cloud-download-outline', title: 'Export de mes données', description: 'Vous pouvez demander une copie de toutes vos données Everia à tout moment.' },
  { icon: 'trash-outline', title: 'Suppression des médias', description: 'Vous pouvez supprimer vos propres photos et vidéos depuis la galerie de chaque événement.' },
  { icon: 'shield-checkmark-outline', title: 'Modération', description: "Les organisateurs peuvent activer une validation manuelle avant publication de vos médias." },
];

export default function Privacy() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Confidentialité" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {ITEMS.map((item) => (
          <View key={item.title} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.link} onPress={() => Linking.openURL('https://everia.app/privacy')}>
          Lire la politique de confidentialité complète
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: theme.layout.screenHorizontal, paddingBottom: 40 },
  row: { flexDirection: 'row', marginBottom: theme.spacing.xl },
  iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: theme.typography.families.bodySemiBold, fontSize: 13.5, color: theme.colors.textPrimary },
  description: { fontFamily: theme.typography.families.body, fontSize: 12, color: theme.colors.textSecondary, marginTop: 3, lineHeight: 17 },
  link: { fontFamily: theme.typography.families.bodySemiBold, fontSize: 13, color: theme.colors.textPlum, textAlign: 'center', marginTop: theme.spacing.lg },
});
