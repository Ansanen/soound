import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Share, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, radius, fonts } from '../theme';

interface InviteModalProps {
  visible: boolean;
  roomCode: string;
  onClose: () => void;
}

export default function InviteModal({ visible, roomCode, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const link = `soound.xyz/r/${roomCode}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my soound room: ${link}`,
        url: `https://${link}`,
      });
    } catch (e) {
      // user cancelled
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modal}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          <Text style={styles.title}>Invite friends</Text>
          <Text style={styles.sub}>Share this link and start listening together</Text>

          <View style={styles.linkBox}>
            <Text style={styles.linkText}>{link}</Text>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              onPress={handleCopy}
            >
              <Text style={styles.copyBtnText}>
                {copied ? 'Copied!' : 'Copy link'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    ...fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: colors.textDim,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    width: '100%',
    marginBottom: spacing.md,
    gap: 12,
  },
  linkText: {
    flex: 1,
    color: colors.accent,
    fontSize: 14,
    ...fonts.medium,
  },
  copyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  copyBtnDone: {
    backgroundColor: colors.green,
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 13,
    ...fonts.semibold,
  },
  shareBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  shareBtnText: {
    color: colors.text,
    fontSize: 15,
    ...fonts.semibold,
  },
});
