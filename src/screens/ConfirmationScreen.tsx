import { Pressable, ScrollView, View } from "react-native";
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
import { DECORATIVE_A11Y, formatCurrencySpoken, speakMaybeCurrency } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onConfirm: () => void; onBack: () => void };

export default function ConfirmationScreen({ onConfirm, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow, activeFlow } = useAppPrefs();
  const isBalance = activeFlow === "balance";

  const recipient = flow.confirmTarget.replace(/^to\s+/i, "");
  const amountSpoken = isBalance ? undefined : formatCurrencySpoken(flow.confirmHero);
  const summaryLabel = isBalance
    ? [flow.intentLabel, flow.confirmLead, recipient, flow.confirmMeta]
        .filter(Boolean)
        .join(", ")
    : [flow.intentLabel, amountSpoken, `to ${recipient}`, speakMaybeCurrency(flow.confirmMeta)]
        .filter(Boolean)
        .join(", ");

  const rows = flow.details.filter((d) => d.label !== "Amount");

  return (
    <Screen>
      <ScreenHeader title="Confirm" onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          accessible
          accessibilityRole="summary"
          role="summary"
          accessibilityLabel={summaryLabel}
          style={styles.hero}
        >
          <AppText
            variant="caption"
            color={colors.textMuted}
            align="center"
            style={styles.intent}
            importantForAccessibility="no"
          >
            {flow.intentLabel}
          </AppText>

          {isBalance ? (
            <>
              <View style={styles.balanceIcon} {...DECORATIVE_A11Y}>
                <Icon name="wallet" size={28} color={colors.purple} />
              </View>
              <AppText
                variant="heading"
                align="center"
                color={colors.text}
                style={styles.balanceTitle}
                importantForAccessibility="no"
              >
                {flow.confirmLead}
              </AppText>
              <View style={styles.recipient} importantForAccessibility="no">
                <View style={styles.metaText}>
                  <AppText variant="labelSM" align="center" numberOfLines={1}>
                    {recipient}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={colors.textMuted}
                    align="center"
                    numberOfLines={2}
                  >
                    {flow.confirmMeta}
                  </AppText>
                </View>
              </View>
            </>
          ) : (
            <>
              <AppText
                variant="displayLG"
                align="center"
                color={colors.text}
                style={styles.amount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                importantForAccessibility="no"
              >
                {flow.confirmHero}
              </AppText>

              <View style={styles.recipient} importantForAccessibility="no">
                <Avatar source={brandImages.ricky} size={40} />
                <View style={styles.recipientText}>
                  <AppText variant="labelSM" numberOfLines={1}>
                    {recipient}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
                    {flow.confirmMeta}
                  </AppText>
                </View>
              </View>
            </>
          )}
        </View>

        <View
          style={styles.details}
          accessible
          accessibilityLabel={rows
            .map((r) => `${r.label}, ${speakMaybeCurrency(r.value)}`)
            .join(". ")}
        >
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={[styles.row, i === rows.length - 1 && styles.rowLast]}
              importantForAccessibility="no"
            >
              <AppText variant="bodySM" color={colors.textMuted}>
                {row.label}
              </AppText>
              <AppText variant="labelSM" style={styles.rowValue} numberOfLines={1}>
                {row.value}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>

      <ScreenFooter>
        <Button onPress={onConfirm} variant="purple">
          {isBalance ? "Check balance" : "Confirm"}
        </Button>
        <View style={styles.linkRow}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Change"
            hitSlop={8}
            style={styles.linkHit}
          >
            <AppText variant="labelSM" color={colors.text} importantForAccessibility="no">
              Change
            </AppText>
          </Pressable>
          <AppText variant="bodySM" color={colors.textSubtle} importantForAccessibility="no">
            {" "}
            ·{" "}
          </AppText>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Cancel"
            hitSlop={8}
            style={styles.linkHit}
          >
            <AppText variant="labelSM" color={colors.textMuted} importantForAccessibility="no">
              Cancel
            </AppText>
          </Pressable>
        </View>
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
      paddingHorizontal: spacing.xl,
      paddingTop: spacing["2xl"],
      paddingBottom: spacing.lg,
      gap: spacing["2xl"],
    },
    hero: {
      alignItems: "center" as const,
      gap: spacing.sm,
    },
    intent: {
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
    },
    amount: {
      letterSpacing: -1.2,
      fontWeight: "800" as const,
      marginTop: spacing.xs,
      width: "100%" as const,
    },
    balanceIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.washPurple,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    balanceTitle: {
      marginTop: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    metaText: {
      alignItems: "center" as const,
      gap: 4,
      maxWidth: "100%" as const,
      paddingHorizontal: spacing.md,
    },
    recipient: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      marginTop: spacing.md,
      maxWidth: "100%" as const,
    },
    recipientText: {
      flexShrink: 1,
      minWidth: 0,
      gap: 2,
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
      maxWidth: "62%" as const,
    },
    linkRow: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      minHeight: 44,
    },
    linkHit: {
      minHeight: 44,
      justifyContent: "center" as const,
      paddingHorizontal: spacing.xs,
    },
  };
}
