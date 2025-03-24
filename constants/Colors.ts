/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { MD3LightTheme } from "react-native-paper";

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';


export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    primary: "rgb(121, 89, 0)",
    onPrimary: "rgb(255, 255, 255)",
    primaryContainer: "rgb(255, 223, 160)",
    onPrimaryContainer: "rgb(38, 26, 0)",
    secondary: "rgb(135, 82, 0)",
    onSecondary: "rgb(255, 255, 255)",
    secondaryContainer: "rgb(255, 221, 186)",
    onSecondaryContainer: "rgb(43, 23, 0)",
    tertiary: "rgb(150, 73, 0)",
    onTertiary: "rgb(255, 255, 255)",
    tertiaryContainer: "rgb(255, 220, 198)",
    onTertiaryContainer: "rgb(49, 19, 0)",
    error: "rgb(186, 26, 26)",
    onError: "rgb(255, 255, 255)",
    errorContainer: "rgb(255, 218, 214)",
    onErrorContainer: "rgb(65, 0, 2)",
    background: "rgb(255, 251, 255)",
    onBackground: "rgb(30, 27, 22)",
    surface: "rgb(255, 251, 255)",
    onSurface: "rgb(30, 27, 22)",
    surfaceVariant: "rgb(237, 225, 207)",
    onSurfaceVariant: "rgb(77, 70, 57)",
    outline: "rgb(127, 118, 103)",
    outlineVariant: "rgb(208, 197, 180)",
    shadow: "rgb(0, 0, 0)",
    scrim: "rgb(0, 0, 0)",
    inverseSurface: "rgb(52, 48, 42)",
    inverseOnSurface: "rgb(248, 239, 231)",
    inversePrimary: "rgb(248, 189, 42)",
    elevation: {
      level0: "transparent",
      level1: "rgb(248, 243, 242)",
      level2: "rgb(244, 238, 235)",
      level3: "rgb(240, 233, 227)",
      level4: "rgb(239, 232, 224)",
      level5: "rgb(236, 228, 219)",
    },
    surfaceDisabled: "rgba(30, 27, 22, 0.12)",
    onSurfaceDisabled: "rgba(30, 27, 22, 0.38)",
    backdrop: "rgba(54, 48, 36, 0.4)",
  },
};

export const darkTheme = {
  ...MD3LightTheme,
  colors: {
    primary: "rgb(248, 189, 42)",
    onPrimary: "rgb(64, 45, 0)",
    primaryContainer: "rgb(92, 67, 0)",
    onPrimaryContainer: "rgb(255, 223, 160)",
    secondary: "rgb(255, 184, 101)",
    onSecondary: "rgb(72, 42, 0)",
    secondaryContainer: "rgb(102, 61, 0)",
    onSecondaryContainer: "rgb(255, 221, 186)",
    tertiary: "rgb(255, 183, 134)",
    onTertiary: "rgb(80, 36, 0)",
    tertiaryContainer: "rgb(114, 54, 0)",
    onTertiaryContainer: "rgb(255, 220, 198)",
    error: "rgb(255, 180, 171)",
    onError: "rgb(105, 0, 5)",
    errorContainer: "rgb(147, 0, 10)",
    onErrorContainer: "rgb(255, 180, 171)",
    background: "rgb(30, 27, 22)",
    onBackground: "rgb(233, 225, 216)",
    surface: "rgb(30, 27, 22)",
    onSurface: "rgb(233, 225, 216)",
    surfaceVariant: "rgb(77, 70, 57)",
    onSurfaceVariant: "rgb(208, 197, 180)",
    outline: "rgb(153, 143, 128)",
    outlineVariant: "rgb(77, 70, 57)",
    shadow: "rgb(0, 0, 0)",
    scrim: "rgb(0, 0, 0)",
    inverseSurface: "rgb(233, 225, 216)",
    inverseOnSurface: "rgb(52, 48, 42)",
    inversePrimary: "rgb(121, 89, 0)",
    elevation: {
      level0: "transparent",
      level1: "rgb(41, 35, 23)",
      level2: "rgb(47, 40, 24)",
      level3: "rgb(54, 45, 24)",
      level4: "rgb(56, 46, 24)",
      level5: "rgb(61, 50, 25)",
    },
    surfaceDisabled: "rgba(233, 225, 216, 0.12)",
    onSurfaceDisabled: "rgba(233, 225, 216, 0.38)",
    backdrop: "rgba(54, 48, 36, 0.4)",
  },
};

export const Colors = {
  light: {
    text: '#11181C',
    // background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    ...lightTheme.colors,
  },
  dark: {
    text: '#ECEDEE',
    // background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    ...darkTheme.colors,
  },
};


