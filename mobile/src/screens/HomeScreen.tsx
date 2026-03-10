import React, { useState, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, fonts } from '../theme';
import { api } from '../services/api';
import type { RootStackParamList } from '../../App';
import { UserContext } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<NavProp>();
  const { userId } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const hostId = userId || 'demo-user';
      const room = await api.createRoom('My Room', hostId) as any;
      nav.navigate('Room', {
        roomCode: room.code,
        roomName: room.name,
        isHost: true,
      });
    } catch (e) {
      // Offline fallback — navigate with a random code
      nav.navigate('Room', {
        roomCode: Math.random().toString(36).slice(2, 6).toUpperCase(),
        roomName: 'My Room',
        isHost: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Text style={styles.logo}>soound</Text>
      <Text style={styles.tagline}>Turn every phone into one giant speaker</Text>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={handleCreateRoom}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.createBtnText}>
            {loading ? 'Creating...' : 'Create Room'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.joinBtn}
          onPress={() => nav.navigate('JoinRoom')}
          activeOpacity={0.8}
        >
          <Text style={styles.joinBtnText}>Join Room</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Rooms */}
      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>RECENT ROOMS</Text>

        <TouchableOpacity
          style={styles.recentItem}
          onPress={() => nav.navigate('Room', {
            roomCode: 'A1B2',
            roomName: 'Chill Vibes',
            isHost: false,
          })}
        >
          <View>
            <Text style={styles.recentName}>Chill Vibes</Text>
            <Text style={styles.recentTime}>2 hours ago</Text>
          </View>
          <Text style={styles.recentCount}>4 listening</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.recentItem}
          onPress={() => nav.navigate('Room', {
            roomCode: 'X9Y8',
            roomName: 'Road Trip Mix',
            isHost: false,
          })}
        >
          <View>
            <Text style={styles.recentName}>Road Trip Mix</Text>
            <Text style={styles.recentTime}>Yesterday</Text>
          </View>
          <Text style={styles.recentCount}>7 listening</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    fontSize: 48,
    ...fonts.black,
    color: colors.accent,
    letterSpacing: -2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: colors.textDim,
    marginBottom: spacing.xxl,
  },
  buttons: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  createBtn: {
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    ...fonts.bold,
  },
  joinBtn: {
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinBtnText: {
    color: colors.text,
    fontSize: 16,
    ...fonts.semibold,
  },
  recentSection: {
    width: '100%',
    maxWidth: 400,
    marginTop: spacing.xxl,
  },
  recentTitle: {
    fontSize: 11,
    ...fonts.semibold,
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  recentName: {
    fontSize: 14,
    ...fonts.semibold,
    color: colors.text,
  },
  recentTime: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  recentCount: {
    fontSize: 13,
    color: colors.accent,
    ...fonts.semibold,
  },
});
