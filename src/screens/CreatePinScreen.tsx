import { useState } from "react";
import { View } from "react-native";
import { AppText, Icon, IconWell, PinInput, Screen, ScreenHeader } from "../components/ui";
import { DECORATIVE_A11Y } from "../lib/currency";
import { spacing, useColors, usePaletteStyles, type Palette } from "../theme";

const PIN_LENGTH = 4;

type Props = {
  mode: "signup" | "reset";
  onDone: () => void;
  onBack: () => void;
};

export default function CreatePinScreen({ mode, onDone, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const confirming = firstPin !== null;
  const title = mode === "signup" ? "Create your PIN" : "Reset your PIN";
  const prompt = confirming ? "Confirm your PIN" : "Choose a 4-digit PIN";
  const pinLabel = confirming ? "Confirm PIN" : "New PIN";

  const onPinChange = (next: string) => {
    setPin(next);
    setError(false);

    if (next.length === PIN_LENGTH) {
      if (!confirming) {
        setTimeout(() => {
          setFirstPin(next);
          setPin("");
        }, 200);
      } else if (next === firstPin) {
        setTimeout(onDone, 300);
      } else {
        setTimeout(() => {
          setError(true);
          setFirstPin(null);
          setPin("");
        }, 300);
      }
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader title={title} onBack={confirming ? () => { setFirstPin(null); setPin(""); } : onBack} />

      <View style={styles.body}>
        <View {...DECORATIVE_A11Y}>
          <IconWell backgroundColor={colors.washPurple} size={56} radius={20}>
            <Icon name="lock-closed" size={26} color={colors.text} />
          </IconWell>
        </View>

        <AppText variant="labelLG" align="center" heading={2}>
          {prompt}
        </AppText>

        <PinInput
          length={PIN_LENGTH}
          value={pin}
          onChangeText={onPinChange}
          error={error}
          autoFocus
          accessibilityLabel={pinLabel}
        />

        {error ? (
          <AppText
            variant="bodySM"
            color={colors.danger}
            align="center"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            role="alert"
            aria-live="assertive"
          >
            PINs didn't match. Let's try again.
          </AppText>
        ) : (
          <AppText variant="bodySM" align="center" color={colors.textSecondary}>
            You'll use this PIN to confirm transactions. You'll never be asked to speak it aloud.
          </AppText>
        )}
      </View>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    body: {
      alignItems: "center" as const,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.xl,
      gap: spacing.xl,
    },
  };
}
