import { Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { spacing, useColors } from "../../theme";

type NavBackProps = {
  onBack: () => void;
};

export default function NavBack({ onBack }: NavBackProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onBack}
      accessibilityRole="button"
      role="button"
      accessibilityLabel="Go back"
      accessibilityHint="Returns to the previous screen"
      hitSlop={8}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Svg
        width={11}
        height={19}
        viewBox="0 0 11 19"
        fill="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Path
          d="M10 1L2 9.5L10 18"
          stroke={colors.text}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: spacing.screenX,
    minHeight: 52,
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.7,
  },
});
