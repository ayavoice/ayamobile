import { useEffect, useState } from "react";
import { View } from "react-native";
import { AppText, Avatar, Button, Card } from "../components/ui";
import { brandImages } from "../content/brand";
import MtnPinEntry from "../components/MtnPinEntry";
import SetupStep, { SetupLink } from "../components/SetupStep";
import { firstName, lastFourInPairs, maskedGhanaPhone } from "../content/onboarding";
import { useAppPrefs } from "../context/AppPrefs";
import { authenticateWithBiometrics, biometricsAvailable } from "../lib/biometrics";
import { DECORATIVE_A11Y } from "../lib/currency";
import { vibrate } from "../lib/haptics";
import { spacing, useColors, usePaletteStyles, type Palette } from "../theme";

export type SignInMethod = "biometric" | "pin";

type Props = {
  phone: string;
  name: string;
  /** "Welcome" for a new account, "Welcome back" for sign-in and unlock. */
  returning: boolean;
  /** Try the phone's biometrics first when they're set up. */
  allowBiometrics: boolean;
  step?: { current: number; total: number };
  onSignedIn: (method: SignInMethod) => void;
  onSwitchAccount: () => void;
  onBack?: () => void;
};

type Method = "checking" | SignInMethod;

export default function SignInScreen({
  phone,
  name,
  returning,
  allowBiometrics,
  step,
  onSignedIn,
  onSwitchAccount,
  onBack,
}: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { accessibility } = useAppPrefs();
  const [method, setMethod] = useState<Method>(allowBiometrics ? "checking" : "pin");
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [prompting, setPrompting] = useState(false);
  const [failed, setFailed] = useState(false);

  const promptBiometrics = async () => {
    setPrompting(true);
    setFailed(false);
    const ok = await authenticateWithBiometrics("Sign in to Aya");
    setPrompting(false);
    if (ok) {
      vibrate("success", accessibility.haptics);
      onSignedIn("biometric");
      return;
    }
    vibrate("failed", accessibility.haptics);
    setFailed(true);
  };

  useEffect(() => {
    if (!allowBiometrics) return;
    biometricsAvailable().then((ok) => {
      setCanUseBiometrics(ok);
      setMethod(ok ? "biometric" : "pin");
      if (ok) promptBiometrics();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usePin = method === "pin";
  const greeting = `${returning ? "Welcome back" : "Welcome"}, ${firstName(name)}`;
  const subtitle = usePin ? "Enter your MoMo PIN to continue." : "Confirm it's you with biometrics.";

  return (
    <SetupStep
      title={greeting}
      subtitle={subtitle}
      step={step}
      onBack={onBack}
      ownerOnly
      footer={
        <>
          {method === "biometric" ? (
            <>
              <Button onPress={promptBiometrics} loading={prompting}>
                {failed ? "Try again" : "Use biometrics"}
              </Button>
              <Button variant="ghost" onPress={() => setMethod("pin")} disabled={prompting}>
                Use MoMo PIN instead
              </Button>
            </>
          ) : usePin && canUseBiometrics ? (
            <Button
              variant="ghost"
              onPress={() => {
                setMethod("biometric");
                promptBiometrics();
              }}
            >
              Use biometrics instead
            </Button>
          ) : null}
          <SetupLink lead="Not you?" label="Use a different number" onPress={onSwitchAccount} />
        </>
      }
    >
      <AccountCard name={name} phone={phone} />

      {failed && method === "biometric" ? (
        <AppText variant="bodySM" color={colors.danger} role="alert" accessibilityLiveRegion="assertive">
          That didn't work. Try again, or use your MoMo PIN.
        </AppText>
      ) : null}

      {usePin ? (
        <View style={styles.pin}>
          <MtnPinEntry title={null} onApproved={() => onSignedIn("pin")} />
        </View>
      ) : null}
    </SetupStep>
  );
}

function AccountCard({ name, phone }: { name: string; phone: string }) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const ending = lastFourInPairs(phone);

  return (
    <Card style={styles.card} accessible accessibilityLabel={`MoMo account: ${name}, number ending ${ending}.`}>
      <View {...DECORATIVE_A11Y}>
        <Avatar source={brandImages.pratik} size={48} />
      </View>
      <View style={styles.flex} importantForAccessibility="no-hide-descendants">
        <AppText variant="headingSM">{name}</AppText>
        <AppText variant="bodySM" color={colors.textMuted}>
          MTN MoMo · {maskedGhanaPhone(phone).replace(/ /g, "\u00A0")}
        </AppText>
      </View>
    </Card>
  );
}

function createStyles(colors: Palette) {
  return {
    flex: {
      flex: 1,
    },
    card: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      padding: spacing.lg,
    },
    pin: {
      paddingTop: spacing.lg,
    },
  };
}
