import { ACCENT, GHOST, SURFACE } from '@isometric-design/core';

export type ThemeName = 'surface' | 'accent' | 'ghost';

export interface ResolvedTheme {
  top: string;
  left: string;
  right: string;
  stroke: string;
  strokeWidth: number;
  dasharray?: string;
}

const THEME_MAP: Record<ThemeName, ResolvedTheme> = {
  surface: { ...SURFACE },
  accent: { ...ACCENT },
  ghost: { ...GHOST, dasharray: '4 4' },
};

export function resolveTheme(theme: ThemeName = 'surface'): ResolvedTheme {
  return THEME_MAP[theme];
}
