import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "../../theme";

type WaveIconProps = {
  size?: number;
  color?: string;
  /** When true, bars pulse like a live sound wave */
  animated?: boolean;
};

const BARS = [
  { h: 0.34, delay: 0 },
  { h: 0.66, delay: 90 },
  { h: 1, delay: 40 },
  { h: 0.58, delay: 130 },
  { h: 0.34, delay: 70 },
];

function WaveBar({
  height,
  delay,
  color,
  barWidth,
  gap,
  animated,
}: {
  height: number;
  delay: number;
  color: string;
  barWidth: number;
  gap: number;
  animated: boolean;
}) {
  const scale = useSharedValue(animated ? 0.45 : 1);

  useEffect(() => {
    if (!animated) {
      scale.value = 1;
      return;
    }
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 340, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.42, { duration: 340, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [animated, delay, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: barWidth,
          height,
          borderRadius: barWidth / 2,
          backgroundColor: color,
          marginHorizontal: gap / 2,
        },
        style,
      ]}
    />
  );
}

export default function WaveIcon({ size = 24, color, animated = false }: WaveIconProps) {
  const palette = useColors();
  const fill = color ?? palette.purple;
  const barWidth = Math.max(2, Math.round(size * 0.14));
  const gap = Math.max(1, Math.round(size * 0.06));

  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {BARS.map((bar, i) => (
        <WaveBar
          key={i}
          height={Math.max(4, size * bar.h * 0.92)}
          delay={bar.delay}
          color={fill}
          barWidth={barWidth}
          gap={gap}
          animated={animated}
        />
      ))}
    </View>
  );
}
