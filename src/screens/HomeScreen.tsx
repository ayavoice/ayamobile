import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { AppText, Avatar, Icon, IconWell, MciIcon, Screen } from "../components/ui";
import NotificationsModal from "../components/NotificationsModal";
import { ACCENT, ACCENT_BLUE, brandImages } from "../content/brand";
import type { FlowId } from "../content/flows";
import { SERVICES } from "../content/services";
import { formatCurrency, formatCurrencySpoken, DECORATIVE_A11Y } from "../lib/currency";
import type { ScreenId } from "../navigation/types";
import { initials, type AyaContact } from "../services/contacts";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type BannerIllustration = "voice" | "gift" | "trophy" | "speaker";

const ART_SIZE = 168;

function ArtAtmosphere({
  blob = "rgba(255,255,255,0.55)",
  accent = "rgba(85,40,232,0.14)",
}: {
  blob?: string;
  accent?: string;
}) {
  return (
    <G>
      <Ellipse cx={118} cy={52} rx={58} ry={50} fill={blob} />
      <Circle cx={42} cy={118} r={28} fill={accent} />
      <Circle cx={28} cy={46} r={7} fill="rgba(255,255,255,0.7)" />
      <Circle cx={132} cy={118} r={5} fill="rgba(255,255,255,0.55)" />
      <Ellipse cx={96} cy={138} rx={42} ry={8} fill="rgba(18,23,33,0.08)" />
    </G>
  );
}

function VoiceIllustration() {
  return (
    <Svg width={ART_SIZE} height={ART_SIZE} viewBox="0 0 168 168">
      <Defs>
        <LinearGradient id="voiceMic" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E8E9FF" />
        </LinearGradient>
        <LinearGradient id="voiceBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ACCENT_BLUE} />
          <Stop offset="1" stopColor={ACCENT} />
        </LinearGradient>
      </Defs>
      <ArtAtmosphere accent="rgba(40,48,240,0.12)" />
      <Path
        d="M118 62c10 8 10 28 0 36"
        stroke={ACCENT_BLUE}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.35}
      />
      <Path
        d="M128 52c16 12 16 44 0 56"
        stroke={ACCENT_BLUE}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.22}
      />
      <Rect x={82} y={108} width={6} height={18} rx={3} fill="#C8CBE8" />
      <Ellipse cx={85} cy={128} rx={18} ry={5} fill="#FFFFFF" />
      <Ellipse cx={85} cy={128} rx={18} ry={5} fill="rgba(40,48,240,0.08)" />
      <Rect x={70} y={48} width={30} height={58} rx={15} fill="url(#voiceMic)" />
      <Rect x={76} y={56} width={18} height={36} rx={9} fill="url(#voiceBody)" />
      <Circle cx={85} cy={66} r={3.5} fill="#FFFFFF" opacity={0.85} />
      <Circle cx={85} cy={76} r={3.5} fill="#FFFFFF" opacity={0.55} />
      <Circle cx={85} cy={86} r={3.5} fill="#FFFFFF" opacity={0.35} />
      <G>
        <Ellipse cx={128} cy={98} rx={22} ry={16} fill="#FFFFFF" />
        <Ellipse cx={128} cy={98} rx={22} ry={16} fill="rgba(40,48,240,0.06)" />
        <Path
          d="M118 98h14M128 92l8 6-8 6"
          stroke={ACCENT_BLUE}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}

