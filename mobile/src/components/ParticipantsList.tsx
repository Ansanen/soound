import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from '../types';
import { colors, spacing, radius, fonts } from '../theme';

interface ParticipantsListProps {
  participants: User[];
  hostId: string;
}

const AVATAR_BG = [
  colors.accent + '18', colors.purple + '18', colors.pink + '18',
  colors.cyan + '18', colors.yellow + '18',
];
const AVATAR_FG = [
  colors.accentLight, colors.neonPurple, colors.neonPink,
  colors.neonCyan, colors.yellow,
];

export default function ParticipantsList({ participants, hostId }: ParticipantsListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LISTENERS</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{participants.length}</Text>
        </View>
      </View>
      {participants.map((user, i) => (
        <View key={user.id} style={styles.item}>
          <View style={[styles.avatar, { backgroundColor: AVATAR_BG[i % 5] }]}>
            <Text style={[styles.avatarText, { color: AVATAR_FG[i % 5] }]}>
              {user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.username}</Text>
            {user.id === hostId && <Text style={styles.hostLabel}>Room host</Text>}
          </View>
          {user.id === hostId && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostText}>HOST</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  title: { fontSize: 11, ...fonts.bold, color: colors.textDim, letterSpacing: 2 },
  countBadge: {
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  countText: { color: colors.textSub, fontSize: 10, ...fonts.bold },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, ...fonts.bold },
  name: { fontSize: 14, ...fonts.medium, color: colors.text },
  hostLabel: { fontSize: 10, color: colors.textDim, marginTop: 1 },
  hostBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.yellow + '12', borderWidth: 1, borderColor: colors.yellow + '25',
  },
  hostText: { color: colors.yellow, fontSize: 9, ...fonts.black, letterSpacing: 1 },
});
