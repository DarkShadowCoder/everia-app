// src/components/event/CommentSheet.js
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@/components/ui/BottomSheet';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import theme from '@/theme';
import { formatRelative } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export default function CommentSheet({ visible, onClose, eventId, mediaId, momentId, comments = [], onPosted, currentUserId }) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!text.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('comments').insert({
      event_id: eventId,
      media_id: mediaId ?? null,
      moment_id: momentId ?? null,
      user_id: currentUserId,
      body: text.trim(),
    });
    setPosting(false);
    if (!error) {
      setText('');
      onPosted?.();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} dark={false} maxHeightRatio={0.8}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Text style={styles.title}>Commentaires</Text>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: theme.layout.screenHorizontal, paddingBottom: 12 }}
          ListEmptyComponent={<EmptyState icon="chatbubble-outline" title="Aucun commentaire" subtitle="Soyez le premier à réagir à ce souvenir." />}
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <Avatar uri={item.author_avatar} name={item.author_name} size="sm" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.author}>{item.author_name || 'Participant'}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{formatRelative(item.created_at)}</Text>
              </View>
            </View>
          )}
        />
        <View style={styles.inputRow}>
          <Input value={text} onChangeText={setText} placeholder="Ajouter un commentaire..." style={{ flex: 1 }} />
          <Pressable onPress={post} disabled={posting || !text.trim()} style={styles.sendBtn}>
            <Ionicons name="send" size={18} color={theme.colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: 'center', fontFamily: theme.typography.families.bodySemiBold, fontSize: 15, marginBottom: 12 },
  commentRow: { flexDirection: 'row', marginBottom: 16 },
  author: { fontFamily: theme.typography.families.bodySemiBold, fontSize: 12.5, color: theme.colors.textPrimary },
  body: { fontFamily: theme.typography.families.body, fontSize: 13, color: theme.colors.textPrimary, marginTop: 2, lineHeight: 18 },
  time: { fontFamily: theme.typography.families.body, fontSize: 10.5, color: theme.colors.textMuted, marginTop: 3 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.layout.screenHorizontal, paddingTop: 10, gap: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
});
