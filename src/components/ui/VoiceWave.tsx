import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const BARS = [
  { h: 18, color: "#2830F0", delay: 0 },
  { h: 36, color: "#3A30F0", delay: 80 },
  { h: 58, color: "#5528E8", delay: 40 },
  { h: 86, color: "#6B20E8", delay: 120 },
  { h: 48, color: "#7B20E8", delay: 20 },
  { h: 72, color: "#4A28E8", delay: 100 },
  { h: 32, color: "#3038F0", delay: 60 },
  { h: 54, color: "#6020E8", delay: 140 },
  { h: 24, color: "#8020E8", delay: 30 },
];

function Bar({ height, color, delay }: { height: number; color: string; delay: number }) {
  const scale = useSharedValue(0.45);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 380, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 380, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { height, backgroundColor: color },
        style,
      ]}
    />
  );
}

export default function VoiceWave() {
  return (
    <View
      style={styles.row}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {BARS.map((b, i) => (
        <Bar key={i} height={b.h} color={b.color} delay={b.delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    gap: 7,
  },
  bar: {
    width: 10,
    borderRadius: 8,
  },
});
