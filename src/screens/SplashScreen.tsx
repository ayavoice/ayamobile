import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, BrandLogo } from "../components/ui";
import { DECORATIVE_A11Y } from "../lib/currency";
import { spacing, useColors } from "../theme";

type Props = { onNext: () => void };

export default function SplashScreen({ onNext }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  useEffect(() => {
    const t = setTimeout(onNext, 2600);
    return () => clearTimeout(t);
  }, [onNext]);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: colors.background,
        },
      ]}
    >
      <AppText heading={1} style={styles.hidden}>
        Aya
      </AppText>
      <Pressable
        style={styles.pressable}
        onPress={onNext}
        accessibilityRole="button"
        role="button"
        accessibilityLabel="Continue to Aya"
      >
        <View {...DECORATIVE_A11Y}>
          <BrandLogo height={92} />
        </View>

        <View
          style={[styles.dots, { bottom: Math.max(insets.bottom, 16) + 24 }]}
          {...DECORATIVE_A11Y}
        >
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === 0
                  ? { width: 28, backgroundColor: colors.purple }
                  : { width: 8, backgroundColor: colors.trackIdle },
              ]}
            />
          ))}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing["5xl"],
  },
  pressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing["3xl"],
  },
  hidden: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    opacity: 0,
  },
  dots: {
    position: "absolute",
    flexDirection: "row",
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
