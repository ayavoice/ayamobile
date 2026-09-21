import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import {
  AppText,
  Button,
  Card,
  Icon,
  IconWell,
  Screen,
  ScreenHeader,
  TextField,
  Toggle,
} from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { announce } from "../lib/a11y";
import { DECORATIVE_A11Y } from "../lib/currency";
import { getMomoPin, setMomoPin } from "../services/momoPin";
import type { UssdPinMode } from "@aya/automator";
import { colors, radii, spacing } from "../theme";

type Props = { onBack: () => void };

const PIN_OPTIONS: { id: UssdPinMode; title: string; sub: string }[] = [
  {
    id: "manual",
    title: "I type my PIN",
    sub: "You enter your MoMo PIN on the screen each time. Aya never sees it.",
  },
  {
    id: "auto",
    title: "Aya enters it for me",
    sub: "Saved on this device only. Never sent, logged, or spoken.",
  },
];

export default function SecurityScreen({ onBack }: Props) {
  const { pinMode, setPinMode } = useAppPrefs();
  const [biometric, setBiometric] = useState(true);
  const [bioAvailable, setBioAvailable] = useState<boolean | null>(null);
  const [momoPin, setMomoPinText] = useState("");
  const [hasMomoPin, setHasMomoPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      let usable = false;
      try {
        const [hardware, enrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        usable = hardware && enrolled;
      } catch {
        usable = false;
      }
      if (active) setBioAvailable(usable);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void getMomoPin().then((pin) => {
      if (active && pin) setHasMomoPin(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const selectPinMode = useCallback(
    (mode: UssdPinMode) => {
      setPinMode(mode);
      announce(
        mode === "manual"
          ? "You will type your MoMo PIN each time."
          : "Aya will enter your MoMo PIN for you, from this device only.",
      );
    },
    [setPinMode],
  );

  const savePin = async () => {
    if (momoPin.replace(/\D/g, "").length !== 4) {
      setPinError("Enter all 4 digits of your MoMo PIN.");
      return;
    }
    await setMomoPin(momoPin.replace(/\D/g, ""));
    setHasMomoPin(true);
    setMomoPinText("");
    setPinError(null);
    announce("Your PIN is saved on this device only. Aya will enter it for you.");
  };

  const removePin = async () => {
    await setMomoPin(null);
    setHasMomoPin(false);
    setMomoPinText("");
    announce("Aya will no longer enter your MoMo PIN.");
  };

  const bioCaption =
    bioAvailable === null
      ? "Checking this device…"
      : bioAvailable === false
        ? "No fingerprint or face on this device — passcode will be used"
        : "Fingerprint, face, or device unlock after confirmation";

  return (
    <Screen background={colors.white} scroll>
      <ScreenHeader title="Security & Privacy" onBack={onBack} />

      <View style={styles.body}>
        <View
          style={styles.banner}
          accessible
          accessibilityLabel="Your PIN is always safe. Aya will NEVER ask for your Mobile Money PIN or OTP by voice. Voice stops before authorization. If anyone asks, it is a scam."
        >
          <View style={styles.bannerTitle} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <Icon name="lock-closed" size={20} color={colors.white} />
            </View>
            <AppText variant="labelMD" color={colors.white} importantForAccessibility="no">
              Your PIN is always safe
            </AppText>
          </View>
          <AppText variant="bodySM" color={colors.dangerOnDark} style={styles.bannerBody} importantForAccessibility="no">
            Aya will NEVER ask for your Mobile Money PIN or OTP by voice. Voice stops before authorization. If anyone asks, it is a scam.
          </AppText>
        </View>

        <Card>
          <View style={styles.row}>
            <View {...DECORATIVE_A11Y}>
              <IconWell backgroundColor={colors.washPurple} size={48} radius={14}>
                <Icon name="finger-print" size={24} color={colors.text} />
              </IconWell>
            </View>
            <View style={styles.flex} importantForAccessibility="no">
              <AppText variant="labelMD" importantForAccessibility="no">Biometric authentication</AppText>
              <AppText variant="caption" importantForAccessibility="no">
                {bioCaption}
              </AppText>
            </View>
            <Toggle
              value={biometric}
              onValueChange={(v) => {
                setBiometric(v);
                announce(v ? "Biometrics on." : "Biometrics off, less secure.");
              }}
              accessibilityLabel="Biometric authentication"
              accessibilityHint={
                biometric
                  ? "On. Money moves only after private device auth"
                  : "Off. Less secure"
              }
            />
          </View>
          <View
            accessible
            accessibilityLabel={
              biometric
                ? "Biometrics ON, money moves only after private device auth"
                : "Biometrics OFF, less secure"
            }
            style={[
              styles.status,
              { backgroundColor: biometric ? colors.successSurface : colors.surfaceWarningSoft },
            ]}
          >
            <View {...DECORATIVE_A11Y}>
              <Icon
                name={biometric ? "checkmark-circle" : "warning"}
                size={16}
                color={biometric ? colors.success : colors.warningDark}
              />
            </View>
            <AppText
              variant="caption"
              color={biometric ? colors.success : colors.warningDark}
              style={styles.statusText}
              importantForAccessibility="no"
            >
              {biometric
                ? "Biometrics ON, money moves only after private device auth"
                : "Biometrics OFF, less secure"}
            </AppText>
          </View>
        </Card>

        <Card
          accessible
          accessibilityLabel="How Aya authorizes. Choose who types the MoMo PIN during USSD."
        >
          <View style={styles.modeTitle} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <IconWell backgroundColor={colors.washBlue} size={48} radius={14}>
                <Icon name="keypad" size={24} color={colors.text} />
              </IconWell>
            </View>
            <View style={styles.flex}>
              <AppText variant="labelMD" importantForAccessibility="no">Who types the MoMo PIN</AppText>
              <AppText variant="caption" importantForAccessibility="no">
                The PIN is never spoken, logged, or transmitted.
              </AppText>
            </View>
          </View>

          <View
            accessibilityRole="radiogroup"
            role="radiogroup"
            accessibilityLabel="Choose who types the MoMo PIN during USSD"
          >
            {PIN_OPTIONS.map((opt, index) => {
              const on = pinMode === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => selectPinMode(opt.id)}
                  accessibilityRole="radio"
                  role="radio"
                  accessibilityState={{ checked: on, selected: on }}
                  aria-checked={on}
                  {...({ "aria-posinset": index + 1, "aria-setsize": PIN_OPTIONS.length } as object)}
                  accessibilityLabel={opt.title}
                  accessibilityHint={opt.sub}
                  style={[styles.modeOption, on ? styles.modeOptionOn : styles.modeOptionOff]}
                >
                  <AppText variant="labelSM" style={styles.modeOptionTitle} importantForAccessibility="no">
                    {opt.title}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} importantForAccessibility="no">
                    {opt.sub}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {pinMode === "auto" ? (
            <View style={styles.pinArea}>
              {hasMomoPin ? (
                <View
                  accessible
                  accessibilityLabel="Your MoMo PIN is saved on this device. Remove it to go back to typing yourself."
                  style={styles.pinSaved}
                >
                  <View {...DECORATIVE_A11Y}>
                    <Icon name="checkmark-circle" size={16} color={colors.success} />
                  </View>
                  <AppText
                    variant="caption"
                    color={colors.success}
                    style={styles.statusText}
                    importantForAccessibility="no"
                  >
                    Saved on this device only.
                  </AppText>
                  <Pressable
                    onPress={removePin}
                    accessibilityRole="button"
                    role="button"
                    accessibilityLabel="Remove saved PIN"
                    hitSlop={8}
                    style={styles.pinRemove}
                  >
                    <AppText variant="caption" color={colors.danger} importantForAccessibility="no">
                      Remove
                    </AppText>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.pinFields}>
                  <TextField
                    label="MoMo PIN"
                    value={momoPin}
                    onChangeText={(t) => {
                      setPinError(null);
                      setMomoPinText(t.replace(/\D/g, ""));
                    }}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={4}
                    error={pinError ?? undefined}
                    helper="4 digits, stored in the device keychain only."
                    accessibilityLabel="Aya assisted PIN. Four digits. Saved on this device only."
                  />
                  <Button onPress={savePin}>
                    Save PIN on this device
                  </Button>
                </View>
              )}
            </View>
          ) : null}
        </Card>

        <Card
          accessible
          accessibilityLabel="Voice PIN capture. Allow Aya to capture PIN by voice. NEVER. Permanently disabled. MoMo PINs are never spoken, captured, or stored by voice."
        >
          <View style={styles.row} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <IconWell backgroundColor={colors.dangerSurface} size={48} radius={14}>
                <Icon name="mic" size={24} color={colors.danger} />
              </IconWell>
            </View>
            <View style={styles.flex}>
              <AppText variant="labelMD" importantForAccessibility="no">Voice PIN capture</AppText>
              <AppText variant="caption" importantForAccessibility="no">Allow Aya to capture PIN by voice</AppText>
            </View>
            <View style={styles.never}>
              <AppText variant="labelXS" color={colors.danger} importantForAccessibility="no">
                NEVER
              </AppText>
            </View>
          </View>
          <View style={[styles.status, { backgroundColor: colors.dangerSurface }]} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <Icon name="lock-closed" size={16} color={colors.danger} />
            </View>
            <AppText variant="caption" color={colors.danger} style={styles.statusText} importantForAccessibility="no">
              Permanently disabled. MoMo PINs are never spoken, captured, or stored by voice.
            </AppText>
          </View>
        </Card>

        <Card
          accessible
          accessibilityLabel="Microphone during authentication. Required off before BiometricPrompt. OFF. Locked OFF. After you say continue, Aya closes the mic and hands auth to the device."
        >
          <View style={styles.row} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <IconWell backgroundColor={colors.washBlue} size={48} radius={14}>
                <Icon name="mic-off" size={24} color={colors.text} />
              </IconWell>
            </View>
            <View style={styles.flex}>
              <AppText variant="labelMD" importantForAccessibility="no">Microphone during authentication</AppText>
              <AppText variant="caption" importantForAccessibility="no">Required off before BiometricPrompt</AppText>
            </View>
            <View style={styles.never}>
              <AppText variant="labelXS" color={colors.success} importantForAccessibility="no">
                OFF
              </AppText>
            </View>
          </View>
          <View style={[styles.status, { backgroundColor: colors.successSurface }]} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <Icon name="checkmark-circle" size={16} color={colors.success} />
            </View>
            <AppText variant="caption" color={colors.success} style={styles.statusText} importantForAccessibility="no">
              Locked OFF. After you say continue, Aya closes the mic and hands auth to the device.
            </AppText>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  banner: {
    backgroundColor: colors.danger,
    borderRadius: radii["2xl"],
    padding: spacing.xl,
  },
  bannerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerBody: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  never: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSurface,
  },
  status: {
    marginTop: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  statusText: {
    flex: 1,
  },
  modeTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: spacing.md,
  },
  modeOption: {
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: "transparent",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 4,
    minHeight: 64,
    justifyContent: "center",
  },
  modeOptionOn: {
    backgroundColor: colors.washPurple,
    borderColor: colors.purple,
  },
  modeOptionOff: {
    backgroundColor: colors.surfaceCard,
  },
  modeOptionTitle: {
    fontFamily: "Inter_600SemiBold",
  },
  pinArea: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pinFields: {
    gap: spacing.md,
  },
  pinSaved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.successSurface,
  },
  pinRemove: {
    minHeight: 44,
    justifyContent: "center",
  },
});