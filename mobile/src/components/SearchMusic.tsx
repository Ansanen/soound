import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Animated,
} from 'react-native';
import { colors, spacing, radius, fonts, shadow } from '../theme';
import { api } from '../services/api';

interface SearchResult {
  youtubeId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
}

interface SearchMusicProps {
  onAddTrack: (track: SearchResult) => void;
}

function formatDuration(sec: number): string {
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}:${s.toString().padStart(2, '0')}`;
}

// Animated add confirmation
function AddedBadge() {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[addStyles.badge, { transform: [{ scale }] }]}>
      <Text style={addStyles.check}>{'✓'}</Text>
    </Animated.View>
  );
}

const addStyles = StyleSheet.create({
  badge: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center',
    ...shadow(colors.green, 0, 0, 0.4, 8),
  },
  check: { color: '#fff', fontSize: 16, ...fonts.bold },
});

export default function SearchMusic({ onAddTrack }: SearchMusicProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.search(query) as SearchResult[];
      setResults(data);
    } catch (e: any) {
      console.error('Search failed:', e);
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleAdd = (track: SearchResult) => {
    setAddedIds(prev => new Set(prev).add(track.youtubeId));
    onAddTrack(track);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>FIND MUSIC</Text>
        {results.length > 0 && (
          <Text style={styles.resultCount}>{results.length} results</Text>
        )}
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
        <View style={styles.searchIconWrap}>
          <View style={styles.searchLens} />
          <View style={styles.searchHandle} />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Search songs, artists..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginRight: 4 }} />
        ) : query.trim() ? (
          <TouchableOpacity style={styles.goBtn} onPress={handleSearch} activeOpacity={0.7}>
            <Text style={styles.goBtnText}>{'>'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorDot}>{'!'}</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Results list */}
      <View style={styles.list}>
        {results.length > 0 ? results.map((item, index) => {
          const added = addedIds.has(item.youtubeId);
          return (
            <TouchableOpacity
              key={item.youtubeId}
              style={[styles.item, added && styles.itemAdded]}
              onPress={() => !added && handleAdd(item)}
              activeOpacity={added ? 1 : 0.7}
            >
              {/* Thumbnail */}
              <View style={styles.thumbWrap}>
                {item.thumbnail ? (
                  <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <View style={styles.thumbNote} />
                  </View>
                )}
                <View style={styles.durBadge}>
                  <Text style={styles.durText}>{formatDuration(item.duration)}</Text>
                </View>
                {/* Overlay number */}
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>{index + 1}</Text>
                </View>
              </View>

              {/* Info */}
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, added && { color: colors.textSub }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.itemArtist} numberOfLines={1}>{item.artist}</Text>
              </View>

              {/* Add / Added */}
              {added ? (
                <AddedBadge />
              ) : (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAdd(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addBtnPlus}>+</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }) : null}

        {/* Empty state */}
        {results.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <View style={styles.emptyNote1} />
              <View style={styles.emptyNote2} />
            </View>
            <Text style={styles.emptyTitle}>Find your music</Text>
            <Text style={styles.emptySub}>Search for any song to add to the queue</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11, ...fonts.bold, color: colors.textDim,
    letterSpacing: 2,
  },
  resultCount: {
    fontSize: 11, color: colors.accent, ...fonts.semibold,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 2,
    marginBottom: spacing.md,
  },
  searchBarFocused: {
    borderColor: colors.borderGlow,
    backgroundColor: 'rgba(124,58,237,0.03)',
    ...shadow(colors.accent, 0, 0, 0.15, 10),
  },
  searchIconWrap: {
    width: 16, height: 16, marginRight: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  searchLens: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1.5, borderColor: colors.textMuted,
  },
  searchHandle: {
    width: 5, height: 1.5, backgroundColor: colors.textMuted,
    position: 'absolute', bottom: 0, right: 0,
    transform: [{ rotate: '45deg' }],
  },
  input: {
    flex: 1, paddingVertical: 14,
    color: colors.text, fontSize: 14,
  },
  goBtn: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  goBtnText: {
    color: '#fff', fontSize: 16, ...fonts.bold,
  },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.12)',
    marginBottom: spacing.sm,
  },
  errorDot: {
    color: colors.red, fontSize: 14, ...fonts.bold,
  },
  errorText: {
    color: colors.red, fontSize: 12, ...fonts.medium, flex: 1,
  },

  // Results
  list: {},
  item: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, marginBottom: 8,
    borderRadius: 16, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
    gap: 12,
  },
  itemAdded: {
    borderColor: 'rgba(16,185,129,0.15)',
    backgroundColor: 'rgba(16,185,129,0.03)',
  },

  // Thumbnail
  thumbWrap: { position: 'relative' },
  thumb: {
    width: 58, height: 58, borderRadius: 12,
    backgroundColor: colors.surface,
  },
  thumbEmpty: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  thumbNote: {
    width: 16, height: 20, borderRadius: 4,
    backgroundColor: colors.textMuted, opacity: 0.3,
  },
  durBadge: {
    position: 'absolute', bottom: 3, right: 3,
    backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 5,
  },
  durText: { color: '#fff', fontSize: 9, ...fonts.bold },
  indexBadge: {
    position: 'absolute', top: 3, left: 3,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  indexText: { color: '#fff', fontSize: 8, ...fonts.bold },

  // Info
  itemInfo: { flex: 1 },
  itemTitle: {
    fontSize: 13, ...fonts.semibold, color: colors.text, lineHeight: 17,
  },
  itemArtist: {
    fontSize: 11, color: colors.textDim, marginTop: 3,
  },

  // Add button
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnPlus: {
    color: colors.accentLight, fontSize: 20, ...fonts.bold, marginTop: -1,
  },

  // Empty
  emptyState: {
    alignItems: 'center', padding: spacing.xl, gap: 6,
  },
  emptyIconWrap: {
    width: 48, height: 48, marginBottom: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyNote1: {
    width: 20, height: 24, borderRadius: 6,
    backgroundColor: colors.accent, opacity: 0.2,
    transform: [{ rotate: '-8deg' }],
  },
  emptyNote2: {
    width: 20, height: 24, borderRadius: 6,
    backgroundColor: colors.purple, opacity: 0.15,
    position: 'absolute', right: 6,
    transform: [{ rotate: '8deg' }],
  },
  emptyTitle: {
    fontSize: 15, ...fonts.semibold, color: colors.textSub,
  },
  emptySub: {
    fontSize: 12, color: colors.textMuted, ...fonts.medium,
  },
});
