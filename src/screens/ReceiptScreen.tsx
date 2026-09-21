import { Pressable, View } from "react-native";
import { AppText, Icon, Screen, ScreenHeader } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y, formatCurrency, formatCurrencySpoken, speakMaybeCurrency } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onBack: () => void };

export default function ReceiptScreen({ onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow } = useAppPrefs();
  const amount = formatCurrency(flow.successAmount ?? "0.00");
  const amountSpoken = formatCurrencySpoken(flow.successAmount ?? "0.00");
  const rows = flow.successDetails.length
    ? flow.successDetails
    : [
        { label: "Recipient", value: "Unknown recipient" },
        { label: "Number", value: "Unknown number" },
        { label: "Reference", value: "AYA-2609-7K8X" },
        { label: "Date & time", value: "Today, 3:02 PM" },
        { label: "Status", value: "Completed" },
      ];

  const rowsSpoken = rows
    .map((row) => `${row.label}, ${speakMaybeCurrency(row.value)}`)
    .join(". ");
  const receiptLabel = `Amount sent, ${amountSpoken}. ${flow.successTitle}. ${rowsSpoken}`;

  return (
    <Screen scroll>
      <ScreenHeader title="Receipt" onBack={onBack} />
      <View style={styles.body}>
        <View style={styles.card}>
          <View accessible accessibilityLabel={receiptLabel}>
            <View style={styles.hero} importantForAccessibility="no">
              <AppText
                variant="caption"
                color={colors.textInverseMuted}
                align="center"
                importantForAccessibility="no"
              >
                Amount sent
              </AppText>
              <AppText
                variant="displayLG"
                color={colors.textOnYellow}
                align="center"
                style={styles.amount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.55}
                importantForAccessibility="no"
              >
                {amount}
              </AppText>
              <AppText
                variant="bodySM"
                color={colors.textInverseMuted}
                align="center"
                numberOfLines={2}
                importantForAccessibility="no"
              >
                {flow.successTitle}
              </AppText>
            </View>
            <View style={styles.rows} importantForAccessibility="no">
              {rows.map((row, i) => (
                <View
                  key={row.label}
                  style={[styles.row, i === rows.length - 1 && styles.rowLast]}
                >
                  <AppText variant="bodySM" color={colors.textMuted} style={styles.rowLabel}>
                    {row.label}
                  </AppText>
                  <AppText variant="labelSM" style={styles.rowValue} numberOfLines={1}>
                    {row.value}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable
              style={styles.ghost}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Read receipt aloud"
            >
              <View {...DECORATIVE_A11Y}>
                <Icon name="volume-high" size={18} color={colors.text} />
              </View>
              <AppText variant="labelSM" importantForAccessibility="no">
                Read aloud
              </AppText>
            </Pressable>
            <Pressable
              style={styles.primary}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Share receipt"
            >
              <View {...DECORATIVE_A11Y}>
                <Icon name="share-outline" size={18} color={colors.textOnYellow} />
              </View>
              <AppText variant="labelSM" color={colors.textOnYellow} importantForAccessibility="no">
                Share
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    body: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing["2xl"],
    },
    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: radii["3xl"],
      overflow: "hidden" as const,
    },
    hero: {
      backgroundColor: colors.purple,
      paddingVertical: spacing["2xl"],
      paddingHorizontal: spacing.xl,
      gap: 4,
    },
    amount: {
      width: "100%" as const,
      letterSpacing: -1,
    },
    rows: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
    },
    row: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      minHeight: 44,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowLabel: {
      flexShrink: 0,
    },
    rowValue: {
      flexShrink: 1,
      textAlign: "right" as const,
      maxWidth: "62%" as const,
    },
    actions: {
      flexDirection: "row" as const,
      gap: 10,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      paddingTop: spacing.sm,
    },
    ghost: {
      flex: 1,
      height: 48,
      borderRadius: radii.xl,
      backgroundColor: colors.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      flexDirection: "row" as const,
      gap: 8,
    },
    primary: {
      flex: 1,
      height: 48,
      borderRadius: radii.xl,
      backgroundColor: colors.purple,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      flexDirection: "row" as const,
      gap: 8,
    },
  };
}
