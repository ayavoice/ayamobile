import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, View } from "react-native";
import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as LocalAuthentication from "expo-local-authentication";
import { AppText, Button, Icon, Screen, ScreenFooter, ScreenHeader } from "../components/ui";
import { DECORATIVE_A11Y } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Method = "finger" | "face" | "device";
type IonName = ComponentProps<typeof Ionicons>["name"];
type Props = { onSuccess: () => void; onBack: () => void };

const METHODS: { id: Method; icon: IonName; label: string }[] = [
  { id: "finger", icon: "finger-print", label: "Fingerprint" },
  { id: "face", icon: "scan", label: "Face unlock" },
  { id: "device", icon: "keypad", label: "Passcode" },
];

function announce(message: string) {
  if (Platform.OS === "web") return;
  AccessibilityInfo.announceForAccessibility(message);
}

export default function BiometricScreen({ onSuccess, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [method, setMethod] = useState<Method>("finger");
  const [scanning, setScanning] = useState(false);
  const [availability, setAvailability] = useState<"checking" | "ok" | "unset">("checking");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") {
      setAvailability("ok");
      return;
    }
    let active = true;
    void (async () => {
      const [hardware, enrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      if (!active) return;
      setAvailability(hardware && enrolled ? "ok" : "unset");
    })();
    return () => {
      active = false;
    };
  }, []);

  const active = METHODS.find((m) => m.id === method)!;
  const confirmLabel = scanning
    ? `Verifying ${active.label}`
    : `Touch to confirm with ${active.label}`;

  const speak = (message: string) => {
    setStatus(message);
    announce(message);
  };

  const selectMethod = (id: Method) => {
    const selected = METHODS.find((m) => m.id === id)!;
    setMethod(id);
    speak(`${selected.label} selected. Touch to confirm with ${selected.label}.`);
  };

  const handleAuth = async () => {
    if (scanning) return;
    if (Platform.OS === "web") {
      speak("Web demo — device auth not required.");
      onSuccess();
      return;
    }
    setScanning(true);
    speak(`Verifying with ${active.label}`);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Confirm it's you to move money`,
        cancelLabel: "Cancel",
        fallbackLabel: "Use passcode",
        disableDeviceFallback: false,
      });
      if (result.success) {
        speak(`${active.label} confirmed`);
        onSuccess();
        return;
      }
      if (result.error === "user_cancel" || result.error === "app_cancel") {
        speak("Cancelled. Nothing was sent.");
      } else {
        speak(
          result.error === "not_enrolled"
            ? "No fingerprint or face is set up on this device. Set one up, then try again."
            : "Authentication did not complete. Try again or cancel.",
        );
      }
    } catch {
      speak("Authentication could not be started. Try again or cancel.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Authorize" onBack={onBack} />

      <View style={styles.body}>
        <View style={styles.intro}>
          <AppText variant="headingSM" align="center" heading={2}>
            Confirm it’s you
          </AppText>
          <AppText variant="bodySM" align="center" color={colors.textMuted}>
            Fingerprint, face, or passcode — voice is off before auth.
          </AppText>
        </View>

        {availability === "unset" ? (
          <View
            style={styles.note}
            accessible
            accessibilityLabel="No fingerprint or face is set up on this device. You can still use your device passcode."
          >
            <View {...DECORATIVE_A11Y}>
              <Icon name="information-circle-outline" size={18} color={colors.text} />
            </View>
            <AppText variant="bodySM" color={colors.text} style={styles.noteText} importantForAccessibility="no">
              No fingerprint or face set up on this device. Passcode still works.
            </AppText>
          </View>
        ) : null}

        <View
          style={styles.methods}
          accessibilityRole="radiogroup"
          role="radiogroup"
          accessibilityLabel="Choose an authentication method"
        >
          {METHODS.map((m, index) => {
            const on = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => selectMethod(m.id)}
                accessibilityRole="radio"
                role="radio"
                accessibilityState={{ checked: on, selected: on }}
                aria-checked={on}
                {...(Platform.OS === "web"
                  ? ({
                      "aria-posinset": index + 1,
                      "aria-setsize": METHODS.length,
                    } as object)
                  : null)}
                accessibilityLabel={m.label}
                accessibilityHint="Selects this method. Then Touch to confirm authenticates with the device."
                style={[styles.method, on ? styles.methodOn : styles.methodOff]}
              >
                <View {...DECORATIVE_A11Y}>
                  <Icon name={m.icon} size={26} color={colors.text} />
                </View>
                <AppText variant="labelXS" align="center" importantForAccessibility="no">
                  {m.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View
          role="status"
          accessibilityLiveRegion="polite"
          aria-live="polite"
          aria-atomic={true}
          style={styles.srOnly}
        >
          <AppText>{status}</AppText>
        </View>

        <Pressable
          onPress={handleAuth}
          accessibilityRole="button"
          role="button"
          accessibilityLabel={confirmLabel}
          accessibilityHint="Authenticates with the device. Nothing is sent until this passes."
          accessibilityState={{ busy: scanning }}
          aria-busy={scanning}
          style={[styles.auth, scanning ? styles.authOn : styles.authOff]}
        >
          <View {...DECORATIVE_A11Y}>
            <Icon
              name={active.icon}
              size={48}
              color={scanning ? colors.successBright : colors.text}
            />
          </View>
          <AppText
            variant="labelXS"
            color={scanning ? colors.successBright : colors.textSubtle}
            importantForAccessibility="no"
          >
            {scanning ? "Verifying…" : "Touch to confirm"}
          </AppText>
        </Pressable>
      </View>

      <ScreenFooter>
        <Button onPress={onBack} variant="ghost">
          Cancel
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    body: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: spacing.xl,
      gap: spacing["2xl"],
      position: "relative" as const,
    },
    intro: {
      alignItems: "center" as const,
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    note: {
      width: "100%" as const,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      backgroundColor: colors.surfaceWarningSoft,
      borderRadius: radii.xl,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    noteText: {
      flex: 1,
      minWidth: 0,
    },
    methods: {
      flexDirection: "row" as const,
      gap: 10,
      width: "100%" as const,
    },
    method: {
      flex: 1,
      borderRadius: radii.xl,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.sm,
      alignItems: "center" as const,
      gap: 6,
      minHeight: 88,
    },
    methodOn: {
      backgroundColor: colors.washPurple,
    },
    methodOff: {
      backgroundColor: colors.surfaceCard,
    },
    auth: {
      width: 160,
      height: 160,
      borderRadius: 80,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: spacing.sm,
    },
    authOn: {
      backgroundColor: colors.successSurface,
    },
    authOff: {
      backgroundColor: colors.surfaceCard,
    },
    srOnly: {
      position: "absolute" as const,
      width: 1,
      height: 1,
      overflow: "hidden" as const,
    },
  };
}