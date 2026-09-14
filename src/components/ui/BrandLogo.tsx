import { Image, StyleSheet, type ImageStyle, type StyleProp } from "react-native";
import { useTheme } from "../../theme";

type Props = {
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export default function BrandLogo({ height = 88, style }: Props) {
  const { logo } = useTheme();
  return (
    <Image
      source={logo}
      style={[styles.logo, { width: height * 3.4, height }, style]}
      resizeMode="contain"
      accessibilityLabel="Aya"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: "center",
  },
});
