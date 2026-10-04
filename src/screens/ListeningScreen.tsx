import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppText, Button, DetailRow, Icon, Screen, VoiceWave } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import {
  DEFAULT_NICKNAMES,
  initialState,
  step,
  toAppRequest,
  type AgentContext,
  type DialogueEvent,
  type DialogueState,
  type Effect,
  type Lang,
} from "../agent";
import { SAVED_RECIPIENTS, demoLookupName, isValidPhone, recipientLine, transferFee } from "../content/send";
import { vibrate, type HapticPattern } from "../lib/haptics";
import { formatCurrency, formatCurrencySpoken } from "../lib/currency";
import { transcribe, useVoiceRecorder } from "../lib/speechGateway";
import { sayAloud, type Utterance } from "../lib/voice";
import { fonts, radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = {
  /** The user confirmed the read-back; the mic is closed and private approval comes next. */
  onConfirmed: () => void;
  /** Open the tap-based send screen with what Aya understood so far. */
  onEdit: () => void;
  /** Hand the conversation to support. */
  onHandoff: () => void;
  onBack: () => void;
  onScan?: () => void;
};

type Mic = "starting" | "recording" | "transcribing" | "speaking" | "idle";

/** High-risk transfers wait this long before "Continue" can be pressed (architecture.md §6.4). */
const COOLING_OFF_MS = 5000;
/** Pace of Aya's words at normal speech rate, matching the Support screen. */
const WORD_MS = 230;
const CARD_HOLD_MS = 350;

const HAPTIC_FOR: Partial<Record<Effect, HapticPattern>> = {
  "haptic:listening": "listening",
  "haptic:understood": "understood",
  "haptic:micOff": "micOff",
  "haptic:failed": "failed",
};

const QUICK_ACTIONS: { label: string; say: string }[] = [
  { label: "Send money", say: "send money" },
  { label: "Check balance", say: "check my balance" },
  { label: "Buy airtime", say: "buy airtime" },
];

export default function ListeningScreen({ onConfirmed, onEdit, onHandoff, onBack, onScan }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const prefs = useAppPrefs();
  const { activeFlow, setActiveFlow, language, accessibility, preApproval } = prefs;
  const isSupport = activeFlow === "support";

  const ctx = useMemo<AgentContext>(
    () => ({
      preferredLang: language as Lang,
      contacts: SAVED_RECIPIENTS,
      nicknames: DEFAULT_NICKNAMES,
      lookupName: (phone) => {
        const saved = SAVED_RECIPIENTS.find((r) => r.kind === "wallet" && r.phone === phone);
        if (saved) return saved.name;
        return isValidPhone(phone) ? demoLookupName(phone) : null;
      },
      largeAmount: preApproval?.perPayment ?? 500,
      veryLargeAmount: Math.max(1000, preApproval?.perDay ?? 1000),
    }),
    [language, preApproval],
  );

  const recorder = useVoiceRecorder();
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;

  const [dlg, setDlg] = useState<DialogueState>(() => initialState(language as Lang));
  const dlgRef = useRef(dlg);
  const [mic, setMic] = useState<Mic>("starting");
  const micRef = useRef(mic);
  micRef.current = mic;
  const [error, setError] = useState<string | null>(null);
  const [tapMode, setTapMode] = useState(false);
  const tapModeRef = useRef(tapMode);
  tapModeRef.current = tapMode;
  const [typed, setTyped] = useState("");
  const [coolingLeft, setCoolingLeft] = useState(0);
  const speechRef = useRef<Utterance | null>(null);
  const mounted = useRef(true);

  /** Aya's latest turn appears word by word while she speaks; `null` shows every turn in full. */
  const [reveal, setReveal] = useState<{ turn: number; shown: number } | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const startReveal = useCallback((turn: number, words: number, rate: number) => {
    clearTimeout(revealTimer.current);
    const ms = WORD_MS * (0.95 / rate);
    const tick = (shown: number) => {
      setReveal({ turn, shown });
      if (shown < words) revealTimer.current = setTimeout(() => tick(shown + 1), ms);
    };
    tick(1);
  }, []);

  const finishReveal = useCallback(() => {
    clearTimeout(revealTimer.current);
    setReveal(null);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(revealTimer.current);
      speechRef.current?.stop();
      if (micRef.current === "recording") recorderRef.current.stop().catch(() => {});
    };
  }, []);

  const startListening = useCallback(() => {
    if (!mounted.current) return;
    setError(null);
    setMic("starting");
    recorderRef.current
      .start()
      .then(() => {
        if (!mounted.current) return;
        setMic("recording");
        vibrate("listening", accessibility.haptics);
      })
      .catch((e: unknown) => {
        if (!mounted.current) return;
        setError(e instanceof Error ? e.message : "Couldn't start the microphone.");
        setMic("idle");
      });
  }, [accessibility.haptics]);

  const stopRecordingQuietly = useCallback(async () => {
    if (micRef.current !== "recording") return;
    await recorderRef.current.stop().catch(() => null);
  }, []);

  const applyRequest = useCallback(
    (state: DialogueState, withRisk: boolean) => {
      if (!state.draft) return;
      const req = toAppRequest(state.draft);
      prefs.setActiveFlow(req.flow);
      prefs.setTransferAmount(req.amountRaw);
      prefs.setTransferRecipient(req.recipient);
      if (req.topUpKind) prefs.setTopUpKind(req.topUpKind);
      if (withRisk) prefs.setRiskLevel(state.risk?.level ?? "low");
    },
    [prefs],
  );

  const speechRate = useCallback(
    (state: DialogueState) => {
      const base = accessibility.speechSpeed === 1 ? 0.8 : accessibility.speechSpeed === 3 ? 1.1 : 0.95;
      return state.repeats >= 2 || state.phase === "cooling_off" ? Math.min(base, 0.8) : base;
    },
    [accessibility.speechSpeed],
  );

  const dispatch = useCallback(
    (event: DialogueEvent) => {
      const result = step(dlgRef.current, event, ctx);
      dlgRef.current = result.state;
      setDlg(result.state);

      for (const effect of result.effects) {
        const pattern = HAPTIC_FOR[effect];
        if (pattern) vibrate(pattern, accessibility.haptics);
      }
      if (result.effects.includes("offer_tap")) setTapMode(true);

      const next = () => {
        if (!mounted.current) return;
        const s = result.state;
        if (result.effects.includes("navigate:confirmed")) {
          applyRequest(s, true);
          onConfirmed();
        } else if (result.effects.includes("navigate:cancelled")) {
          onBack();
        } else if (result.effects.includes("navigate:handoff") && s.handoff) {
          setActiveFlow("support");
          prefs.setSpokenRequest(s.handoff.text);
          onHandoff();
        } else if (!tapModeRef.current) {
          startListening();
        } else {
          setMic("idle");
        }
      };

      if (!result.say) return next();
      setMic("speaking");
      speechRef.current?.stop();
      const rate = speechRate(result.state);
      const lastIdx = result.state.turns.length - 1;
      const last = result.state.turns[lastIdx];
      if (last?.who === "aya") startReveal(lastIdx, last.text.split(" ").length, rate);
      const utterance = sayAloud(result.say.text, result.state.lang, rate);
      speechRef.current = utterance;
      utterance.done.then(() => {
        if (speechRef.current === utterance) {
          speechRef.current = null;
          finishReveal();
        }
        next();
      });
    },
    [
      ctx,
      accessibility.haptics,
      applyRequest,
      onConfirmed,
      onBack,
      onHandoff,
      setActiveFlow,
      prefs,
      startListening,
      speechRate,
      startReveal,
      finishReveal,
    ],
  );

  // Open the conversation and the microphone once.
  useEffect(() => {
    if (!isSupport) {
      const r = step(dlgRef.current, { type: "start" }, ctx);
      dlgRef.current = r.state;
      setDlg(r.state);
    }
    startListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleText = useCallback(
    (text: string) => {
      if (isSupport) {
        if (!text) {
          setError("I didn't catch that. Please say it again.");
          setMic("idle");
          return;
        }
        prefs.setSpokenRequest(text);
        onHandoff();
        return;
      }
      dispatch({ type: "utterance", text });
    },
    [isSupport, dispatch, prefs, onHandoff],
  );

  const finishSpeaking = async () => {
    setMic("transcribing");
    try {
      const uri = await recorder.stop();
      if (!uri) throw new Error("Nothing was recorded.");
      const text = await transcribe(uri);
      if (!mounted.current) return;
      handleText(text);
    } catch (e) {
      if (!mounted.current) return;
      setError(`${e instanceof Error ? e.message : "Something went wrong."} You can type instead.`);
      setMic("idle");
    }
  };

  /** Typing takes over from the mic so the two never run at once. */
  const onTypeFocus = async () => {
    if (micRef.current !== "recording") return;
    await stopRecordingQuietly();
    setMic("idle");
  };

  const switchToTyping = async () => {
    await stopRecordingQuietly();
    speechRef.current?.stop();
    setTapMode(true);
    setMic("idle");
  };

  const switchToVoice = () => {
    setTapMode(false);
    startListening();
  };

  const submitTyped = async () => {
    const text = typed.trim();
    if (!text) return;
    setTyped("");
    await stopRecordingQuietly();
    speechRef.current?.stop();
    handleText(text);
  };

  const command = async (cmd: "CONFIRM" | "CANCEL" | "REPEAT") => {
    await stopRecordingQuietly();
    speechRef.current?.stop();
    dispatch({ type: "command", command: cmd });
  };

  const skipSpeech = () => speechRef.current?.stop();

  const quickAction = async (say: string) => {
    await stopRecordingQuietly();
    dispatch({ type: "utterance", text: say });
  };

  const chooseCandidate = async (index: number) => {
    const c = dlg.draft?.candidates?.[index];
    if (!c) return;
    await stopRecordingQuietly();
    speechRef.current?.stop();
    dispatch({ type: "choose_recipient", recipient: c });
  };

  const editOnScreen = async () => {
    await stopRecordingQuietly();
    speechRef.current?.stop();
    applyRequest(dlgRef.current, false);
    onEdit();
  };

  // Cooling-off: a short, visible pause before "Continue" works. The user can still cancel at once.
  useEffect(() => {
    if (dlg.phase !== "cooling_off") {
      setCoolingLeft(0);
      return;
    }
    const until = Date.now() + COOLING_OFF_MS;
    setCoolingLeft(Math.ceil(COOLING_OFF_MS / 1000));
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setCoolingLeft(left);
      if (left === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [dlg.phase]);

  const scrollRef = useRef<ScrollView>(null);
  const [scrolledUnder, setScrolledUnder] = useState(false);
  const [edgeFade] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(edgeFade, { toValue: scrolledUnder ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [scrolledUnder, edgeFade]);

  const userSpoke = recorder.heard || mic === "transcribing" || dlg.turns.some((t) => t.who === "user");
  const lifted = userSpoke || !!error || tapMode;
  const [bodyHeight, setBodyHeight] = useState(0);
  const [waveHeight, setWaveHeight] = useState(0);
  const [lift] = useState(() => new Animated.Value(0));
  const stackTop = lift.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(0, (bodyHeight - waveHeight) / 2), spacing.lg],
  });
  useEffect(() => {
    Animated.timing(lift, {
      toValue: lifted ? 1 : 0,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [lifted, lift]);

  const reviewing = dlg.phase === "readback" || dlg.phase === "cooling_off";
  const draft = dlg.draft;
  const recording = mic === "recording";
  const busy = mic === "starting" || mic === "transcribing";
  const hasTyped = typed.trim().length > 0;
  const micLabel = recording ? "I'm done speaking" : mic === "speaking" ? "Skip and speak" : "Tap to speak";
  const composerMode = hasTyped ? "send" : mic === "speaking" ? "stopSpeech" : draft ? "cancel" : "idle";
  const composerStops = composerMode === "stopSpeech" || composerMode === "cancel";
  const composerLabel =
    composerMode === "stopSpeech" ? "Stop Aya talking" : composerMode === "cancel" ? "Cancel this request" : "Send to Aya";
  const composerPress = () => {
    if (composerMode === "send") submitTyped();
    else if (composerMode === "stopSpeech") skipSpeech();
    else if (composerMode === "cancel") command("CANCEL");
  };
  const micAction = () => {
    if (recording) finishSpeaking();
    else if (mic === "speaking") skipSpeech();
    else startListening();
  };
  const candidates = dlg.expecting === "recipient_choice" ? (draft?.candidates ?? []) : [];

  const card = useMemo(() => {
    if (!reviewing || !draft) return null;
    const rows: { label: string; value: string }[] = [];
    const r = draft.recipient?.value;
    const amount = draft.amount?.value ?? 0;
    switch (draft.intent) {
      case "TRANSFER_MONEY": {
        rows.push({ label: "Amount", value: formatCurrency(amount) });
        if (r) {
          rows.push({ label: "To", value: r.registeredName });
          rows.push({ label: "Account", value: recipientLine(r.recipient) });
          const fee =
            r.recipient.kind === "wallet" && r.recipient.network === "merchant"
              ? 0
              : transferFee(amount, r.recipient.kind);
          rows.push({ label: "Fee", value: fee > 0 ? formatCurrency(fee) : "Free" });
        }
        return { title: "SEND MONEY", rows };
      }
      case "CHECK_BALANCE":
        return { title: "CHECK BALANCE", rows: [{ label: "Account", value: "Your MTN MoMo" }] };
      case "BUY_AIRTIME":
      case "BUY_DATA":
        rows.push({ label: "Amount", value: formatCurrency(amount) });
        rows.push({
          label: "For",
          value: r && !draft.forSelf ? `${r.registeredName} · ${recipientLine(r.recipient)}` : "Your number",
        });
        return { title: draft.intent === "BUY_DATA" ? "BUY DATA" : "BUY AIRTIME", rows };
    }
  }, [reviewing, draft]);

  const cardShown = !!card && !reveal;
  const [cardIn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!cardShown) {
      cardIn.setValue(0);
      return;
    }
    const t = setTimeout(() => {
      Animated.timing(cardIn, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, CARD_HOLD_MS);
    return () => clearTimeout(t);
  }, [cardShown, cardIn]);

  const heading = isSupport
    ? "Take your time…"
    : reviewing
      ? "Check the details"
      : dlg.phase === "clarifying"
        ? "One more thing"
        : "Listening…";

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerSide}>
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
            {recording
              ? "Listening"
              : mic === "speaking"
                ? "Aya is speaking"
                : mic === "transcribing"
                  ? "Thinking"
                  : "Mic off"}
          </AppText>
        </View>
        <View style={[styles.headerSide, styles.headerRight]}>
          {onScan ? (
            <Pressable
              onPress={onScan}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Scan to pay"
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

      <AppText heading={1} style={styles.srOnly}>
        {heading}
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
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              onScroll={(e) => setScrolledUnder(e.nativeEvent.contentOffset.y > 1)}
              scrollEventThrottle={16}
            >
              {dlg.turns.map((turn, i) => {
                const recent = i >= dlg.turns.length - 2 && !error;
                const variant = recent ? "titleMD" : "bodyLG";
                const tone = recent ? colors.text : colors.textMuted;
                if (turn.who === "user") {
                  return (
                    <View key={i} style={styles.userTurn} accessible accessibilityLabel={`You said: ${turn.text}`}>
                      <AppText variant={variant} align="right" color={tone} importantForAccessibility="no">
                        {turn.text}
                      </AppText>
                    </View>
                  );
                }
                const text = reveal?.turn === i ? turn.text.split(" ").slice(0, reveal.shown).join(" ") : turn.text;
                return (
                  <View
                    key={i}
                    style={styles.ayaTurn}
                    accessible
                    accessibilityLabel={`Aya says: ${turn.text}`}
                    accessibilityLiveRegion={i === dlg.turns.length - 1 ? "polite" : "none"}
                  >
                    <AppText variant="labelXS" color={colors.purple} importantForAccessibility="no">
                      Aya
                    </AppText>
                    <AppText variant={variant} color={tone} importantForAccessibility="no">
                      {text || "•••"}
                    </AppText>
                  </View>
                );
              })}

              {candidates.length > 0 ? (
                <View
                  style={styles.choices}
                  accessibilityRole="radiogroup"
                  role="radiogroup"
                  accessibilityLabel="Choose who to send to"
                >
                  {candidates.map((c, i) => (
                    <Pressable
                      key={`${c.name}-${i}`}
                      onPress={() => chooseCandidate(i)}
                      accessibilityRole="button"
                      role="button"
                      accessibilityLabel={`${c.name}, ${recipientLine(c)}`}
                      style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
                    >
                      <AppText variant="labelLG" color={colors.text}>
                        {c.name}
                      </AppText>
                      <AppText variant="caption" color={colors.textMuted}>
                        {recipientLine(c)}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {card && cardShown ? (
                <Animated.View
                  style={[
                    styles.card,
                    {
                      opacity: cardIn,
                      transform: [{ translateY: cardIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                    },
                  ]}
                  accessible
                  accessibilityLabel={`${card.title}. ${card.rows.map((r) => `${r.label}, ${r.label === "Amount" || r.label === "Fee" ? formatCurrencySpoken(r.value) : r.value}`).join(". ")}`}
                >
                  {dlg.phase === "cooling_off" ? (
                    <View style={styles.warning}>
                      <Icon name="shield-half" size={16} color={colors.text} />
                      <AppText variant="labelXS" color={colors.text} style={styles.flex}>
                        Take a moment. Aya and MTN never ask you to send money to fix an account or claim a prize.
                      </AppText>
                    </View>
                  ) : null}
                  <AppText variant="overline" color={colors.textMuted} importantForAccessibility="no">
                    {card.title}
                  </AppText>
                  {card.rows.map((row, i) => (
                    <DetailRow key={row.label} label={row.label} value={row.value} last={i === card.rows.length - 1} />
                  ))}
                  <View style={styles.pinNote} importantForAccessibility="no">
                    <Icon name="shield-checkmark" size={14} color={colors.success} />
                    <AppText variant="caption" color={colors.textMuted}>
                      Nothing happens until you approve privately.
                    </AppText>
                  </View>
                </Animated.View>
              ) : null}

              {error ? (
                <View
                  style={styles.ayaTurn}
                  accessible
                  accessibilityLabel={`Aya says: ${error}`}
                  accessibilityLiveRegion="polite"
                >
                  <AppText variant="labelXS" color={colors.purple} importantForAccessibility="no">
                    Aya
                  </AppText>
                  <AppText variant="titleMD" color={colors.text} importantForAccessibility="no">
                    {error}
                  </AppText>
                </View>
              ) : null}

              {tapMode && !draft && !isSupport ? (
                <View style={styles.choices}>
                  {QUICK_ACTIONS.map((a) => (
                    <Pressable
                      key={a.label}
                      onPress={() => quickAction(a.say)}
                      accessibilityRole="button"
                      role="button"
                      style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
                    >
                      <AppText variant="labelLG" color={colors.text}>
                        {a.label}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </ScrollView>
            <Animated.View
              pointerEvents="none"
              style={[styles.edgeFade, { opacity: edgeFade }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <LinearGradient colors={[colors.background, `${colors.background}00`]} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        {reviewing ? (
          <>
            <Button
              onPress={() => command("CONFIRM")}
              variant="purple"
              disabled={coolingLeft > 0}
              style={styles.mainBtn}
              accessibilityLabel={coolingLeft > 0 ? `Take a moment, ${coolingLeft} seconds` : "That's right, continue"}
            >
              {coolingLeft > 0 ? `Take a moment… ${coolingLeft}` : "That's right, continue"}
            </Button>
            <View style={styles.secondaryRow}>
              <TextLink icon="refresh" label="Repeat" onPress={() => command("REPEAT")} />
              {draft?.intent === "TRANSFER_MONEY" ? (
                <>
                  <View style={styles.divider} />
                  <TextLink icon="create-outline" label="Edit" onPress={editOnScreen} />
                </>
              ) : null}
              <View style={styles.divider} />
              <TextLink icon="close" label="Cancel" muted onPress={() => command("CANCEL")} />
            </View>
          </>
        ) : !tapMode ? (
          <>
            <Button
              onPress={micAction}
              loading={busy}
              style={styles.mainBtn}
              accessibilityLabel={micLabel}
            >
              <Icon
                name={recording ? "checkmark" : mic === "speaking" ? "play-skip-forward" : "mic"}
                size={20}
                color={colors.textOnYellow}
              />
              <AppText variant="button" color={colors.textOnYellow}>
                {micLabel}
              </AppText>
            </Button>
            <View style={styles.secondaryRow}>
              <TextLink icon="keypad-outline" label="Type instead" onPress={switchToTyping} />
              {draft ? (
                <>
                  <View style={styles.divider} />
                  <TextLink icon="close" label="Cancel" muted onPress={() => command("CANCEL")} />
                </>
              ) : null}
            </View>
          </>
        ) : (
          <>
            <View style={styles.composer}>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                onSubmitEditing={submitTyped}
                onFocus={onTypeFocus}
                placeholder={isSupport ? "Tell Aya what happened" : "Type to Aya"}
                placeholderTextColor={colors.textSubtle}
                returnKeyType="send"
                autoFocus={tapMode}
                style={[styles.typeInput, { color: colors.text }]}
                underlineColorAndroid="transparent"
                cursorColor={colors.purple}
                selectionColor={colors.purple}
                accessibilityLabel="Type your request to Aya"
              />
              {!hasTyped ? (
                <Pressable
                  onPress={switchToVoice}
                  accessibilityRole="button"
                  role="button"
                  accessibilityLabel="Speak instead"
                  hitSlop={4}
                  style={({ pressed }) => [styles.composerGhostBtn, pressed && styles.pressed]}
                >
                  <Icon name="mic-outline" size={24} color={colors.text} />
                </Pressable>
              ) : null}
              <Pressable
                onPress={composerPress}
                disabled={composerMode === "idle"}
                accessibilityRole="button"
                role="button"
                accessibilityLabel={composerLabel}
                accessibilityState={{ disabled: composerMode === "idle" }}
                style={({ pressed }) => [
                  styles.composerBtn,
                  composerMode === "idle" && styles.composerBtnBusy,
                  pressed && styles.pressed,
                ]}
              >
                <Icon
                  name={composerStops ? "stop" : "arrow-up"}
                  size={composerStops ? 18 : 22}
                  color={composerMode === "idle" ? colors.textSubtle : colors.textOnYellow}
                />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

function TextLink({
  icon,
  label,
  onPress,
  muted,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const color = muted ? colors.textMuted : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      role="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}
    >
      <Icon name={icon as never} size={18} color={color} />
      <AppText variant="bodySM" color={color} style={styles.textBtnLabel} importantForAccessibility="no">
        {label}
      </AppText>
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return {
    flex: { flex: 1 },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: spacing.sm,
      minHeight: 52,
      flexShrink: 0,
    },
    headerSide: { width: 88, flexDirection: "row" as const, alignItems: "center" as const },
    headerRight: { justifyContent: "flex-end" as const },
    headerBtn: { width: 44, height: 44, alignItems: "center" as const, justifyContent: "center" as const },
    micPill: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.full,
    },
    micPillOn: { backgroundColor: colors.successSurface },
    micPillOff: { backgroundColor: colors.surfaceCard },
    body: { flex: 1, overflow: "hidden" as const },
    stack: { position: "absolute" as const, left: 0, right: 0, bottom: 0 },
    waveWrap: { alignItems: "center" as const, gap: spacing.xs, flexShrink: 0, paddingBottom: spacing.sm },
    chat: { flexGrow: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
    edgeFade: { position: "absolute" as const, top: 0, left: 0, right: 0, height: 48 },
    userTurn: { alignSelf: "flex-end" as const, maxWidth: "88%" as const, gap: 2 },
    ayaTurn: { alignSelf: "stretch" as const, gap: spacing.xs },
    choices: { gap: spacing.sm },
    choice: {
      minHeight: 56,
      justifyContent: "center" as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceCard,
      gap: 2,
    },
    card: {
      marginTop: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceCard,
      gap: spacing.xs,
    },
    warning: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      padding: spacing.sm,
      marginBottom: spacing.xs,
      borderRadius: radii.lg,
      backgroundColor: colors.washYellow,
    },
    pinNote: { flexDirection: "row" as const, alignItems: "center" as const, gap: spacing.xs, marginTop: spacing.xs },
    actions: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      flexShrink: 0,
    },
    mainBtn: { alignSelf: "center" as const, minWidth: 240, paddingHorizontal: spacing["2xl"] },
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
    textBtnLabel: { fontFamily: fonts.body.bold },
    divider: { width: 1, height: 16, backgroundColor: colors.border },
    pressed: { opacity: 0.6 },
    disabled: { opacity: 0.4 },
    composer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      minHeight: 60,
      paddingLeft: spacing.lg,
      paddingRight: 6,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: "transparent",
      backgroundColor: colors.surfaceCard,
    },
    typeInput: {
      flex: 1,
      minHeight: 48,
      paddingVertical: spacing.sm,
      fontFamily: fonts.body.regular,
      fontSize: 16,
      textAlignVertical: "center" as const,
      includeFontPadding: false,
      ...({ outlineStyle: "none" } as object),
    },
    composerBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: colors.purple,
    },
    composerGhostBtn: {
      width: 44,
      height: 48,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    composerBtnLive: { backgroundColor: colors.success },
    composerBtnBusy: { backgroundColor: colors.surfaceGhost },
    srOnly: { position: "absolute" as const, width: 1, height: 1, overflow: "hidden" as const, opacity: 0 },
  };
}
