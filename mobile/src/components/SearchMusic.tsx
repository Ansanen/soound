import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';
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

export default function SearchMusic({ onAddTrack }: SearchMusicProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const [error, setError] = useState('');

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
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Search music..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator color={colors.accent} style={styles.loader} />}
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.list}>
        {results.length > 0 ? results.map((item) => {
          const added = addedIds.has(item.youtubeId);
          return (
            <View key={item.youtubeId} style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemArtist} numberOfLines={1}>{item.artist}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemDur}>{formatDuration(item.duration)}</Text>
                <TouchableOpacity
                  style={[styles.addBtn, added && styles.addBtnDone]}
                  onPress={() => handleAdd(item)}
                  disabled={added}
                >
                  <Text style={[styles.addBtnText, added && styles.addBtnTextDone]}>
                    {added ? '✓' : '+'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }) : (
          query.trim() && !loading ? (
            <Text style={styles.empty}>Search for songs to add to the queue</Text>
          ) : null
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    padding: 14,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 14,
  },
  loader: {
    marginLeft: 12,
  },
  list: {
    maxHeight: 300,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 14,
    ...fonts.medium,
    color: colors.text,
  },
  itemArtist: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemDur: {
    fontSize: 12,
    color: colors.textMuted,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDone: {
    borderColor: colors.green,
  },
  addBtnText: {
    color: colors.accent,
    fontSize: 18,
    ...fonts.bold,
  },
  addBtnTextDone: {
    color: colors.green,
  },
  searchBtn: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 14,
    ...fonts.semibold,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 8,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: spacing.xl,
    fontSize: 13,
  },
});
