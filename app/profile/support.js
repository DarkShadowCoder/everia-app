// app/profile/support.js
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';
import Header from '@/components/ui/Header';

const FAQS = [
  { q: 'Comment rejoindre un événement ?', a: "Scannez le QR code fourni par l'organisateur ou entrez le code affiché dans l'invitation." },
  { q: 'Puis-je participer sans créer de compte ?', a: "Oui, si l'organisateur a activé l'accès invité. Il vous suffit d'indiquer votre prénom." },
  { q: "Comment récupérer mes photos après l'événement ?", a: "Rendez-vous dans l'onglet Souvenirs pour retrouver le Best Of et votre Replay personnel." },
];

export default function Support() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Aide & Support" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@everia.app')}>
          <View style={styles.iconWrap}>
            <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.contactTitle}>Contacter le support</Text>
            <Text style={styles.contactSubtitle}>support@everia.app</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Pressable>

        <Text style={styles.sectionTitle}>Questions fréquentes</Text>
        {FAQS.map((item) => (
          <View key={item.q} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>{item.q}</Text>
            <Text style={styles.faqAnswer}>{item.a}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: theme.layout.screenHorizontal, paddingBottom: 40 },
  contactRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cards.default.backgroundColor, borderColor: theme.cards.default.borderColor, borderWidth: 1, borderRadius: theme.cards.default.borderRadius, padding: theme.spacing.lg },
  iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  contactTitle: { fontFamily: theme.typography.families.bodySemiBold, fontSize: 13.5, color: theme.colors.textPrimary },
  contactSubtitle: { fontFamily: theme.typography.families.body, fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontFamily: theme.typography.families.displaySemiBold, fontSize: 16, color: theme.colors.textPrimary, marginTop: theme.spacing.xxl, marginBottom: theme.spacing.sm },
  faqItem: { marginBottom: theme.spacing.lg },
  faqQuestion: { fontFamily: theme.typography.families.bodySemiBold, fontSize: 13, color: theme.colors.textPrimary },
  faqAnswer: { fontFamily: theme.typography.families.body, fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
});
