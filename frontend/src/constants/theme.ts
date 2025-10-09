import { MD3LightTheme as DefaultTheme, MD3Colors } from "react-native-paper";

// Custom color palette for Hobbyverse
export const colors = {
  primary: "#1DA1F2",
  primaryContainer: "#EADDFF",
  secondary: "#03DAC6",
  secondaryContainer: "#B2F5EA",
  tertiary: "#FF6B6B",
  tertiaryContainer: "#FFE5E5",
  surface: "#FFFFFF",
  surfaceVariant: "#F5F5F5",
  background: "#FAFAFA",
  error: "#B00020",
  errorContainer: "#F9DEDC",
  onPrimary: "#FFFFFF",
  onPrimaryContainer: "#21005D",
  onSecondary: "#000000",
  onSecondaryContainer: "#002114",
  onTertiary: "#FFFFFF",
  onTertiaryContainer: "#370001",
  onSurface: "#1C1B1F",
  onSurfaceVariant: "#49454F",
  onBackground: "#1C1B1F",
  onError: "#FFFFFF",
  onErrorContainer: "#410E0B",
  outline: "#79747E",
  outlineVariant: "#CAC4D0",
  shadow: "#000000",
  scrim: "#000000",
  inverseSurface: "#313033",
  inverseOnSurface: "#F4EFF4",
  inversePrimary: "#D0BCFF",
  // Custom colors
  success: "#4CAF50",
  warning: "#FF9800",
  info: "#2196F3",
  badge: "#FF4444",
  cardBackground: "#FFFFFF",
  divider: "#E0E0E0",
  placeholder: "#9E9E9E",
  // Custom like color
  like: "#E12349",
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...colors,
  },
  roundness: 8,
};

// Typography
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: "bold" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: "bold" as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: "bold" as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  body1: {
    fontSize: 16,
    fontWeight: "normal" as const,
    lineHeight: 22,
  },
  body2: {
    fontSize: 14,
    fontWeight: "normal" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "normal" as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.25,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Shadows
export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
