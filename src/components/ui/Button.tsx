import {
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from "react-native";
import AppText from "./AppText";
import { radii, spacing, useColors } from "../../theme";
import type { Palette } from "../../theme";

export type ButtonVariant = "primary" | "purple" | "outline" | "ghost" | "danger";

type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

function variantFill(variant: ButtonVariant, colors: Palette) {
  switch (variant) {
    case "primary":
    case "purple":
      return colors.purple;
    case "danger":
      return colors.dangerSurface;
    default:
      return colors.surfaceGhost;
  }
}

function variantLabel(variant: ButtonVariant, colors: Palette) {
  if (variant === "primary" || variant === "purple") return colors.textOnYellow;
  if (variant === "danger") return colors.danger;
  return colors.text;
}

export default function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const resolvedLabel =
    accessibilityLabel ??
    (typeof children === "string"
      ? loading
        ? `Loading, ${children}`
        : children
      : loading
        ? "Loading"
        : undefined);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      role="button"
      hitSlop={4}
      accessibilityLabel={resolvedLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      aria-disabled={isDisabled}
      aria-busy={loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: variantFill(variant, colors) },
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantLabel(variant, colors)}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : typeof children === "string" ? (
        <AppText
          variant="button"
          color={variantLabel(variant, colors)}
          style={styles.label}
          importantForAccessibility="no"
        >
          {children}
        </AppText>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "stretch",
    minHeight: 56,
    borderRadius: radii["2xl"],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    flexShrink: 0,
  },
  label: {
    textAlign: "center",
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});
