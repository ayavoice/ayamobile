import { useState } from "react";
import {
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from "react-native";
import AppText from "./AppText";
import { fonts, radii, spacing, useColors, usePaletteStyles, type Palette } from "../../theme";

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  prefix?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoFocus?: boolean;
  maxLength?: number;
  helper?: string;
  error?: string;
  onBlur?: () => void;
  accessibilityLabel?: string;
};

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  prefix,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoFocus,
  maxLength,
  helper,
  error,
  onBlur,
  accessibilityLabel,
}: TextFieldProps) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [focused, setFocused] = useState(false);

  const a11yLabel = [
    accessibilityLabel ?? label,
    prefix ? `country code ${prefix.split("").join(" ")}` : null,
    error ? `Error: ${error}` : helper ?? null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <View style={styles.wrap}>
      <AppText variant="labelSM" style={styles.label} importantForAccessibility="no">
        {label}
      </AppText>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error && styles.fieldError,
        ]}
      >
        {prefix ? (
          <AppText
            variant="body"
            color={colors.textSecondary}
            style={styles.prefix}
            importantForAccessibility="no"
          >
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          style={styles.input}
          accessibilityLabel={a11yLabel}
          accessibilityHint={error ? "Correct the field and try again" : undefined}
        />
      </View>
      {error ? (
        <AppText
          variant="caption"
          color={colors.danger}
          style={styles.helper}
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" style={styles.helper}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

function createStyles(colors: Palette) {
  return {
    wrap: {
      gap: spacing.sm,
    },
    label: {
      marginLeft: spacing.xs,
    },
    field: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: colors.surfaceCard,
      borderRadius: radii.xl,
      borderWidth: 2,
      borderColor: "transparent",
      paddingHorizontal: spacing.lg,
      minHeight: 56,
      gap: spacing.sm,
    },
    fieldFocused: {
      borderColor: colors.purple,
    },
    fieldError: {
      borderColor: colors.danger,
    },
    prefix: {
      flexShrink: 0,
    },
    input: {
      flex: 1,
      fontFamily: fonts.body.regular,
      fontSize: 17,
      color: colors.text,
      paddingVertical: 0,
      borderWidth: 0,
      // react-native's TextStyle type omits "none", but web (react-native-web)
      // supports it and this is the only way to drop the native focus ring.
      ...({ outlineStyle: "none", outlineWidth: 0 } as object),
    },
    helper: {
      marginLeft: spacing.xs,
    },
  };
}
