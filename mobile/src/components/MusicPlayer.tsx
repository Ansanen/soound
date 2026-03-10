import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';
import WaveAnimation from './WaveAnimation';

interface MusicPlayerProps {
  trackTitle: string;
  trackArtist: string;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  onPrev: () => void;
  onSeek: (ms: number) => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function MusicPlayer({
  trackTitle, trackArtist, isPlaying, positionMs, durationMs,
  onPlay, onPause, onSkip, onPrev,
}: MusicPlayerProps) {
  const progress = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.art}>
        <WaveAnimation isPlaying={isPlaying} />
      </View>

      <Text style={styles.title} numberOfLines={1}>{trackTitle}</Text>
      <Text style={styles.artist} numberOfLines={1}>{trackArtist}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <View style={styles.times}>
          <Text style={styles.time}>{formatTime(positionMs)}</Text>
          <Text style={styles.time}>{formatTime(durationMs)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={onPrev}>
          <Text style={styles.ctrlIcon}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playBtn} onPress={isPlaying ? onPause : onPlay} activeOpacity={0.8}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={onSkip}>
          <Text style={styles.ctrlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg, borderRadius: radius.xl,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  art: {
    width: 180, height: 180, borderRadius: 20,
    backgroundColor: '#1a1a2e', marginBottom: spacing.lg,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 17, ...fonts.bold, color: colors.text, marginBottom: 4, textAlign: 'center' },
  artist: { fontSize: 13, color: colors.textDim, marginBottom: spacing.lg, textAlign: 'center' },
  progressContainer: { width: '100%', marginBottom: spacing.lg },
  progressBg: { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: colors.accent },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 11, color: colors.textMuted },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ctrlBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  ctrlIcon: { color: colors.text, fontSize: 18 },
  playBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#fff', fontSize: 22 },
});
