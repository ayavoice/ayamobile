import { Alert, Pressable, ScrollView, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { AppText, Icon, IconWell, Screen, ScreenHeader } from "../components/ui";
import { ACCENT, ACCENT_BLUE } from "../content/brand";
import type { FlowId } from "../content/flows";
import { SERVICES, type ServiceItem, type ServiceWash } from "../content/services";
import { DECORATIVE_A11Y } from "../lib/currency";
import type { ScreenId } from "../navigation/types";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = {
  onBack: () => void;
  onStartFlow: (flow: FlowId) => void;
  onNav: (screen: ScreenId) => void;
};

type BannerKind = "send" | "shop" | "wallet";

const ART = 148;
const BANNER_W = 268;
const BANNER_H = 124;
const BANNER_GAP = 12;

function washColor(wash: ServiceWash, colors: Palette) {
  if (wash === "blue") return colors.washBlue;
  if (wash === "green") return colors.washGreen;
  if (wash === "yellow") return colors.washYellow;
  return colors.washPurple;
}

function isAvailable(service: ServiceItem) {
  return Boolean(service.flow || service.screen);
}

function openService(
  service: ServiceItem,
  onStartFlow: (flow: FlowId) => void,
  onNav: (screen: ScreenId) => void,
) {
  if (service.screen) {
    onNav(service.screen);
    return;
  }
  if (service.flow) {
    onStartFlow(service.flow);
    return;
  }
  Alert.alert(service.label, "This service is coming soon.");
}

function ArtAtmosphere({
  blob = "rgba(255,255,255,0.55)",
  accent = "rgba(85,40,232,0.14)",
}: {
  blob?: string;
  accent?: string;
}) {
  return (
    <G>
      <Ellipse cx={108} cy={46} rx={52} ry={44} fill={blob} />
      <Circle cx={36} cy={108} r={24} fill={accent} />
      <Circle cx={24} cy={40} r={6} fill="rgba(255,255,255,0.7)" />
      <Ellipse cx={88} cy={128} rx={38} ry={7} fill="rgba(18,23,33,0.08)" />
    </G>
  );
}

/** Mic + cedi send — voice transfer. */
function SendIllustration() {
  return (
    <Svg width={ART} height={ART} viewBox="0 0 148 148">
      <Defs>
        <SvgGradient id="svcMic" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E8E9FF" />
        </SvgGradient>
        <SvgGradient id="svcMicCore" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ACCENT_BLUE} />
          <Stop offset="1" stopColor={ACCENT} />
        </SvgGradient>
      </Defs>
      <ArtAtmosphere accent="rgba(40,48,240,0.12)" />
      <Path
        d="M104 54c9 7 9 24 0 31"
        stroke={ACCENT_BLUE}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.35}
      />
      <Path
        d="M114 46c14 11 14 38 0 49"
        stroke={ACCENT_BLUE}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.2}
      />
      <Rect x={66} y={96} width={5} height={16} rx={2.5} fill="#C8CBE8" />
      <Ellipse cx={68.5} cy={114} rx={16} ry={4.5} fill="#FFFFFF" />
      <Rect x={55} y={42} width={27} height={52} rx={13.5} fill="url(#svcMic)" />
      <Rect x={60} y={49} width={17} height={32} rx={8.5} fill="url(#svcMicCore)" />
      <Circle cx={68.5} cy={58} r={3} fill="#FFFFFF" opacity={0.9} />
      <Circle cx={68.5} cy={67} r={3} fill="#FFFFFF" opacity={0.55} />
      <Circle cx={68.5} cy={76} r={3} fill="#FFFFFF" opacity={0.35} />
      <Ellipse cx={114} cy={88} rx={20} ry={14} fill="#FFFFFF" />
      <Path
        d="M105 88h16M116 82l8 6-8 6"
        stroke={ACCENT}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Shop QR + speaker rings — merchant receive. */
