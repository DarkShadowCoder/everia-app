// src/components/event/GuestbookEntryCard.js
// ------------------------------------------------------------
// Carte éditoriale d'un message du livre d'or.
// Pattern : social memory wall / premium editorial.
// ------------------------------------------------------------

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Avatar from '@/components/ui/Avatar';
import theme from '@/theme';
import { formatRelative } from '@/lib/format';

const MESSAGE_META = {
  text: {
    accent: theme.guestbook.textMessage.accent,
    soft: theme.colors.primarySoft,
    label: 'Message',
    icon: 'create-outline',
  },

  audio: {
    accent: theme.guestbook.audioMessage.accent,
    soft: theme.colors.successLight,
    label: 'Message vocal',
    icon: 'mic-outline',
  },

  video: {
    accent: theme.guestbook.videoMessage.accent,
    soft: theme.colors.primarySoft,
    label: 'Message vidéo',
    icon: 'videocam-outline',
  },
};

export default function GuestbookEntryCard({
  entry,
  onPress,
  index = 0,
}) {
  const meta =
    MESSAGE_META[entry.entry_type] ||
    MESSAGE_META.text;

  const hasMedia =
    Boolean(entry.media) &&
    entry.entry_type !== 'text';

  const quoteMark = '“';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        index % 2 === 1 &&
          styles.cardOffset,
        pressed &&
          styles.cardPressed,
      ]}
    >
      <View
        style={[
          styles.accentRail,
          {
            backgroundColor:
              meta.accent,
          },
        ]}
      />

      <View style={styles.topRow}>
        <Avatar
          uri={entry.author_avatar}
          name={entry.author_name}
          size={46}
          ring
          style={[
            styles.avatar,
            {
              borderColor:
                meta.accent,
            },
          ]}
        />

        <View style={styles.authorBlock}>
          <View style={styles.authorNameRow}>
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {entry.author_name ||
                'Invité'}
            </Text>

            <View
              style={[
                styles.typePill,
                {
                  backgroundColor:
                    meta.soft,
                },
              ]}
            >
              <Ionicons
                name={meta.icon}
                size={11}
                color={meta.accent}
              />

              <Text
                style={[
                  styles.typePillText,
                  {
                    color:
                      meta.accent,
                  },
                ]}
              >
                {meta.label}
              </Text>
            </View>
          </View>

          <Text style={styles.time}>
            {formatRelative(
              entry.created_at
            )}
          </Text>
        </View>

        <View
          style={[
            styles.moreButton,
            {
              backgroundColor:
                meta.soft,
            },
          ]}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={16}
            color={meta.accent}
          />
        </View>
      </View>

      <View style={styles.contentBlock}>
        {entry.text_content ? (
          <>
            <Text
              style={[
                styles.quoteMark,
                {
                  color:
                    meta.accent,
                },
              ]}
            >
              {quoteMark}
            </Text>

            <Text style={styles.body}>
              {entry.text_content}
            </Text>
          </>
        ) : null}

        {hasMedia ? (
          <View
            style={[
              styles.mediaPreview,
              {
                backgroundColor:
                  meta.soft,
                borderColor:
                  meta.accent + '22',
              },
            ]}
          >
            <View
              style={[
                styles.mediaIcon,
                {
                  backgroundColor:
                    meta.accent,
                },
              ]}
            >
              <Ionicons
                name={
                  entry.entry_type ===
                  'audio'
                    ? 'play'
                    : 'play-outline'
                }
                size={16}
                color={
                  theme.colors.white
                }
              />
            </View>

            <View
              style={styles.mediaCopy}
            >
              <Text
                style={[
                  styles.mediaTitle,
                  {
                    color:
                      meta.accent,
                  },
                ]}
              >
                {meta.label}
              </Text>

              <Text
                style={
                  styles.mediaSubtitle
                }
              >
                {entry.entry_type ===
                'audio'
                  ? 'Écouter le souvenir'
                  : 'Voir le souvenir'}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={17}
              color={meta.accent}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          <Ionicons
            name="heart-outline"
            size={14}
            color={
              theme.colors.textMuted
            }
          />

          <Text
            style={styles.footerText}
          >
            Un souvenir partagé
          </Text>
        </View>

        <View style={styles.footerRight}>
          <View
            style={[
              styles.footerDot,
              {
                backgroundColor:
                  meta.accent,
              },
            ]}
          />

          <Text
            style={styles.footerText}
          >
            Everia
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor:
      theme.guestbook.cardBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor:
      theme.colors.borderLight,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 13,
    marginBottom: 12,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },

  cardOffset: {
    marginLeft: 6,
  },

  cardPressed: {
    opacity: 0.96,
    transform: [
      {
        scale: 0.995,
      },
    ],
  },

  accentRail: {
    position: 'absolute',
    left: 0,
    top: 18,
    bottom: 18,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    backgroundColor:
      theme.colors.surfaceSoft,
  },

  authorBlock: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },

  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  name: {
    flexShrink: 1,
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 13,
    color:
      theme.colors.textPrimary,
  },

  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 23,
    borderRadius: 999,
    paddingHorizontal: 7,
    marginLeft: 7,
    gap: 4,
  },

  typePillText: {
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 8.5,
    letterSpacing: 0.1,
  },

  time: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 10,
    color:
      theme.colors.textMuted,
  },

  moreButton: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  contentBlock: {
    marginTop: 16,
    paddingLeft: 4,
  },

  quoteMark: {
    height: 28,
    fontFamily:
      theme.typography.families.displayBold,
    fontSize: 38,
    lineHeight: 30,
    marginBottom: 1,
  },

  body: {
    fontFamily:
      theme.typography.families.display,
    fontSize: 18,
    lineHeight: 27,
    color:
      theme.colors.textPrimary,
    paddingRight: 6,
  },

  mediaPreview: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  mediaIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mediaCopy: {
    flex: 1,
    marginHorizontal: 10,
  },

  mediaTitle: {
    fontFamily:
      theme.typography.families.bodySemiBold,
    fontSize: 11.5,
  },

  mediaSubtitle: {
    marginTop: 2,
    fontFamily:
      theme.typography.families.body,
    fontSize: 9.5,
    color:
      theme.colors.textSecondary,
  },

  footerRow: {
    borderTopWidth: 1,
    borderTopColor:
      theme.colors.divider,
    marginTop: 16,
    paddingTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  footerText: {
    fontFamily:
      theme.typography.families.bodyMedium,
    fontSize: 9,
    color:
      theme.colors.textMuted,
  },
});