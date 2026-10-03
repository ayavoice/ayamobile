import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppText, Button, DetailRow, Icon, Screen, VoiceWave } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { vibrate } from "../lib/haptics";
import { speak } from "../lib/speech";
import { playClip, synthesize, transcribe, useVoiceRecorder } from "../lib/speechGateway";
import { fonts, radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onNext: () => void; onBack: () => void; onScan?: () => void };

type Phase = "starting" | "recording" | "transcribing" | "done";

const REPLY_DELAY_MS = 400;
/** Roughly the pace of Aya's speech, so the text keeps up with the voice. */
const TTS_WORD_MS = 260;
/** Lets the last spoken words land before the receipt replaces them. */
const RECEIPT_HOLD_MS = 700;
/** Support carries straight on into the conversation once the user stops talking. */
const SUPPORT_HANDOFF_MS = 500;

export default function ListeningScreen({ onNext, onBack, onScan }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow, activeFlow, setActiveFlow, accessibility } = useAppPrefs();
  const isSupport = activeFlow === "support";
  useEffect(() => {
    vibrate("listening", accessibility.haptics);
  }, [accessibility.haptics]);
  const recorder = useVoiceRecorder();
  const [phase, setPhase] = useState<Phase>("starting");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const done = phase === "done";
  const recording = phase === "recording";
  const stableText = transcript;
  const talking = !!transcript || !!error;

  const [bodyHeight, setBodyHeight] = useState(0);
  const [waveHeight, setWaveHeight] = useState(0);
  const lift = useRef(new Animated.Value(0)).current;
  const stackTop = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(0, (bodyHeight - waveHeight) / 2), spacing.lg],
  });

  useEffect(() => {
    Animated.timing(lift, {
      toValue: talking ? 1 : 0,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [talking, lift]);

  const [attempt, setAttempt] = useState(0);
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;

  useEffect(() => {
    let cancelled = false;
    setPhase("starting");
    setTranscript("");
    setError(null);
    recorderRef.current
      .start()
      .then(() => {
        if (!cancelled) setPhase("recording");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Couldn't start the microphone.");
        setPhase("done");
      });
    return () => {
      cancelled = true;
      if (phaseRef.current === "recording") recorderRef.current.stop().catch(() => {});
    };
  }, [attempt]);

  /** User ends the turn: stop the mic and send the clip to the gateway ASR. */
  const finishSpeaking = async () => {
    const turn = attempt;
    setPhase("transcribing");
    try {
      const uri = await recorder.stop();
      if (!uri) throw new Error("Nothing was recorded.");
      const text = await transcribe(uri);
      if (turn !== attemptRef.current) return;
      setTranscript(text);
      if (!text) setError("I didn't catch that. Please say it again.");
    } catch (e) {
      if (turn !== attemptRef.current) return;
      setError(e instanceof Error ? e.message : "Transcription failed.");
    }
    setPhase("done");
  };

  const sayAgain = () => {
    vibrate("listening", accessibility.haptics);
    setAttempt((n) => n + 1);
  };

  useEffect(() => {
    if (done) vibrate("micOff", accessibility.haptics);
  }, [done, accessibility.haptics]);

  const replyWords = useMemo(() => flow.readAloud.split(" "), [flow.readAloud]);
  const [spoken, setSpoken] = useState(0);
  const replyText = replyWords.slice(0, spoken).join(" ");
  const replying = spoken > 0;
  const replyDone = spoken >= replyWords.length;
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setShowReceipt(false);
    receiptIn.setValue(0);
    if (!replyDone) return;
    const timeoutId = setTimeout(() => {
      setShowReceipt(true);
      Animated.timing(receiptIn, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, RECEIPT_HOLD_MS);
    return () => clearTimeout(timeoutId);
  }, [replyDone, receiptIn]);
  const scrollRef = useRef<ScrollView>(null);

  const [scrolledUnder, setScrolledUnder] = useState(false);
  const edgeFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(edgeFade, {
      toValue: scrolledUnder ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [scrolledUnder, edgeFade]);

  useEffect(() => {
    setSpoken(0);
    if (!done || isSupport || error) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let stopAudio: (() => void) | undefined;
    const reveal = (wordMs: number) => {
      const say = (i: number) => {
        setSpoken(i);
        if (i < replyWords.length) timeoutId = setTimeout(() => say(i + 1), wordMs);
      };
      say(1);
    };
    timeoutId = setTimeout(async () => {
      try {
        const clip = await synthesize(flow.readAloud);
        if (cancelled) return;
        stopAudio = playClip(clip.uri);
        reveal(clip.durationSec > 0 ? (clip.durationSec * 1000) / replyWords.length : TTS_WORD_MS);
      } catch (e) {
        if (cancelled) return;
        console.warn("Speech gateway TTS failed", e);
        speak(flow.readAloud);
        reveal(TTS_WORD_MS);
      }
    }, REPLY_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      stopAudio?.();
    };
  }, [done, error, replyWords, flow.readAloud, isSupport]);

  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  useEffect(() => {
    if (!done || !isSupport || error) return;
    const t = setTimeout(() => onNextRef.current(), SUPPORT_HANDOFF_MS);
    return () => clearTimeout(t);
  }, [done, isSupport, error]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            style={styles.headerBtn}
          >
            <Icon name="chevron-back" size={26} color={colors.text} />
          </Pressable>
        </View>
        <View
          style={[styles.micPill, recording ? styles.micPillOn : styles.micPillOff]}
          accessible
          accessibilityLabel={recording ? "Microphone on, listening" : "Microphone off"}
          accessibilityLiveRegion="polite"
        >
          <Icon name={recording ? "mic" : "mic-off"} size={14} color={recording ? colors.success : colors.textMuted} />
          <AppText variant="labelXS" color={recording ? colors.text : colors.textMuted} importantForAccessibility="no">
            {recording ? "Listening" : "Mic off"}
          </AppText>
        </View>
        <View style={styles.headerActions}>
          {onScan ? (
            <Pressable
              onPress={onScan}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Scan to pay"
              accessibilityHint="Opens the camera to scan a merchant QR code"
              hitSlop={8}
              style={styles.headerBtn}
            >
              <Icon name="scan-outline" size={22} color={colors.text} />
            </Pressable>
          ) : null}
          {!isSupport ? (
            <Pressable
              onPress={() => setActiveFlow("support")}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Get help"
              accessibilityHint="Switches to reporting a problem by voice"
              hitSlop={8}
              style={styles.headerBtn}
            >
              <Icon name="help-circle-outline" size={24} color={colors.text} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.flex}>
        <AppText heading={1} style={styles.srOnly}>
          {done ? (isSupport ? "I hear you" : "Got it") : isSupport ? "Take your time..." : "Listening..."}
        </AppText>

        <View style={styles.body} onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}>
          <Animated.View style={[styles.stack, { top: stackTop, opacity: bodyHeight ? 1 : 0 }]}>
            <View style={styles.waveWrap} onLayout={(e) => setWaveHeight(e.nativeEvent.layout.height)}>
              <VoiceWave />
            </View>
            <View style={styles.flex}>
              <ScrollView
                ref={scrollRef}
                style={styles.flex}
                contentContainerStyle={styles.chat}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                onScroll={(e) => setScrolledUnder(e.nativeEvent.contentOffset.y > 1)}
                scrollEventThrottle={16}
              >
                <View
                  accessible
                  accessibilityLabel={stableText ? `You said: ${stableText}` : "Your words"}
                  accessibilityLiveRegion="polite"
                  role="log"
                  aria-atomic={false}
                  style={styles.userTurn}
                >
                  <AppText variant="titleMD" align="right" color={colors.text} importantForAccessibility="no">
                    {stableText}
                  </AppText>
                </View>

                {error ? (
                  <View style={styles.ayaTurn} accessible accessibilityLabel={`Aya says: ${error}`} accessibilityLiveRegion="polite">
                    <AppText variant="labelXS" color={colors.purple} importantForAccessibility="no">
                      Aya
                    </AppText>
                    <AppText variant="titleMD" align="left" color={colors.text} importantForAccessibility="no">
                      {error}
                    </AppText>
                  </View>
                ) : null}

                {replying ? (
                  <View style={styles.ayaTurn}>
                    <AppText variant="labelXS" color={colors.purple} importantForAccessibility="no">
                      Aya
                    </AppText>
                    {!showReceipt ? (
                      <View accessible accessibilityLabel={`Aya says: ${flow.readAloud}`}>
                        <AppText variant="titleMD" align="left" color={colors.text} importantForAccessibility="no">
                          {replyText}
                        </AppText>
                      </View>
                    ) : (
                      <Animated.View
                        style={[
                          styles.intentCard,
                          {
                            opacity: receiptIn,
                            transform: [
                              { translateY: receiptIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                            ],
                          },
                        ]}
                      >
                        <AppText variant="overline" color={colors.textMuted}>
                          {flow.intentLabel}
                        </AppText>
                        {flow.details.map((d, i) => (
                          <DetailRow
                            key={d.label}
                            label={d.label}
                            value={d.value}
                            last={i === flow.details.length - 1}
                          />
                        ))}
                        <View style={styles.pinNote}>
                          <Icon name="shield-checkmark" size={14} color={colors.success} />
                          <AppText variant="caption" color={colors.textMuted}>
                            Nothing happens until you approve privately.
                          </AppText>
                        </View>
                      </Animated.View>
                    )}
                  </View>
                ) : null}

              </ScrollView>
              <Animated.View
                pointerEvents="none"
                style={[styles.edgeFade, { opacity: edgeFade }]}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <LinearGradient
                  colors={[colors.background, `${colors.background}00`]}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.actions}>
          {done ? (
            <>
              <Button
                onPress={onNext}
                disabled={!showReceipt}
                style={styles.mainBtn}
                accessibilityLabel="That's right, continue"
              >
                That's right, continue
              </Button>
              <View style={styles.secondaryRow}>
                <Pressable
                  onPress={sayAgain}
                  accessibilityRole="button"
                  role="button"
                  accessibilityLabel="Not right, say it again"
                  hitSlop={8}
                  style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}
                >
                  <Icon name="refresh" size={18} color={colors.text} />
                  <AppText
                    variant="bodySM"
                    color={colors.text}
                    style={styles.textBtnLabel}
                    importantForAccessibility="no"
                  >
                    Say it again
                  </AppText>
                </Pressable>
                <View style={styles.divider} />
                <Pressable
                  onPress={onBack}
                  accessibilityRole="button"
                  role="button"
                  accessibilityLabel="Cancel"
                  hitSlop={8}
                  style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}
                >
                  <Icon name="close" size={18} color={colors.textMuted} />
                  <AppText
                    variant="bodySM"
                    color={colors.textMuted}
                    style={styles.textBtnLabel}
                    importantForAccessibility="no"
                  >
                    Cancel
                  </AppText>
                </Pressable>
              </View>
            </>
          ) : (
            <Button
              onPress={finishSpeaking}
              disabled={!recording}
              style={styles.mainBtn}
              accessibilityLabel="I'm done speaking"
            >
              <Icon name="checkmark" size={20} color={colors.textOnYellow} />
              <AppText variant="button" color={colors.textOnYellow}>
                I'm done speaking
              </AppText>
            </Button>
          )}
        </View>
      </View>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: spacing.sm,
      minHeight: 52,
      flexShrink: 0,
    },
    micPill: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.full,
    },
    micPillOn: {
      backgroundColor: colors.successSurface,
    },
    micPillOff: {
      backgroundColor: colors.surfaceCard,
    },
    intentCard: {
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceCard,
      gap: spacing.xs,
    },
    pinNote: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    mainBtn: {
      alignSelf: "center" as const,
      minWidth: 240,
      paddingHorizontal: spacing["2xl"],
    },
    secondaryRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: spacing.lg,
    },
    textBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      minHeight: 44,
      paddingHorizontal: spacing.sm,
    },
    textBtnLabel: {
      fontFamily: fonts.body.bold,
    },
    pressed: {
      opacity: 0.6,
    },
    divider: {
      width: 1,
      height: 16,
      backgroundColor: colors.border,
    },
    headerActions: {
      width: 88,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "flex-end" as const,
    },
    headerLeft: {
      width: 88,
    },
    headerBtn: {
      width: 44,
      height: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    body: {
      flex: 1,
      overflow: "hidden" as const,
    },
    stack: {
      position: "absolute" as const,
      left: spacing.xl,
      right: spacing.xl,
      bottom: 0,
      gap: spacing.xl,
    },
    waveWrap: {
      alignItems: "center" as const,
    },
    edgeFade: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      height: 56,
    },
    chat: {
      flexGrow: 1,
      gap: spacing.xl,
      paddingBottom: spacing["2xl"],
    },
    userTurn: {
      alignSelf: "flex-end" as const,
      maxWidth: "88%" as const,
    },
    ayaTurn: {
      alignSelf: "stretch" as const,
      gap: spacing.xs,
    },
    actions: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      flexShrink: 0,
    },
    srOnly: {
      position: "absolute" as const,
      width: 1,
      height: 1,
      overflow: "hidden" as const,
      opacity: 0,
    },
  };
}
