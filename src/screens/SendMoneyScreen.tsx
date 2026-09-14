import { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import { AppText, Avatar, Button, Icon, Screen, ScreenFooter } from "../components/ui";
import NotificationsModal from "../components/NotificationsModal";
import { brandImages } from "../content/brand";
import { useAppPrefs } from "../context/AppPrefs";
import { formatCurrencySpoken } from "../lib/currency";
import { fonts, spacing, useColors } from "../theme";

type Props = { onSend: () => void; onBack: () => void };

function recipientFrom(details: { label: string; value: string }[]) {
  const name = details.find((d) => d.label === "To")?.value ?? "Ricky Martin";
  const number = details.find((d) => d.label === "Number")?.value ?? "Ac no. 8050530XXX";
  return { name, number };
}

function sanitizeAmount(raw: string) {
  let next = raw.replace(/[^0-9.]/g, "");
  const firstDot = next.indexOf(".");
  if (firstDot !== -1) {
    next =
      next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, "");
    const [whole, decimals = ""] = next.split(".");
    next = `${whole}.${decimals.slice(0, 2)}`;
  }
  if (next.startsWith(".")) next = `0${next}`;
  return next;
}

export default function SendMoneyScreen({ onSend, onBack }: Props) {
  const colors = useColors();
  const { flow } = useAppPrefs();
  const inputRef = useRef<RNTextInput>(null);
  const recipient = useMemo(() => recipientFrom(flow.details), [flow.details]);
  const initialAmount = useMemo(
    () => flow.confirmHero.replace(/[^0-9.]/g, "") || "580.00",
    [flow.confirmHero],
  );
  const [amount, setAmount] = useState(initialAmount);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  const canSend = Number(amount) > 0;
  const amountSpoken = formatCurrencySpoken(amount || "0");

  return (
    <Screen style={styles.root}>
      <NotificationsModal
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <View style={styles.top}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.topBtn}
        >
          <Icon name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <AppText variant="headingSM" heading={1}>
          Send Money
        </AppText>
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setNotificationsOpen(true);
          }}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Notifications"
          accessibilityHint="Opens your notifications"
          hitSlop={8}
          style={styles.topBtn}
        >
          <Icon name="notifications-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.recipient}>
          <View
            accessible
            accessibilityLabel={`${recipient.name}, ${recipient.number}`}
            style={styles.recipientInfo}
          >
            <Avatar source={brandImages.ricky} size={108} />
            <AppText
              variant="heading"
              color={colors.text}
              style={styles.name}
              importantForAccessibility="no"
            >
              {recipient.name}
            </AppText>
            <AppText variant="bodySM" color={colors.textSubtle} importantForAccessibility="no">
              {recipient.number}
            </AppText>
          </View>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Change recipient"
            accessibilityHint="Goes back to change who receives the money"
            hitSlop={8}
          >
            <AppText
              variant="labelXS"
              color={colors.textSubtle}
              style={styles.change}
              importantForAccessibility="no"
            >
              Change
            </AppText>
          </Pressable>
        </View>

        <Pressable
          onPress={() => inputRef.current?.focus()}
          accessibilityRole="none"
          style={styles.amountWrap}
        >
          <AppText
            variant="displayLG"
            color={colors.text}
            style={styles.currencyPrefix}
            importantForAccessibility="no"
          >
            GH₵
          </AppText>
          <TextInput
            ref={inputRef}
            value={amount}
            onChangeText={(text) => setAmount(sanitizeAmount(text))}
            keyboardType="decimal-pad"
            autoFocus
            returnKeyType="done"
            selectTextOnFocus
            caretHidden={false}
            placeholder="0.00"
            placeholderTextColor={colors.textSubtle}
            style={[styles.amountInput, { color: colors.text }]}
            accessibilityLabel={`Amount, ${amountSpoken}`}
            accessibilityHint="Edit the amount using the system keyboard"
          />
        </Pressable>
      </View>

      <ScreenFooter>
        <Button
          onPress={onSend}
          disabled={!canSend}
          variant="purple"
          accessibilityHint="Confirms amount and continues to authentication"
        >
          Send
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    minHeight: 52,
    flexShrink: 0,
  },
  topBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    justifyContent: "flex-start",
    gap: spacing["2xl"],
  },
  recipient: {
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  recipientInfo: {
    alignItems: "center",
  },
  name: {
    marginTop: spacing.md,
  },
  change: {
    marginTop: 6,
    textDecorationLine: "underline",
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    paddingHorizontal: spacing.sm,
  },
  currencyPrefix: {
    letterSpacing: -1,
  },
  amountInput: {
    flexShrink: 1,
    minWidth: 120,
    maxWidth: "70%",
    fontFamily: fonts.display.black,
            fontSize: 38,
    letterSpacing: -1.2,
    padding: 0,
    margin: 0,
    textAlign: "left",
    ...({ outlineStyle: "none", outlineWidth: 0 } as object),
  },
});
