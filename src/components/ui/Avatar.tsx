import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { useColors } from "../../theme";

type Props = {
  source: ImageSourcePropType;
  size: number;
};

export default function Avatar({ source, size }: Props) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.washPurple,
        },
      ]}
    >
      <Image
        source={source}
        style={{ width: size, height: size }}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
  },
});
