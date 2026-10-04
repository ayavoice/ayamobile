import { ReactNode } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, useColors } from "../../theme";
import { lightColors } from "../../theme/colors";
import { useAppPrefsOptional } from "../../context/AppPrefs";

type ScreenProps = {
  children: ReactNode;
  background?: string;
  scroll?: boolean;
  padded?: boolean;
  safeBottom?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function Screen({
  children,
  background,
  scroll = false,
  padded = false,
  safeBottom = true,
  style,
  contentStyle,
}: ScreenProps) {
  const colors = useColors();
  const prefs = useAppPrefsOptional();
  const highContrast = prefs?.highContrast ?? false;

  const pageBg =
    !background ||
    background === lightColors.white ||
    background === lightColors.background
      ? colors.background
      : background === lightColors.backgroundMuted
        ? colors.backgroundMuted
        : background;

  const resolvedBg = highContrast ? colors.background : pageBg;

  const padStyle = padded ? { paddingHorizontal: spacing.screenX } : undefined;

  const insets = useSafeAreaInsets();
  const safePad =
    Platform.OS === "web"
      ? undefined
      : {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: safeBottom ? insets.bottom : 0,
        };

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, padStyle, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padStyle, contentStyle]}>{children}</View>
  );

  return (
    <View
      style={[styles.root, { backgroundColor: resolvedBg }, safePad, style]}
      role="main"
      nativeID="main-content"
      // Web skip-link target; RNW maps `id` onto the DOM node.
      {...(Platform.OS === "web" ? ({ id: "main-content", tabIndex: -1 } as object) : null)}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "web" ? undefined : "padding"}
      >
        {body}
      </KeyboardAvoidingView>
    </View>
  );
}

export function ScreenFooter({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  flex: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
    flexShrink: 0,
  },
});
