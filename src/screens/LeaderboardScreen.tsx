import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppText, Avatar, Icon, IconWell, MciIcon, Screen, ScreenHeader } from "../components/ui";
import { brandImages } from "../content/brand";
import { DECORATIVE_A11Y } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onBack: () => void };

type Leader = {
  name: string;
  image: keyof typeof brandImages;
  xp: number;
  delta: number;
  isYou?: boolean;
};

const LEADERS: Leader[] = [
  { name: "Sourabh", image: "sourabh", xp: 480, delta: 42 },
  { name: "Aisha", image: "aisha", xp: 445, delta: 28 },
  { name: "Ricky", image: "ricky", xp: 410, delta: -8 },
  { name: "Pratik", image: "pratik", xp: 360, delta: 15, isYou: true },
  { name: "Sonya", image: "sonya", xp: 310, delta: 6 },
  { name: "Mansi", image: "mansi", xp: 275, delta: -3 },
  { name: "Palak", image: "palak", xp: 230, delta: 12 },
  { name: "Sandeepa", image: "sandeepa", xp: 190, delta: 4 },
];

const TIER = {
  gold: "#F5C518",
  silver: "#B8BECF",
  bronze: "#D4925A",
} as const;

function DeltaChip({ delta, colors }: { delta: number; colors: Palette }) {
  const up = delta >= 0;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        backgroundColor: up ? colors.successSurface : colors.dangerSurface,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radii.full,
      }}
      {...DECORATIVE_A11Y}
    >
      <Icon name={up ? "caret-up" : "caret-down"} size={12} color={up ? colors.successMid : colors.danger} />
      <AppText variant="caption" color={up ? colors.successDark : colors.dangerDark}>
        {Math.abs(delta)}
      </AppText>
    </View>
  );
}

