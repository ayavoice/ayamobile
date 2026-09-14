import { Pressable, StyleSheet, View } from "react-native";
import { useColors } from "../../theme";

type ToggleProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onColor?: string;
  offColor?: string;
};

export default function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
  accessibilityHint,
  onColor,
  offColor,
}: ToggleProps) {
  const colors = useColors();
  const on = onColor ?? colors.purple;
  const off = offColor ?? colors.toggleOff;

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      role="switch"
      accessibilityState={{ checked: value }}
      aria-checked={value}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hitSlop={8}
      style={[styles.track, { backgroundColor: value ? on : off }]}
    >
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.thumb,
          { backgroundColor: colors.white },
          value ? styles.thumbOn : styles.thumbOff,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    flexShrink: 0,
  },
  thumb: {
    position: "absolute",
    top: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  thumbOn: {
    left: 25,
  },
  thumbOff: {
    left: 3,
  },
});
