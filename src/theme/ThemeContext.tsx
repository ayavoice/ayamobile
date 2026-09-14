import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { darkColors, lightColors, type Palette } from "./colors";

export type ColorSchemeName = "light" | "dark";

type ThemeValue = {
  scheme: ColorSchemeName;
  isDark: boolean;
  colors: Palette;
  logo: ImageSourcePropType;
};

const lightLogo = require("../../assets/brand/logo.png");
const darkLogo = require("../../assets/brand/logo1.png");

const ThemeContext = createContext<ThemeValue>({
  scheme: "light",
  isDark: false,
  colors: lightColors,
  logo: lightLogo,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const isDark = system === "dark";

  const value = useMemo<ThemeValue>(
    () => ({
      scheme: isDark ? "dark" : "light",
      isDark,
      colors: isDark ? darkColors : lightColors,
      logo: isDark ? darkLogo : lightLogo,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}
