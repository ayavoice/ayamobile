import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppText, Button, Icon, Screen, VoiceWave } from "../components/ui";
import ComfortCard from "../components/ComfortCard";
import { COMFORT_SPOKEN } from "../content/emotionalSupport";
import {
  STATUS_LABEL,
  SUPPORT_TRANSACTIONS,
  detectSupportSignals,
  spokenReference,
  type SupportCategory,
  type SupportTransaction,
} from "../content/support";
import {
  getNode,
  nextGuess,
  routeNode,
  startNode,
  type CardKind,
  type ConversationContext,
  type NodeId,
  type Reply,
  type SupportNode,
} from "../content/supportConversation";
import { useAppPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y, speakMaybeCurrency } from "../lib/currency";
import { vibrate } from "../lib/haptics";
import { speak } from "../lib/speech";
import { simulatePartials, stableWordCount } from "../lib/transcript";
import { fonts, radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onDone: () => void; onBack: () => void };

type Turn = { id: number; who: "aya" | "user"; text: string; node?: NodeId; card?: CardKind; txId?: string };

type Overrides = Partial<Pick<ConversationContext, "category" | "pressured" | "alertTrusted">> & { txId?: string };

const OPEN_DELAY_MS = 500;
const REPLY_DELAY_MS = 450;
const PARTIAL_STEP_MS = 150;
const ENDPOINT_MS = 450;
const CARD_HOLD_MS = 350;
/** Aya slows down when the user is stressed or confused. */
const WORD_MS = { steady: 230, gentle: 320 } as const;
/** Cards that stay in the conversation after Aya moves on. */
const PERSISTENT_CARDS: CardKind[] = ["ticket", "reversal", "arrived"];
/** Steps where Aya names the payment she found. */
const ANNOUNCING: NodeId[] = ["askWhat", "reversalOffer", "checking", "mtnCase", "fraud"];

function spokenForm(text: string, ref: string | null) {
  const withRef = ref ? text.replace(ref, spokenReference(ref)) : text;
  return withRef.replace(/GH₵[\d,]+(\.\d{2})?/g, (m) => speakMaybeCurrency(m));
}