function GiftIllustration() {
  return (
    <Svg width={ART_SIZE} height={ART_SIZE} viewBox="0 0 168 168">
      <Defs>
        <LinearGradient id="giftLid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ACCENT} />
          <Stop offset="1" stopColor={ACCENT_BLUE} />
        </LinearGradient>
        <LinearGradient id="giftBox" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#EAF7EC" />
        </LinearGradient>
        <LinearGradient id="giftCoin" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#F0B429" />
        </LinearGradient>
      </Defs>
      <ArtAtmosphere accent="rgba(46,180,90,0.14)" blob="rgba(255,255,255,0.5)" />
      <Circle cx={48} cy={58} r={3.5} fill="#2DBE6C" opacity={0.7} />
      <Rect x={130} y={48} width={7} height={7} rx={2} fill={ACCENT} opacity={0.55} />
      <Circle cx={138} cy={78} r={2.5} fill="#F0B429" />
      <Path
        d="M52 78h64c6 0 10 4 10 10v36c0 6-4 10-10 10H52c-6 0-10-4-10-10V88c0-6 4-10 10-10z"
        fill="url(#giftBox)"
      />
      <Rect x={78} y={78} width={12} height={56} fill="rgba(85,40,232,0.18)" />
      <Path
        d="M46 68h76c5 0 8 3 8 8v8H38v-8c0-5 3-8 8-8z"
        fill="url(#giftLid)"
      />
      <Rect x={78} y={68} width={12} height={16} fill="rgba(255,255,255,0.35)" />
      <Path d="M84 68c-14-2-22-16-12-22 8-4 14 8 12 22z" fill="#7B20E8" />
      <Path d="M84 68c14-2 22-16 12-22-8-4-14 8-12 22z" fill="#9B5CFF" />
      <Circle cx={84} cy={66} r={5} fill="#FFFFFF" />
      <Circle cx={128} cy={108} r={18} fill="url(#giftCoin)" />
      <Circle cx={128} cy={108} r={13} fill="#FFF6D6" />
      <Path
        d="M128 100v16M123 104c2-2 8-2 10 0M123 112c2 2 8 2 10 0"
        stroke="#C98A10"
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function TrophyIllustration() {
  return (
    <Svg width={ART_SIZE} height={ART_SIZE} viewBox="0 0 168 168">
      <Defs>
        <LinearGradient id="trophyCup" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE59A" />
          <Stop offset="1" stopColor="#F0B429" />
        </LinearGradient>
        <LinearGradient id="trophyStem" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E8EAFF" />
        </LinearGradient>
      </Defs>
      <ArtAtmosphere accent="rgba(240,180,41,0.16)" blob="rgba(255,255,255,0.52)" />
      <Path d="M48 58l2.5 5.5 5.5 2.5-5.5 2.5L48 74l-2.5-5.5L40 66l5.5-2.5z" fill="#F0B429" opacity={0.85} />
      <Path d="M132 50l2 4.2 4.2 2-4.2 2L132 62.4l-2-4.2-4.2-2 4.2-2z" fill={ACCENT} opacity={0.55} />
      <Rect x={58} y={124} width={52} height={10} rx={4} fill="#FFFFFF" />
      <Rect x={66} y={116} width={36} height={10} rx={3} fill="url(#trophyStem)" />
      <Rect x={80} y={100} width={8} height={18} rx={3} fill="#D4D7F0" />
      <Path
        d="M58 48h52v22c0 18-12 32-26 32S58 88 58 70z"
        fill="url(#trophyCup)"
      />
      <Path
        d="M66 54h36v14c0 12-8 22-18 22s-18-10-18-22z"
        fill="#FFF6D6"
        opacity={0.55}
      />
      <Path
        d="M58 56c-12 0-18 8-18 16s8 14 16 14"
        stroke="#F0B429"
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M110 56c12 0 18 8 18 16s-8 14-16 14"
        stroke="#F0B429"
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M84 62l3.2 6.6 7.3 1.1-5.3 5.1 1.3 7.2L84 78.6l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1.1z"
        fill={ACCENT}
      />
    </Svg>
  );
}

function SpeakerIllustration() {
  return (
    <Svg width={ART_SIZE} height={ART_SIZE} viewBox="0 0 168 168">
      <Defs>
        <LinearGradient id="phoneBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#EDE8FF" />
        </LinearGradient>
        <LinearGradient id="phoneScreen" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={ACCENT_BLUE} />
          <Stop offset="1" stopColor={ACCENT} />
        </LinearGradient>
      </Defs>
      <ArtAtmosphere />
      <Path
        d="M122 58c12 10 12 34 0 44"
        stroke={ACCENT}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.3}
      />
      <Path
        d="M132 48c20 14 20 50 0 64"
        stroke={ACCENT}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.18}
      />
      <Rect x={58} y={42} width={52} height={88} rx={14} fill="url(#phoneBody)" />
      <Rect x={64} y={52} width={40} height={62} rx={8} fill="url(#phoneScreen)" />
      <Ellipse cx={84} cy={120} rx={8} ry={3} fill="rgba(85,40,232,0.2)" />
      <Rect x={72} y={72} width={4} height={12} rx={2} fill="#FFFFFF" opacity={0.9} />
      <Rect x={80} y={66} width={4} height={24} rx={2} fill="#FFFFFF" />
      <Rect x={88} y={70} width={4} height={16} rx={2} fill="#FFFFFF" opacity={0.9} />
      <Rect x={96} y={74} width={4} height={8} rx={2} fill="#FFFFFF" opacity={0.75} />
      <G>
        <Rect x={108} y={88} width={44} height={28} rx={14} fill="#FFFFFF" />
        <Circle cx={122} cy={102} r={8} fill="#2DBE6C" />
        <Path
          d="M118 102l3 3 6-7"
          stroke="#FFFFFF"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Rect x={134} y={97} width={12} height={3.5} rx={1.75} fill="#D8D6E8" />
        <Rect x={134} y={104} width={8} height={3.5} rx={1.75} fill="#E8E6F2" />
      </G>
    </Svg>
  );
}

