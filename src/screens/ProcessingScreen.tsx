import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { AppText, Button, Icon, Screen, ScreenFooter } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { announce } from "../lib/a11y";
import { formatCurrency, formatCurrencySpoken, DECORATIVE_A11Y } from "../lib/currency";
import type { FlowId } from "../content/flows";
import { missionForFlow } from "../lib/ussdMissions";
import {
  ensureCallPermission,
  isAyaDriveEnabled,
  openAyaDriveSettings,
  startMission,
  stopMission,
  subscribeAutomator,
  type UssdEvent,
  type UssdResult,
  type UssdSubscription,
} from "../services/automator";
import { getMomoPin } from "../services/momoPin";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Web-only demo outcome; never produced on device. */
function webDemoResult(flow: FlowId): UssdResult {
  return {
    sessionId: `web-${Date.now()}`,
    status: "completed",
    message: flow === "balance" ? "Your balance is GHS 2,648.34" : "Seeded demo transaction completed.",
    reference: null,
    balanceMinor: flow === "balance" ? 264834 : null,
    stepsTaken: ["Seeded demo"],
    at: Date.now(),
  };
}

type Props = {
  onDone: (result: UssdResult | null) => void;
  onCancel: () => void;
};

/**
 * The live money path: preflights Aya Drive + call permission, hands a mission
 * to the native USSD automator, and mirrors session progress to the screen
 * until the terminal result arrives. No simulation on this screen.
 */