export default function SupportScreen({ onDone, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow, language, accessibility, supportTicket, openSupportTicket, addTicketEvent, requestCallback } =
    useAppPrefs();

  const signals = useMemo(
    () => detectSupportSignals(`${flow.utterance.transcript} ${flow.utterance.gloss}`),
    [flow.utterance.transcript, flow.utterance.gloss],
  );

  const [turns, setTurns] = useState<Turn[]>(() => [{ id: 0, who: "user", text: flow.utterance.transcript }]);
  const [node, setNode] = useState<NodeId | null>(null);
  const [txId, setTxId] = useState(SUPPORT_TRANSACTIONS[0].id);
  const [category, setCategory] = useState<SupportCategory | null>(signals.suggestedCategory);
  const [pressured, setPressured] = useState(signals.pressure);
  const [alertTrusted, setAlertTrusted] = useState(false);
  const [ticketRef, setTicketRef] = useState<string | null>(null);
  const [corrections, setCorrections] = useState(0);
  const [repeats, setRepeats] = useState(0);
  const [ended, setEnded] = useState(false);
  const [announcedTxId, setAnnouncedTxId] = useState<string | null>(null);

  const tx = SUPPORT_TRANSACTIONS.find((t) => t.id === txId) ?? SUPPORT_TRANSACTIONS[0];
  const simplify = corrections + repeats >= 2 || accessibility.speechSpeed === 1;
  const gentle = signals.distress || pressured || category === "scam" || simplify;
  const ticket = ticketRef && supportTicket?.reference === ticketRef ? supportTicket : null;

  const ctx: ConversationContext = {
    language,
    tx,
    category,
    gentle,
    pressured,
    alertTrusted,
    ticketRef,
    firstTurn: turns.every((t) => t.who === "user"),
    announceTx: tx.id !== announcedTxId,
  };
  const [current, setCurrent] = useState<SupportNode | null>(null);

  const nextId = useRef(1);
  const pushTurn = (turn: Omit<Turn, "id">) => setTurns((ts) => [...ts, { ...turn, id: nextId.current++ }]);

  /** Aya takes her turn: run the node's action, then say its line. */
  const enter = (id: NodeId, o: Overrides = {}) => {
    const nextTx: SupportTransaction = SUPPORT_TRANSACTIONS.find((t) => t.id === (o.txId ?? txId)) ?? tx;
    let c: ConversationContext = {
      ...ctx,
      tx: nextTx,
      category: o.category !== undefined ? o.category : category,
      pressured: o.pressured ?? pressured,
      alertTrusted: o.alertTrusted ?? alertTrusted,
      announceTx: nextTx.id !== announcedTxId && ANNOUNCING.includes(id),
    };
    c = { ...c, gentle: c.gentle || c.pressured || c.category === "scam" };
    const action = getNode(id, c).action;
    if (action?.kind === "openTicket") {
      const created = openSupportTicket({
        category: c.category ?? "other",
        route: action.route,
        transaction: c.category === "app_issue" ? null : c.tx,
        signalLevel: c.pressured || c.category === "scam" ? "high" : c.gentle ? "medium" : "low",
        callback: action.callback,
        note: action.note,
      });
      if (c.pressured) {
        addTicketEvent({
          title: "Pressure reported",
          detail: "The customer said someone was telling them what to do. Handle gently.",
        });
      }
      if (c.alertTrusted) {
        addTicketEvent({ title: "Trusted contact alerted", detail: "Maame was told you asked Aya for help." });
      }
      c = { ...c, ticketRef: created.reference };
      setTicketRef(created.reference);
      vibrate("success", accessibility.haptics);
    } else if (action?.kind === "callback") {
      requestCallback();
    } else if (action?.kind === "end") {
      setEnded(true);
    }
    const n = getNode(id, c);
    const text = simplify && n.simple ? n.simple : n.say;
    pushTurn({ who: "aya", text, node: id, card: n.card, txId: c.tx.id });
    setNode(id);
    setCurrent(n);
    if (c.announceTx) setAnnouncedTxId(c.tx.id);
    speak(spokenForm(text, c.ticketRef));
  };
  const enterRef = useRef(enter);
  enterRef.current = enter;

  useEffect(() => {
    const t = setTimeout(() => enterRef.current(startNode(category, pressured, tx)), OPEN_DELAY_MS);
    return () => clearTimeout(t);
    // Opens the conversation once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastAya = [...turns].reverse().find((t) => t.who === "aya");
  const lastTurn = turns[turns.length - 1];

  /** Aya turn the comfort card sits under; null while hidden. */
  const [comfortAfter, setComfortAfter] = useState<number | null>(null);
  const comfortShownOnce = useRef(false);
  useEffect(() => {
    if (comfortShownOnce.current || !lastAya) return;
    if (signals.distress || signals.pressure || category === "scam") {
      comfortShownOnce.current = true;
      setComfortAfter(lastAya.id);
    }
  }, [lastAya, signals.distress, signals.pressure, category]);
  const openComfort = () => {
    if (!lastAya) return;
    comfortShownOnce.current = true;
    setComfortAfter(lastAya.id);
    speak(COMFORT_SPOKEN);
  };
  const ayaWords = useMemo(() => (lastAya ? lastAya.text.split(" ") : []), [lastAya]);
  const [spoken, setSpoken] = useState(0);
  const ayaSpeaking = lastTurn?.who === "aya" && spoken < ayaWords.length;
  const [cardShown, setCardShown] = useState(false);
  const cardIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!lastAya) return;
    setSpoken(0);
    setCardShown(false);
    cardIn.setValue(0);
    vibrate("understood", accessibility.haptics);
    let id: ReturnType<typeof setTimeout>;
    const step = (i: number) => {
      setSpoken(i);
      if (i < ayaWords.length) id = setTimeout(() => step(i + 1), gentle ? WORD_MS.gentle : WORD_MS.steady);
      else
        id = setTimeout(() => {
          setCardShown(true);
          Animated.timing(cardIn, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start();
        }, CARD_HOLD_MS);
    };
    step(1);
    return () => clearTimeout(id);
    // Re-run per Aya turn and on "Repeat".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAya?.id, repeats]);

  useEffect(() => {
    if (!cardShown || !current?.autoNext) return;
    const { to, afterMs } = current.autoNext;
    const t = setTimeout(() => enterRef.current(to), afterMs);
    return () => clearTimeout(t);
  }, [cardShown, current?.autoNext]);

  const eventCount = ticket?.events.length ?? 0;
  const prevEventCount = useRef(eventCount);
  useEffect(() => {
    if (ticket && eventCount > prevEventCount.current && prevEventCount.current > 0) {
      vibrate("update", accessibility.haptics);
      AccessibilityInfo.announceForAccessibility(`Update on your request. ${ticket.events[eventCount - 1].title}`);
    }
    prevEventCount.current = eventCount;
  }, [eventCount, ticket, accessibility.haptics]);

  const answer = (reply: Reply) => {
    pushTurn({ who: "user", text: reply.label });
    const guess = reply.nextTx ? nextGuess(tx) : null;
    const nextTxId = guess?.id ?? reply.txId;
    if (nextTxId) setTxId(nextTxId);
    if (reply.category !== undefined) setCategory(reply.category);
    if (reply.pressured) setPressured(true);
    if (reply.alertTrusted) setAlertTrusted(true);
    if (reply.correction) setCorrections((n) => n + 1);
    const o: Overrides = {
      txId: nextTxId,
      category: reply.category,
      pressured: reply.pressured,
      alertTrusted: reply.alertTrusted,
    };
    const to = guess ? routeNode(category, guess) : reply.to;
    setTimeout(() => enterRef.current(to, o), REPLY_DELAY_MS);
  };

  const [hearing, setHearing] = useState<{ reply: Reply; partials: string[][]; received: number } | null>(null);
  const hearTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(hearTimer.current), []);

  const commitHearing = useCallback(
    (reply: Reply) => {
      clearTimeout(hearTimer.current);
      setHearing(null);
      vibrate("micOff", accessibility.haptics);
      answer(reply);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessibility.haptics, txId, category, pressured, alertTrusted],
  );
  const commitRef = useRef(commitHearing);
  commitRef.current = commitHearing;

  /** Demo voice answer: the recogniser "hears" the suggested reply. */
  const startListening = () => {
    const reply = current?.replies[0];
    if (!reply) return;
    vibrate("listening", accessibility.haptics);
    const partials = simulatePartials(reply.label.split(" "));
    const receive = (i: number) => {
      setHearing({ reply, partials, received: i });
      hearTimer.current =
        i < partials.length
          ? setTimeout(() => receive(i + 1), PARTIAL_STEP_MS)
          : setTimeout(() => commitRef.current(reply), ENDPOINT_MS);
    };
    hearTimer.current = setTimeout(() => receive(1), 500);
    setHearing({ reply, partials, received: 0 });
  };

  const talkToPerson = () => {
    clearTimeout(hearTimer.current);
    setHearing(null);
    answer({ label: "I'd like to talk to a person", to: "person" });
  };

  const repeat = () => {
    setRepeats((n) => n + 1);
    if (lastAya) speak(spokenForm(lastAya.text, ticketRef));
  };

  const scrollRef = useRef<ScrollView>(null);
  const [scrolledUnder, setScrolledUnder] = useState(false);
  const edgeFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(edgeFade, { toValue: scrolledUnder ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [scrolledUnder, edgeFade]);

  const heardWords = hearing ? (hearing.partials[hearing.received - 1] ?? []) : [];
  const heardStable = hearing ? stableWordCount(hearing.partials.slice(0, hearing.received)) : 0;
  const canAnswer = !!current && !ayaSpeaking && cardShown && !hearing && !ended && current.replies.length > 0;
  const micState = hearing ? "listening" : ayaSpeaking ? "speaking" : "off";

  const renderCard = (turn: Turn, latest: boolean) => {
    if (!turn.card || (latest ? !cardShown : !PERSISTENT_CARDS.includes(turn.card))) return null;
    const t = SUPPORT_TRANSACTIONS.find((x) => x.id === turn.txId) ?? tx;
    const body = (() => {
      switch (turn.card) {
        case "transaction":
          return (
            <View
              style={styles.card}
              accessible
              accessibilityLabel={`${t.title}, ${speakMaybeCurrency(t.amount)}, ${t.when}, reference ${t.reference}`}
            >
              <AppText variant="overline" color={colors.textMuted} importantForAccessibility="no">
                {t.title}
              </AppText>
              <AppText variant="displayMD" importantForAccessibility="no">
                {t.amount}
              </AppText>
              <AppText variant="bodySM" color={colors.textSecondary} importantForAccessibility="no">
                {t.counterpart} · {t.number}
              </AppText>
              <AppText variant="caption" color={colors.textMuted} importantForAccessibility="no">
                {t.when} · {t.reference}
              </AppText>
            </View>
          );
        case "checking":
          return (
            <View style={[styles.card, styles.row]} accessible accessibilityLabel="Checking with MTN">
              <ActivityIndicator color={colors.purple} />
              <AppText variant="bodySM" importantForAccessibility="no">
                Checking with MTN…
              </AppText>
            </View>
          );
        case "arrived":
          return (
            <View
              style={[styles.card, styles.row]}
              accessible
              accessibilityLabel={`Delivered. ${speakMaybeCurrency(t.amount)} to ${t.counterpart}`}
            >
              <View style={[styles.dot, { backgroundColor: colors.success }]} {...DECORATIVE_A11Y}>
                <Icon name="checkmark" size={16} color={colors.white} />
              </View>
              <View style={styles.flexText} importantForAccessibility="no">
                <AppText variant="labelMD">Delivered</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {t.amount} to {t.counterpart} · {t.reference}
                </AppText>
              </View>
            </View>
          );
        case "reversal":
          return (
            <View style={styles.card} accessibilityRole="list" role="list" accessibilityLabel="Reversal progress">
              <AppText variant="overline" color={colors.textMuted}>
                Reversal · {t.amount}
              </AppText>
              {[
                { title: "Requested from MTN", done: true },
                { title: `Waiting for ${t.counterpart.split(" ")[0]} to approve`, done: false },
                { title: "No answer in 24 hours? Aya opens an MTN case", done: false, muted: true },
              ].map((s) => (
                <View key={s.title} style={styles.row} role="listitem" accessible accessibilityLabel={s.title}>
                  <View
                    style={[styles.stepDot, s.done && styles.stepDotDone, s.muted && styles.stepDotMuted]}
                    {...DECORATIVE_A11Y}
                  >
                    {s.done ? <Icon name="checkmark" size={12} color={colors.white} /> : null}
                  </View>
                  <AppText
                    variant="bodySM"
                    color={s.muted ? colors.textMuted : colors.text}
                    style={styles.flexText}
                    importantForAccessibility="no"
                  >
                    {s.title}
                  </AppText>
                </View>
              ))}
            </View>
          );
        case "ticket":
          return ticket ? <TicketCard ticket={ticket} styles={styles} colors={colors} /> : null;
      }
    })();
    if (!body) return null;
    if (!latest) return body;
    return (
      <Animated.View
        style={{
          opacity: cardIn,
          transform: [{ translateY: cardIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}
      >
        {body}
      </Animated.View>
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Leave support"
            hitSlop={8}
            style={styles.headerBtn}
          >
            <Icon name="chevron-back" size={26} color={colors.text} />
          </Pressable>
        </View>
        <View
          style={[styles.micPill, micState === "listening" ? styles.micPillOn : styles.micPillOff]}
          accessible
          accessibilityLabel={
            micState === "listening"
              ? "Microphone on, listening"
              : micState === "speaking"
                ? "Aya is speaking"
                : "Microphone off"
          }
          accessibilityLiveRegion="polite"
        >
          <Icon
            name={micState === "listening" ? "mic" : micState === "speaking" ? "volume-high" : "mic-off"}
            size={14}
            color={
              micState === "listening" ? colors.success : micState === "speaking" ? colors.purple : colors.textMuted
            }
          />
          <AppText
            variant="labelXS"
            color={micState === "off" ? colors.textMuted : colors.text}
            importantForAccessibility="no"
          >
            {micState === "listening" ? "Listening" : micState === "speaking" ? "Aya speaking" : "Mic off"}
          </AppText>
        </View>
        <View style={styles.headerSide} />
      </View>

      <AppText heading={1} style={styles.srOnly}>
        Get help
      </AppText>

      <View style={styles.waveWrap}>
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
          {turns.map((turn, i) => {
            const recent = i >= turns.length - 2 && !hearing;
            const latestAya = turn.id === lastAya?.id;
            const text = latestAya ? ayaWords.slice(0, spoken).join(" ") : turn.text;
            const variant = recent ? "titleMD" : "bodyLG";
            if (turn.who === "user") {
              return (
                <View key={turn.id} style={styles.userTurn} accessible accessibilityLabel={`You said: ${turn.text}`}>
                  <AppText
                    variant={variant}
                    align="right"
                    color={recent ? colors.text : colors.textMuted}
                    importantForAccessibility="no"
                  >
                    {turn.text}
                  </AppText>
                </View>
              );
            }
            return (
              <View key={turn.id} style={styles.ayaTurn}>
                <AppText variant="labelXS" color={colors.purple} importantForAccessibility="no">
                  Aya
                </AppText>
                <View
                  accessible
                  accessibilityLabel={`Aya says: ${spokenForm(turn.text, ticketRef)}`}
                  accessibilityLiveRegion={latestAya ? "polite" : "none"}
                >
                  <AppText
                    variant={variant}
                    color={recent ? colors.text : colors.textMuted}
                    importantForAccessibility="no"
                  >
                    {text || "•••"}
                  </AppText>
                </View>
                {renderCard(turn, latestAya)}
                {comfortAfter === turn.id ? (
                  <ComfortCard onTalkToPerson={talkToPerson} onHide={() => setComfortAfter(null)} />
                ) : null}
              </View>
            );
          })}

          {hearing ? (
            <View style={styles.userTurn} accessible accessibilityLabel="Your words" accessibilityLiveRegion="polite">
              <AppText variant="titleMD" align="right" color={colors.text} importantForAccessibility="no">
                {heardWords.slice(0, heardStable).join(" ")}
                <AppText variant="titleMD" color={colors.textSubtle}>
                  {heardStable ? " " : ""}
                  {heardWords.slice(heardStable).join(" ")}
                </AppText>
              </AppText>
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

      <View style={styles.dock}>
        {ended ? (
          <Button onPress={onDone} style={styles.mainBtn}>
            Done
          </Button>
        ) : hearing ? (
          <Button
            onPress={() => commitHearing(hearing.reply)}
            style={styles.mainBtn}
            accessibilityLabel="I'm done speaking"
          >
            <Icon name="checkmark" size={20} color={colors.textOnYellow} />
            <AppText variant="button" color={colors.textOnYellow}>
              I'm done speaking
            </AppText>
          </Button>
        ) : (
          <>
            {comfortAfter === null && lastAya ? (
              <Pressable
                onPress={openComfort}
                accessibilityRole="button"
                role="button"
                accessibilityLabel="Feeling worried? Take a moment"
                hitSlop={8}
                style={({ pressed }) => [styles.comfortLink, pressed && styles.pressed]}
              >
                <Icon name="heart-outline" size={16} color={colors.purple} />
                <AppText variant="labelSM" color={colors.purple} importantForAccessibility="no">
                  Feeling worried? Take a moment
                </AppText>
              </Pressable>
            ) : null}
            {canAnswer ? (
              <View style={styles.chips} accessibilityRole="radiogroup" role="radiogroup" accessibilityLabel="Answers">
                {current.replies.map((r, i) => (
                  <Pressable
                    key={r.label}
                    onPress={() => answer(r)}
                    accessibilityRole="button"
                    role="button"
                    accessibilityLabel={r.label}
                    style={({ pressed }) => [styles.chip, i === 0 && styles.chipPrimary, pressed && styles.pressed]}
                  >
                    <AppText
                      variant="labelSM"
                      color={i === 0 ? colors.purple : colors.text}
                      importantForAccessibility="no"
                    >
                      {r.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.controls}>
              <Pressable
                onPress={repeat}
                disabled={ayaSpeaking || !current}
                accessibilityRole="button"
                role="button"
                accessibilityLabel="Repeat"
                accessibilityHint="Aya says that again, more slowly"
                style={({ pressed }) => [
                  styles.textBtn,
                  (ayaSpeaking || !current) && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Icon name="refresh" size={18} color={colors.text} />
                <AppText variant="bodySM" style={styles.textBtnLabel} importantForAccessibility="no">
                  Repeat
                </AppText>
              </Pressable>
              <Pressable
                onPress={startListening}
                disabled={!canAnswer}
                accessibilityRole="button"
                role="button"
                accessibilityLabel="Answer by voice"
                accessibilityHint={canAnswer ? `For example, say: ${current.replies[0].label}` : undefined}
                style={({ pressed }) => [styles.mic, !canAnswer && styles.disabled, pressed && styles.pressed]}
              >
                <Icon name="mic" size={26} color={colors.textOnYellow} />
              </Pressable>
              <Pressable
                onPress={talkToPerson}
                disabled={node === "person" || !current}
                accessibilityRole="button"
                role="button"
                accessibilityLabel="Talk to a person"
                accessibilityHint="A person from Aya support calls you back in your language"
                style={({ pressed }) => [
                  styles.textBtn,
                  (node === "person" || !current) && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Icon name="person-outline" size={18} color={gentle ? colors.purple : colors.text} />
                <AppText
                  variant="bodySM"
                  color={gentle ? colors.purple : colors.text}
                  style={styles.textBtnLabel}
                  importantForAccessibility="no"
                >
                  A person
                </AppText>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

function TicketCard({
  ticket,
  styles,
  colors,
}: {
  ticket: NonNullable<ReturnType<typeof useAppPrefs>["supportTicket"]>;
  styles: ReturnType<typeof createStyles>;
  colors: Palette;
}) {
  const latest = ticket.events.slice(-3);
  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <View
        style={styles.ticketHead}
        accessible
        accessibilityLabel={`Case number ${spokenReference(ticket.reference)}. ${STATUS_LABEL[ticket.status]}${ticket.priority === "urgent" ? ". Urgent" : ""}`}
      >
        <View importantForAccessibility="no">
          <AppText variant="overline" color={colors.textMuted}>
            Case number
          </AppText>
          <AppText variant="headingSM">{ticket.reference}</AppText>
        </View>
        <View style={styles.pills} importantForAccessibility="no">
          {ticket.priority === "urgent" ? (
            <View style={[styles.pill, { backgroundColor: colors.dangerSurface }]}>
              <AppText variant="labelXS" color={colors.danger}>
                Urgent
              </AppText>
            </View>
          ) : null}
          <View style={[styles.pill, { backgroundColor: colors.washPurple }]}>
            <AppText variant="labelXS" color={colors.purple}>
              {STATUS_LABEL[ticket.status]}
            </AppText>
          </View>
        </View>
      </View>
      {latest.map((e, i) => (
        <View key={`${e.at}-${i}`} style={styles.row} accessible accessibilityLabel={`${e.title}. ${e.detail ?? ""}`}>
          <View
            style={[styles.eventDot, i === latest.length - 1 && { backgroundColor: colors.purple }]}
            {...DECORATIVE_A11Y}
          />
          <View style={styles.flexText} importantForAccessibility="no">
            <AppText variant="labelSM">{e.title}</AppText>
            {e.detail ? (
              <AppText variant="caption" color={colors.textMuted}>
                {e.detail}
              </AppText>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: Palette) {
  return {
    flex: { flex: 1, minHeight: 0 },
    flexText: { flex: 1, minWidth: 0, gap: 2 },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: spacing.sm,
      minHeight: 52,
      flexShrink: 0,
    },
    headerSide: { width: 88 },
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
    waveWrap: { alignItems: "center" as const, gap: spacing.xs, flexShrink: 0, paddingBottom: spacing.sm },
    chat: { flexGrow: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
    edgeFade: { position: "absolute" as const, top: 0, left: 0, right: 0, height: 48 },
    userTurn: { alignSelf: "flex-end" as const, maxWidth: "88%" as const, gap: 2 },
    ayaTurn: { alignSelf: "stretch" as const, gap: spacing.xs },
    card: {
      marginTop: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceCard,
      gap: spacing.sm,
    },
    row: { flexDirection: "row" as const, alignItems: "center" as const, gap: spacing.md },
    dot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    stepDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.purple,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    stepDotDone: { backgroundColor: colors.purple },
    stepDotMuted: { borderColor: colors.border },
    ticketHead: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      justifyContent: "space-between" as const,
      gap: spacing.sm,
    },
    pills: {
      flexDirection: "row" as const,
      gap: spacing.xs,
      flexWrap: "wrap" as const,
      justifyContent: "flex-end" as const,
    },
    pill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full },
    eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textSubtle },
    dock: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      flexShrink: 0,
    },
    chips: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      justifyContent: "center" as const,
      gap: spacing.sm,
    },
    chip: {
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      justifyContent: "center" as const,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipPrimary: { borderColor: colors.purple, backgroundColor: colors.washPurple },
    comfortLink: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: spacing.xs,
      minHeight: 44,
    },
    controls: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    mic: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.purple,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    textBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.xs,
      minHeight: 44,
      minWidth: 96,
      paddingHorizontal: spacing.sm,
    },
    textBtnLabel: { fontFamily: fonts.body.bold },
    mainBtn: { alignSelf: "center" as const, minWidth: 240, paddingHorizontal: spacing["2xl"] },
    pressed: { opacity: 0.6 },
    disabled: { opacity: 0.35 },
    srOnly: {
      position: "absolute" as const,
      width: 1,
      height: 1,
      overflow: "hidden" as const,
      opacity: 0,
    },
  };
}