function BannerArt({ kind }: { kind: BannerIllustration }) {
  if (kind === "voice") return <VoiceIllustration />;
  if (kind === "gift") return <GiftIllustration />;
  if (kind === "trophy") return <TrophyIllustration />;
  return <SpeakerIllustration />;
}

type Props = {
  onNav: (screen: ScreenId) => void;
  onStartFlow: (flow: FlowId) => void;
  /** Real device contacts (empty on web / when permission denied). */
  quickSend: AyaContact[];
  onQuickSend: (contact: AyaContact) => void;
};

type QuickItem = { name: string; image?: ImageSourcePropType; contact?: AyaContact };

const RECIPIENTS = [
  { name: "Sonya", image: brandImages.sonya },
  { name: "Mansi", image: brandImages.mansi },
  { name: "Palak", image: brandImages.palak },
  { name: "Sourabh", image: brandImages.sourabh },
];

const QUICK_SEND: QuickItem[] = [
  { name: "Sonya", image: brandImages.sonya },
  { name: "Mansi", image: brandImages.mansi },
  { name: "Palak", image: brandImages.palak },
  { name: "Sandeepa", image: brandImages.sandeepa },
  { name: "Sourabh", image: brandImages.sourabh },
  { name: "Aisha", image: brandImages.aisha },
];

const HOME_BALANCE = 2648.34;

type LastAction = {
  id: string;
  label: string;
  sub: string;
  amount: number;
  icon: "spotify" | "arrow-up" | "arrow-down" | "phone-portrait" | "wifi" | "flash";
  tint: "spotify" | "purple" | "blue" | "green" | "yellow";
};

const LAST_ACTIONS: LastAction[] = [
  { id: "sent", label: "Sent to Ricky", sub: "Today, 3:02 PM", amount: -580, icon: "arrow-up", tint: "purple" },
  { id: "received", label: "Received from Abena", sub: "Yesterday, 4:20 PM", amount: 300, icon: "arrow-down", tint: "blue" },
  { id: "spotify", label: "Spotify", sub: "Yesterday", amount: -14.9, icon: "spotify", tint: "spotify" },
  { id: "airtime", label: "Airtime", sub: "6 Sep, 10:00 AM", amount: -10, icon: "phone-portrait", tint: "purple" },
  { id: "data", label: "Data bundle", sub: "5 Sep, 2:15 PM", amount: -25, icon: "wifi", tint: "blue" },
];

const LAST_ACTIONS_PREVIEW = 2;

const BANNER_WIDTH = 292;
const BANNER_HEIGHT = 128;
const BANNER_GAP = 12;

function bannersFor(
  colors: Palette,
  onNav: (screen: ScreenId) => void,
): {
  illustration: BannerIllustration;
  title: string;
  bg: string;
  accessibilityLabel: string;
  onPress?: () => void;
}[] {
  return [
    {
      illustration: "speaker",
      title: "Get paid out loud",
      bg: colors.washPurple,
      accessibilityLabel: "Get paid out loud. Set up shop payments with speaker alerts",
      onPress: () => onNav("merchant-receive"),
    },
    {
      illustration: "voice",
      title: "Send with just your voice",
      bg: colors.washBlue,
      accessibilityLabel: "Send with just your voice",
    },
    {
      illustration: "gift",
      title: "Invite friends, earn GH₵20",
      bg: colors.washGreen,
      accessibilityLabel: "Invite friends, earn GH₵20",
    },
    {
      illustration: "trophy",
      title: "Think Genius leaderboard",
      bg: colors.washYellow,
      accessibilityLabel: "Open Learn leaderboard",
      onPress: () => onNav("leaderboard"),
    },
  ];
}