function PodiumPlayer({
  leader,
  rank,
  colors,
}: {
  leader: Leader;
  rank: 1 | 2 | 3;
  colors: Palette;
}) {
  const styles = usePaletteStyles(createPodiumStyles);
  const displayName = leader.isYou ? "You" : leader.name;
  const tier = rank === 1 ? TIER.gold : rank === 2 ? TIER.silver : TIER.bronze;
  const avatarSize = rank === 1 ? 72 : 56;
  const barHeight = rank === 1 ? 88 : rank === 2 ? 64 : 52;

  return (
    <View
      style={styles.col}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Rank ${rank}, ${displayName}, ${leader.xp} XP${leader.isYou ? ", this is you" : ""}`}
    >
      {rank === 1 ? (
        <View {...DECORATIVE_A11Y}>
          <MciIcon name="crown" size={22} color={TIER.gold} style={styles.crown} />
        </View>
      ) : (
        <View style={styles.crownSpacer} {...DECORATIVE_A11Y} />
      )}
      <View
        style={[
          styles.avatarRing,
          {
            borderColor: tier,
            width: avatarSize + 8,
            height: avatarSize + 8,
            borderRadius: (avatarSize + 8) / 2,
          },
        ]}
        {...DECORATIVE_A11Y}
      >
        <Avatar source={brandImages[leader.image]} size={avatarSize} />
      </View>
      <AppText
        variant="labelSM"
        color={colors.text}
        numberOfLines={1}
        style={styles.name}
        importantForAccessibility="no"
      >
        {displayName}
      </AppText>
      <AppText variant="caption" color={colors.textSubtle} importantForAccessibility="no">
        {leader.xp} XP
      </AppText>
      <LinearGradient
        colors={rank === 1 ? [colors.purple, colors.yellow] : [tier, tier]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.bar, { height: barHeight }]}
      >
        <AppText
          variant="labelMD"
          color={rank === 1 ? colors.white : colors.dark}
          importantForAccessibility="no"
        >
          {rank}
        </AppText>
      </LinearGradient>
    </View>
  );
}

export default function LeaderboardScreen({ onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const you = LEADERS.find((l) => l.isYou);
  const yourRank = LEADERS.findIndex((l) => l.isYou) + 1;
  const top3 = LEADERS.slice(0, 3);
  const maxXp = LEADERS[0]?.xp ?? 1;

  return (
    <Screen style={styles.root} scroll safeBottom={false}>
      <ScreenHeader title="Learn leaderboard" onBack={onBack} />
      <View style={styles.body}>
        <View
          style={styles.hero}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`This week's learn leaderboard. You're number ${yourRank} with ${you?.xp ?? 0} XP.`}
        >
          <View style={styles.heroTop} importantForAccessibility="no">
            <View style={[styles.weekChip, { backgroundColor: colors.washPurple }]}>
              <Icon name="flash" size={14} color={colors.purple} />
              <AppText variant="labelXS" color={colors.purple}>
                This week
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textSubtle}>
              Think Genius Ghana
            </AppText>
          </View>

          <View style={styles.podiumRow}>
            {top3[1] ? <PodiumPlayer leader={top3[1]} rank={2} colors={colors} /> : <View style={styles.flex} />}
            {top3[0] ? <PodiumPlayer leader={top3[0]} rank={1} colors={colors} /> : <View style={styles.flex} />}
            {top3[2] ? <PodiumPlayer leader={top3[2]} rank={3} colors={colors} /> : <View style={styles.flex} />}
          </View>
        </View>

        {you ? (
          <LinearGradient
            colors={[colors.purple, colors.yellow]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.youEdge}
          >
            <View
              style={[styles.youCard, { backgroundColor: colors.surface }]}
              accessible
              accessibilityRole="summary"
              accessibilityLabel={`You're number ${yourRank} this week. ${you.xp} XP. Learn and practice to climb up.`}
            >
              <View style={styles.youRank} {...DECORATIVE_A11Y}>
                <AppText variant="labelMD" color={colors.purple}>
                  #{yourRank}
                </AppText>
              </View>
              <View {...DECORATIVE_A11Y}>
                <Avatar source={brandImages[you.image]} size={48} />
              </View>
              <View style={styles.flex} importantForAccessibility="no">
                <AppText variant="labelMD" importantForAccessibility="no">
                  Your spot
                </AppText>
                <AppText variant="caption" color={colors.textSubtle} importantForAccessibility="no">
                  {you.xp} XP · {maxXp - you.xp} XP behind 1st
                </AppText>
              </View>
              <DeltaChip delta={you.delta} colors={colors} />
            </View>
          </LinearGradient>
        ) : null}

        <View
          style={styles.list}
          role="list"
          accessibilityRole="list"
          accessibilityLabel={`Full rankings, ${LEADERS.length} players`}
        >
          <View style={styles.listHeader} importantForAccessibility="no">
            <AppText variant="labelSM" color={colors.textSubtle}>
              Full rankings
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {LEADERS.length} players
            </AppText>
          </View>

          {LEADERS.map((leader, i) => {
            const rank = i + 1;
            const displayName = leader.isYou ? "You" : leader.name;
            const isTop = rank <= 3;
            const medal = rank === 1 ? TIER.gold : rank === 2 ? TIER.silver : rank === 3 ? TIER.bronze : null;

            return (
              <View
                key={leader.name}
                role="listitem"
                accessible
                accessibilityLabel={`Rank ${rank}, ${displayName}, ${leader.xp} XP, ${
                  leader.delta >= 0 ? "up" : "down"
                } ${Math.abs(leader.delta)}${leader.isYou ? ", this is you" : ""}`}
                style={[
                  styles.row,
                  i < LEADERS.length - 1 && styles.rowDivider,
                  leader.isYou && { backgroundColor: colors.washPurple },
                ]}
              >
                <View style={styles.rankCol} importantForAccessibility="no">
                  {medal ? (
                    <IconWell backgroundColor={medal} size={28} radius={14}>
                      <AppText variant="labelXS" color={colors.dark}>
                        {rank}
                      </AppText>
                    </IconWell>
                  ) : (
                    <AppText variant="labelSM" color={colors.textSubtle}>
                      {rank}
                    </AppText>
                  )}
                </View>
                <View {...DECORATIVE_A11Y}>
                  <Avatar source={brandImages[leader.image]} size={44} />
                </View>
                <View style={styles.flex} importantForAccessibility="no">
                  <View style={styles.nameRow}>
                    <AppText
                      variant={leader.isYou || isTop ? "labelMD" : "labelSM"}
                      numberOfLines={1}
                      style={styles.flex}
                    >
                      {displayName}
                    </AppText>
                    <DeltaChip delta={leader.delta} colors={colors} />
                  </View>
                  <AppText variant="caption" color={colors.textSubtle}>
                    {leader.xp} XP
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function createPodiumStyles(_colors: Palette) {
  return {
    col: { flex: 1, alignItems: "center" as const, gap: 6 },
    crown: { marginBottom: 2 },
    crownSpacer: { height: 24 },
    avatarRing: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 3,
      marginBottom: 2,
    },
    name: { maxWidth: 88, textAlign: "center" as const },
    bar: {
      width: "78%" as const,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      alignItems: "center" as const,
      paddingTop: 8,
      marginTop: 4,
    },
  };
}

function createStyles(colors: Palette) {
  return {
    root: { flex: 1 },
    body: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing["3xl"],
      gap: spacing.lg,
    },
    flex: { flex: 1, minWidth: 0 },
    hero: {
      backgroundColor: colors.backgroundMuted,
      borderRadius: radii["3xl"],
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingBottom: 0,
      overflow: "hidden" as const,
      gap: spacing.md,
    },
    heroTop: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: spacing.sm,
    },
    weekChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radii.full,
    },
    podiumRow: {
      flexDirection: "row" as const,
      alignItems: "flex-end" as const,
      gap: spacing.xs,
      paddingTop: spacing.sm,
    },
    youEdge: {
      borderRadius: radii["2xl"],
      padding: 2,
    },
    youCard: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      borderRadius: radii["2xl"] - 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    youRank: {
      minWidth: 40,
      alignItems: "center" as const,
    },
    list: {
      overflow: "hidden" as const,
      paddingBottom: spacing.sm,
    },
    listHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      minHeight: 72,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    rankCol: {
      width: 28,
      alignItems: "center" as const,
    },
    nameRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      marginBottom: 2,
    },
  };
}
