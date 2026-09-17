import { ComponentProps } from "react";
import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useColors } from "../../theme";

type IonName = ComponentProps<typeof Ionicons>["name"];
type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const DECORATIVE = {
  accessible: false as const,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants" as const,
  "aria-hidden": true as const,
};

type IconProps = {
  name: IonName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  accessible?: boolean;
  accessibilityLabel?: string;
};

export default function Icon({
  name,
  size = 24,
  color,
  style,
  accessible = false,
  accessibilityLabel,
}: IconProps) {
  const palette = useColors();
  return (
    <Ionicons
      name={name}
      size={size}
      color={color ?? palette.text}
      style={style}
      accessible={accessible}
      accessibilityLabel={accessible ? accessibilityLabel : undefined}
      accessibilityElementsHidden={!accessible}
      importantForAccessibility={accessible ? "yes" : "no-hide-descendants"}
      aria-hidden={!accessible}
    />
  );
}

export function MciIcon({
  name,
  size = 24,
  color,
  style,
  accessible = false,
  accessibilityLabel,
}: {
  name: MciName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  accessible?: boolean;
  accessibilityLabel?: string;
}) {
  const palette = useColors();
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color ?? palette.text}
      style={style}
      accessible={accessible}
      accessibilityLabel={accessible ? accessibilityLabel : undefined}
      accessibilityElementsHidden={!accessible}
      importantForAccessibility={accessible ? "yes" : "no-hide-descendants"}
      aria-hidden={!accessible}
    />
  );
}

export function IconWell({
  children,
  backgroundColor,
  size = 48,
  radius,
  style,
}: {
  children: React.ReactNode;
  backgroundColor: string;
  size?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.well,
        {
          width: size,
          height: size,
          borderRadius: radius ?? size * 0.3,
          backgroundColor,
        },
        style,
      ]}
      {...DECORATIVE}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
