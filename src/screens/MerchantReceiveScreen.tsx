import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import QRCode from "react-native-qrcode-svg";
import {
  AppText,
  Button,
  IconWell,
  Screen,
  ScreenFooter,
  ScreenHeader,
  Toggle,
  WaveIcon,
} from "../components/ui";
import { ACCENT } from "../content/brand";
import { DECORATIVE_A11Y } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onBack: () => void };
type Step = "intro" | "setup" | "live";

const DEMO_AMOUNT = "GH₵45.00";
const DEMO_FROM = "Ama Mensah";
const SHOP_PAY_URL =
  "https://pay.aya.app/m/pratik-shop?name=Pratik%27s%20Shop&currency=GHS";
const QR_SIZE = 156;

function PulseRing({ delay }: { delay: number }) {
  const scale = useSharedValue(0.72);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.28, { duration: 1400, easing: Easing.out(Easing.quad) }),
          withTiming(0.72, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 1400, easing: Easing.out(Easing.quad) }),
          withTiming(0.4, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: QR_SIZE + 24,
          height: QR_SIZE + 24,
          borderRadius: (QR_SIZE + 24) / 2,
          borderWidth: 2,
          borderColor: ACCENT,
        },
        style,
      ]}
    />
  );
}

export default function MerchantReceiveScreen({ onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [step, setStep] = useState<Step>("intro");
  const [announceAll, setAnnounceAll] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [announcing, setAnnouncing] = useState(false);
  const [lastHeard, setLastHeard] = useState<string | null>(null);

  const liveWave = speakerOn && announceAll;

  const playDemo = () => {
    if (!speakerOn || !announceAll) return;
    setAnnouncing(true);
    setLastHeard(`${DEMO_AMOUNT} from ${DEMO_FROM}`);
    setTimeout(() => setAnnouncing(false), 2200);
  };

  return (
    <Screen scroll>
      <ScreenHeader
        title={step === "live" ? "Shop payments" : "Receive payment"}
        onBack={step === "intro" ? onBack : () => setStep(step === "live" ? "setup" : "intro")}
      />

      {step === "intro" ? (
        <>
          <View style={styles.hero}>
            <View style={styles.waveHero} {...DECORATIVE_A11Y}>
              <WaveIcon size={48} color={ACCENT} animated />
            </View>
            <AppText
              variant="heading"
              align="center"
              heading={2}
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Get paid out loud
            </AppText>
            <AppText
              variant="bodySM"
              align="center"
              style={styles.lead}
              numberOfLines={3}
              adjustsFontSizeToFit
            >
              Show your QR. Aya announces each payment on your loudspeaker.
            </AppText>
          </View>

          <View style={styles.bullets} accessibilityRole="list" accessibilityLabel="How it works">
            {[
              "Customers scan and pay",
              "Hear the amount aloud",
              "Keep serving without checking",
            ].map((text) => (
              <View key={text} style={styles.bullet} role="listitem" accessibilityRole="text">
                <IconWell backgroundColor={colors.washPurple} size={36} radius={11}>
                  <WaveIcon size={18} color={colors.text} />
                </IconWell>
                <AppText
                  variant="labelSM"
                  style={styles.bulletText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {text}
                </AppText>
              </View>
            ))}
          </View>

          <ScreenFooter>
            <Button onPress={() => setStep("setup")} accessibilityHint="Continues to speaker setup">
              Set up my shop
            </Button>
          </ScreenFooter>
        </>
      ) : null}

      {step === "setup" ? (
        <>
          <View style={styles.setupHead}>
            <AppText
              variant="heading"
              heading={2}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Speaker alerts
            </AppText>
            <AppText
              variant="bodySM"
              style={styles.lead}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              Play every payment on your loudspeaker.
            </AppText>
          </View>

          <Pressable
            onPress={() => setAnnounceAll((v) => !v)}
            accessibilityRole="switch"
            role="switch"
            accessibilityState={{ checked: announceAll }}
            aria-checked={announceAll}
            accessibilityLabel="Announce every payment on speaker"
            accessibilityHint="When on, Aya reads each payment aloud"
            style={[styles.prefCard, announceAll && styles.prefCardOn]}
          >
            <View {...DECORATIVE_A11Y}>
              <IconWell
                backgroundColor={announceAll ? colors.surface : colors.washPurple}
                size={44}
                radius={14}
              >
                <WaveIcon size={22} color={colors.text} />
              </IconWell>
            </View>
            <View style={styles.prefMeta} importantForAccessibility="no">
              <AppText
                variant="labelMD"
                importantForAccessibility="no"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Announce all payments
              </AppText>
              <AppText
                variant="caption"
                style={styles.prefDesc}
                importantForAccessibility="no"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Hear amount and payer aloud
              </AppText>
            </View>
            <View pointerEvents="none" {...DECORATIVE_A11Y}>
              <Toggle
                value={announceAll}
                onValueChange={() => {}}
                accessibilityLabel="Announce all payments"
              />
            </View>
          </Pressable>

          <View style={styles.note} accessibilityRole="text">
            <WaveIcon size={14} color={colors.textMuted} />
            <AppText
              variant="caption"
              style={styles.noteText}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              Turn this off later when your shop is quiet or closed.
            </AppText>
          </View>

          <ScreenFooter>
            <Button
              onPress={() => {
                setSpeakerOn(announceAll);
                setStep("live");
              }}
              accessibilityHint="Opens your payment QR"
            >
              Show my QR
            </Button>
          </ScreenFooter>
        </>
      ) : null}

      {step === "live" ? (
        <>
          <View style={styles.liveTop}>
            <View
              style={[styles.statusPill, liveWave ? styles.statusOn : styles.statusOff]}
              accessibilityRole="text"
              accessibilityLabel={
                liveWave
                  ? "Speaker on, announcing payments"
                  : "Speaker off, payments are silent"
              }
            >
              <WaveIcon
                size={14}
                color={liveWave ? colors.success : colors.textMuted}
              />
              <AppText variant="caption" color={colors.text} numberOfLines={1}>
                {liveWave ? "Speaker on" : "Silent"}
              </AppText>
            </View>

            <View style={styles.speakerToggle}>
              <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
                Loudspeaker
              </AppText>
              <Toggle
                value={liveWave}
                onValueChange={(next) => {
                  if (!announceAll) return;
                  setSpeakerOn(next);
                }}
                accessibilityLabel="Loudspeaker"
                accessibilityHint="Turns loud payment announcements on or off"
              />
            </View>
          </View>

          <View
            style={styles.qrCard}
            accessible
            accessibilityLabel="Your shop QR code. Customers scan this to pay you."
          >
            <View style={styles.pulseHost} {...DECORATIVE_A11Y}>
              {announcing ? (
                <>
                  <PulseRing delay={0} />
                  <PulseRing delay={450} />
                </>
              ) : null}
              <View style={[styles.qrInner, announcing && styles.qrPulse]}>
                <QRCode
                  value={SHOP_PAY_URL}
                  size={QR_SIZE}
                  color={colors.text}
                  backgroundColor={colors.surface}
                  ecl="M"
                />
              </View>
            </View>
            <AppText
              variant="labelMD"
              align="center"
              style={styles.shopName}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Pratik's Shop
            </AppText>
            <AppText
              variant="caption"
              align="center"
              color={colors.textMuted}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Scan to pay with Aya Wallet
            </AppText>
          </View>

          {lastHeard ? (
            <View
              style={styles.heardCard}
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Last announced: Payment received, ${lastHeard}`}
            >
              <IconWell backgroundColor={colors.surface} size={36} radius={11}>
                <WaveIcon size={18} color={colors.success} />
              </IconWell>
              <View style={styles.heardMeta}>
                <AppText variant="labelSM" numberOfLines={1} adjustsFontSizeToFit>
                  Payment received
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.textMuted}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {lastHeard}
                </AppText>
              </View>
            </View>
          ) : (
            <AppText
              variant="caption"
              align="center"
              color={colors.textMuted}
              style={styles.waiting}
              numberOfLines={1}
            >
              Waiting for a payment
            </AppText>
          )}

          <ScreenFooter>
            <Button
              onPress={playDemo}
              disabled={!liveWave}
              accessibilityHint="Plays a sample payment announcement"
            >
              {announcing ? "Speaking" : "Try a sample payment"}
            </Button>
            {!announceAll ? (
              <Button
                variant="ghost"
                onPress={() => setStep("setup")}
                accessibilityHint="Opens speaker preferences"
              >
                Turn on announcements
              </Button>
            ) : null}
          </ScreenFooter>
        </>
      ) : null}
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    hero: {
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.xs,
      alignItems: "center" as const,
    },
    waveHero: {
      width: 76,
      height: 76,
      borderRadius: 24,
      backgroundColor: colors.washPurple,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: spacing.sm,
    },
    title: {
      marginBottom: 4,
      alignSelf: "stretch" as const,
      paddingHorizontal: spacing.sm,
    },
    lead: {
      marginTop: 2,
      color: colors.textSecondary,
      alignSelf: "stretch" as const,
      paddingHorizontal: spacing.xs,
    },
    bullets: {
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.lg,
      gap: 8,
    },
    bullet: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceCard,
      minWidth: 0,
    },
    bulletText: {
      flex: 1,
      minWidth: 0,
    },
    setupHead: {
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.xs,
    },
    prefCard: {
      marginTop: spacing.md,
      marginHorizontal: spacing.screenX,
      borderRadius: radii["2xl"],
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      backgroundColor: colors.surfaceCard,
      minWidth: 0,
    },
    prefCardOn: {
      backgroundColor: colors.washPurple,
    },
    prefMeta: {
      flex: 1,
      minWidth: 0,
    },
    prefDesc: {
      marginTop: 2,
      color: colors.textMuted,
    },
    note: {
      marginTop: spacing.sm,
      marginHorizontal: spacing.screenX,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      minWidth: 0,
    },
    noteText: {
      flex: 1,
      minWidth: 0,
      color: colors.textMuted,
    },
    liveTop: {
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.xs,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: spacing.sm,
      minWidth: 0,
    },
    statusPill: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      flexShrink: 1,
      minWidth: 0,
    },
    statusOn: {
      backgroundColor: colors.successSurface,
    },
    statusOff: {
      backgroundColor: colors.surfaceCard,
    },
    speakerToggle: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      flexShrink: 0,
    },
    qrCard: {
      marginTop: spacing.md,
      marginHorizontal: spacing.screenX,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radii["2xl"],
      backgroundColor: colors.surfaceCard,
      alignItems: "center" as const,
    },
    pulseHost: {
      width: QR_SIZE + 24,
      height: QR_SIZE + 24,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: spacing.xs,
    },
    qrInner: {
      padding: 8,
      borderRadius: 14,
      backgroundColor: colors.surface,
    },
    qrPulse: {
      transform: [{ scale: 1.02 }],
    },
    shopName: {
      marginBottom: 2,
      alignSelf: "stretch" as const,
      paddingHorizontal: spacing.sm,
    },
    heardCard: {
      marginTop: spacing.sm,
      marginHorizontal: spacing.screenX,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.xl,
      backgroundColor: colors.successSurface,
      minWidth: 0,
    },
    heardMeta: {
      flex: 1,
      minWidth: 0,
    },
    waiting: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.screenX,
    },
  };
}
