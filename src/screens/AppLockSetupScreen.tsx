import { useEffect, useState } from "react";
import { AppText, Button } from "../components/ui";
import SetupStep from "../components/SetupStep";
import { OWNER_DONE_LINE, SIGNUP_STEPS, SIGNUP_TOTAL } from "../content/onboarding";
import { useAppPrefs } from "../context/AppPrefs";
import { authenticateWithBiometrics, biometricsAvailable } from "../lib/biometrics";
import { vibrate } from "../lib/haptics";
import { speak } from "../lib/speech";
import { useColors } from "../theme";

type Props = { onDone: () => void; onBack: () => void };
type Stage = "offer" | "checking" | "failed";

/** Optional, and only offered after the MoMo PIN has signed in, like MoMo. */
export default function AppLockSetupScreen({ onDone, onBack }: Props) {
  const colors = useColors();
  const { setAppLock, accessibility } = useAppPrefs();
  const [stage, setStage] = useState<Stage>("offer");

  const finish = (biometric: boolean) => {
    setAppLock({ biometric });
    if (biometric) vibrate("success", accessibility.haptics);
    speak(OWNER_DONE_LINE);
    onDone();
  };

  useEffect(() => {
    biometricsAvailable().then((ok) => {
      if (!ok) finish(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const turnOn = async () => {
    setStage("checking");
    const ok = await authenticateWithBiometrics("Use biometrics to sign in to Aya");
    if (ok) {
      finish(true);
      return;
    }
    vibrate("failed", accessibility.haptics);
    setStage("failed");
  };

  return (
    <SetupStep
      title="Use biometrics?"
      subtitle="Sign in with your fingerprint or face instead of your PIN. You can change this in Settings."
      step={{ current: SIGNUP_STEPS.biometrics, total: SIGNUP_TOTAL }}
      onBack={stage === "checking" ? undefined : onBack}
      ownerOnly
      footer={
        <>
          <Button onPress={turnOn} loading={stage === "checking"}>
            {stage === "failed" ? "Try again" : "Use biometrics"}
          </Button>
          <Button variant="ghost" onPress={() => finish(false)} disabled={stage === "checking"}>
            Not now
          </Button>
        </>
      }
    >
      {stage === "failed" ? (
        <AppText variant="bodySM" color={colors.danger} role="alert" accessibilityLiveRegion="assertive">
          That didn't work. Try again, or choose Not now.
        </AppText>
      ) : null}
    </SetupStep>
  );
}
