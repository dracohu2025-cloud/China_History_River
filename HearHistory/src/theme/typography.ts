// 听见历史 - 字体排版

import { Platform, TextStyle } from 'react-native';

// 系统字体
const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

// 中文衬线字体 (iOS)
const serifFontFamily = Platform.select({
  ios: 'STSongti-SC-Regular',
  android: 'serif',
  default: 'serif',
});

// 字体大小
export const fontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// 行高
export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

// 字重
export const fontWeight: Record<string, TextStyle['fontWeight']> = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// 预设文本样式
export const typography = {
  // 标题
  h1: {
    fontFamily,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['4xl'] * lineHeight.tight,
  } as TextStyle,

  h2: {
    fontFamily,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
  } as TextStyle,

  h3: {
    fontFamily,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  } as TextStyle,

  h4: {
    fontFamily,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.normal,
  } as TextStyle,

  // 正文
  body: {
    fontFamily,
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.base * lineHeight.relaxed,
  } as TextStyle,

  bodyLarge: {
    fontFamily,
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.md * lineHeight.relaxed,
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.sm * lineHeight.normal,
  } as TextStyle,

  // 文稿/阅读
  transcript: {
    fontFamily: serifFontFamily,
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.md * lineHeight.loose,
  } as TextStyle,

  // 标签/辅助
  caption: {
    fontFamily,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.xs * lineHeight.normal,
  } as TextStyle,

  label: {
    fontFamily,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
  } as TextStyle,

  // 按钮
  button: {
    fontFamily,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.base * lineHeight.normal,
  } as TextStyle,

  buttonSmall: {
    fontFamily,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.sm * lineHeight.normal,
  } as TextStyle,

  // FM 收音机风格 - 频率数字
  radioFrequency: {
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
  } as TextStyle,

  // FM 收音机风格 - 刻度标签
  radioDial: {
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  } as TextStyle,
};
