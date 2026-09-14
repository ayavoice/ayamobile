import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AppText from "./AppText";
import Icon from "./Icon";
import { spacing, useColors } from "../../theme";

type Props = {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export default function ScreenHeader({ title, onBack, right }: Props) {
  const colors = useColors();
  return (
    <View style={styles.top}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
          hitSlop={8}
          style={styles.btn}
        >
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Icon name="chevron-back" size={26} color={colors.text} />
          </View>
        </Pressable>
      ) : (
        <View style={styles.btn} />
      )}
      {title ? (
        <AppText variant="headingSM" numberOfLines={1} heading={1} style={styles.title}>
          {title}
        </AppText>
      ) : (
        <View style={styles.flex} />
      )}
      <View style={styles.btn}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    minHeight: 52,
    flexShrink: 0,
  },
  btn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  flex: {
    flex: 1,
  },
});