export default function ProcessingScreen({ onDone, onCancel }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow, activeFlow, draft, pinMode } = useAppPrefs();
  const spin = useRef(new Animated.Value(0)).current;
  const attemptRef = useRef(-1);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"starting" | "running" | "error">("starting");
  const [progress, setProgress] = useState<string>(flow.processingStep);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    return () => spin.stopAnimation();
  }, [spin]);

  const retry = () => {
    setError(null);
    setPhase("starting");
    setNotice(null);
    setAttempt((a) => a + 1);
  };

  useEffect(() => {
    if (attemptRef.current === attempt) return;
    attemptRef.current = attempt;
    let unsub: UssdSubscription | null = null;
    let active = true;

    const announceResult = (result: UssdResult) => {
      if (result.status !== "completed") return;
      if (result.balanceMinor != null) {
        announce(`Your balance is ${formatCurrencySpoken(formatCurrency(result.balanceMinor / 100))}`);
      } else {
        announce("Done. Check the screen for the result.");
      }
    };

    const handleEvent = (event: UssdEvent) => {
      if (!active) return;
      switch (event.type) {
        case "state":
          setProgress(event.state.label);
          break;
        case "step":
          setProgress(event.label);
          announce(event.label);
          break;
        case "pin-required":
          setProgress("Enter your MoMo PIN on the screen now");
          announce("Enter your MoMo PIN on the screen now.");
          break;
        case "complete": {
          setPhase("running");
          announceResult(event.result);
          onDone(event.result);
          break;
        }
        case "error": {
          setPhase("error");
          setError(event.message);
          announce(event.message);
          break;
        }
      }
    };

    void (async () => {
      // Web is a demo target only: no native automator, no money movement.
      if (Platform.OS === "web") {
        await sleep(1500);
        if (!active) return;
        setPhase("running");
        onDone(webDemoResult(activeFlow));
        return;
      }

      if ((await ensureCallPermission()) === false) {
        if (!active) return;
        setPhase("error");
        setError("Aya needs call permission to dial *170#. Allow it, then try again.");
        return;
      }

      if (!(await isAyaDriveEnabled())) {
        const deadline = Date.now() + 25_000;
        while (!(await isAyaDriveEnabled())) {
          if (!active) return;
          setNotice("Aya Drive is off. I opened Settings — switch on Aya Drive, then come back here.");
          openAyaDriveSettings();
          if (Date.now() > deadline) {
            setPhase("error");
            setError("Aya Drive is still off. Turn it on in Settings, then try again.");
            return;
          }
          await sleep(1200);
        }
      }

      if (!active) return;
      const momoPin = pinMode === "auto" ? await getMomoPin() : null;
      const mission = missionForFlow(
        activeFlow,
        draft
          ? { slots: draft.slots, recipient: draft.recipient }
          : { slots: {} },
        { pinMode, pin: momoPin && pinMode === "auto" ? momoPin : undefined },
      );
      if (!mission) {
        setPhase("error");
        setError("Aya couldn't prepare that action. Say it again.");
        return;
      }

      setNotice(null);
      unsub = subscribeAutomator(handleEvent);
      let started = false;
      try {
        started = await startMission(mission);
      } catch (err) {
        console.warn("[processing] startMission threw", err);
        started = false;
      }
      if (!active) return;
      if (!started) {
        unsub?.remove();
        setPhase("error");
        setError("Aya couldn't start the USSD session. Make sure Aya Drive is on, then try again.");
        return;
      }
      setPhase("running");
      announce(`Dialing *${mission.shortCode}#`);
    })();

    return () => {
      active = false;
      unsub?.remove();
    };
  }, [attempt, draft, activeFlow, pinMode, onDone]);

  const iconName =
    activeFlow === "airtime"
      ? "phone-portrait"
      : activeFlow === "balance"
        ? "wallet"
        : "paper-plane";

  const title =
    phase === "error"
      ? "Couldn't finish"
      : activeFlow === "balance"
        ? "Checking balance…"
        : activeFlow === "airtime"
          ? "Buying airtime…"
          : "Processing…";

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.spinnerWrap} {...DECORATIVE_A11Y}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Circle
                cx={60}
                cy={60}
                r={52}
                fill="none"
                stroke={colors.borderMuted}
                strokeWidth={8}
              />
              <Circle
                cx={60}
                cy={60}
                r={52}
                fill="none"
                stroke={colors.purple}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray="326"
                strokeDashoffset="80"
              />
            </Svg>
          </Animated.View>
          <View style={styles.iconWrap}>
            <Icon name={iconName} size={36} color={colors.text} />
          </View>
        </View>

        <View>
          <AppText variant="titleLG" align="center" heading={1}>
            {title}
          </AppText>
          <AppText variant="bodyMD" align="center" color={colors.textMuted} style={styles.wait}>
            Please wait. Do not close the app.
          </AppText>
        </View>

        <View
          style={styles.summary}
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={phase === "error" ? error ?? progress : progress}
        >
          <AppText
            variant="bodyXS"
            align="center"
            color={colors.textSubtle}
            importantForAccessibility="no"
          >
            {flow.processingLabel}
          </AppText>
          <AppText variant="caption" align="center" style={styles.step} importantForAccessibility="no">
            {phase === "error" ? error : progress}
          </AppText>
        </View>

        {notice ? (
          <AppText
            variant="bodySM"
            align="center"
            color={colors.textSecondary}
            accessibilityRole="alert"
            role="alert"
            accessibilityLiveRegion="polite"
          >
            {notice}
          </AppText>
        ) : null}
      </View>

      <ScreenFooter>
        {phase === "error" ? (
          <>
            <Button onPress={retry} accessibilityLabel="Try again">
              Try again
            </Button>
            <Button onPress={onCancel} variant="ghost">
              Back
            </Button>
          </>
        ) : (
          <Button
            onPress={() => {
              void stopMission();
              onCancel();
            }}
            variant="ghost"
            accessibilityLabel="Stop and go back"
          >
            Cancel
          </Button>
        )}
      </ScreenFooter>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    body: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: spacing["4xl"],
      paddingHorizontal: spacing["6xl"],
    },
    spinnerWrap: {
      width: 120,
      height: 120,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    iconWrap: {
      position: "absolute" as const,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    wait: {
      marginTop: spacing.md,
    },
    summary: {
      width: "100%" as const,
      backgroundColor: colors.surfaceCard,
      borderRadius: radii["2xl"],
      paddingVertical: 14,
      paddingHorizontal: spacing.xl,
      gap: 6,
    },
    step: {
      marginTop: 4,
    },
  };
}