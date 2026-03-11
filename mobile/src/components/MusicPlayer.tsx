import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, spacing, radius, fonts, shadow } from '../theme';

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

// Neon ring with pulsing glow
function NeonRing({ isPlaying }: { isPlaying: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isPlaying) {
      const spinAnim = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 12000, useNativeDriver: true })
      );
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 0.2, duration: 1500, useNativeDriver: true }),
          ]),
        ])
      );
      spinAnim.start();
      pulseAnim.start();
      return () => { spinAnim.stop(); pulseAnim.stop(); };
    } else {
      spin.stopAnimation();
      Animated.timing(pulseOpacity, { toValue: 0.1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isPlaying]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={ringStyles.wrapper}>
      {/* Outer glow pulse */}
      <Animated.View style={[ringStyles.outerGlow, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />

      {/* Spinning disc */}
      <Animated.View style={[ringStyles.disc, { transform: [{ rotate: rotation }] }]}>
        {/* Groove lines */}
        <View style={ringStyles.groove1} />
        <View style={ringStyles.groove2} />
        <View style={ringStyles.groove3} />
        <View style={ringStyles.groove4} />
        {/* Accent arc */}
        <View style={ringStyles.accentArc} />
        {/* Center */}
        <View style={ringStyles.center}>
          <View style={ringStyles.centerRing} />
          <View style={ringStyles.centerDot} />
        </View>
      </Animated.View>
    </View>
  );
}

// Audio spectrum visualizer
function Spectrum({ isPlaying }: { isPlaying: boolean }) {
  const bars = useRef(
    Array.from({ length: 21 }, () => new Animated.Value(0.15))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      const anims = bars.map((bar, i) => {
        const center = 10;
        const dist = Math.abs(i - center);
        const maxH = Math.max(0.3, 1 - dist * 0.07);
        return Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: maxH * (0.4 + Math.random() * 0.6),
              duration: 150 + Math.random() * 200,
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: maxH * (0.1 + Math.random() * 0.3),
              duration: 150 + Math.random() * 200,
              useNativeDriver: true,
            }),
          ])
        );
      });
      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    } else {
      bars.forEach(bar => {
        Animated.timing(bar, { toValue: 0.08, duration: 500, useNativeDriver: true }).start();
      });
    }
  }, [isPlaying]);

  return (
    <View style={spectrumStyles.container}>
      {bars.map((bar, i) => {
        const center = 10;
        const dist = Math.abs(i - center);
        const hue = dist < 3 ? colors.accent : dist < 6 ? colors.neonPurple : dist < 9 ? colors.neonPink : colors.neonCyan;
        return (
          <Animated.View
            key={i}
            style={[
              spectrumStyles.bar,
              {
                height: 36,
                backgroundColor: hue,
                transform: [{ scaleY: bar }],
                opacity: 1 - dist * 0.04,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function MusicPlayer({
  trackTitle, trackArtist, isPlaying, positionMs, durationMs,
  onPlay, onPause, onSkip, onPrev, onSeek,
}: MusicPlayerProps) {
  const progress = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;
  const hasTrack = trackTitle !== 'No track selected';

  return (
    <View style={styles.container}>
      {/* Background accent glow */}
      {isPlaying && <View style={styles.bgGlow} />}

      {/* Neon disc */}
      <NeonRing isPlaying={isPlaying} />

      {/* Spectrum */}
      <Spectrum isPlaying={isPlaying} />

      {/* Track info */}
      <Text style={[styles.title, !hasTrack && { color: colors.textMuted }]} numberOfLines={1}>
        {trackTitle}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>{trackArtist}</Text>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          {progress > 0 && (
            <View style={[styles.progressKnob, { left: `${Math.min(progress, 100)}%` }]} />
          )}
        </View>
        <View style={styles.times}>
          <Text style={styles.time}>{formatTime(positionMs)}</Text>
          <Text style={styles.time}>{formatTime(durationMs)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={onPrev} activeOpacity={0.6}>
          <View style={styles.prevIcon}>
            <View style={styles.prevBar} />
            <View style={styles.prevTriangle} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playBtn}
          onPress={isPlaying ? onPause : onPlay}
          activeOpacity={0.85}
        >
          {isPlaying ? (
            <View style={styles.pauseWrap}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          ) : (
            <View style={styles.playTriangle} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctrlBtn} onPress={onSkip} activeOpacity={0.6}>
          <View style={styles.nextIcon}>
            <View style={styles.nextTriangle} />
            <View style={styles.nextBar} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrapper: {
    width: 200, height: 200,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  outerGlow: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  disc: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#0c0c18',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.25)',
  },
  groove1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.04)',
  },
  groove2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.03)',
  },
  groove3: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.04)',
  },
  groove4: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.03)',
  },
  accentArc: {
    position: 'absolute', width: 145, height: 145, borderRadius: 72.5,
    borderWidth: 1.5, borderColor: 'transparent',
    borderTopColor: colors.accentLight,
    borderRightColor: colors.neonPink,
    opacity: 0.3,
  },
  center: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    ...shadow(colors.accent, 0, 0, 0.6, 10),
  },
  centerRing: {
    position: 'absolute',
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  centerDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#fff',
  },
});

const spectrumStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 2, height: 40, marginBottom: 16,
  },
  bar: {
    width: 3, borderRadius: 1.5,
  },
});

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    top: -50, left: '25%',
    width: '50%', height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  title: {
    fontSize: 17, ...fonts.bold, color: colors.text,
    marginBottom: 3, textAlign: 'center', paddingHorizontal: 8,
  },
  artist: {
    fontSize: 13, color: colors.textSub,
    marginBottom: spacing.md, textAlign: 'center',
  },
  progressWrap: { width: '100%', marginBottom: spacing.lg },
  progressBg: {
    width: '100%', height: 3, borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 8,
    position: 'relative',
  },
  progressFill: {
    height: '100%', borderRadius: 1.5, backgroundColor: colors.accent,
  },
  progressKnob: {
    position: 'absolute', top: -5, width: 13, height: 13, borderRadius: 6.5,
    backgroundColor: colors.accent, marginLeft: -6.5,
    borderWidth: 2, borderColor: '#fff',
    ...shadow(colors.accent, 0, 0, 0.6, 6, 6),
  },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 11, color: colors.textMuted, ...fonts.medium },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  ctrlBtn: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  // Prev icon
  prevIcon: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  prevBar: { width: 2.5, height: 14, backgroundColor: colors.textSub, borderRadius: 1 },
  prevTriangle: {
    width: 0, height: 0,
    borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 10,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderRightColor: colors.textSub,
  },
  // Next icon
  nextIcon: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  nextTriangle: {
    width: 0, height: 0,
    borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 10,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: colors.textSub,
  },
  nextBar: { width: 2.5, height: 14, backgroundColor: colors.textSub, borderRadius: 1 },
  // Play button
  playBtn: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    ...shadow(colors.accent, 0, 6, 0.5, 20, 12),
  },
  playTriangle: {
    width: 0, height: 0, marginLeft: 4,
    borderTopWidth: 12, borderBottomWidth: 12, borderLeftWidth: 20,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
  },
  pauseWrap: { flexDirection: 'row', gap: 6 },
  pauseBar: {
    width: 5, height: 20, borderRadius: 2.5, backgroundColor: '#fff',
  },
});
