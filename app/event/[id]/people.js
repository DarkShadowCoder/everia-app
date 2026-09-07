// app/event/[id]/people.js
// ============================================================
// EVERIA — People
// ============================================================

import React, {
  useMemo,
  useState,
} from 'react';

import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Image,
} from 'expo-image';

import {
  useLocalSearchParams,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

import theme from '@/theme';

import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

import {
  useAuthStore,
} from '@/store/authStore';

import {
  useUIStore,
} from '@/store/uiStore';

import {
  useSupabaseQuery,
} from '@/hooks/useSupabaseQuery';

import {
  getPeopleForEvent,
  getPersonMedia,
  bootstrapEventPeople,
  tagPerson,
  untagPerson,
} from '@/lib/peopleEngine';

import {
  mediaThumbnail,
  avatarUrl,
} from '@/lib/storage';

import {
  supabase,
} from '@/lib/supabase';

export default function People() {
  const {
    id,
  } =
    useLocalSearchParams();

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const toast =
    useUIStore(
      (state) =>
        state.showToast
    );

  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    selectedId,
    setSelectedId,
  ] =
    useState(null);

  const [
    tagMode,
    setTagMode,
  ] =
    useState(false);

  const {
    data: people,
    isLoading,
    refresh,
  } =
    useSupabaseQuery(
      async () => {
        await bootstrapEventPeople(
          id
        );

        return getPeopleForEvent(
          id
        );
      },
      [id]
    );

  const {
    data: media = [],
    isLoading:
      mediaLoading,
    refresh:
      refreshMedia,
  } =
    useSupabaseQuery(
      () =>
        getPersonMedia(
          selectedId
        ),
      [selectedId]
    );

  const {
    data:
      recentMedia = [],
  } =
    useSupabaseQuery(
      async () => {
        if (
          !id ||
          !tagMode
        ) {
          return [];
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'media'
            )
            .select(
              '*'
            )
            .eq(
              'event_id',
              id
            )
            .is(
              'deleted_at',
              null
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              }
            )
            .limit(
              20
            );

        if (error) {
          throw error;
        }

        return data || [];
      },
      [
        id,
        tagMode,
      ]
    );

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (
          !query
        ) {
          return (
            people ||
            []
          );
        }

        return (
          people ||
          []
        ).filter(
          (person) =>
            (
              person
                .display_name ||
              ''
            )
              .toLowerCase()
              .includes(
                query
              )
        );
      },
      [
        people,
        search,
      ]
    );

  const selected =
    (
      people ||
      []
    ).find(
      (person) =>
        person.id ===
        selectedId
    ) || null;

  const doTag =
    async (
      mediaId
    ) => {
      if (!selectedId) {
        return;
      }

      try {
        await tagPerson({
          personId:
            selectedId,
          mediaId,
          confirmed:
            true,
        });

        toast(
          'Personne associée à la photo.',
          'success'
        );

        setTagMode(
          false
        );

        refreshMedia();
        refresh();
      } catch (
        error
      ) {
        toast(
          error?.message ||
            'Impossible d’associer cette personne.',
          'error'
        );
      }
    };

  const doUntag =
    async (
      mediaId
    ) => {
      try {
        await untagPerson({
          personId:
            selectedId,
          mediaId,
        });

        toast(
          'Association supprimée.',
          'success'
        );

        refreshMedia();
      } catch (
        error
      ) {
        toast(
          error?.message ||
            'Impossible de supprimer l’association.',
          'error'
        );
      }
    };

  return (
    <View
      style={
        styles.screen
      }
    >
      <Header
        title="People"
        subtitle="Les personnes de l’événement"
        dark
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={
              isLoading
            }
            onRefresh={
              refresh
            }
            tintColor={
              theme.colors
                .primary
            }
          />
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.hero
          }
        >
          <Text
            style={
              styles.eyebrow
            }
          >
            PEOPLE
          </Text>

          <Text
            style={
              styles.heroTitle
            }
          >
            Retrouvez les personnes qui partagent vos souvenirs.
          </Text>

          <Text
            style={
              styles.heroText
            }
          >
            Les associations de personnes sont explicites et respectent la confidentialité. Everia ne donne pas de nom à un visage sans action de l’utilisateur.
          </Text>
        </View>

        <Input
          value={
            search
          }
          onChangeText={
            setSearch
          }
          placeholder="Rechercher une personne…"
          style={
            styles.search
          }
        />

        <Text
          style={
            styles.sectionTitle
          }
        >
          {
            filtered.length
          }{' '}
          participant
          {
            filtered.length >
            1
              ? 's'
              : ''
          }
        </Text>

        <FlatList
          horizontal
          data={
            filtered
          }
          keyExtractor={
            (item) =>
              item.id
          }
          showsHorizontalScrollIndicator={
            false
          }
          renderItem={({
            item,
          }) => (
            <PersonCard
              item={
                item
              }
              selected={
                selectedId ===
                item.id
              }
              onPress={() => {
                setSelectedId(
                  item.id
                );

                setTagMode(
                  false
                );
              }}
            />
          )}
          contentContainerStyle={
            styles.peopleList
          }
        />

        {selected ? (
          <View
            style={
              styles.selectedCard
            }
          >
            <View
              style={
                styles.selectedTop
              }
            >
              <Avatar
                uri={avatarUrl(
                  selected.avatar_path
                )}
                name={
                  selected.display_name
                }
                size="lg"
                ring
              />

              <View
                style={{
                  flex: 1,
                  marginLeft: 12,
                }}
              >
                <Text
                  style={
                    styles.selectedName
                  }
                >
                  {
                    selected.display_name ||
                    'Participant'
                  }
                </Text>

                <Text
                  style={
                    styles.selectedMeta
                  }
                >
                  {
                    media.length
                  }{' '}
                  souvenir
                  {
                    media.length >
                    1
                      ? 's'
                      : ''
                  }{' '}
                  associé
                  {
                    media.length >
                    1
                      ? 's'
                      : ''
                  }
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setSelectedId(
                    null
                  )
                }
              >
                <Ionicons
                  name="close-circle-outline"
                  size={22}
                  color={
                    theme.colors
                      .white40
                  }
                />
              </Pressable>
            </View>

            <Button
              title="Associer à une photo"
              variant="gold"
              onPress={() =>
                setTagMode(
                  (value) =>
                    !value
                )
              }
              icon="pricetag-outline"
              style={{
                marginTop: 15,
              }}
            />

            {tagMode ? (
              <View
                style={{
                  marginTop: 16,
                }}
              >
                <Text
                  style={
                    styles.tagTitle
                  }
                >
                  Choisissez une photo récente
                </Text>

                <View
                  style={
                    styles.tagGrid
                  }
                >
                  {recentMedia.map(
                    (
                      item
                    ) => (
                      <Pressable
                        key={
                          item.id
                        }
                        onPress={() =>
                          doTag(
                            item.id
                          )
                        }
                        style={
                          styles.tagTile
                        }
                      >
                        <Image
                          source={{
                            uri:
                              mediaThumbnail(
                                item
                              ),
                          }}
                          style={
                            StyleSheet.absoluteFillObject
                          }
                          contentFit="cover"
                        />

                        <View
                          style={
                            styles.tagOverlay
                          }
                        >
                          <Ionicons
                            name="pricetag"
                            size={16}
                            color={
                              theme.colors
                                .white
                            }
                          />
                        </View>
                      </Pressable>
                    )
                  )}
                </View>

                {!recentMedia.length ? (
                  <Text
                    style={
                      styles.muted
                    }
                  >
                    Aucune photo récente disponible.
                  </Text>
                ) : null}
              </View>
            ) : null}

            <Text
              style={[
                styles.tagTitle,
                {
                  marginTop: 20,
                },
              ]}
            >
              Photos associées
            </Text>

            {mediaLoading ? (
              <Text
                style={
                  styles.muted
                }
              >
                Chargement…
              </Text>
            ) : media.length ? (
              <View
                style={
                  styles.mediaGrid
                }
              >
                {media.map(
                  (item) => (
                    <Pressable
                      key={
                        item.id
                      }
                      onLongPress={() =>
                        doUntag(
                          item.id
                        )
                      }
                      style={
                        styles.mediaTile
                      }
                    >
                      <Image
                        source={{
                          uri:
                            mediaThumbnail(
                              item
                            ),
                        }}
                        style={
                          StyleSheet.absoluteFillObject
                        }
                        contentFit="cover"
                      />
                    </Pressable>
                  )
                )}
              </View>
            ) : (
              <Text
                style={
                  styles.muted
                }
              >
                Aucun souvenir associé pour le moment.
              </Text>
            )}

            <Text
              style={
                styles.helper
              }
            >
              Maintenez une photo associée pour retirer le lien.
            </Text>
          </View>
        ) : (
          <EmptyState
            icon="people-outline"
            title="Sélectionnez une personne"
            subtitle="Vous pourrez ensuite consulter et enrichir ses souvenirs."
          />
        )}
      </ScrollView>
    </View>
  );
}

