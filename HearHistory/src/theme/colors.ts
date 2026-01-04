// 听见历史 - 颜色主题

export const colors = {
  // 品牌主色
  primary: '#DC143C', // 中国红
  primaryDark: '#8B0000',
  primaryLight: '#FF6B6B',

  // 朝代代表色
  dynasty: {
    xia: '#8B4513',
    shang: '#CD853F',
    zhou: '#DAA520',
    qin: '#2F4F4F',
    han: '#DC143C',
    jin: '#9370DB',
    sui: '#4682B4',
    tang: '#FFD700',
    song: '#87CEEB',
    yuan: '#228B22',
    ming: '#FF4500',
    qing: '#4169E1',
    modern: '#FF0000',
  },

  // FM 收音机风格
  radio: {
    dial: '#2C2C2C',
    dialText: '#FFD700',
    tuner: '#FF6B35',
    speaker: '#1A1A1A',
    speakerGrill: '#333333',
    indicator: '#00FF00',
    wood: '#8B4513',
    chrome: '#C0C0C0',
  },

  // 语义色
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // 灰度
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // 背景色
  background: {
    light: '#FAFAFA',
    dark: '#0A0A0A',
  },

  // 文字色
  text: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#A3A3A3',
    inverse: '#FFFFFF',
  },

  // 深色模式文字色
  textDark: {
    primary: '#FAFAFA',
    secondary: '#A3A3A3',
    tertiary: '#525252',
    inverse: '#171717',
  },
};

// 浅色主题
export const lightTheme = {
  colors: {
    ...colors,
    background: colors.background.light,
    surface: colors.white,
    surfaceVariant: colors.gray[100],
    text: colors.text,
    border: colors.gray[200],
    divider: colors.gray[100],
  },
};

// 深色主题
export const darkTheme = {
  colors: {
    ...colors,
    background: colors.background.dark,
    surface: colors.gray[900],
    surfaceVariant: colors.gray[800],
    text: colors.textDark,
    border: colors.gray[700],
    divider: colors.gray[800],
  },
};

export type Theme = typeof lightTheme;
