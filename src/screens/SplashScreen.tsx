import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, BrandLogo } from "../components/ui";
import { DECORATIVE_A11Y } from "../lib/currency";
import { useColors } from "../theme";

const SPLASH_MS = 1800;

type Props = { onNext: () => void };

export default function SplashScreen({ onNext }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  useEffect(() => {
    const t = setTimeout(onNext, SPLASH_MS);
    return () => clearTimeout(t);
  }, [onNext]);

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.background },
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
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hidden: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    opacity: 0,
  },
});
