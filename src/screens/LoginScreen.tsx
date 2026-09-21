import { useState } from "react";
import { Pressable, View } from "react-native";
import {
  AppText,
  BrandLogo,
  Button,
  Screen,
  ScreenFooter,
  ScreenHeader,
  TextField,
} from "../components/ui";
import { DECORATIVE_A11Y } from "../lib/currency";
import { fonts, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

const PHONE_LENGTH = 9;

type Props = {
  onNext: (phone: string) => void;
  onBack: () => void;
  onForgotPin: () => void;
  onSignup: () => void;
};

export default function LoginScreen({ onNext, onBack, onForgotPin, onSignup }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const phoneValid = phone.length === PHONE_LENGTH;
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
          Welcome back
        </AppText>
        <AppText variant="bodyMD" align="center" color={colors.textSecondary}>
          Enter your phone number and Aya will text you a code to sign in.
        </AppText>
      </View>

      <View style={styles.phoneBody}>
        <TextField
          label="Phone number"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^\d]/g, "").slice(0, PHONE_LENGTH))}
          onBlur={() => setPhoneTouched(true)}
          placeholder="24 123 4567"
          prefix="+233"
          keyboardType="phone-pad"
          maxLength={PHONE_LENGTH}
          error={phoneError}
          autoFocus
        />
      </View>

      <ScreenFooter>
        <Button
          onPress={() => onNext(phone)}
          disabled={!phoneValid}
          accessibilityLabel="Send verification code"
        >
          Send code
        </Button>
        <Pressable
          onPress={onForgotPin}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Trouble signing in"
          hitSlop={8}
          style={styles.footerLink}
        >
          <AppText variant="bodySM" color={colors.textSecondary} importantForAccessibility="no">
            Trouble signing in?{" "}
          </AppText>
          <AppText variant="bodySM" color={colors.text} style={styles.footerLinkStrong} importantForAccessibility="no">
            Get help
          </AppText>
        </Pressable>
        <Pressable
          onPress={onSignup}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Create a new account"
          hitSlop={8}
          style={styles.footerLink}
        >
          <AppText variant="bodySM" color={colors.textSecondary} importantForAccessibility="no">
            New to Aya?{" "}
          </AppText>
          <AppText variant="bodySM" color={colors.text} style={styles.footerLinkStrong} importantForAccessibility="no">
            Create account
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
    phoneBody: {
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