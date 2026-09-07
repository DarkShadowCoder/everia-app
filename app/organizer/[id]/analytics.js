// app/organizer/[id]/analytics.js
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import theme from '@/theme';
import Header from '@/components/ui/Header';
import StatCard from '@/components/ui/StatCard';
import SimpleBarChart from '@/components/organizer/SimpleBarChart';
import EmptyState from '@/components/ui/EmptyState';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/lib/supabase';
import { formatShortDate } from '@/lib/format';

export default function OrganizerAnalytics() {
  const { id } = useLocalSearchParams();

  const { data: dailyMetrics } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('event_daily_metrics')
      .select('*')
      .eq('event_id', id)
      .order('metric_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [id]);

  const { data: mediaTypeSplit } = useSupabaseQuery(async () => {
    const { count: photos } = await supabase.from('media').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('media_type', 'photo');
    const { count: videos } = await supabase.from('media').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('media_type', 'video');
    return { photos: photos || 0, videos: videos || 0 };
  }, [id]);

  const totals = (dailyMetrics || []).reduce(
    (acc, row) => ({
      uploads: acc.uploads + row.uploads,
      likes: acc.likes + row.likes,
      comments: acc.comments + row.comments,
      challenges: acc.challenges + row.challenges_completed,
    }),
    { uploads: 0, likes: 0, comments: 0, challenges: 0 }
  );

  const chartData = (dailyMetrics || []).slice(-7).map((row) => ({ label: formatShortDate(row.metric_date).split(' ')[0], value: row.uploads }));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Analytics" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard icon="cloud-upload-outline" value={totals.uploads} label="Médias envoyés" />
          <StatCard icon="heart-outline" value={totals.likes} label="Réactions" />
          <StatCard icon="chatbubble-outline" value={totals.comments} label="Commentaires" />
          <StatCard icon="trophy-outline" value={totals.challenges} label="Défis complétés" />
        </View>

        <Text style={styles.sectionTitle}>Engagement (7 derniers jours)</Text>
        {chartData.length ? (
          <SimpleBarChart data={chartData} />
        ) : (
          <EmptyState icon="stats-chart-outline" title="Pas encore de données" subtitle="Les statistiques apparaîtront dès les premières activités sur l'événement." />
        )}

        <Text style={styles.sectionTitle}>Types de contenus</Text>
        <View style={styles.splitRow}>
          <SplitBar label="Photos" value={mediaTypeSplit?.photos || 0} total={(mediaTypeSplit?.photos || 0) + (mediaTypeSplit?.videos || 0)} color={theme.colors.mediaPhoto} />
          <SplitBar label="Vidéos" value={mediaTypeSplit?.videos || 0} total={(mediaTypeSplit?.photos || 0) + (mediaTypeSplit?.videos || 0)} color={theme.colors.mediaVideo} />
        </View>
      </ScrollView>
    </View>
  );
}

function SplitBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.splitItem}>
      <View style={styles.splitHeader}>
        <Text style={styles.splitLabel}>{label}</Text>
        <Text style={styles.splitValue}>{pct}%</Text>
      </View>
      <View style={styles.splitTrack}>
        <View style={[styles.splitFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: theme.layout.screenHorizontal, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionTitle: { fontFamily: theme.typography.families.displaySemiBold, fontSize: 16, color: theme.colors.textPrimary, marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md },
  splitRow: { gap: theme.spacing.lg },
  splitItem: {},
  splitHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  splitLabel: { fontFamily: theme.typography.families.bodyMedium, fontSize: 12.5, color: theme.colors.textPrimary },
  splitValue: { fontFamily: theme.typography.families.bodySemiBold, fontSize: 12.5, color: theme.colors.textSecondary },
  splitTrack: { height: 8, borderRadius: 4, backgroundColor: theme.colors.border, overflow: 'hidden' },
  splitFill: { height: '100%', borderRadius: 4 },
});
