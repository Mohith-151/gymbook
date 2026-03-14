export type Theme = typeof darkTheme;

export const darkTheme = {
  bg: '#0d0d0d',
  surface: '#161616',
  surface2: '#1e1e1e',
  border: '#262626',

  green0: '#051a0a',
  green1: '#0e4429',
  green2: '#006d32',
  green3: '#26a641',
  green4: '#39d353',

  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  textMuted: '#484f58',
  textDim: '#2d333b',
} as const;

export const lightTheme = {
  bg: '#ffffff',
  surface: '#f6f8fa',
  surface2: '#ebedf0',
  border: '#d0d7de',

  green0: '#dafbe1',
  green1: '#9be9a8',
  green2: '#40c463',
  green3: '#30a14e',
  green4: '#216e39',

  textPrimary: '#1f2328',
  textSecondary: '#636c76',
  textMuted: '#9198a1',
  textDim: '#d0d7de',
} as const;

export const FONTS = {
  display: 'Georgia' as const,
  mono: 'Courier New' as const,
};
