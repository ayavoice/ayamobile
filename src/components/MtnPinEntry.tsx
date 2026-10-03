import { useEffect, useState } from "react";
import { View } from "react-native";
import { AppText, Icon, PinInput } from "./ui";
import { MOMO_PIN_LOCKED, MOMO_PIN_LOCKED_SPOKEN, MOMO_PIN_TRIES } from "../content/onboarding";
import { DECORATIVE_A11Y } from "../lib/currency";
import { speak } from "../lib/speech";
import { spacing, useColors, usePaletteStyles } from "../theme";

const PIN_LENGTH = 4;
const VERIFY_MS = 1100;
/** Demo stand-in for a PIN MTN rejects, so the wrong-PIN and lockout paths can be shown. */
const DEMO_WRONG_PIN = "0000";

type Props = {
  onApproved: () => void;
  /** Pass null when the screen heading already asks for the PIN. */
  title?: string | null;
  onLocked?: () => void;
};

/**
 * Stand-in for MTN's secure PIN field. In production this is MTN's SDK or
 * hosted input: digits go straight to MTN and never reach Aya's code or servers.
 * No time limit: screen-reader users need as long as they need.
 */
export default function MtnPinEntry({ onApproved, title = "Enter your MoMo PIN", onLocked }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [pin, setPin] = useState("");
  const [triesLeft, setTriesLeft] = useState(MOMO_PIN_TRIES);
  const [error, setError] = useState("");
  const locked = triesLeft <= 0;
  const verifying = pin.length === PIN_LENGTH;

  useEffect(() => {
    if (!verifying) return;
    const t = setTimeout(() => {
      const entered = pin;
      setPin("");
      if (entered !== DEMO_WRONG_PIN) {
        onApproved();
        return;
      }
      const left = triesLeft - 1;
      setTriesLeft(left);
      if (left <= 0) {
        setError("");
        speak(MOMO_PIN_LOCKED_SPOKEN);
        onLocked?.();
        return;
      }
      const msg = `Wrong PIN. ${left} ${left === 1 ? "try" : "tries"} left.`;
      setError(msg);
      speak(msg);
    }, VERIFY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifying]);

  if (locked) {
    return (
      <View style={styles.wrap} accessibilityLiveRegion="assertive" role="alert">
        <View {...DECORATIVE_A11Y}>
          <Icon name="lock-closed" size={32} color={colors.danger} />
        </View>
        <AppText variant="headingSM" align="center" heading={2}>
          PIN locked
        </AppText>
        <AppText variant="bodyMD" align="center" color={colors.textSecondary}>
          {MOMO_PIN_LOCKED}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {title ? (
        <AppText variant="headingSM" align="center" heading={2}>
          {title}
        </AppText>
      ) : null}

      <PinInput
        length={PIN_LENGTH}
        value={pin}
        onChangeText={(t) => {
          setPin(t);
          if (t) setError("");
        }}
        editable={!verifying}
        autoFocus
        error={Boolean(error)}
        textContentType="password"
        accessibilityLabel="MTN MoMo PIN, 4 digits. It goes to MTN only."
      />

      <View style={styles.status} accessibilityLiveRegion="polite" aria-live="polite">
        {verifying ? (
          <AppText variant="caption" color={colors.textMuted}>
            Checking…
          </AppText>
        ) : error ? (
          <AppText variant="bodySM" align="center" color={colors.danger}>
            {error}
          </AppText>
        ) : (
          <View style={styles.secure}>
            <View {...DECORATIVE_A11Y}>
              <Icon name="lock-closed" size={14} color={colors.textMuted} />
            </View>
            <AppText variant="caption" color={colors.textMuted}>
              Goes to MTN only. Aya never sees it.
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles() {
  return {
    wrap: {
      alignSelf: "stretch" as const,
      alignItems: "center" as const,
      gap: spacing.lg,
    },
    status: {
      minHeight: 24,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    secure: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
    },
  };
}
