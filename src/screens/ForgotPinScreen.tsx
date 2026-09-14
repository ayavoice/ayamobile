import { useState } from "react";
import { View } from "react-native";
import { AppText, Button, Screen, ScreenFooter, ScreenHeader, TextField } from "../components/ui";
import { spacing, usePaletteStyles, type Palette } from "../theme";

type Props = { onNext: (phone: string) => void; onBack: () => void };

export default function ForgotPinScreen({ onNext, onBack }: Props) {
  const styles = usePaletteStyles(createStyles);
  const [phone, setPhone] = useState("");

  const phoneValid = phone.replace(/\D/g, "").length >= 9;

  return (
    <Screen scroll>
      <ScreenHeader title="Reset PIN" onBack={onBack} />

      <View style={styles.body}>
        <AppText variant="bodyMD" accessibilityRole="text">
          Enter the phone number on your account. We'll text a 4-digit code so you can set a new
          PIN.
        </AppText>

        <TextField
          label="Phone number"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^\d]/g, ""))}
          placeholder="24 123 4567"
          prefix="+233"
          keyboardType="phone-pad"
          maxLength={10}
          helper="We'll text a 4-digit code to this number."
          autoFocus
        />
      </View>

      <ScreenFooter>
        <Button
          onPress={() => onNext(phone)}
          disabled={!phoneValid}
          accessibilityLabel="Send code"
          accessibilityHint="Sends a 4-digit verification code by text message"
        >
          Send code
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    body: {
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.sm,
      gap: spacing.xl,
    },
  };
}
