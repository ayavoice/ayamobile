import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { AppText, Icon, Screen } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onDone: () => void };

export default function ProcessingScreen({ onDone }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow, activeFlow } = useAppPrefs();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    return () => clearTimeout(t);
  }, [onDone, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const iconName =
    activeFlow === "airtime"
      ? "phone-portrait"
      : activeFlow === "balance"
        ? "wallet"
        : "paper-plane";

  const title =
    activeFlow === "balance"
      ? "Checking balance…"
      : activeFlow === "airtime"
        ? "Buying airtime…"
        : "Processing…";

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.spinnerWrap} {...DECORATIVE_A11Y}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Circle
                cx={60}
                cy={60}
                r={52}
                fill="none"
                stroke={colors.borderMuted}
                strokeWidth={8}
              />
              <Circle
                cx={60}
                cy={60}
                r={52}
                fill="none"
                stroke={colors.purple}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray="326"
                strokeDashoffset="80"
              />
            </Svg>
          </Animated.View>
          <View style={styles.iconWrap}>
            <Icon name={iconName} size={36} color={colors.text} />
          </View>
        </View>

        <View>
          <AppText variant="titleLG" align="center" heading={1}>
            {title}
          </AppText>
          <AppText variant="bodyMD" align="center" color={colors.textMuted} style={styles.wait}>
            Please wait. Do not close the app.
          </AppText>
        </View>

        <View
          style={styles.summary}
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${flow.processingLabel}. ${flow.processingStep}`}
        >
          <AppText
            variant="bodyXS"
            align="center"
            color={colors.textSubtle}
            importantForAccessibility="no"
          >
            {flow.processingLabel}
          </AppText>
          <AppText variant="caption" align="center" style={styles.step} importantForAccessibility="no">
            {flow.processingStep}
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    body: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: spacing["4xl"],
      paddingHorizontal: spacing["6xl"],
    },
    spinnerWrap: {
      width: 120,
      height: 120,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    iconWrap: {
      position: "absolute" as const,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    wait: {
      marginTop: spacing.md,
    },
    summary: {
      width: "100%" as const,
      backgroundColor: colors.surfaceCard,
      borderRadius: radii["2xl"],
      paddingVertical: 14,
      paddingHorizontal: spacing.xl,
      gap: 6,
    },
    step: {
      marginTop: 4,
    },
  };
}
