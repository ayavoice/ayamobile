import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, BrandLogo, Button, Screen, ScreenFooter, ScreenHeader, TextField } from "../components/ui";
import { DECORATIVE_A11Y } from "../lib/currency";
import { fonts, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

const PHONE_LENGTH = 9;

type Props = { onNext: (phone: string) => void; onBack: () => void; onLogin: () => void };

export default function SignupScreen({ onNext, onBack, onLogin }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const phoneValid = phone.length === PHONE_LENGTH;
  const nameValid = name.trim().length > 1;
  const canContinue = nameValid && phoneValid;

  const nameError = nameTouched && !nameValid ? "Enter your full name." : undefined;
  const phoneError =
    phoneTouched && !phoneValid
      ? `Enter all ${PHONE_LENGTH} digits of your phone number.`
      : undefined;

  return (
    <Screen scroll>
      <ScreenHeader onBack={onBack} />

      <View style={styles.intro}>
        <View {...DECORATIVE_A11Y}>
          <BrandLogo height={40} />
        </View>
        <AppText variant="titleLG" align="center" heading={1} style={styles.introTitle}>
          Create your account
        </AppText>
        <AppText variant="bodyMD" align="center" color={colors.textSecondary}>
          A few details so Aya knows it's you.
        </AppText>
      </View>

      <View style={styles.body}>
        <TextField
          label="Full name"
          value={name}
          onChangeText={setName}
          onBlur={() => setNameTouched(true)}
          placeholder="e.g. Kwame Mensah"
          autoCapitalize="words"
          error={nameError}
        />

        <TextField
          label="Phone number"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^\d]/g, "").slice(0, PHONE_LENGTH))}
          onBlur={() => setPhoneTouched(true)}
          placeholder="24 123 4567"
          prefix="+233"
          keyboardType="phone-pad"
          maxLength={PHONE_LENGTH}
          helper="We'll text a 4-digit code to confirm it's you."
          error={phoneError}
        />
      </View>

      <ScreenFooter>
        <Button onPress={() => onNext(phone)} disabled={!canContinue}>
          Continue
        </Button>
        <Pressable
          onPress={onLogin}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="I already have an account"
          hitSlop={8}
          style={styles.footerLink}
        >
          <AppText variant="bodySM" color={colors.textSecondary} importantForAccessibility="no">
            Already have an account?{" "}
          </AppText>
          <AppText variant="bodySM" color={colors.text} style={styles.footerLinkStrong} importantForAccessibility="no">
            Log in
          </AppText>
        </Pressable>
      </ScreenFooter>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    intro: {
      alignItems: "center" as const,
      paddingHorizontal: spacing.screenX,
      paddingBottom: spacing.lg,
      gap: spacing.sm,
    },
    introTitle: {
      marginTop: spacing.xs,
    },
    body: {
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.sm,
      gap: spacing.xl,
    },
    footerLink: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      minHeight: 44,
      alignItems: "center" as const,
    },
    footerLinkStrong: {
      fontFamily: fonts.body.bold,
    },
  };
}
