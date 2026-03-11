import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Animated } from 'react-native';
import { colors, spacing, radius, fonts, shadow } from '../theme';
import { api } from '../services/api';
import { UserContext } from '../contexts/UserContext';

function StatCard({ value, label, color, icon }: { value: number; label: string; color: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '15', borderColor: color + '25' }]}>
        <Text style={[styles.statIcon, { color }]}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TierBar({ name, emoji, min, max, current, color }: {
  name: string; emoji: string; min: number; max: number; current: number; color: string;
}) {
  const progress = Math.min(Math.max((current - min) / (max - min), 0), 1) * 100;
  const isActive = current >= min && current < max;
  const isComplete = current >= max;
  return (
    <View style={[styles.tierItem, isActive && styles.tierItemActive]}>
      <View style={styles.tierLeft}>
        <Text style={styles.tierEmoji}>{emoji}</Text>
        <View>
          <Text style={[styles.tierName, isActive && { color: colors.text }]}>{name}</Text>
          <Text style={styles.tierRange}>{min.toLocaleString()} pts</Text>
        </View>
      </View>
      <View style={styles.tierBarWrap}>
        <View style={styles.tierBarBg}>
          <View style={[styles.tierBarFill, { width: `${isComplete ? 100 : progress}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

export default function RewardsScreen() {
  const { userId } = useContext(UserContext);
  const [rewards, setRewards] = useState({
    totalPoints: 12480, minutesListened: 847,
    roomsHosted: 23, friendsInvited: 14,
  });

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getRewards(userId || 'demo-user') as any;
        if (data) setRewards({
          totalPoints: data.total_points || 0, minutesListened: data.minutes_listened || 0,
          roomsHosted: data.rooms_hosted || 0, friendsInvited: data.friends_invited || 0,
        });
      } catch {}
    })();
  }, []);

  const multiplier = Math.max(1, Math.floor(rewards.friendsInvited / 3) + 1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <Text style={styles.headerTitle}>Rewards</Text>
        <Text style={styles.headerSub}>Earn points by listening with friends</Text>

        {/* Points card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsGlow} />
          <View style={styles.pointsGlow2} />
          <Text style={styles.pointsLabel}>TOTAL POINTS</Text>
          <Text style={styles.pointsValue}>{rewards.totalPoints.toLocaleString()}</Text>
          <View style={styles.multiplierRow}>
            <View style={styles.multiplierBadge}>
              <Text style={styles.multiplierText}>{multiplier}x</Text>
            </View>
            <Text style={styles.multiplierLabel}>multiplier active</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={rewards.minutesListened} label="MINUTES" color={colors.accent} icon="~" />
          <StatCard value={rewards.roomsHosted} label="HOSTED" color={colors.neonCyan} icon="o" />
          <StatCard value={rewards.friendsInvited} label="INVITED" color={colors.neonPink} icon="+" />
        </View>

        {/* Tiers */}
        <View style={styles.tiersCard}>
          <Text style={styles.tiersTitle}>REWARD TIERS</Text>
          <TierBar name="Listener" emoji="~" min={0} max={5000} current={rewards.totalPoints} color={colors.accent} />
          <TierBar name="Fan" emoji="*" min={5000} max={25000} current={rewards.totalPoints} color={colors.neonCyan} />
          <TierBar name="Superfan" emoji="!" min={25000} max={100000} current={rewards.totalPoints} color={colors.neonPink} />
          <TierBar name="Legend" emoji="#" min={100000} max={500000} current={rewards.totalPoints} color={colors.yellow} />
        </View>

        {/* How it works */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          {[
            { color: colors.accent, title: 'Listen together', text: 'Every minute earns you points' },
            { color: colors.neonCyan, title: 'Bigger rooms', text: 'More people = bigger multiplier' },
            { color: colors.neonPink, title: 'Invite friends', text: 'Bonus points for each invite' },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={[styles.infoDot, { backgroundColor: item.color + '20', borderColor: item.color + '30' }]}>
                <View style={[styles.infoDotInner, { backgroundColor: item.color }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoHead}>{item.title}</Text>
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 80 : Platform.OS === 'web' ? 40 : 60,
  },
  headerTitle: {
    fontSize: 32, ...fonts.black, color: colors.text,
    letterSpacing: -1, marginBottom: 6, textAlign: 'center',
  },
  headerSub: {
    fontSize: 14, color: colors.textSub, textAlign: 'center', marginBottom: spacing.xl,
  },

  // Points
  pointsCard: {
    alignItems: 'center', padding: spacing.xl,
    borderRadius: 24, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.borderAccent,
    marginBottom: spacing.md, overflow: 'hidden',
  },
  pointsGlow: {
    position: 'absolute', top: -50, left: -30,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  pointsGlow2: {
    position: 'absolute', top: -20, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(236,72,153,0.06)',
  },
  pointsLabel: {
    fontSize: 11, ...fonts.bold, color: colors.textDim, letterSpacing: 2, marginBottom: 8,
  },
  pointsValue: {
    fontSize: 56, ...fonts.black, color: colors.text, letterSpacing: -3, lineHeight: 60,
  },
  multiplierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14,
  },
  multiplierBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.full, backgroundColor: colors.accent,
    ...shadow(colors.accent, 0, 0, 0.4, 8),
  },
  multiplierText: { color: '#fff', fontSize: 13, ...fonts.black },
  multiplierLabel: { color: colors.textDim, fontSize: 12, ...fonts.medium },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard: {
    flex: 1, padding: spacing.md, paddingVertical: spacing.lg,
    borderRadius: 20, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  statIcon: { fontSize: 14, ...fonts.bold },
  statValue: { fontSize: 24, ...fonts.black, marginBottom: 3 },
  statLabel: { fontSize: 8, ...fonts.bold, color: colors.textDim, letterSpacing: 1.5 },

  // Tiers
  tiersCard: {
    padding: spacing.lg, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  tiersTitle: {
    fontSize: 11, ...fonts.bold, color: colors.textDim, letterSpacing: 2, marginBottom: 18,
  },
  tierItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 12,
  },
  tierItemActive: {
    backgroundColor: 'rgba(124,58,237,0.03)',
    marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg,
    borderRadius: 10,
  },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, width: 110 },
  tierEmoji: { fontSize: 16, color: colors.textSub },
  tierName: { fontSize: 13, ...fonts.semibold, color: colors.textSub },
  tierRange: { fontSize: 10, color: colors.textMuted, ...fonts.medium, marginTop: 1 },
  tierBarWrap: { flex: 1 },
  tierBarBg: {
    height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tierBarFill: { height: '100%', borderRadius: 2.5 },

  // Info
  infoCard: {
    padding: spacing.lg, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  infoTitle: { fontSize: 14, ...fonts.bold, color: colors.text, marginBottom: spacing.md },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12,
  },
  infoDot: {
    width: 34, height: 34, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  infoDotInner: { width: 10, height: 10, borderRadius: 5 },
  infoHead: { fontSize: 13, ...fonts.semibold, color: colors.text, marginBottom: 2 },
  infoText: { fontSize: 12, color: colors.textDim, lineHeight: 18 },
});
