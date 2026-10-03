import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppText, PinInput } from "../components/ui";
import SetupStep, { SetupLink } from "../components/SetupStep";
import { SIGNUP_STEPS, SIGNUP_TOTAL, formatGhanaPhone } from "../content/onboarding";
import { DECORATIVE_A11Y } from "../lib/currency";
import { speak } from "../lib/speech";
import { spacing, useColors, usePaletteStyles } from "../theme";

const CODE_LENGTH = 4;
const RESEND_SECONDS = 30;
/** Stand-in for the SMS Retriever / iOS one-time-code autofill. */
const DEMO_CODE = "4821";

type Props = {
  phone: string;
  /** Show sign-up progress; omitted when logging in. */
  showProgress?: boolean;
  onVerified: () => void;
  onBack: () => void;
};

export default function OtpVerifyScreen({ phone, showProgress, onVerified, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setCode((c) => c || DEMO_CODE), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  useEffect(() => {
    if (code.length !== CODE_LENGTH) return;
    setVerifying(true);
    speak("Verified.");
    const t = setTimeout(onVerified, 900);
    return () => clearTimeout(t);
  }, [code, onVerified]);

  const resend = (by: "sms" | "call") => {
    setCode("");
    setVerifying(false);
    setSecondsLeft(RESEND_SECONDS);
    setNotice(by === "call" ? "Calling you now." : "New code sent.");
  };

  const canResend = secondsLeft <= 0 && !verifying;

  return (
    <SetupStep
      title="Enter the code"
      subtitle={`Sent to ${formatGhanaPhone(phone)}. Never share it with anyone.`}
      step={showProgress ? { current: SIGNUP_STEPS.code, total: SIGNUP_TOTAL } : undefined}
      onBack={onBack}
      footer={<SetupLink lead="Wrong number?" label="Change it" onPress={onBack} disabled={verifying} />}
    >
      <View role="form" aria-label="Verification code" style={styles.form}>
        <PinInput
          length={CODE_LENGTH}
          value={code}
          onChangeText={setCode}
          editable={!verifying}
          autoFocus
          textContentType="oneTimeCode"
          accessibilityLabel={`Verification code, ${CODE_LENGTH} digits`}
        />

        <View style={styles.status} accessibilityLiveRegion="polite" aria-live="polite">
          {verifying ? (
            <View style={styles.row}>
              <ActivityIndicator color={colors.purple} {...DECORATIVE_A11Y} />
              <AppText variant="bodySM" color={colors.textSecondary}>
                Verifying…
              </AppText>
            </View>
          ) : canResend ? (
            <View style={styles.row}>
              <SetupLink label="Resend code" onPress={() => resend("sms")} />
              <AppText variant="bodySM" color={colors.textMuted} {...DECORATIVE_A11Y}>
                ·
              </AppText>
              <SetupLink label="Call me instead" onPress={() => resend("call")} />
            </View>
          ) : (
            <AppText variant="bodySM" align="center" color={colors.textSecondary}>
              {notice ? `${notice} ` : ""}Resend in 0:{String(secondsLeft).padStart(2, "0")}
            </AppText>
          )}
        </View>
      </View>
    </SetupStep>
  );
}

function createStyles() {
  return {
    form: {
      gap: spacing.lg,
      paddingTop: spacing.sm,
    },
    status: {
      minHeight: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
    },
  };
}
