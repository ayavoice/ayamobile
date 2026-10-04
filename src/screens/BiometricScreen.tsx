import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { Animated, Easing, Pressable, ScrollView, View } from "react-native";
import { AppText, Icon, Screen, ScreenHeader } from "../components/ui";
import MtnPinEntry from "../components/MtnPinEntry";
import { AUTH_LINES, decideAuth, parseAmount, pinReasonText } from "../content/authorization";
import { useAppPrefs } from "../context/AppPrefs";
import { authenticateWithBiometrics } from "../lib/biometrics";
import { formatCurrencySpoken, speakMaybeCurrency } from "../lib/currency";
import { vibrate } from "../lib/haptics";
import { speak } from "../lib/speech";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onSuccess: () => void; onBack: () => void };
type Stage = "owner" | "checking" | "pin" | "approved";

const HANDOFF_MS = 700;
const ORB = 128;

export default function BiometricScreen({ onSuccess, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const {
    flow,
    activeFlow,
    accessibility,
    preApproval,
    spentToday,
    recordSpend,
    scanPayee,
    transferRecipient,
    appLock,
    riskLevel,
  } = useAppPrefs();
  const biometricOn = appLock?.biometric ?? true;
  const movesMoney = activeFlow !== "balance";
  const amount = movesMoney ? parseAmount(flow.confirmHero) : 0;

  const [decision] = useState(() =>
    !biometricOn
      ? ({ mode: "pin", reason: "no-pre-approval" } as const)
      : movesMoney && riskLevel === "high"
        ? ({ mode: "pin", reason: "safety-check" } as const)
        : movesMoney
        ? decideAuth({ amount, savedRecipient: transferRecipient?.saved ?? !scanPayee, spentToday, preApproval })
        : ({ mode: "fingerprint" } as const),
  );
  const withinLimits = movesMoney && decision.mode === "fingerprint";

  const hero = movesMoney ? flow.confirmHero : flow.confirmTarget;
  const sub = movesMoney ? flow.confirmTarget : flow.confirmMeta;
  const summaryLabel = movesMoney
    ? `${flow.intentLabel}. ${formatCurrencySpoken(flow.confirmHero)} ${flow.confirmTarget}. ${speakMaybeCurrency(flow.confirmMeta)}`
    : `${flow.intentLabel}. ${flow.confirmTarget}. ${flow.confirmMeta}`;

  const [stage, setStage] = useState<Stage>(biometricOn ? "owner" : "pin");

  useEffect(() => {
    speak(biometricOn ? AUTH_LINES.owner : AUTH_LINES.pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmOwner = async () => {
    if (stage !== "owner") return;
    setStage("checking");
    const ok = await authenticateWithBiometrics("Use biometrics to approve");
    if (!ok) {
      vibrate("failed", accessibility.haptics);
      setStage("owner");
      return;
    }
    vibrate("understood", accessibility.haptics);
    if (decision.mode === "pin") {
      setStage("pin");
      speak(AUTH_LINES.pin);
    } else {
      setStage("approved");
    }
  };

  const pinApproved = useCallback(() => setStage("approved"), []);

  useEffect(() => {
    if (stage !== "approved") return;
    vibrate("success", accessibility.haptics);
    speak(AUTH_LINES.approved);
    if (movesMoney) recordSpend(amount);
    const t = setTimeout(onSuccess, HANDOFF_MS);
    return () => clearTimeout(t);
    // run once on approval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (stage !== "checking") return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [stage, pulse]);

  const orbs: Record<Exclude<Stage, "pin">, { icon: ComponentProps<typeof Icon>["name"]; bg: string; fg: string }> = {
    owner: { icon: "finger-print", bg: colors.washPurple, fg: colors.purple },
    checking: { icon: "finger-print", bg: colors.washPurple, fg: colors.purple },
    approved: { icon: "checkmark", bg: colors.successSurface, fg: colors.success },
  };
  const orbStage = stage === "pin" ? "owner" : stage;
  const orb = orbs[orbStage];
  const status: Record<Exclude<Stage, "pin">, string> = {
    owner: "Use biometrics to confirm it's you",
    checking: "Checking…",
    approved: "Approved",
  };
  const detail =
    stage === "approved"
      ? movesMoney
        ? "Sending now"
        : ""
      : withinLimits
        ? "Within your everyday limit. No PIN needed."
        : "";

  return (
    <Screen>
      <ScreenHeader title="Approve" onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          accessible
          accessibilityRole="summary"
          role="summary"
          accessibilityLabel={summaryLabel}
          style={styles.summary}
        >
          <AppText variant="overline" color={colors.textMuted} importantForAccessibility="no">
            {flow.intentLabel}
          </AppText>
          <AppText
            variant="displayLG"
            color={colors.text}
            align="center"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={styles.hero}
            importantForAccessibility="no"
          >
            {hero}
          </AppText>
          <AppText
            variant="labelMD"
            color={colors.text}
            align="center"
            numberOfLines={1}
            importantForAccessibility="no"
          >
            {sub}
          </AppText>
          {movesMoney ? (
            <AppText variant="caption" color={colors.textMuted} numberOfLines={1} importantForAccessibility="no">
              {flow.confirmMeta}
            </AppText>
          ) : null}
        </View>

        {stage === "pin" && decision.mode === "pin" ? (
          <View style={styles.stage} accessibilityLiveRegion="polite">
            {decision.reason !== "no-pre-approval" ? (
              <View style={styles.reason}>
                <Icon name="shield-half" size={14} color={colors.text} />
                <AppText variant="labelXS" color={colors.text}>
                  {pinReasonText(decision.reason, preApproval)}
                </AppText>
              </View>
            ) : null}
            <MtnPinEntry onApproved={pinApproved} />
          </View>
        ) : (
          <View style={styles.stage} accessibilityLiveRegion="polite">
            <Pressable
              onPress={confirmOwner}
              disabled={stage !== "owner"}
              accessibilityRole="button"
              role="button"
              accessibilityLabel={status[orbStage]}
              accessibilityState={{ disabled: stage !== "owner", busy: stage === "checking" }}
              style={({ pressed }) => [styles.orbWrap, pressed && styles.pressed]}
            >
              {stage === "checking" ? (
                <Animated.View
                  style={[
                    styles.ring,
                    { backgroundColor: orb.fg },
                    {
                      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }),
                      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
                    },
                  ]}
                />
              ) : null}
              <View style={[styles.orb, { backgroundColor: orb.bg }]}>
                <Icon name={orb.icon} size={52} color={orb.fg} />
              </View>
            </Pressable>
            <AppText variant="headingSM" align="center" heading={2} importantForAccessibility="no">
              {status[orbStage]}
            </AppText>
            {detail ? (
              <AppText variant="bodySM" color={colors.textMuted} align="center">
                {detail}
              </AppText>
            ) : null}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    flex: {
      flex: 1,
    },
    body: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      gap: spacing.xl,
    },
    summary: {
      alignItems: "center" as const,
      gap: spacing.xs,
    },
    hero: {
      width: "100%" as const,
      letterSpacing: -1,
    },
    stage: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: spacing.sm,
    },
    reason: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.full,
      backgroundColor: colors.washYellow,
    },
    orbWrap: {
      width: ORB,
      height: ORB,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: spacing.sm,
    },
    orb: {
      width: ORB,
      height: ORB,
      borderRadius: ORB / 2,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    ring: {
      position: "absolute" as const,
      width: ORB,
      height: ORB,
      borderRadius: ORB / 2,
    },
    pressed: {
      opacity: 0.6,
    },
  };
}
