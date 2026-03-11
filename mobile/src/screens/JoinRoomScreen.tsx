import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Animated, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, fonts, shadow } from '../theme';
import { RootStackParamList } from '../contexts/UserContext';

const { width: SCREEN_W } = Dimensions.get('window');
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function JoinRoomScreen() {
  const nav = useNavigation<NavProp>();
  const [code, setCode] = useState('');

  const iconScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(contentSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) return;
    nav.navigate('Room', { roomCode: trimmed, roomName: `Room ${trimmed}`, isHost: false });
  };

  const isValid = code.trim().length >= 4;

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <View style={[styles.orb, { top: -40, left: SCREEN_W * 0.5 - 100, backgroundColor: 'rgba(124,58,237,0.08)' }]} />
      <View style={[styles.orb2, { bottom: 100, right: -40, backgroundColor: 'rgba(6,182,212,0.06)' }]} />

      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()} activeOpacity={0.7}>
        <View style={styles.backCircle}>
          <View style={styles.backLine1} />
          <View style={styles.backLine2} />
        </View>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Icon */}
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Text style={styles.iconHash}>#</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ alignItems: 'center', opacity: contentOpacity, transform: [{ translateY: contentSlide }] }}>
          <Text style={styles.title}>Join a room</Text>
          <Text style={styles.sub}>Enter the code shared by your friend</Text>

          {/* Input */}
          <View style={[styles.inputWrap, code.length > 0 && styles.inputWrapActive]}>
            <TextInput
              style={styles.input}
              placeholder="ABCD"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
              onSubmitEditing={handleJoin}
            />
          </View>

          {/* Character indicators */}
          <View style={styles.charIndicators}>
            {[0,1,2,3].map(i => (
              <View key={i} style={[styles.charDot, code.length > i && styles.charDotFilled]} />
            ))}
          </View>

          <Text style={styles.hint}>4-6 characters</Text>

          {/* Join */}
          <TouchableOpacity
            style={[styles.joinBtn, !isValid && styles.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={styles.joinBtnText}>Join Room</Text>
            <Text style={styles.joinArrow}>{'>'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  orb: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
  },
  orb2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'web' ? 20 : 40,
  },
  backCircle: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  backLine1: {
    width: 8, height: 1.5, backgroundColor: colors.textSub,
    borderRadius: 1, transform: [{ rotate: '-45deg' }, { translateY: -2 }],
  },
  backLine2: {
    width: 8, height: 1.5, backgroundColor: colors.textSub,
    borderRadius: 1, transform: [{ rotate: '45deg' }, { translateY: 2 }],
  },
  backText: { color: colors.textSub, fontSize: 14, ...fonts.medium },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.lg, paddingBottom: 140,
  },
  iconWrap: { marginBottom: 28 },
  iconOuter: {
    width: 80, height: 80, borderRadius: 28,
    backgroundColor: colors.accentMuted, borderWidth: 1, borderColor: colors.borderAccent,
    alignItems: 'center', justifyContent: 'center',
    ...shadow(colors.accent, 0, 0, 0.3, 20),
  },
  iconInner: {
    width: 50, height: 50, borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  iconHash: { color: colors.accent, fontSize: 26, ...fonts.black },
  title: { fontSize: 28, ...fonts.bold, color: colors.text, marginBottom: 8 },
  sub: {
    fontSize: 14, color: colors.textSub, marginBottom: 36, textAlign: 'center',
  },
  inputWrap: {
    width: '100%', maxWidth: 280,
    borderRadius: 22, borderWidth: 2,
    borderColor: colors.border, backgroundColor: colors.card,
    marginBottom: 12,
  },
  inputWrapActive: {
    borderColor: colors.borderGlow,
    backgroundColor: 'rgba(124,58,237,0.03)',
  },
  input: {
    padding: 22, color: colors.text, fontSize: 32,
    textAlign: 'center', ...fonts.black, letterSpacing: 10,
  },
  charIndicators: {
    flexDirection: 'row', gap: 8, marginBottom: 8,
  },
  charDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border,
  },
  charDotFilled: {
    backgroundColor: colors.accent, borderColor: colors.accent,
    ...shadow(colors.accent, 0, 0, 0.5, 4),
  },
  hint: { fontSize: 11, color: colors.textMuted, marginBottom: 28, ...fonts.medium },
  joinBtn: {
    width: '100%', maxWidth: 280,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 18,
    backgroundColor: colors.accent, gap: 8,
    ...shadow(colors.accent, 0, 6, 0.4, 20, 12),
  },
  joinBtnDisabled: { opacity: 0.25, ...shadow('transparent', 0, 0, 0, 0, 0) },
  joinBtnText: { color: '#fff', fontSize: 16, ...fonts.bold },
  joinArrow: { color: 'rgba(255,255,255,0.5)', fontSize: 16, ...fonts.bold },
});