function PersonCard({
  item,
  selected,
  onPress,
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={[
        styles.person,
        selected &&
          styles.personSelected,
      ]}
    >
      <Avatar
        uri={avatarUrl(
          item.avatar_path
        )}
        name={
          item.display_name
        }
        size="lg"
        ring={
          selected
        }
      />

      <Text
        numberOfLines={1}
        style={
          styles.personName
        }
      >
        {
          item.display_name ||
          'Participant'
        }
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        theme.screens
          .people,
    },

    content: {
      paddingHorizontal:
        theme.layout
          .screenHorizontal,
      paddingBottom: 44,
    },

    hero: {
      padding: 20,
      borderRadius: 22,
      backgroundColor:
        theme.colors.surface,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      marginBottom: 16,
    },

    eyebrow: {
      color:
        theme.colors.textGold,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 9,
      letterSpacing: 1.4,
    },

    heroTitle: {
      color:
        theme.colors
          .textPrimary,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 24,
      lineHeight: 29,
      marginTop: 6,
    },

    heroText: {
      color:
        theme.colors
          .textSecondary,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 8,
    },

    search: {
      marginBottom: 18,
    },

    sectionTitle: {
      color:
        theme.colors
          .textPrimary,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 20,
      marginBottom: 12,
    },

    peopleList: {
      paddingBottom: 18,
    },

    person: {
      alignItems:
        'center',
      width: 82,
      marginRight: 12,
      paddingVertical: 8,
      borderRadius: 18,
    },

    personSelected: {
      backgroundColor:
        theme.colors
          .primarySoft,
    },

    personName: {
      color:
        theme.colors
          .textPrimary,
      fontFamily:
        theme.typography
          .families
          .bodyMedium,
      fontSize: 10,
      marginTop: 6,
      maxWidth: 78,
      textAlign:
        'center',
    },

    selectedCard: {
      backgroundColor:
        theme.colors.surface,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 22,
      padding: 16,
    },

    selectedTop: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    selectedName: {
      color:
        theme.colors
          .textPrimary,
      fontFamily:
        theme.typography
          .families
          .displaySemiBold,
      fontSize: 20,
    },

    selectedMeta: {
      color:
        theme.colors
          .textSecondary,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 11,
      marginTop: 3,
    },

    tagTitle: {
      color:
        theme.colors
          .textPrimary,
      fontFamily:
        theme.typography
          .families
          .bodySemiBold,
      fontSize: 13,
      marginBottom: 10,
    },

    tagGrid: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 8,
    },

    tagTile: {
      width: '23%',
      aspectRatio:
        0.85,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor:
        theme.colors
          .borderLight,
    },

    tagOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        'rgba(33,16,34,0.28)',
    },

    mediaGrid: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 8,
    },

    mediaTile: {
      width: '31.5%',
      aspectRatio:
        0.82,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor:
        theme.colors
          .borderLight,
    },

    muted: {
      color:
        theme.colors
          .textMuted,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 12,
    },

    helper: {
      color:
        theme.colors
          .textMuted,
      fontFamily:
        theme.typography
          .families.body,
      fontSize: 10,
      marginTop: 9,
    },
  });