const MIC_WAVE_BARS = [
  { h: 16, delay: 0, color: "#2830F0" },
  { h: 32, delay: 90, color: "#3A30F0" },
  { h: 48, delay: 40, color: "#5528E8" },
  { h: 28, delay: 130, color: "#6B20E8" },
  { h: 16, delay: 60, color: "#7B20E8" },
];

function MicWaveBar({ height, delay, color }: { height: number; delay: number; color: string }) {
  const scale = useSharedValue(0.45);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 340, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.45, { duration: 340, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.value }] }));

  return <Animated.View style={[micWaveStyles.bar, { height, backgroundColor: color }, style]} />;
}

function MicWave() {
  return (
    <View style={micWaveStyles.row} {...DECORATIVE_A11Y}>
      {MIC_WAVE_BARS.map((bar, i) => (
        <MicWaveBar key={i} height={bar.h} delay={bar.delay} color={bar.color} />
      ))}
    </View>
  );
}

const micWaveStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 50,
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
});

function tintColor(tint: LastAction["tint"], colors: Palette) {
  if (tint === "spotify") return "#1DB954";
  if (tint === "blue") return colors.washBlue;
  if (tint === "green") return colors.washGreen;
  if (tint === "yellow") return colors.washYellow;
  return colors.washPurple;
}

