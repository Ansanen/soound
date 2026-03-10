import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';
import { api } from '../services/api';
import { UserContext } from '../../App';

export default function RewardsScreen() {
  const { userId } = useContext(UserContext);
  const [rewards, setRewards] = useState({
    totalPoints: 12480,
    minutesListened: 847,
    roomsHosted: 23,
    friendsInvited: 14,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getRewards(userId || 'demo-user') as any;
        if (data) {
          setRewards({
            totalPoints: data.total_points || 0,
            minutesListened: data.minutes_listened || 0,
            roomsHosted: data.rooms_hosted || 0,
            friendsInvited: data.friends_invited || 0,
          });
        }
      } catch {
        // Use demo data
      }
    })();
  }, []);

  const multiplier = Math.max(1, Math.floor(rewards.friendsInvited / 3) + 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Rewards</Text>
        <Text style={styles.headerSub}>
          Earn points by listening, hosting, and inviting friends
        </Text>
      </View>

      {/* Points */}
      <View style={styles.pointsSection}>
        <Text style={styles.pointsValue}>
          {rewards.totalPoints.toLocaleString()}
        </Text>
        <Text style={styles.pointsLabel}>TOTAL POINTS</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{rewards.minutesListened}</Text>
          <Text style={styles.statLabel}>MINUTES LISTENED</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{rewards.roomsHosted}</Text>
          <Text style={styles.statLabel}>ROOMS HOSTED</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{rewards.friendsInvited}</Text>
          <Text style={styles.statLabel}>FRIENDS INVITED</Text>
        </View>
      </View>

      {/* Multiplier */}
      <View style={styles.multiplierCard}>
        <Text style={styles.multiplierValue}>{multiplier}x</Text>
        <Text style={styles.multiplierLabel}>Current Reward Multiplier</Text>
      </View>

      {/* How it works */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How rewards work</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoDot}>{'  '}</Text>
          <Text style={styles.infoText}>Every minute of listening earns points</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoDot}>{'  '}</Text>
          <Text style={styles.infoText}>More people in your room = bigger multiplier</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoDot}>{'  '}</Text>
          <Text style={styles.infoText}>Invite friends to earn bonus points</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'web' ? 40 : 100,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerTitle: {
    fontSize: 28,
    ...fonts.heavy,
    color: colors.text,
    letterSpacing: -1,
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
  },
  pointsSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  pointsValue: {
    fontSize: 56,
    ...fonts.black,
    color: colors.accent,
    letterSpacing: -3,
    lineHeight: 60,
  },
  pointsLabel: {
    fontSize: 12,
    ...fonts.semibold,
    color: colors.textDim,
    letterSpacing: 1.5,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    ...fonts.heavy,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    ...fonts.semibold,
    color: colors.textDim,
    letterSpacing: 1,
    textAlign: 'center',
  },
  multiplierCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  multiplierValue: {
    fontSize: 48,
    ...fonts.black,
    color: colors.accent,
    marginBottom: 4,
  },
  multiplierLabel: {
    fontSize: 13,
    color: colors.textDim,
    ...fonts.medium,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 14,
    ...fonts.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  infoDot: {
    color: colors.accent,
    fontSize: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textDim,
    lineHeight: 20,
  },
});
