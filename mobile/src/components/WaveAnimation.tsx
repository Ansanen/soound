import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface WaveAnimationProps {
  isPlaying: boolean;
  barCount?: number;
  barColor?: string;
}

export default function WaveAnimation({
  isPlaying,
  barCount = 7,
  barColor = colors.accent,
}: WaveAnimationProps) {
  const animations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      const anims = animations.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.3 + Math.random() * 0.7,
              duration: 300 + Math.random() * 400,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.2 + Math.random() * 0.3,
              duration: 300 + Math.random() * 400,
              useNativeDriver: true,
            }),
          ])
        )
      );
      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    } else {
      animations.forEach(anim => {
        Animated.timing(anim, {
          toValue: 0.15,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isPlaying]);

  const barColors = [colors.accent, colors.purple, colors.accent, colors.pink, colors.accent, colors.purple, colors.accent];

  return (
    <View style={styles.container}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: barColors[i % barColors.length],
              transform: [{ scaleY: anim }],
              height: 80,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 80,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
});