function ShopIllustration() {
  return (
    <Svg width={ART} height={ART} viewBox="0 0 148 148">
      <Defs>
        <SvgGradient id="svcPhone" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#EDE8FF" />
        </SvgGradient>
        <SvgGradient id="svcScreen" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={ACCENT_BLUE} />
          <Stop offset="1" stopColor={ACCENT} />
        </SvgGradient>
      </Defs>
      <ArtAtmosphere />
      <Path
        d="M108 52c11 9 11 30 0 39"
        stroke={ACCENT}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.28}
      />
      <Path
        d="M118 44c17 12 17 44 0 56"
        stroke={ACCENT}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.16}
      />
      <Rect x={48} y={38} width={48} height={80} rx={12} fill="url(#svcPhone)" />
      <Rect x={54} y={48} width={36} height={54} rx={7} fill="url(#svcScreen)" />
      <Rect x={62} y={56} width={8} height={8} rx={1.5} fill="#FFFFFF" />
      <Rect x={74} y={56} width={8} height={8} rx={1.5} fill="#FFFFFF" opacity={0.85} />
      <Rect x={62} y={68} width={8} height={8} rx={1.5} fill="#FFFFFF" opacity={0.85} />
      <Rect x={74} y={68} width={8} height={8} rx={1.5} fill="#FFFFFF" />
      <Rect x={68} y={80} width={8} height={8} rx={1.5} fill="#FFFFFF" opacity={0.7} />
      <Ellipse cx={72} cy={110} rx={7} ry={2.5} fill="rgba(85,40,232,0.2)" />
      <G>
        <Rect x={98} y={78} width={40} height={26} rx={13} fill="#FFFFFF" />
        <Circle cx={112} cy={91} r={7} fill="#2DBE6C" />
        <Path
          d="M108.5 91l2.5 2.5 5-6"
          stroke="#FFFFFF"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Rect x={122} y={86} width={11} height={3} rx={1.5} fill="#D8D6E8" />
        <Rect x={122} y={92} width={7} height={3} rx={1.5} fill="#E8E6F2" />
      </G>
    </Svg>
  );
}

/** Wallet card + peep balance. */
function WalletIllustration() {
  return (
    <Svg width={ART} height={ART} viewBox="0 0 148 148">
      <Defs>
        <SvgGradient id="svcCard" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={ACCENT_BLUE} />
          <Stop offset="1" stopColor={ACCENT} />
        </SvgGradient>
        <SvgGradient id="svcCoin" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE08A" />
          <Stop offset="1" stopColor="#F0B429" />
        </SvgGradient>
      </Defs>
      <ArtAtmosphere accent="rgba(240,180,41,0.16)" blob="rgba(255,255,255,0.5)" />
      <Rect x={34} y={52} width={78} height={52} rx={14} fill="url(#svcCard)" />
      <Rect x={34} y={66} width={78} height={10} fill="rgba(255,255,255,0.18)" />
      <Circle cx={52} cy={88} r={6} fill="rgba(255,255,255,0.85)" />
      <Rect x={64} y={84} width={28} height={5} rx={2.5} fill="rgba(255,255,255,0.55)" />
      <Rect x={64} y={92} width={18} height={4} rx={2} fill="rgba(255,255,255,0.35)" />
      <Circle cx={112} cy={58} r={18} fill="url(#svcCoin)" />
      <Circle cx={112} cy={58} r={13} fill="#FFF6D6" />
      <Path
        d="M112 50v16M107 54c2-2 8-2 10 0M107 62c2 2 8 2 10 0"
        stroke="#C98A10"
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M48 44l2 4.5 4.5 2L50 53l-2 4.5-2-4.5-4.5-2 4.5-2z"
        fill="#F0B429"
        opacity={0.8}
      />
    </Svg>
  );
}

function BannerArt({ kind }: { kind: BannerKind }) {
  if (kind === "shop") return <ShopIllustration />;
  if (kind === "wallet") return <WalletIllustration />;
  return <SendIllustration />;
}

