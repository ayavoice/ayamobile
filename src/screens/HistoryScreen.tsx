import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText, Icon, IconWell, Screen, ScreenHeader } from "../components/ui";
import { DECORATIVE_A11Y, formatCurrencySpoken } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onBack: () => void };

function txHistory(colors: Palette) {
  return [
    { icon: "arrow-up" as const, label: "Sent to Ricky Martin", sub: "Wallet", amount: "-GH₵580.00", date: "Today, 3:02 PM", type: "sent", color: colors.washPurple },
    { icon: "musical-notes" as const, label: "Spotify", sub: "Subscription", amount: "-GH₵14.90", date: "Yesterday", type: "bills", color: colors.washGreen },
    { icon: "arrow-down" as const, label: "Received from Abena Mensah", sub: "Wallet", amount: "+GH₵300.00", date: "Yesterday, 4:20pm", type: "received", color: colors.washBlue },
    { icon: "phone-portrait" as const, label: "Airtime", sub: "Self recharge", amount: "-GH₵10.00", date: "6 Sep, 10:00am", type: "airtime", color: colors.washPurple },
    { icon: "wifi" as const, label: "Data bundle", sub: "2GB, 30 days", amount: "-GH₵25.00", date: "5 Sep, 2:15pm", type: "data", color: colors.washBlue },
    { icon: "flash" as const, label: "Electricity", sub: "Bills", amount: "-GH₵85.00", date: "3 Sep, 9:00am", type: "bills", color: colors.washYellow },
  ];
}

const FILTERS = ["all", "sent", "received", "airtime", "data", "bills"];

export default function HistoryScreen({ onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createHistoryStyles);
  const [filter, setFilter] = useState("all");
  const items = txHistory(colors).filter((t) => filter === "all" || t.type === filter);

  return (
    <Screen style={styles.root}>
      <ScreenHeader title="Transactions" onBack={onBack} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        accessibilityRole="tablist"
        accessibilityLabel="Filter transactions"
      >
        {FILTERS.map((f) => {
          const on = filter === f;
          const filterLabel = f.charAt(0).toUpperCase() + f.slice(1);
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
              accessibilityRole="tab"
              role="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Filter: ${filterLabel}`}
            >
              <AppText
                variant="labelXS"
                color={on ? colors.textOnYellow : colors.text}
                numberOfLines={1}
                importantForAccessibility="no"
              >
                {filterLabel}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View
          accessibilityRole="list"
          role="list"
          accessibilityLabel={`Transactions, ${items.length} items`}
        >
          {items.map((tx, i) => {
            const amountSpoken = formatCurrencySpoken(tx.amount);
            const rowLabel = `${tx.label}, ${tx.sub}, ${tx.date}, ${amountSpoken}`;
            return (
              <View
                key={`${tx.label}-${tx.date}`}
                accessible
                accessibilityRole="listitem"
                role="listitem"
                accessibilityLabel={rowLabel}
                style={[styles.row, i < items.length - 1 && styles.rowDivider]}
              >
                <View {...DECORATIVE_A11Y}>
                  <IconWell backgroundColor={tx.color} size={44} radius={14}>
                    <Icon name={tx.icon} size={20} color={colors.text} />
                  </IconWell>
                </View>
                <View style={styles.flex} importantForAccessibility="no">
                  <AppText variant="labelSM" numberOfLines={1} importantForAccessibility="no">
                    {tx.label}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1} importantForAccessibility="no">
                    {tx.sub} · {tx.date}
                  </AppText>
                </View>
                <AppText
                  variant="amount"
                  color={tx.type === "received" ? colors.success : colors.text}
                  importantForAccessibility="no"
                >
                  {tx.amount}
                </AppText>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

function createHistoryStyles(colors: Palette) {
  return {
  root: { flex: 1 },
  filters: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    alignItems: "center" as const,
  },
  chip: {
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii["2xl"],
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  chipOn: {
    backgroundColor: colors.purple,
  },
  chipOff: {
    backgroundColor: colors.surfaceCard,
  },
  list: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    paddingVertical: spacing.lg,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  flex: { flex: 1, minWidth: 0 },
  };
}
