import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { User } from '../types';
import { colors, spacing, radius, fonts } from '../theme';

interface ParticipantsListProps {
  participants: User[];
  hostId: string;
}

export default function ParticipantsList({ participants, hostId }: ParticipantsListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PARTICIPANTS</Text>
      {participants.map(user => (
        <View key={user.id} style={styles.item}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.username}</Text>
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
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 11,
    ...fonts.semibold,
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 14,
    ...fonts.semibold,
  },
  name: {
    flex: 1,
    fontSize: 14,
    ...fonts.medium,
    color: colors.text,
  },
  hostBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(234,179,8,0.1)',
  },
  hostText: {
    color: colors.yellow,
    fontSize: 10,
    ...fonts.semibold,
  },
});
