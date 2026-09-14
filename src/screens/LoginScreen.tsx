import { useState } from "react";
import { Pressable, View } from "react-native";
import {
  AppText,
  BrandLogo,
  Button,
  Icon,
  IconWell,
  PinInput,
  Screen,
  ScreenFooter,
  ScreenHeader,
  TextField,
} from "../components/ui";
import { DECORATIVE_A11Y } from "../lib/currency";
import { fonts, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

const PIN_LENGTH = 4;
const PHONE_LENGTH = 9;

type Props = {
  onNext: () => void;
  onBack: () => void;
  onForgotPin: () => void;
  onSignup: () => void;
};

type Step = "phone" | "pin";

export default function LoginScreen({ onNext, onBack, onForgotPin, onSignup }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [pin, setPin] = useState("");

  const phoneValid = phone.length === PHONE_LENGTH;
  const phoneError =
    phoneTouched && !phoneValid
      ? `Enter all ${PHONE_LENGTH} digits of your phone number.`
      : undefined;

  const onPinChange = (next: string) => {
    setPin(next);
    if (next.length !== PIN_LENGTH) return;
    setTimeout(onNext, 300);
  };

  if (step === "pin") {
    return (
      <Screen scroll>
        <ScreenHeader
          onBack={() => {
            setPin("");
            setStep("phone");
          }}
        />

        <View style={styles.pinBody}>
          <View {...DECORATIVE_A11Y}>
            <IconWell backgroundColor={colors.washPurple} size={56} radius={20}>
              <Icon name="lock-closed" size={26} color={colors.text} />
            </IconWell>
          </View>

          <AppText variant="labelLG" align="center" heading={1}>
            Enter your PIN
          </AppText>

          <PinInput
            length={PIN_LENGTH}
            value={pin}
            onChangeText={onPinChange}
            autoFocus
            accessibilityLabel="Login PIN"
          />

          <Pressable
            onPress={onForgotPin}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Forgot PIN?"
            hitSlop={8}
            style={styles.forgotPin}
          >
            <AppText variant="bodySM" color={colors.text} importantForAccessibility="no">
              Forgot PIN?
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

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
          Enter your phone number to continue.
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
        <Button onPress={() => setStep("pin")} disabled={!phoneValid} accessibilityLabel="Continue">
          Continue
        </Button>
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
    pinBody: {
      alignItems: "center" as const,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.xl,
      gap: spacing.xl,
    },
    forgotPin: {
      minHeight: 44,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
  };
}
