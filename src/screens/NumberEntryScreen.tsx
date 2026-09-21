import { useState } from "react";
import { View } from "react-native";
import { AppText, Button, Screen, ScreenFooter, ScreenHeader, TextField } from "../components/ui";
import { useScreenAnnounce } from "../hooks/useScreenAnnounce";
import { toE164 } from "../services/contacts";
import { spacing, useColors, usePaletteStyles, type Palette } from "../theme";

const PHONE_LENGTH = 9;

type Props = {
  /** Confirm the typed number. `number` is the local display form (024…),
   *  `e164` the canonical (+23324…) used on the money path. */
  onConfirm: (number: string, e164: string) => void;
  onBack: () => void;
};

export default function NumberEntryScreen({ onConfirm, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [digits, setDigits] = useState("");
  const [touched, setTouched] = useState(false);

  useScreenAnnounce(
    "Type the recipient's mobile money number into the field, then press Use this number. Aya reads the number back before sending.",
  );

  const valid = digits.length === PHONE_LENGTH;
  const error =
    touched && !valid
      ? `Enter all ${PHONE_LENGTH} digits of the recipient's number.`
      : undefined;

  function confirm() {
    const e164 = toE164(`+233${digits}`);
    if (!e164) {
      setTouched(true);
      return;
    }
    onConfirm(e164.replace("+233", "0"), e164);
  }

  return (
    <Screen scroll>
      <ScreenHeader title="Enter number" onBack={onBack} />

      <View style={styles.body}>
        <AppText variant="headingSM" heading={2} color={colors.text} style={styles.lead}>
          Type the recipient&apos;s MoMo number
        </AppText>
        <AppText variant="bodyMD" color={colors.textSecondary}>
          Aya reads the number back to you before sending, so you know it is right.
        </AppText>

        <View style={styles.field}>
          <TextField
            label="Recipient number"
            value={digits}
            onChangeText={(t) => setDigits(t.replace(/[^\d]/g, "").slice(0, PHONE_LENGTH))}
            onBlur={() => setTouched(true)}
            placeholder="24 123 4567"
            prefix="+233"
            keyboardType="phone-pad"
            maxLength={PHONE_LENGTH}
            error={error}
            autoFocus
          />
        </View>
      </View>

      <ScreenFooter>
        <Button
          onPress={confirm}
          disabled={!valid}
          accessibilityLabel="Use this number"
          accessibilityHint="Sends money to the number you typed"
        >
          Use this number
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    body: {
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.lg,
      gap: spacing.sm,
    },
    lead: {
      marginBottom: spacing.xs,
    },
    field: {
      marginTop: spacing.lg,
    },
  };
}