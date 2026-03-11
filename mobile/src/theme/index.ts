import { Platform } from 'react-native';

export const colors = {
  // Backgrounds — deep space vibes
  bg: '#050508',
  surface: '#0a0a12',
  card: '#0f0f1a',
  cardHover: '#161625',
  cardElevated: '#1a1a2e',

  // Primary accent — electric indigo
  accent: '#7c3aed',
  accentLight: '#a78bfa',
  accentSoft: 'rgba(124, 58, 237, 0.15)',
  accentGlow: 'rgba(124, 58, 237, 0.35)',
  accentMuted: 'rgba(124, 58, 237, 0.08)',

  // Secondary palette
  purple: '#a855f7',
  pink: '#ec4899',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
  yellow: '#fbbf24',
  orange: '#f97316',
  lime: '#84cc16',

  // Neon versions for glow effects
  neonPurple: '#c084fc',
  neonPink: '#f472b6',
  neonCyan: '#22d3ee',
  neonGreen: '#34d399',

  // Text hierarchy
  text: '#f5f5fa',
  textSub: '#b0b0c8',
  textDim: '#6b6b85',
  textMuted: '#404058',

  // Borders
  border: 'rgba(255,255,255,0.05)',
  borderLight: 'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(124,58,237,0.3)',
  borderGlow: 'rgba(124,58,237,0.5)',

  // Glass effects
  glass: 'rgba(255,255,255,0.03)',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHover: 'rgba(255,255,255,0.06)',

  // Gradients
  gradient1: '#7c3aed',
  gradient2: '#a855f7',
  gradient3: '#ec4899',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 100,
};

export const fonts = {
  regular: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
  bold: { fontWeight: '700' as const },
  heavy: { fontWeight: '800' as const },
  black: { fontWeight: '900' as const },
};

export function shadow(color: string, offsetX: number, offsetY: number, opacity: number, radius: number, elevation?: number): any {
  if (Platform.OS === 'web') {
    // For web, construct boxShadow string
    // Parse hex color to rgb for proper opacity application
    let r = 0, g = 0, b = 0;
    if (color.startsWith('#')) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }
    return { boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(${r},${g},${b},${opacity})` };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    ...(elevation != null ? { elevation } : {}),
  };
}
