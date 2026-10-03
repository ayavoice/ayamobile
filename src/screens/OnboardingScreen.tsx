import { useEffect } from "react";
import { View } from "react-native";
import { AppText, BrandLogo, Button, Screen, ScreenFooter } from "../components/ui";
import { WELCOME_LINES } from "../content/onboarding";
import { DECORATIVE_A11Y } from "../lib/currency";
import { speak } from "../lib/speech";
import { spacing, useColors, usePaletteStyles } from "../theme";

type Props = { onNext: () => void; onLogin: () => void };

const TAGLINE = "Send money and pay by voice, in Twi or English.";

export default function OnboardingScreen({ onNext, onLogin }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);

  useEffect(() => {
    speak(`${WELCOME_LINES.map((l) => l.text).join(" ")} ${TAGLINE}`);
  }, []);

  return (
    <Screen>
      <View style={styles.hero}>
        <View {...DECORATIVE_A11Y}>
          <BrandLogo height={56} />
        </View>
        <View style={styles.copy}>
          <AppText variant="displayMD" align="center" heading={1}>
            Akwaaba!
          </AppText>
          <AppText variant="bodyLG" align="center" color={colors.textSecondary}>
            {TAGLINE}
          </AppText>
        </View>
      </View>

      <ScreenFooter>
        <Button onPress={onNext}>Get started</Button>
        <Button variant="ghost" onPress={onLogin}>
          I already have an account
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

function createStyles() {
  return {
    hero: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: spacing.screenX,
      gap: spacing["3xl"],
    },
    copy: {
      gap: spacing.md,
      maxWidth: 340,
    },
  };
}
