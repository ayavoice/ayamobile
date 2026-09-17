import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText, Button, Card, DetailRow, Icon, Screen } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y, formatCurrencySpoken } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onDone: () => void; onReceipt: () => void };

export default function SuccessScreen({ onDone, onReceipt }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow, activeFlow, accessibility } = useAppPrefs();
  const [revealed, setRevealed] = useState(activeFlow !== "balance");
  const isBalance = activeFlow === "balance";
  const amountSpoken = flow.successAmount
    ? formatCurrencySpoken(flow.successAmount)
    : "";
  const amountLabel =
    isBalance && !revealed
      ? "Balance hidden"
      : amountSpoken
        ? `Amount, ${amountSpoken}`
        : undefined;

  return (
    <Screen>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.check} {...DECORATIVE_A11Y}>
          <Icon name="checkmark" size={28} color={colors.textOnYellow} />
        </View>

        <View style={styles.heroCopy}>
          <AppText
            variant="heading"
            align="center"
            heading={1}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {flow.successTitle}
          </AppText>
          {flow.successAmount ? (
            <AppText
              variant="displayLG"
              align="center"
              color={isBalance && !revealed ? colors.trackIdle : colors.text}
              style={styles.amount}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              accessibilityLabel={amountLabel}
              accessibilityLiveRegion="polite"
            >
              {isBalance && !revealed ? "••••••" : flow.successAmount}
            </AppText>
          ) : null}
          <AppText
            variant="bodySM"
            align="center"
            color={colors.textSecondary}
            numberOfLines={3}
          >
            {flow.successSubtitle}
          </AppText>
        </View>

        {isBalance ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            style={styles.reveal}
            accessibilityRole="button"
            role="button"
            accessibilityLabel={revealed ? "Hide balance" : "Reveal balance"}
            accessibilityState={{ expanded: revealed }}
            aria-expanded={revealed}
          >
            <View {...DECORATIVE_A11Y}>
              <Icon
                name={revealed ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.text}
              />
            </View>
            <AppText variant="labelXS" color={colors.text} importantForAccessibility="no">
              {revealed ? "Hide balance" : "Reveal balance"}
            </AppText>
          </Pressable>
        ) : null}

        {accessibility.voiceFirst && (!isBalance || revealed) ? (
          <View
            style={styles.aya}
            accessible
            accessibilityLabel={
              isBalance
                ? `Aya says: Your current balance is ${amountSpoken || flow.successAmount}`
                : `Aya says: ${flow.successTitle}`
            }
          >
            <View {...DECORATIVE_A11Y}>
              <Icon name="volume-high" size={18} color={colors.text} />
            </View>
            <AppText
              variant="caption"
              style={styles.textFlex}
              numberOfLines={2}
              importantForAccessibility="no"
            >
              {isBalance
                ? `Aya says: "Your current balance is ${flow.successAmount}"`
                : `Aya says: "${flow.successTitle}"`}
            </AppText>
          </View>
        ) : null}

        <Card style={styles.card} padded={false}>
          <View style={styles.cardInner}>
            {flow.successDetails.map((row, i) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={
                  isBalance && !revealed && row.label === "Available" ? "••••••" : row.value
                }
                last={i === flow.successDetails.length - 1}
              />
            ))}
          </View>
        </Card>

        <View style={styles.actions}>
          {flow.receiptAvailable ? (
            <Button onPress={onReceipt} accessibilityLabel="View Receipt">
              View Receipt
            </Button>
          ) : null}
          <Button onPress={onDone} variant={flow.receiptAvailable ? "ghost" : "primary"}>
            Done
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    flex: {
      flex: 1,
      minHeight: 0,
    },
    body: {
      flexGrow: 1,
      alignItems: "center" as const,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing["2xl"],
      paddingBottom: spacing["2xl"],
      gap: spacing.lg,
    },
    check: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.purple,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    heroCopy: {
      width: "100%" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
    },
    amount: {
      width: "100%" as const,
      letterSpacing: -1,
    },
    reveal: {
      paddingVertical: 10,
      paddingHorizontal: spacing.xl,
      borderRadius: radii.full,
      backgroundColor: colors.washPurple,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
    },
    aya: {
      width: "100%" as const,
      backgroundColor: colors.surfaceCard,
      borderRadius: radii.xl,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      flexDirection: "row" as const,
      gap: spacing.sm,
      alignItems: "center" as const,
    },
    textFlex: {
      flex: 1,
      minWidth: 0,
    },
    card: {
      width: "100%" as const,
    },
    cardInner: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    actions: {
      width: "100%" as const,
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
  };
}