export default function ServicesScreen({ onBack, onStartFlow, onNav }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createServiceStyles);
  const ready = SERVICES.filter(isAvailable);
  const soon = SERVICES.filter((s) => !isAvailable(s));
  const total = SERVICES.length;

  const banners: {
    kind: BannerKind;
    title: string;
    lead: string;
    bg: string;
    accessibilityLabel: string;
    onPress: () => void;
  }[] = [
    {
      kind: "send",
      title: "Send with your voice",
      lead: "Name + amount",
      bg: colors.washPurple,
      accessibilityLabel: "Send with your voice. Starts a voice transfer",
      onPress: () => onStartFlow("transfer"),
    },
    {
      kind: "shop",
      title: "Get paid out loud",
      lead: "QR + speaker",
      bg: colors.washBlue,
      accessibilityLabel: "Get paid out loud. Opens shop payments with speaker alerts",
      onPress: () => onNav("merchant-receive"),
    },
    {
      kind: "wallet",
      title: "Ask for your balance",
      lead: "Private & spoken",
      bg: colors.washYellow,
      accessibilityLabel: "Ask for your balance. Starts a voice balance check",
      onPress: () => onStartFlow("balance"),
    },
  ];

  return (
    <Screen scroll safeBottom={false}>
      <ScreenHeader title="Services" onBack={onBack} />

      <View style={styles.body}>
        <AppText variant="headingSM" heading={2} style={styles.sectionTitle}>
          Highlights
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={BANNER_W + BANNER_GAP}
          snapToAlignment="start"
          contentContainerStyle={styles.bannerRow}
          accessibilityRole="list"
          role="list"
          accessibilityLabel={`Highlights, ${banners.length} items`}
        >
          {banners.map((banner, i) => (
            <View key={banner.kind} role="listitem">
              <Pressable
                onPress={banner.onPress}
                accessibilityRole="button"
                role="button"
                accessible
                accessibilityLabel={`${banner.accessibilityLabel}, ${i + 1} of ${banners.length}`}
                accessibilityHint="Opens this service"
                style={({ pressed }) => [
                  styles.bannerCard,
                  { backgroundColor: banner.bg },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.bannerText} {...DECORATIVE_A11Y}>
                  <AppText variant="labelLG" color={colors.text} numberOfLines={2}>
                    {banner.title}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted} style={styles.bannerLead}>
                    {banner.lead}
                  </AppText>
                </View>
                <View style={styles.bannerArt} {...DECORATIVE_A11Y}>
                  <BannerArt kind={banner.kind} />
                </View>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHead}>
          <AppText variant="headingSM" heading={2}>
            All services
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {ready.length} ready · {soon.length} soon
          </AppText>
        </View>

        <View
          style={styles.grid}
          accessibilityRole="list"
          role="list"
          accessibilityLabel={`Services, ${total} items`}
        >
          {SERVICES.map((service, index) => {
            const available = isAvailable(service);
            return (
              <View key={service.label} role="listitem" accessible={false} style={styles.tileWrap}>
                <Pressable
                  onPress={() => openService(service, onStartFlow, onNav)}
                  accessibilityRole="button"
                  role="button"
                  accessible
                  accessibilityState={{ disabled: !available }}
                  accessibilityLabel={`${service.label}, ${index + 1} of ${total}${
                    available ? "" : ", coming soon"
                  }`}
                  accessibilityHint={service.actionHint}
                  style={({ pressed }) => [
                    styles.tile,
                    { backgroundColor: washColor(service.wash, colors) },
                    pressed && styles.pressed,
                    !available && styles.tileDisabled,
                  ]}
                >
                  <View {...DECORATIVE_A11Y}>
                    <View style={styles.tileTop}>
                      <IconWell backgroundColor={colors.surface} size={44} radius={16}>
                        <Icon name={service.icon} size={22} color={colors.text} />
                      </IconWell>
                      {!available ? (
                        <View style={[styles.soonBadge, { backgroundColor: colors.surface }]}>
                          <AppText variant="caption" color={colors.textMuted}>
                            Soon
                          </AppText>
                        </View>
                      ) : (
                        <View style={styles.chevWrap}>
                          <Icon name="chevron-forward" size={16} color={colors.textSubtle} />
                        </View>
                      )}
                    </View>
                    <AppText variant="labelMD" style={styles.tileLabel} numberOfLines={1}>
                      {service.label}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
                      {service.hint}
                    </AppText>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function createServiceStyles(colors: Palette) {
  return {
    body: {
      paddingHorizontal: spacing.screenX,
      paddingBottom: spacing["4xl"],
      paddingTop: spacing.sm,
    },
    sectionTitle: {
      marginBottom: spacing.md,
    },
    sectionHead: {
      flexDirection: "row" as const,
      alignItems: "baseline" as const,
      justifyContent: "space-between" as const,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    bannerRow: {
      gap: BANNER_GAP,
      paddingRight: 4,
      marginBottom: spacing["2xl"],
    },
    bannerCard: {
      width: BANNER_W,
      height: BANNER_H,
      borderRadius: radii["2xl"],
      overflow: "hidden" as const,
    },
    bannerText: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      padding: spacing.lg,
      paddingRight: spacing["3xl"],
      maxWidth: BANNER_W - 100,
      zIndex: 2,
      gap: 4,
    },
    bannerLead: {
      marginTop: 2,
    },
    bannerArt: {
      position: "absolute" as const,
      right: -18,
      bottom: -22,
      zIndex: 1,
    },
    grid: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      justifyContent: "space-between" as const,
    },
    tileWrap: {
      width: "48%" as const,
      marginBottom: spacing.md,
    },
    tile: {
      width: "100%" as const,
      borderRadius: radii["2xl"],
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      gap: 8,
      minHeight: 132,
    },
    tileTop: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      marginBottom: 2,
    },
    tileLabel: {
      marginTop: 2,
    },
    soonBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radii.full,
    },
    chevWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: colors.surface,
    },
    tileDisabled: {
      opacity: 0.78,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.985 }],
    },
  };
}
