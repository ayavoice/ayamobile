import { Pressable, View } from "react-native";
import {
  AppText,
  Avatar,
  Button,
  Icon,
  Screen,
  ScreenFooter,
  ScreenHeader,
} from "../components/ui";
import { brandImages } from "../content/brand";
import { useAppPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y, formatCurrency, formatCurrencySpoken } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onHome: () => void; onTransferMore: () => void; onBack: () => void };

export default function TransferReceiptScreen({ onHome, onTransferMore, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow } = useAppPrefs();

  const name = flow.details.find((d) => d.label === "To")?.value ?? "Ricky Martin";
  const number = flow.details.find((d) => d.label === "Number")?.value ?? "Ac no. 8050530XXX";
  const amount = formatCurrency(flow.successAmount ?? "580.00");
  const amountSpoken = formatCurrencySpoken(flow.successAmount ?? "580.00");
  const reference =
    flow.successDetails.find((d) => d.label === "Reference")?.value ?? "AYA-2609-7K8X";
  const when =
    flow.successDetails.find((d) => d.label === "Date & time")?.value ?? "Today, 3:02 PM";

  const details = [
    { label: "To", value: name },
    { label: "Account", value: number },
    { label: "Reference", value: reference },
    { label: "Date", value: when },
  ];

  return (
    <Screen>
      <ScreenHeader title="Receipt" onBack={onBack} />

      <View style={styles.body}>
        <View style={styles.hero}>
          <View style={styles.check} {...DECORATIVE_A11Y}>
            <Icon name="checkmark" size={28} color={colors.white} />
          </View>

          <AppText variant="labelSM" color={colors.success} align="center" style={styles.status}>
            Sent
          </AppText>

          <View
            accessible
            accessibilityLabel={`Amount sent, ${amountSpoken}`}
            style={styles.amountBlock}
          >
            <AppText
              variant="displayLG"
              align="center"
              color={colors.text}
              style={styles.amount}
              importantForAccessibility="no"
            >
              {amount}
            </AppText>
          </View>

          <View
            style={styles.recipient}
            accessible
            accessibilityLabel={`Sent to ${name}`}
          >
            <Avatar source={brandImages.ricky} size={36} />
            <AppText variant="bodySM" color={colors.textSecondary} importantForAccessibility="no">
              to {name}
            </AppText>
          </View>
        </View>

        <View
          style={styles.details}
          accessible
          accessibilityLabel={details.map((d) => `${d.label}, ${d.value}`).join(". ")}
        >
          {details.map((row, i) => (
            <View
              key={row.label}
              style={[styles.row, i === details.length - 1 && styles.rowLast]}
              importantForAccessibility="no"
            >
              <AppText variant="bodySM" color={colors.textMuted}>
                {row.label}
              </AppText>
              <AppText variant="labelSM" style={styles.rowValue}>
                {row.value}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <ScreenFooter>
        <Button onPress={onHome} variant="purple" accessibilityLabel="Done, back to home">
          Done
        </Button>
        <Pressable
          onPress={onTransferMore}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Transfer again"
          accessibilityHint="Starts another transfer"
          style={styles.secondary}
        >
          <AppText variant="labelSM" color={colors.textMuted} importantForAccessibility="no">
            Transfer again
          </AppText>
        </Pressable>
      </ScreenFooter>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    body: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      gap: spacing["3xl"],
    },
    hero: {
      alignItems: "center" as const,
      gap: spacing.sm,
      paddingTop: spacing.md,
    },
    check: {
      width: 56,
      height: 56,
      borderRadius: radii.full,
      backgroundColor: colors.success,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: spacing.sm,
    },
    status: {
      letterSpacing: 0.4,
      textTransform: "uppercase" as const,
    },
    amountBlock: {
      width: "100%" as const,
    },
    amount: {
      letterSpacing: -1.2,
      fontWeight: "800" as const,
    },
    recipient: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    details: {
      backgroundColor: colors.surfaceCard,
      borderRadius: radii["2xl"],
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
    },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: spacing.md,
      minHeight: 48,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowValue: {
      flexShrink: 1,
      textAlign: "right" as const,
    },
    secondary: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      minHeight: 44,
    },
  };
}
