import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppText, Card, Icon, IconWell, MciIcon } from "../../components/ui";
import { DECORATIVE_A11Y } from "../../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../../theme";
import { buildLeague, type LeagueEntry, type LeagueTrend } from "../../content/play";

type Props = { xp: number };

const TIER = {
  gold: "#FFD54A",
  silver: "#C9CEE0",
  bronze: "#E3A272",
};

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

function TrendIcon({ trend }: { trend: LeagueTrend }) {
  const colors = useColors();
  if (trend === "up") return <Icon name="caret-up" size={14} color={colors.successMid} />;
  if (trend === "down") return <Icon name="caret-down" size={14} color={colors.danger} />;
  return <Icon name="remove" size={12} color={colors.textSubtle} />;
}

function trendSpoken(trend: LeagueTrend) {
  if (trend === "up") return "trending up";
  if (trend === "down") return "trending down";
  return "unchanged";
}

function PodiumSlot({
  entry,
  rank,
  avatarSize,
  barHeight,
  tierColor,
}: {
  entry: LeagueEntry;
  rank: number;
  avatarSize: number;
  barHeight: number;
  tierColor: string;
}) {
  const displayName = entry.isYou ? "You" : entry.name;
  return (
    <View
      style={podiumSlotStyles.col}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Rank ${rank}, ${displayName}, ${entry.xp.toLocaleString()} XP${
        entry.isYou ? ", this is you" : ""
      }`}
    >
      {rank === 1 ? (
        <View {...DECORATIVE_A11Y}>
          <MciIcon name="crown" size={22} color={TIER.gold} style={podiumSlotStyles.crown} />
        </View>
      ) : (
        <View style={podiumSlotStyles.crownSpacer} {...DECORATIVE_A11Y} />
      )}
      <View
        style={[
          podiumSlotStyles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderColor: tierColor,
          },
          entry.isYou && { borderColor: "#FFFFFF" },
        ]}
        importantForAccessibility="no"
      >
        <AppText variant="labelLG" color="#FFFFFF" importantForAccessibility="no">
          {initials(entry.name)}
        </AppText>
      </View>
      <AppText variant="labelXS" color="#FFFFFF" numberOfLines={1} style={podiumSlotStyles.name} importantForAccessibility="no">
        {displayName}
      </AppText>
      <AppText variant="caption" color="rgba(255,255,255,0.68)" importantForAccessibility="no">
        {entry.xp.toLocaleString()} XP
      </AppText>
      <View style={[podiumSlotStyles.bar, { height: barHeight, backgroundColor: tierColor }]} importantForAccessibility="no">
        <AppText variant="labelMD" color="#1B1433" importantForAccessibility="no">
          {rank}
        </AppText>
      </View>
    </View>
  );
}

export default function LeaderboardScreen({ xp }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { league, youRank } = buildLeague(xp);
  const podium = league.slice(0, 3);
  const rest = league.slice(3);

  return (
    <View style={styles.body}>
      <Card style={styles.introCard}>
        <View {...DECORATIVE_A11Y}>
          <IconWell backgroundColor={colors.washPurple} size={52} radius={26}>
            <Icon name="trophy" size={24} color={colors.text} />
          </IconWell>
        </View>
        <View style={styles.flex}>
          <AppText variant="headingSM" heading={2}>
            Ghana League
          </AppText>
          <AppText variant="caption" color={colors.textSubtle}>
            This week · you're #{youRank}
          </AppText>
        </View>
      </Card>

      <LinearGradient
        colors={["#2A1F52", "#120C24"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.podiumCard}
      >
        <View style={styles.podiumRow}>
          {podium[1] ? (
            <PodiumSlot entry={podium[1]} rank={2} avatarSize={56} barHeight={56} tierColor={TIER.silver} />
          ) : (
            <View style={styles.flex} />
          )}
          {podium[0] ? (
            <PodiumSlot entry={podium[0]} rank={1} avatarSize={72} barHeight={84} tierColor={TIER.gold} />
          ) : (
            <View style={styles.flex} />
          )}
          {podium[2] ? (
            <PodiumSlot entry={podium[2]} rank={3} avatarSize={52} barHeight={44} tierColor={TIER.bronze} />
          ) : (
            <View style={styles.flex} />
          )}
        </View>
      </LinearGradient>

      <Card padded={false} style={styles.leagueCard}>
        <View role="list" accessibilityRole="list" accessibilityLabel="Ghana League standings">
          {rest.map((entry, i) => {
            const rank = i + 4;
            const displayName = entry.isYou ? "You" : entry.name;
            return (
              <View
                key={entry.isYou ? "you" : entry.name}
                role="listitem"
                accessible
                accessibilityLabel={`Rank ${rank}, ${displayName}, ${entry.xp.toLocaleString()} XP, ${trendSpoken(
                  entry.trend,
                )}${entry.isYou ? ", this is you" : ""}`}
                style={[
                  styles.leagueRow,
                  i < rest.length - 1 && styles.leagueRowDivider,
                  entry.isYou && { backgroundColor: colors.washPurple },
                ]}
              >
                <AppText variant="labelSM" color={colors.textSubtle} style={styles.rankWell} importantForAccessibility="no">
                  {rank}
                </AppText>
                <View {...DECORATIVE_A11Y}>
                  <IconWell backgroundColor={colors.surfaceGhost} size={36} radius={18}>
                    <AppText variant="labelXS">{initials(entry.name)}</AppText>
                  </IconWell>
                </View>
                <AppText variant={entry.isYou ? "labelMD" : "bodySM"} style={styles.flex} numberOfLines={1} importantForAccessibility="no">
                  {displayName}
                </AppText>
                <View {...DECORATIVE_A11Y}>
                  <TrendIcon trend={entry.trend} />
                </View>
                <AppText variant="labelSM" color={colors.textSubtle} importantForAccessibility="no">
                  {entry.xp.toLocaleString()} XP
                </AppText>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

function createStyles(colors: Palette) {
  return {
    body: { gap: spacing.md },
    flex: { flex: 1, minWidth: 0 },
    introCard: { flexDirection: "row" as const, alignItems: "center" as const, gap: spacing.md },
    podiumCard: {
      borderRadius: radii["3xl"],
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      overflow: "hidden" as const,
    },
    podiumRow: { flexDirection: "row" as const, alignItems: "flex-end" as const, gap: spacing.sm },
    leagueCard: { overflow: "hidden" as const },
    leagueRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
    },
    leagueRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.borderMuted },
    rankWell: { width: 20, textAlign: "center" as const },
  };
}

const podiumSlotStyles = {
  col: { flex: 1, alignItems: "center" as const, gap: 6 as const },
  crown: { marginBottom: 2 },
  crownSpacer: { height: 24 },
  avatar: {
    borderWidth: 3,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  name: { maxWidth: 78 },
  bar: {
    width: "82%" as const,
    borderRadius: radii.lg,
    alignItems: "center" as const,
    paddingTop: 6,
    marginTop: 4,
  },
};
