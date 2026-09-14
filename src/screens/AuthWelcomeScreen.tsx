import { View } from "react-native";
import { AppText, BrandLogo, Button, Screen, ScreenFooter } from "../components/ui";
import { DECORATIVE_A11Y } from "../lib/currency";
import { spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onSignup: () => void; onLogin: () => void };

export default function AuthWelcomeScreen({ onSignup, onLogin }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);

  return (
    <Screen>
      <View style={styles.body}>
        <View {...DECORATIVE_A11Y}>
          <BrandLogo height={72} />
        </View>
        <View style={styles.copy}>
          <AppText variant="titleLG" align="center" heading={1}>
            Let's get you set up
          </AppText>
          <AppText variant="bodyLG" align="center" style={styles.sub} color={colors.textSecondary}>
            Create an account to start sending money, checking your balance, and buying airtime,
            all by voice.
          </AppText>
        </View>
      </View>

      <ScreenFooter>
        <Button onPress={onSignup} accessibilityLabel="Create account">
          Create account
        </Button>
        <Button onPress={onLogin} variant="outline" accessibilityLabel="I already have an account">
          I already have an account
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    body: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: spacing["4xl"],
      gap: spacing["3xl"],
    },
    copy: {
      alignItems: "center" as const,
    },
    sub: {
      marginTop: spacing.sm,
    },
  };
}
