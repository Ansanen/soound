import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, fonts, shadow } from '../theme';
import { api } from '../services/api';
import { RootStackParamList, UserContext } from '../contexts/UserContext';

const { width: SCREEN_W } = Dimensions.get('window');
type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Animated floating orb with glow
function GlowOrb({ size, x, y, color, delay, duration }: {
  size: number; x: number; y: number; color: string; delay: number; duration: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, { toValue: 1, duration: 1200, delay, useNativeDriver: true }).start();

    // Continuous float
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -20, duration: duration, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: duration, useNativeDriver: true }),
      ])
    );
    // Continuous scale
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: duration * 0.8, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.85, duration: duration * 0.8, useNativeDriver: true }),
      ])
    );

    setTimeout(() => { floatAnim.start(); scaleAnim.start(); }, delay);
    return () => { floatAnim.stop(); scaleAnim.stop(); };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', left: x, top: y,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        opacity, transform: [{ translateY }, { scale }],
      }}
    />
  );
}

// Animated equalizer bars in the center
function LiveBars() {
  const bars = useRef(
    Array.from({ length: 13 }, () => new Animated.Value(0.2))
  ).current;

  useEffect(() => {
    const anims = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 200 + i * 40 + Math.random() * 200,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.1 + Math.random() * 0.3,
            duration: 200 + i * 40 + Math.random() * 200,
            useNativeDriver: true,
          }),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  const barColors = [
    colors.accent, colors.neonPurple, colors.purple, colors.neonPink,
    colors.pink, colors.accent, colors.neonCyan, colors.accent,
    colors.neonPurple, colors.purple, colors.neonPink, colors.accent, colors.cyan,
  ];

  return (
    <View style={barStyles.container}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            barStyles.bar,
            {
              height: 44 + (i % 3) * 8,
              backgroundColor: barColors[i],
              transform: [{ scaleY: bar }],
              opacity: 0.7 + (i % 3) * 0.1,
            },
          ]}
        />
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginBottom: 36,
    height: 60,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});

export default function HomeScreen() {
  const nav = useNavigation<NavProp>();
  const { userId } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  // Stagger entrance animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const barsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(40)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(barsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(buttonsTranslate, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(footerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const hostId = userId || 'demo-user';
      const room = await api.createRoom('My Room', hostId) as any;
      nav.navigate('Room', { roomCode: room.code, roomName: room.name, isHost: true });
    } catch (e) {
      nav.navigate('Room', {
        roomCode: Math.random().toString(36).slice(2, 6).toUpperCase(),
        roomName: 'My Room', isHost: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <GlowOrb size={280} x={SCREEN_W * 0.5 - 140} y={-60} color="rgba(124,58,237,0.12)" delay={0} duration={3000} />
      <GlowOrb size={200} x={-60} y={200} color="rgba(168,85,247,0.08)" delay={400} duration={3500} />
      <GlowOrb size={160} x={SCREEN_W - 80} y={350} color="rgba(236,72,153,0.08)" delay={800} duration={4000} />
      <GlowOrb size={120} x={SCREEN_W * 0.3} y={500} color="rgba(6,182,212,0.06)" delay={1200} duration={3200} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoArea, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoS}>s</Text>
            <View style={styles.logoOContainer}>
              <Text style={styles.logoOoo}>oou</Text>
            </View>
            <Text style={styles.logoNd}>nd</Text>
          </View>
          <View style={styles.logoDot} />
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: taglineOpacity, alignItems: 'center' }}>
          <Text style={styles.tagline1}>Every phone becomes</Text>
          <Text style={styles.tagline2}>one giant speaker</Text>
        </Animated.View>

        {/* Live equalizer bars */}
        <Animated.View style={{ opacity: barsOpacity }}>
          <LiveBars />
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttons, { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslate }] }]}>
          {/* Create Room — primary */}
          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleCreateRoom}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.createBtnGlow} />
            <View style={styles.createBtnInner}>
              <View style={styles.createIconWrap}>
                <Text style={styles.createIcon}>+</Text>
              </View>
              <View>
                <Text style={styles.createBtnText}>
                  {loading ? 'Creating...' : 'Create Room'}
                </Text>
                <Text style={styles.createBtnSub}>Start a listening session</Text>
              </View>
            </View>
            <Text style={styles.createArrow}>{'>'}</Text>
          </TouchableOpacity>

          {/* Join Room — secondary glass */}
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => nav.navigate('JoinRoom')}
            activeOpacity={0.85}
          >
            <View style={styles.joinBtnInner}>
              <View style={styles.joinIconWrap}>
                <Text style={styles.joinIcon}>{'#'}</Text>
              </View>
              <View>
                <Text style={styles.joinBtnText}>Join Room</Text>
                <Text style={styles.joinBtnSub}>Enter a room code</Text>
              </View>
            </View>
            <Text style={styles.joinArrow}>{'>'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
          <View style={styles.liveBadge}>
            <View style={styles.liveGreenDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Sync music across devices instantly</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Logo
  logoArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoS: {
    fontSize: 56,
    ...fonts.black,
    color: colors.text,
    letterSpacing: -2,
  },
  logoOContainer: {},
  logoOoo: {
    fontSize: 56,
    ...fonts.black,
    color: colors.accent,
    letterSpacing: -2,
  },
  logoNd: {
    fontSize: 56,
    ...fonts.black,
    color: colors.text,
    letterSpacing: -2,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neonCyan,
    marginBottom: 14,
    marginLeft: 1,
    ...shadow(colors.neonCyan, 0, 0, 0.8, 6),
  },

  // Tagline
  tagline1: {
    fontSize: 17,
    color: colors.textSub,
    ...fonts.medium,
    lineHeight: 24,
  },
  tagline2: {
    fontSize: 17,
    color: colors.accentLight,
    ...fonts.bold,
    lineHeight: 24,
    marginBottom: 8,
  },

  // Buttons
  buttons: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
    marginBottom: 36,
  },

  // Create button
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.accent,
    overflow: 'hidden',
    ...shadow(colors.accent, 0, 6, 0.4, 20, 12),
  },
  createBtnGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  createBtnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  createIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createIcon: {
    color: '#fff',
    fontSize: 22,
    ...fonts.bold,
    marginTop: -1,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    ...fonts.bold,
  },
  createBtnSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    ...fonts.medium,
    marginTop: 1,
  },
  createArrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    ...fonts.bold,
  },

  // Join button
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  joinBtnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  joinIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinIcon: {
    color: colors.accentLight,
    fontSize: 18,
    ...fonts.bold,
  },
  joinBtnText: {
    color: colors.text,
    fontSize: 16,
    ...fonts.semibold,
  },
  joinBtnSub: {
    color: colors.textDim,
    fontSize: 12,
    ...fonts.medium,
    marginTop: 1,
  },
  joinArrow: {
    color: colors.textMuted,
    fontSize: 16,
    ...fonts.bold,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonGreen,
    ...shadow(colors.neonGreen, 0, 0, 0.8, 4),
  },
  liveText: {
    color: colors.neonGreen,
    fontSize: 11,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
  },
  footerText: {
    color: colors.textDim,
    fontSize: 11,
    ...fonts.medium,
  },
});
