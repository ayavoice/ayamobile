import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  AppText,
  Button,
  Icon,
  Screen,
  ScreenFooter,
  ScreenHeader,
} from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y, formatCurrency, formatCurrencySpoken } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onBack: () => void };

export default function BalanceScreen({ onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow, accessibility } = useAppPrefs();
  const [revealed, setRevealed] = useState(false);

  const amount = flow.successAmount ?? formatCurrency(2648.34);
  const amountSpoken = formatCurrencySpoken(amount);
  const wallet =
    flow.successDetails.find((d) => d.label === "Wallet")?.value ?? "MTN MoMo";
  const reference =
    flow.successDetails.find((d) => d.label === "Reference")?.value ?? "—";

  return (
    <Screen>
      <ScreenHeader title="Balance" onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.iconRing} {...DECORATIVE_A11Y}>
            <Icon name="wallet" size={28} color={colors.purple} />
          </View>

          <AppText
            variant="caption"
            color={colors.textMuted}
            align="center"
            style={styles.intent}
            importantForAccessibility="no"
          >
            {wallet}
          </AppText>

          <View
            accessible
            accessibilityLabel={`Your balance, ${revealed ? amountSpoken : "hidden"}`}
            accessibilityLiveRegion="polite"
            style={styles.amountBlock}
          >
            <AppText
              variant="displayLG"
              align="center"
              color={revealed ? colors.text : colors.trackIdle}
              style={styles.amount}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              importantForAccessibility="no"
            >
              {revealed ? amount : "••••••"}
            </AppText>
          </View>

          <AppText
            variant="bodySM"
            align="center"
            color={colors.textSecondary}
            numberOfLines={2}
          >
            {flow.successSubtitle}
          </AppText>

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
        </View>

        {accessibility.voiceFirst && revealed ? (
          <View
            style={styles.aya}
            accessible
            accessibilityLabel={`Aya says: Your current balance is ${amountSpoken}`}
          >
            <View {...DECORATIVE_A11Y}>
              <Icon name="volume-high" size={18} color={colors.purple} />
            </View>
            <AppText
              variant="bodySM"
              color={colors.text}
              style={styles.ayaText}
              importantForAccessibility="no"
            >
              {`Your current balance is ${amount}`}
            </AppText>
          </View>
        ) : null}

        <View
          style={styles.details}
          accessible
          accessibilityLabel={`Wallet, ${wallet}. Reference, ${reference}`}
        >
          <View style={[styles.row, styles.rowBorder]} importantForAccessibility="no">
            <AppText variant="bodySM" color={colors.textMuted}>
              Wallet
            </AppText>
            <AppText variant="labelSM" style={styles.rowValue} numberOfLines={1}>
              {wallet}
            </AppText>
          </View>
          <View style={styles.row} importantForAccessibility="no">
            <AppText variant="bodySM" color={colors.textMuted}>
              Reference
            </AppText>
            <AppText variant="labelSM" style={styles.rowValue} numberOfLines={1}>
              {reference}
            </AppText>
          </View>
        </View>

        <View
          style={styles.askChip}
          accessible
          accessibilityLabel={`You asked, ${flow.utterance.languageLabel}. ${flow.utterance.gloss}`}
        >
          <View {...DECORATIVE_A11Y}>
            <Icon name="mic" size={16} color={colors.purple} />
          </View>
          <AppText
            variant="caption"
            color={colors.textSecondary}
            style={styles.askText}
            numberOfLines={2}
            importantForAccessibility="no"
          >
            {flow.utterance.gloss}
          </AppText>
        </View>
      </ScrollView>

      <ScreenFooter>
        <Button onPress={onBack}>Back to home</Button>
      </ScreenFooter>
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
      paddingHorizontal: spacing.xl,
      paddingTop: spacing["2xl"],
      paddingBottom: spacing.xl,
      gap: spacing.xl,
      alignItems: "center" as const,
    },
    hero: {
      width: "100%" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
    },
    iconRing: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.washPurple,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: spacing.sm,
    },
    intent: {
      letterSpacing: 0.4,
      textTransform: "uppercase" as const,
    },
    amountBlock: {
      width: "100%" as const,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    amount: {
      width: "100%" as const,
      letterSpacing: -1.2,
      fontWeight: "800" as const,
    },
    reveal: {
      marginTop: spacing.md,
      minHeight: 44,
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
      borderRadius: radii["2xl"],
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
    },
    ayaText: {
      flex: 1,
      minWidth: 0,
    },
    details: {
      width: "100%" as const,
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
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    rowValue: {
      flexShrink: 1,
      textAlign: "right" as const,
      maxWidth: "62%" as const,
    },
    askChip: {
      width: "100%" as const,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    askText: {
      flex: 1,
      minWidth: 0,
      fontStyle: "italic" as const,
    },
  };
}
