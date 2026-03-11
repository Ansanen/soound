import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Share, Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, radius, fonts, shadow } from '../theme';

interface InviteModalProps {
  visible: boolean;
  roomCode: string;
  onClose: () => void;
}

export default function InviteModal({ visible, roomCode, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const link = `soound.xyz/r/${roomCode}`;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Join my soound room: ${link}`, url: `https://${link}` });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
          <TouchableOpacity style={styles.modal} activeOpacity={1} onPress={e => e.stopPropagation()}>
            {/* Icon */}
            <View style={styles.iconWrap}>
              <View style={styles.iconRing1} />
              <View style={styles.iconCenter}>
                <Text style={styles.iconPlus}>+</Text>
              </View>
            </View>

            <Text style={styles.title}>Invite friends</Text>
            <Text style={styles.sub}>Share the link to listen together</Text>

            {/* Code */}
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>ROOM CODE</Text>
              <Text style={styles.codeValue}>{roomCode}</Text>
            </View>

            {/* Link */}
            <View style={styles.linkRow}>
              <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnDone]}
                onPress={handleCopy} activeOpacity={0.7}
              >
                <Text style={styles.copyText}>{copied ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>

            {/* Share */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.lg,
  },
  modal: {
    width: '100%', maxWidth: 380,
    backgroundColor: colors.surface, borderRadius: 28,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: 'center',
  },
  iconWrap: {
    width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  iconRing1: {
    position: 'absolute', width: 60, height: 60, borderRadius: 20,
    borderWidth: 1, borderColor: colors.borderAccent,
    backgroundColor: colors.accentMuted,
  },
  iconCenter: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  iconPlus: { color: colors.accent, fontSize: 20, ...fonts.bold },
  title: { fontSize: 20, ...fonts.bold, color: colors.text, marginBottom: 4 },
  sub: {
    fontSize: 13, color: colors.textSub, marginBottom: spacing.xl, textAlign: 'center',
  },
  codeCard: {
    alignItems: 'center', marginBottom: spacing.md,
    padding: spacing.md, borderRadius: 16,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    width: '100%',
  },
  codeLabel: { fontSize: 9, ...fonts.bold, color: colors.textMuted, letterSpacing: 2, marginBottom: 4 },
  codeValue: {
    fontSize: 36, ...fonts.black, color: colors.accent, letterSpacing: 8,
    ...shadow(colors.accent, 0, 0, 0.3, 10),
  },
  linkRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 12, width: '100%',
    marginBottom: spacing.md, gap: 10,
  },
  linkText: { flex: 1, color: colors.textSub, fontSize: 13, ...fonts.medium },
  copyBtn: {
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 10, backgroundColor: colors.accent,
  },
  copyBtnDone: { backgroundColor: colors.green },
  copyText: { color: '#fff', fontSize: 12, ...fonts.bold },
  shareBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 14,
    borderWidth: 1, borderColor: colors.glassBorder,
    backgroundColor: colors.glass, alignItems: 'center',
    marginBottom: 8,
  },
  shareText: { color: colors.text, fontSize: 15, ...fonts.semibold },
  closeBtn: { paddingVertical: 10 },
  closeText: { color: colors.textDim, fontSize: 13, ...fonts.medium },
});
