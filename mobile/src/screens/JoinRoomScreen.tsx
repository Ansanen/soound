import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, fonts } from '../theme';
import type { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function JoinRoomScreen() {
  const nav = useNavigation<NavProp>();
  const [code, setCode] = useState('');

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) return;
    nav.navigate('Room', {
      roomCode: trimmed,
      roomName: `Room ${trimmed}`,
      isHost: false,
    });
  };

  return (
    <View style={styles.container}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
        <Text style={styles.backText}>&#8592; Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Join a room</Text>
        <Text style={styles.sub}>Enter the room code to start listening</Text>

        <TextInput
          style={styles.input}
          placeholder="Room code"
          placeholderTextColor={colors.textMuted}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          maxLength={6}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.joinBtn, code.trim().length < 4 && styles.joinBtnDisabled]}
          onPress={handleJoin}
          disabled={code.trim().length < 4}
          activeOpacity={0.8}
        >
          <Text style={styles.joinBtnText}>Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backBtn: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
  },
  backText: {
    color: colors.textDim,
    fontSize: 15,
    ...fonts.medium,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    ...fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: colors.textDim,
    marginBottom: 36,
  },
  input: {
    width: '100%',
    maxWidth: 360,
    padding: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 22,
    textAlign: 'center',
    ...fonts.semibold,
    letterSpacing: 6,
    marginBottom: 16,
  },
  joinBtn: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  joinBtnDisabled: {
    opacity: 0.4,
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 16,
    ...fonts.bold,
  },
});
