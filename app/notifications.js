// app/notifications.js

import React, {
  useCallback,
} from 'react';

import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import theme from '@/theme';

import Header from '@/components/ui/Header';

import EmptyState from '@/components/ui/EmptyState';

import {
  useSupabaseQuery,
} from '@/hooks/useSupabaseQuery';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  supabase,
} from '@/lib/supabase';

import {
  formatRelative,
  mapNotificationCategory,
} from '@/lib/format';

import {
  markAllNotificationsRead,
  markNotificationRead,
  normalizeNotificationRoute,
} from '@/lib/notifications';

// ============================================================
// SCREEN
// ============================================================

export default function Notifications() {
  const {
    user,
  } =
    useAuthStore();

  // ==========================================================
  // FETCH
  // ==========================================================

  const fetchNotifications =
    useCallback(
      async () => {
        if (
          !user?.id
        ) {
          return [];
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'notifications'
            )
            .select('*')
            .eq(
              'user_id',
              user.id
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              }
            )
            .limit(
              100
            );

        if (
          error
        ) {
          throw error;
        }

        return data ||
          [];
      },
      [user?.id]
    );

  const {
    data:
      notifications,
    isLoading,
    refresh,
    setData,
  } =
    useSupabaseQuery(
      fetchNotifications,
      [user?.id]
    );

  // ==========================================================
  // OPEN
  // ==========================================================

  const openNotification =
    async (
      notification
    ) => {
      try {
        setData(
          (
            current
          ) =>
            (
              current ||
              []
            ).map(
              (
                item
              ) =>
                item.id ===
                notification.id
                  ? {
                      ...item,

                      read_at:
                        new Date().toISOString(),
                    }
                  : item
            )
        );

        await markNotificationRead(
          notification.id
        );
      } catch (
        error
      ) {
        console.warn(
          '[Everia] Mark notification read failed:',
          error
        );
      }

      const route =
        normalizeNotificationRoute(
          notification
        );

      if (
        route
      ) {
        router.push(
          route
        );

        return;
      }

      if (
        notification.event_id
      ) {
        router.push(
          `/event/${notification.event_id}`
        );
      }
    };

  // ==========================================================
  // MARK ALL
  // ==========================================================

  const readAll =
    async () => {
      try {
        await markAllNotificationsRead();

        setData(
          (
            current
          ) =>
            (
              current ||
              []
            ).map(
              (
                item
              ) => ({
                ...item,

                read_at:
                  item.read_at ||
                  new Date().toISOString(),
              })
            )
        );
      } catch (
        error
      ) {
        console.warn(
          '[Everia] Mark all notifications read failed:',
          error
        );
      }
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View
      style={{
        flex: 1,

        backgroundColor:
          theme.colors
            .background,
      }}
    >
      <Header
        title="Notifications"
        onBack={() =>
          router.back()
        }
        rightActions={[
          {
            icon:
              'checkmark-done-outline',

            onPress:
              readAll,
          },
        ]}
      />

      <FlatList
        data={
          notifications
        }
        keyExtractor={
          (
            item
          ) =>
            item.id
        }
        refreshing={
          isLoading
        }
        onRefresh={
          refresh
        }
        contentContainerStyle={{
          paddingHorizontal:
            theme.layout
              .screenHorizontal,

          paddingBottom:
            40,
        }}
        showsVerticalScrollIndicator={
          false
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="notifications-outline"
              title="Aucune notification"
              subtitle="Vous êtes à jour !"
            />
          ) : null
        }
        renderItem={({
          item,
        }) => {
          const spec =
            theme
              .notifications
              .types[
                mapNotificationCategory(
                  item.type
                )
              ] ||
            theme
              .notifications
              .types
              .system;

          return (
            <Pressable
              style={
                styles.row
              }
              onPress={() =>
                openNotification(
                  item
                )
              }
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor:
                      `${spec.color}1A`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    spec.icon
                  }
                  size={
                    18
                  }
                  color={
                    spec.color
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,

                  marginLeft:
                    12,
                }}
              >
                <Text
                  style={[
                    styles.title,
                    !item.read_at &&
                      styles.titleUnread,
                  ]}
                  numberOfLines={
                    2
                  }
                >
                  {
                    item.title
                  }
                </Text>

                {!!item.body && (
                  <Text
                    style={
                      styles.body
                    }
                    numberOfLines={
                      2
                    }
                  >
                    {
                      item.body
                    }
                  </Text>
                )}

                <Text
                  style={
                    styles.time
                  }
                >
                  {formatRelative(
                    item.created_at
                  )}
                </Text>
              </View>

              {!item.read_at && (
                <View
                  style={
                    styles.unreadDot
                  }
                />
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    row: {
      flexDirection:
        'row',

      alignItems:
        'center',

      paddingVertical:
        12,

      borderBottomWidth:
        1,

      borderBottomColor:
        theme.colors
          .border,
    },

    iconWrap: {
      width:
        36,

      height:
        36,

      borderRadius:
        12,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    title: {
      fontFamily:
        theme.typography
          .families
          .bodyMedium,

      fontSize:
        13,

      color:
        theme.colors
          .textPrimary,

      lineHeight:
        18,
    },

    titleUnread: {
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
    },

    body: {
      fontFamily:
        theme.typography
          .families
          .body,

      fontSize:
        12,

      color:
        theme.colors
          .textSecondary,

      marginTop:
        3,

      lineHeight:
        17,
    },

    time: {
      fontFamily:
        theme.typography
          .families
          .body,

      fontSize:
        11,

      color:
        theme.colors
          .textMuted,

      marginTop:
        3,
    },

    unreadDot: {
      width:
        8,

      height:
        8,

      borderRadius:
        4,

      backgroundColor:
        theme.notifications
          .unreadIndicator,
    },
  });