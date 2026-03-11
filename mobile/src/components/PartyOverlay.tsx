import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface PartyOverlayProps {
  active: boolean;
}

export default function PartyOverlay({ active }: PartyOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(colorAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
          Animated.timing(colorAnim, { toValue: 2, duration: 2000, useNativeDriver: false }),
          Animated.timing(colorAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    }
  }, [active]);

  const bgColor = colorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      'rgba(124, 58, 237, 0.05)',
      'rgba(168, 85, 247, 0.05)',
      'rgba(236, 72, 153, 0.05)',
    ],
  });
  const borderColor = colorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      'rgba(124, 58, 237, 0.2)',
      'rgba(168, 85, 247, 0.2)',
      'rgba(236, 72, 153, 0.2)',
    ],
  });

  return (
    <Animated.View
      style={[styles.overlay, { opacity, backgroundColor: bgColor, borderColor, pointerEvents: 'none' as const }]}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2, borderRadius: 0, zIndex: 50,
  },
});
