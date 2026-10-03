import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { AppText, Button, Icon, Screen, ScreenFooter, ScreenHeader } from "../components/ui";
import {
  DEMO_SCAN_AMOUNT,
  DEMO_SHOP,
  SHOP_PAY_URL,
  parseMerchantPayUrl,
} from "../content/merchantPay";
import { useAppPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y } from "../lib/currency";
import { radii, spacing, useColors } from "../theme";

type Props = {
  onScanned: () => void;
  onBack: () => void;
};

const SCAN_MS = 1600;

export default function ScanPayScreen({ onScanned, onBack }: Props) {
  const colors = useColors();
  const { setActiveFlow, setScanPayee, setTransferAmount } = useAppPrefs();
  const [status, setStatus] = useState<"aim" | "scanning" | "found">("aim");
  const [shopName, setShopName] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [sweep]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sweep.value * 200 - 8 }],
  }));

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const applyMerchant = useCallback(
    (raw: string) => {
      const merchant = parseMerchantPayUrl(raw) ?? {
        id: DEMO_SHOP.id,
        name: DEMO_SHOP.name,
        account: DEMO_SHOP.account,
        currency: DEMO_SHOP.currency,
      };
      setShopName(merchant.name);
      setStatus("found");
      setActiveFlow("transfer");
      setScanPayee({
        id: merchant.id,
        name: merchant.name,
        account: merchant.account,
      });
      setTransferAmount(DEMO_SCAN_AMOUNT);
      timerRef.current = setTimeout(onScanned, 700);
    },
    [onScanned, setActiveFlow, setScanPayee, setTransferAmount],
  );

  const startScan = () => {
    if (status !== "aim") return;
    setStatus("scanning");
    timerRef.current = setTimeout(() => applyMerchant(SHOP_PAY_URL), SCAN_MS);
  };

  return (
    <Screen style={styles.root}>
      <ScreenHeader
        title="Scan to pay"
        onBack={onBack}
        right={
          status === "scanning" ? (
            <AppText variant="caption" color={colors.textMuted}>
              …
            </AppText>
          ) : null
        }
      />

      <View style={styles.body}>
        <AppText variant="bodySM" align="center" color={colors.textSecondary} style={styles.lead}>
          Point at a shop QR. Aya pays the merchant and their loudspeaker announces it.
        </AppText>

        <Pressable
          onPress={startScan}
          disabled={status !== "aim"}
          accessibilityRole="button"
          role="button"
          accessibilityLabel={
            status === "found"
              ? `Merchant found, ${shopName}`
              : status === "scanning"
                ? "Scanning"
                : "Scan merchant QR code"
          }
          accessibilityHint="Simulates scanning a shop QR to pay"
          style={[styles.viewfinder, { borderColor: colors.borderMuted }]}
        >
          <View style={[styles.corner, styles.tl, { borderColor: colors.purple }]} {...DECORATIVE_A11Y} />
          <View style={[styles.corner, styles.tr, { borderColor: colors.purple }]} {...DECORATIVE_A11Y} />
          <View style={[styles.corner, styles.bl, { borderColor: colors.purple }]} {...DECORATIVE_A11Y} />
          <View style={[styles.corner, styles.br, { borderColor: colors.purple }]} {...DECORATIVE_A11Y} />

          <View style={styles.frameInner} {...DECORATIVE_A11Y}>
            <Icon
              name={status === "found" ? "checkmark-circle" : "qr-code-outline"}
              size={56}
              color={status === "found" ? colors.success : colors.textSubtle}
            />
            {status === "scanning" || status === "aim" ? (
              <Animated.View
                style={[
                  styles.sweep,
                  { backgroundColor: colors.purple },
                  sweepStyle,
                ]}
              />
            ) : null}
          </View>
        </Pressable>

        <AppText
          variant="labelMD"
          align="center"
          color={status === "found" ? colors.success : colors.text}
          accessibilityLiveRegion="polite"
        >
          {status === "aim"
            ? "Tap the frame to scan"
            : status === "scanning"
              ? "Scanning…"
              : `Paying ${shopName}`}
        </AppText>
      </View>

      <ScreenFooter>
        <Button
          onPress={startScan}
          disabled={status !== "aim"}
          variant="purple"
          accessibilityHint="Scans the demo shop QR and continues to send money"
        >
          {status === "found" ? "Opening payment…" : "Scan shop QR"}
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  lead: {
    paddingHorizontal: spacing.md,
  },
  viewfinder: {
    width: 240,
    height: 240,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  frameInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  sweep: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 2,
    opacity: 0.85,
    borderRadius: 2,
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderWidth: 3,
  },
  tl: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3, borderTopWidth: 0, borderRightWidth: 0 },
  br: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3, borderTopWidth: 0, borderLeftWidth: 0 },
});