export default function HomeScreen({ onNav, onStartFlow, quickSend, onQuickSend }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createHomeStyles);
  const [selectedSend, setSelectedSend] = useState("Mansi");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const BANNERS = bannersFor(colors, onNav);
  const balanceSpoken = formatCurrencySpoken(HOME_BALANCE);
  const serviceCount = SERVICES.length;
  const visibleActions = LAST_ACTIONS.slice(0, LAST_ACTIONS_PREVIEW);
  const quickItems: QuickItem[] = quickSend.length
    ? quickSend.slice(0, 6).map((c) => ({ name: c.name, contact: c }))
    : QUICK_SEND;

  return (
    <Screen style={styles.root} safeBottom={false}>
      <NotificationsModal
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Home"
      >
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <Pressable
              onPress={() => onNav("profile")}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Open your profile"
              accessibilityHint="Opens profile and settings"
              hitSlop={8}
              style={styles.profileAvatarHit}
            >
              <Avatar source={brandImages.pratik} size={42} />
            </Pressable>
            <AppText variant="headingSM" color={colors.text} heading={1} style={styles.hello}>
              Hello, <Text style={styles.helloName}>Pratik!</Text>
            </AppText>
          </View>
          <View
            style={styles.headerActions}
            accessibilityRole="toolbar"
            accessibilityLabel="Quick actions"
          >
            <Pressable
              onPress={() => setNotificationsOpen(true)}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Notifications"
              accessibilityHint="Opens your notifications"
              hitSlop={12}
              style={styles.iconBtn}
            >
              <Icon name="notifications-outline" size={22} color={colors.text} />
              <View style={styles.notifDot} {...DECORATIVE_A11Y} />
            </Pressable>
            <Pressable
              onPress={() => onNav("services")}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Open all services"
              accessibilityHint="Shows every Aya service in one place"
              hitSlop={12}
              style={styles.iconBtn}
            >
              <Icon name="grid-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View
          accessible
          accessibilityRole="summary"
          role="summary"
          accessibilityLabel={`Your balance, ${balanceSpoken}`}
          accessibilityLiveRegion="polite"
          style={styles.balanceBlock}
        >
          <AppText
            variant="labelSM"
            align="center"
            color={colors.purple}
            style={styles.balanceLabel}
            importantForAccessibility="no"
          >
            Your balance
          </AppText>
          <AppText
            variant="displayLG"
            align="center"
            color={colors.text}
            style={styles.balance}
            numberOfLines={1}
            adjustsFontSizeToFit
            importantForAccessibility="no"
          >
            {formatCurrency(HOME_BALANCE)}
          </AppText>
        </View>

        <View style={styles.stage}>
          <Image
            source={brandImages.cardStack}
            style={styles.cardStack as ImageStyle}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            {...DECORATIVE_A11Y}
          />
          <View style={styles.micWrap}>
            <Pressable
              onPress={() => onStartFlow("transfer")}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Talk to send money"
              accessibilityHint="Starts a voice-guided transfer"
              style={({ pressed }) => [styles.micButton, pressed && styles.micPressed]}
            >
              <MicWave />
            </Pressable>
          </View>
        </View>

        <AppText variant="headingSM" heading={2} style={styles.sectionTitle}>
          Recipients
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hRow}
          accessibilityRole="list"
          role="list"
          accessibilityLabel={`Recent recipients, ${RECIPIENTS.length + 1} items`}
        >
          {RECIPIENTS.map((person, i) => (
            <View
              key={person.name}
              role="listitem"
            >
              <Pressable
                onPress={() => onStartFlow("transfer")}
                accessibilityRole="button"
                role="button"
                accessibilityLabel={`Send money to ${person.name}`}
                accessibilityHint={`Recipient ${i + 1} of ${RECIPIENTS.length}. Starts a voice transfer`}
                style={styles.recipientHit}
              >
                <Avatar source={person.image} size={58} />
              </Pressable>
            </View>
          ))}
          <View role="listitem">
            <Pressable
              onPress={() => onStartFlow("transfer")}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="5 more recipients"
              accessibilityHint="Starts a voice transfer to choose another recipient"
              style={styles.moreCircle}
            >
              <AppText variant="labelSM" color={colors.white} importantForAccessibility="no">
                5+
              </AppText>
            </Pressable>
          </View>
        </ScrollView>

        <AppText variant="headingSM" heading={2} style={styles.sectionTitle}>
          Quick access
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickAccessRow}
          accessibilityRole="list"
          role="list"
          accessibilityLabel={`Quick access, ${serviceCount + 1} items`}
        >
          {SERVICES.map((service, index) => {
            const available = Boolean(service.flow || service.screen);
            return (
              <View
                key={service.label}
                role="listitem"
              >
                <Pressable
                  onPress={() => {
                    if (service.screen) {
                      onNav(service.screen);
                      return;
                    }
                    if (service.flow) {
                      onStartFlow(service.flow);
                      return;
                    }
                    Alert.alert(service.label, "This service is coming soon.");
                  }}
                  accessibilityRole="button"
                  role="button"
                  accessible
                  accessibilityLabel={`${service.label}, ${index + 1} of ${serviceCount}${
                    available ? "" : ", coming soon"
                  }`}
                  accessibilityHint={service.actionHint}
                  style={({ pressed }) => [
                    styles.quickAccessItem,
                    pressed && styles.quickAccessPressed,
                    !available && styles.quickAccessDisabled,
                  ]}
                >
                  <View style={styles.quickAccessInner} {...DECORATIVE_A11Y}>
                    <IconWell backgroundColor={colors.washPurple} size={48} radius={16}>
                      <Icon name={service.icon} size={24} color={colors.text} />
                    </IconWell>
                    <AppText variant="caption" numberOfLines={2} style={styles.quickAccessLabel}>
                      {service.label}
                    </AppText>
                  </View>
                </Pressable>
              </View>
            );
          })}
          <View role="listitem">
            <Pressable
              onPress={() => onNav("services")}
              accessibilityRole="button"
              role="button"
              accessible
              accessibilityLabel={`All services, ${serviceCount + 1} of ${serviceCount + 1}`}
              accessibilityHint="Opens the full services list"
              style={({ pressed }) => [
                styles.quickAccessItem,
                pressed && styles.quickAccessPressed,
              ]}
            >
              <View style={styles.quickAccessInner} {...DECORATIVE_A11Y}>
                <IconWell backgroundColor={colors.washBlue} size={48} radius={16}>
                  <Icon name="grid-outline" size={24} color={colors.text} />
                </IconWell>
                <AppText variant="caption" numberOfLines={2} style={styles.quickAccessLabel}>
                  All services
                </AppText>
              </View>
            </Pressable>
          </View>
        </ScrollView>

        <AppText variant="headingSM" heading={2} style={styles.sectionTitle}>
          Highlights
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={BANNER_WIDTH + BANNER_GAP}
          snapToAlignment="start"
          contentContainerStyle={styles.bannerRow}
          accessibilityRole="list"
          role="list"
          accessibilityLabel={`Highlights, ${BANNERS.length} items`}
        >
          {BANNERS.map((banner, i) => (
            <View key={i} role="listitem">
              <Pressable
                onPress={banner.onPress}
                disabled={!banner.onPress}
                accessible
                accessibilityRole={banner.onPress ? "button" : "text"}
                role={banner.onPress ? "button" : undefined}
                accessibilityLabel={`${banner.accessibilityLabel}, ${i + 1} of ${BANNERS.length}`}
                accessibilityHint={
                  banner.onPress ? "Opens this highlight" : "Informational highlight"
                }
                style={[styles.bannerCard, { backgroundColor: banner.bg }]}
              >
                <View style={styles.bannerText} {...DECORATIVE_A11Y}>
                  <AppText variant="labelLG" color={colors.text}>
                    {banner.title}
                  </AppText>
                </View>
                <View style={styles.bannerArt} {...DECORATIVE_A11Y}>
                  <BannerArt kind={banner.illustration} />
                </View>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <View
          style={styles.quickHead}
          accessible
          accessibilityRole="header"
          accessibilityLabel={`Quick send, ${quickItems.length} contacts`}
        >
          <AppText variant="headingSM" heading={2} importantForAccessibility="no">
            Quick send{" "}
          </AppText>
          <AppText variant="headingSM" color={colors.text} importantForAccessibility="no">
            {quickItems.length}
          </AppText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hRow}
          accessibilityRole="list"
          role="list"
          accessibilityLabel={`Quick send, ${quickItems.length} contacts`}
        >
          {quickItems.map((person, index) => {
            const selected = person.name === selectedSend;
            return (
              <View key={person.name} role="listitem">
                <Pressable
                  onPress={() => {
                    setSelectedSend(person.name);
                    if (person.contact) onQuickSend(person.contact);
                    else onStartFlow("transfer");
                  }}
                  accessibilityRole="button"
                  role="button"
                  accessible
                  accessibilityLabel={`Quick send to ${person.name}, ${index + 1} of ${quickItems.length}`}
                  accessibilityHint="Starts a voice transfer to this contact"
                  accessibilityState={{ selected }}
                  aria-selected={selected}
                  style={styles.quickItem}
                >
                  <View {...DECORATIVE_A11Y}>
                    {person.contact ? (
                      <View style={[styles.quickInitials, { backgroundColor: colors.washPurple }]}>
                        <Text style={[styles.quickInitialsText, { color: colors.text }]}>
                          {initials(person.contact.name)}
                        </Text>
                      </View>
                    ) : (
                      <Avatar source={person.image} size={58} />
                    )}
                    <AppText variant="caption" numberOfLines={1} style={styles.quickName}>
                      {person.name}
                    </AppText>
                    <View style={[styles.caret, !selected && styles.caretHidden]} />
                  </View>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.lastActionsBlock}>
          <View style={styles.lastHeader}>
            <AppText variant="headingSM" heading={2} color={colors.textMuted}>
              Last actions
            </AppText>
            <Pressable
              onPress={() => onNav("history")}
              accessibilityRole="button"
              role="button"
              accessible
              accessibilityLabel="See all transactions"
              accessibilityHint="Opens full transaction history"
              hitSlop={8}
              style={styles.lastHeaderRight}
            >
              <AppText variant="caption" color={colors.textMuted} importantForAccessibility="no">
                See all
              </AppText>
            </Pressable>
          </View>

          <View
            accessibilityRole="list"
            role="list"
            accessibilityLabel={`Last actions, ${visibleActions.length} items`}
          >
            {visibleActions.map((action, index) => {
              const amountSpoken = formatCurrencySpoken(action.amount);
              const isLast = index === visibleActions.length - 1;
              return (
                <View
                  key={action.id}
                  accessible
                  role="listitem"
                  accessibilityLabel={`${action.label}, ${action.sub}, ${amountSpoken}`}
                  style={[styles.actionRow, isLast && styles.actionRowLast]}
                >
                  <View
                    style={[
                      styles.actionMark,
                      action.tint === "spotify"
                        ? styles.spotifyMark
                        : { backgroundColor: tintColor(action.tint, colors) },
                    ]}
                    {...DECORATIVE_A11Y}
                  >
                    {action.icon === "spotify" ? (
                      <MciIcon name="spotify" size={22} color={colors.white} />
                    ) : (
                      <Icon name={action.icon} size={20} color={colors.text} />
                    )}
                  </View>
                  <View style={styles.actionText} {...DECORATIVE_A11Y}>
                    <AppText variant="labelSM" numberOfLines={1}>
                      {action.label}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {action.sub}
                    </AppText>
                  </View>
                  <AppText
                    variant="amount"
                    color={action.amount > 0 ? colors.success : colors.text}
                    numberOfLines={1}
                    style={styles.actionAmount}
                    importantForAccessibility="no"
                  >
                    {action.amount > 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(action.amount))}
                  </AppText>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const MIC = 92;

type HomeStyleSheet = Record<string, ViewStyle | TextStyle | ImageStyle>;

function createHomeStyles(colors: Palette): HomeStyleSheet {
  return {
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing["5xl"],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing["2xl"],
  },
  profileRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginRight: spacing.md,
    minWidth: 0,
  },
  profileAvatarHit: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  hello: {
    flex: 1,
    minWidth: 0,
  },
  helloName: {
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.purple,
  },
  balanceLabel: {
    marginBottom: 6,
  },
  balanceBlock: {
    alignItems: "center",
  },
  balance: {
    letterSpacing: -1.2,
    fontWeight: "800",
  },
  stage: {
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  cardStack: {
    position: "absolute",
    width: 345,
    height: 240,
  },
  micWrap: {
    width: MIC,
    height: MIC,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -130,
    zIndex: 2,
  },
  micButton: {
    width: MIC,
    height: MIC,
    borderRadius: MIC / 2,
    backgroundColor: "rgba(228,228,235,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5528E8",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 14,
  },
  micPressed: {
    opacity: 0.88,
  },
  bannerRow: {
    gap: BANNER_GAP,
    paddingRight: 8,
    marginBottom: spacing["2xl"],
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: radii["2xl"],
    overflow: "hidden",
  },
  bannerText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingRight: spacing["2xl"],
    maxWidth: BANNER_WIDTH - 108,
    zIndex: 2,
  },
  bannerArt: {
    position: "absolute",
    right: -22,
    bottom: -26,
    zIndex: 1,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  sectionLead: {
    marginBottom: spacing.md,
    color: colors.textMuted,
  },
  hRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingRight: 8,
    marginBottom: spacing["2xl"],
  },
  recipientHit: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  moreCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  quickAccessRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingRight: 8,
    marginBottom: spacing["2xl"],
  },
  quickAccessItem: {
    width: 76,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: spacing.xs,
  },
  quickAccessInner: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  quickAccessPressed: {
    opacity: 0.85,
  },
  quickAccessDisabled: {
    opacity: 0.72,
  },
  quickAccessLabel: {
    width: "100%",
    textAlign: "center",
    color: colors.text,
    lineHeight: 16,
    minHeight: 32,
  },
  lastActionsBlock: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  lastHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    marginBottom: spacing.md,
  },
  lastHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    marginBottom: spacing.md,
  },
  actionRowLast: {
    marginBottom: 0,
  },
  actionMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionText: {
    flex: 1,
    minWidth: 0,
  },
  actionAmount: {
    flexShrink: 0,
    marginLeft: 4,
  },
  spotifyMark: {
    backgroundColor: "#1DB954",
  },
  quickHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  quickItem: {
    width: 64,
    minHeight: 88,
    alignItems: "center",
    gap: 6,
  },
  quickInitials: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  quickInitialsText: {
    fontSize: 20,
    fontWeight: "700",
  },
  quickName: {
    textAlign: "center",
    color: colors.text,
  },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: ACCENT,
    marginTop: 2,
  },
  caretHidden: {
    opacity: 0,
  },
  };
}
