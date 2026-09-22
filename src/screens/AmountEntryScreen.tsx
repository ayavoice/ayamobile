import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import { AppText, Button, Screen, ScreenFooter } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { useAyaSpeech } from "../hooks/useAyaSpeech";
import {
  formatCurrencySpoken,
  normalizeAmountInput,
  parseGhsToMinor,
} from "../lib/currency";
import { speakOrAlert } from "../lib/voice-unavailable";
import { fonts, spacing, useColors } from "../theme";

type Props = { onBack: () => void; onSubmit: (amountMinor: number) => void };

/**
 * Manual amount entry fallback: reached when ASR did not catch the amount for a
 * non-transfer flow (airtime/data/bill). The typed amount is converted to minor
 * units and pushed back into the draft's slots, where missionForFlow picks it up.
 */
export default function AmountEntryScreen({ onBack, onSubmit }: Props) {
  const colors = useColors();
  const { flow, language, accessibility } = useAppPrefs();
  const { speakLocalized, stop } = useAyaSpeech();
  const inputRef = useRef<RNTextInput>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (accessibility.screenReader) return;
    void speakOrAlert(speakLocalized, flow.readAloud, language, onBack);
    return () => stop();
  }, [flow.readAloud, language, accessibility.screenReader, speakLocalized, stop, onBack]);

  const amountMinor = parseGhsToMinor(amount);
  const amountSpoken = formatCurrencySpoken(amount || "0");

  return (
    <Screen style={styles.root}>
      <View style={styles.top}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.topBtn}
        >
          <AppText variant="bodyLG" color={colors.text}>
            Back
          </AppText>
        </Pressable>
        <AppText variant="headingSM" heading={1}>
          How much?
        </AppText>
        <View style={styles.topBtn} />
      </View>

      <View style={styles.body}>
        <AppText variant="bodyMD" align="center" color={colors.textSubtle}>
          {flow.confirmMeta}
        </AppText>
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
            onChangeText={(text) => setAmount(normalizeAmountInput(text))}
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
          onPress={() => {
            Keyboard.dismiss();
            onSubmit(amountMinor ?? 0);
          }}
          disabled={amountMinor == null}
          variant="purple"
          accessibilityHint="Confirms the amount and continues"
        >
          Continue
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
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    justifyContent: "flex-start",
    gap: spacing["2xl"],
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