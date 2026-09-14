import { StyleSheet, View } from "react-native";
import { speakMaybeCurrency } from "../../lib/currency";
import { spacing, useColors } from "../../theme";
import AppText from "./AppText";

type DetailRowProps = {
  label: string;
  value: string;
  last?: boolean;
  valueColor?: string;
  accessibilityLabel?: string;
};

export default function DetailRow({
  label,
  value,
  last = false,
  valueColor,
  accessibilityLabel,
}: DetailRowProps) {
  const colors = useColors();
  const spoken = accessibilityLabel ?? `${label}, ${speakMaybeCurrency(value)}`;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={spoken}
      style={[styles.row, last && styles.last]}
    >
      <AppText variant="bodySM" color={colors.textMuted} importantForAccessibility="no">
        {label}
      </AppText>
      <AppText
        variant="labelSM"
        color={valueColor ?? colors.text}
        style={styles.value}
        importantForAccessibility="no"
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  last: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  value: {
    textAlign: "right",
    flexShrink: 1,
    marginLeft: spacing.md,
  },
});
