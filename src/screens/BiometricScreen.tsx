import { useState } from "react";
import { Pressable, View } from "react-native";
import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
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

export default function BiometricScreen({ onSuccess, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [method, setMethod] = useState<Method>("finger");
  const [scanning, setScanning] = useState(false);

  const handleAuth = () => {
    if (scanning) return;
    setScanning(true);
    setTimeout(onSuccess, 1600);
  };

  const active = METHODS.find((m) => m.id === method)!;

  return (
    <Screen>
      <ScreenHeader title="Authorize" onBack={onBack} />

      <View style={styles.body}>
        <View style={styles.intro}>
          <AppText variant="headingSM" align="center" heading={2}>
            Confirm it’s you
          </AppText>
          <AppText variant="bodySM" align="center" color={colors.textMuted}>
            Fingerprint, face, or passcode
          </AppText>
        </View>

        <View style={styles.methods} accessibilityLabel="Authentication method">
          {METHODS.map((m) => {
            const on = method === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMethod(m.id)}
                accessibilityRole="button"
                role="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={m.label}
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

        <Pressable
          onPress={handleAuth}
          accessibilityRole="button"
          role="button"
          accessibilityLabel={`Authenticate with ${active.label}`}
          accessibilityState={{ busy: scanning }}
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
    },
    intro: {
      alignItems: "center" as const,
      gap: spacing.xs,
      marginBottom: spacing.sm,
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
  };
}
