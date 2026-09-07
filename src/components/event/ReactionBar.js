// src/components/event/ReactionBar.js
// Barre de réactions rapides sous un média (like/love/laugh/wow/celebration)
// + accès aux commentaires. RPC add_reaction/remove_reaction en base.
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import theme from '@/theme';
import { supabase } from '@/lib/supabase';

const REACTIONS = [
  { type: 'like', icon: 'thumbs-up', color: theme.colors.like },
  { type: 'love', icon: 'heart', color: theme.colors.love },
  { type: 'laugh', icon: 'happy', color: theme.colors.laugh },
  { type: 'wow', icon: 'sparkles', color: theme.colors.wow },
  { type: 'celebration', icon: 'trophy', color: theme.colors.celebration },
];

export default function ReactionBar({ mediaId, myReaction, reactionsCount = 0, commentsCount = 0, onOpenComments, onReacted }) {
  const [picking, setPicking] = useState(false);
  const [current, setCurrent] = useState(myReaction);

  // myReaction arrive souvent de façon asynchrone (requête séparée sur
  // media_reactions) après le premier rendu : on resynchronise l'état local
  // dès qu'il change, plutôt que de figer la valeur initiale du useState.
  useEffect(() => {
    setCurrent(myReaction);
  }, [myReaction]);

  const react = async (type) => {
    setPicking(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (current === type) {
      setCurrent(null);
      await supabase.rpc('remove_reaction', { p_media_id: mediaId });
    } else {
      setCurrent(type);
      await supabase.rpc('add_reaction', { p_media_id: mediaId, p_type: type });
    }
    onReacted?.();
  };

  const activeSpec = REACTIONS.find((r) => r.type === current);

  return (
    <View style={styles.row}>
      <Pressable onLongPress={() => setPicking(true)} onPress={() => react(current || 'like')} style={styles.action}>
        <Ionicons name={activeSpec ? activeSpec.icon : 'heart-outline'} size={20} color={activeSpec ? activeSpec.color : theme.colors.textSecondary} />
        <Text style={styles.count}>{reactionsCount}</Text>
      </Pressable>

      <Pressable onPress={onOpenComments} style={styles.action}>
        <Ionicons name="chatbubble-outline" size={19} color={theme.colors.textSecondary} />
        <Text style={styles.count}>{commentsCount}</Text>
      </Pressable>

      {picking && (
        <View style={styles.picker}>
          {REACTIONS.map((r) => (
            <Pressable key={r.type} onPress={() => react(r.type)} style={styles.pickerItem}>
              <Ionicons name={r.icon} size={20} color={r.color} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { fontFamily: theme.typography.families.bodyMedium, fontSize: 12, color: theme.colors.textSecondary },
  picker: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    padding: 6,
    gap: 10,
    ...theme.shadows.lg,
  },
  pickerItem: { padding: 4 },
});
