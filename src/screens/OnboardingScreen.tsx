import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Button, Screen, ScreenFooter } from "../components/ui";
import { spacing, usePaletteStyles, type Palette } from "../theme";

function slidesFor(): {
  title: string;
  body: string;
}[] {
  return [
    {
      title: "Speak naturally",
      body: "Talk to Aya just like you would talk to a friend. No reading or typing needed.",
    },
    {
      title: "Use your language",
      body: "Akan/Twi, Ewe, or English, Aya understands you in the language you are most comfortable with.",
    },
    {
      title: "Authenticate privately",
      body: "Use your fingerprint or face to confirm. You never speak your PIN to Aya.",
    },
  ];
}

type Props = { onNext: () => void };

export default function OnboardingScreen({ onNext }: Props) {
  const styles = usePaletteStyles(createOnboardingStyles);
  const [slide, setSlide] = useState(0);
  const SLIDES = slidesFor();
  const s = SLIDES[slide];

  return (
    <Screen scroll>
      <View style={styles.header}>
        {slide < 2 && (
          <Button
            onPress={onNext}
            variant="ghost"
            style={styles.skipButton}
            accessibilityLabel="Skip onboarding"
          >
            <AppText variant="caption">Skip</AppText>
          </Button>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.copy}>
          <AppText variant="displayMD" align="center" heading={1}>
            {s.title}
          </AppText>
          <AppText variant="bodyLG" align="center" style={styles.bodyText}>
            {s.body}
          </AppText>
        </View>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => setSlide(i)}
            accessibilityRole="button"
            role="button"
            accessibilityState={{ selected: i === slide }}
            accessibilityLabel={`Go to slide ${i + 1} of ${SLIDES.length}`}
            style={styles.dotHit}
          >
            <View style={[styles.dot, i === slide ? styles.dotActive : styles.dotIdle]} />
          </Pressable>
        ))}
      </View>

      <ScreenFooter>
        {slide < 2 ? (
          <Button onPress={() => setSlide(slide + 1)} style={styles.nextButton}>
            Next
          </Button>
        ) : (
          <Button onPress={onNext}>Get started</Button>
        )}
      </ScreenFooter>
    </Screen>
  );
}

function createOnboardingStyles(colors: Palette) {
  return {
    header: {
      flexDirection: "row" as const,
      justifyContent: "flex-end" as const,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    skipButton: {
      alignSelf: "flex-end" as const,
      minHeight: 0,
      backgroundColor: "transparent",
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
    },
    body: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: spacing["4xl"],
      gap: spacing["2xl"],
    },
    copy: {
      alignItems: "center" as const,
    },
    bodyText: {
      marginTop: 14,
    },
    dots: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      paddingBottom: spacing.sm,
      flexShrink: 0,
    },
    dotHit: {
      minWidth: 44,
      minHeight: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    dot: {
      height: 8,
      borderRadius: 4,
    },
    dotActive: {
      width: 28,
      backgroundColor: colors.purple,
    },
    dotIdle: {
      width: 8,
      backgroundColor: colors.trackIdle,
    },
    nextButton: {
      borderRadius: 9999,
    },
  };
}
