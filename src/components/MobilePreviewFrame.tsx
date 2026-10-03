import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "../theme";

type Props = {
  children: React.ReactNode;
};

/**
 * On web/desktop: centered mobile-width column.
 * Top and bottom stay open (full height). On native: pass-through.
 */
export default function MobilePreviewFrame({ children }: Props) {
  const colors = useColors();
  if (Platform.OS !== "web") {
    return <View style={styles.nativeFill}>{children}</View>;
  }

  return (
    <View style={[styles.stage, { backgroundColor: colors.backgroundMuted }]}>
      <View style={[styles.phone, { backgroundColor: colors.background }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeFill: {
    flex: 1,
  },
  stage: {
    // `fixed` + inset sizes this against the viewport in a single layout
    // pass, instead of relying on every ancestor's height:'100%'/flex:1 to
    // have already resolved — the latter can lose the race on first paint
    // (esp. on mobile, while the browser chrome is still settling), leaving
    // blank space below the app until something forces a reflow (a reload).
    position: "fixed" as unknown as "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  phone: {
    width: "100%",
    maxWidth: 390,
    height: "100%" as unknown as number,
    maxHeight: 926,
    overflow: "hidden",
  },
});
