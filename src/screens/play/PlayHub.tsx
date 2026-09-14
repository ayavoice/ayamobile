import { Alert, Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppText, Icon, IconWell, WaveIcon } from "../../components/ui";
import { ACCENT, ACCENT_BLUE } from "../../content/brand";
import {
  LEARN_PATHS,
  LOCAL_GAMES,
  type GameProgress,
  type LearnPath,
  type LearnPathId,
  type LocalGameId,
} from "../../content/play";
import { DECORATIVE_A11Y, formatCurrencySpoken } from "../../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../../theme";
import { darken, StarRow, starsFor } from "./shared";

type Props = {
  progress: GameProgress;
  onPlay: (gameId: LocalGameId) => void;
  onOpenPath: (pathId: LearnPathId) => void;
};

function washFor(wash: LearnPath["wash"], colors: Palette) {
  if (wash === "blue") return colors.washBlue;
  if (wash === "yellow") return colors.washYellow;
  if (wash === "green") return colors.washGreen;
  return colors.washPurple;
}

export default function PlayHub({ progress, onPlay, onOpenPath }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const stars = starsFor(progress.best, progress.total);
  const played = progress.plays > 0;
  const spendSpoken = formatCurrencySpoken(180);
  const practiceGames = LOCAL_GAMES.filter((g) => g.id !== "oware");

  return (
    <View style={styles.body}>
      <LinearGradient
        colors={[ACCENT, ACCENT_BLUE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroGlow} {...DECORATIVE_A11Y} />
        <AppText variant="overlineBrand" color="rgba(255,255,255,0.78)" style={styles.heroBrand}>
          Think Genius
        </AppText>
        <AppText
          variant="titleLG"
          color={colors.white}
          heading={1}
          style={styles.heroTitle}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          Learn to think before you pay
        </AppText>
        <AppText
          variant="bodySM"
          color="rgba(255,255,255,0.86)"
          style={styles.heroLead}
          numberOfLines={3}
          adjustsFontSizeToFit
        >
          Safety tips, scam words, and practice play so MoMo stays yours.
        </AppText>
        <View style={styles.heroWave} {...DECORATIVE_A11Y}>
          <WaveIcon size={36} color={colors.white} animated />
        </View>
      </LinearGradient>

      <AppText variant="headingSM" heading={2} style={styles.sectionTitle}>
        Your paths
      </AppText>
      <View
        style={styles.pathList}
        accessibilityRole="list"
        role="list"
        accessibilityLabel={`Learn paths, ${LEARN_PATHS.length} items`}
      >
        {LEARN_PATHS.map((path, index) => (
          <View key={path.id} role="listitem">
            <Pressable
              onPress={() => {
                if (path.id === "practice") {
                  onPlay("oware");
                  return;
                }
                if (path.playable) {
                  onOpenPath(path.id);
                  return;
                }
                Alert.alert(path.title, "This learning path is coming soon.");
              }}
              accessibilityRole="button"
              role="button"
              accessibilityLabel={`${path.title}. ${path.subtitle}`}
              accessibilityHint={
                path.playable ? `Opens ${path.title}` : "This path is coming soon"
              }
              style={({ pressed }) => [
                styles.pathRow,
                { backgroundColor: washFor(path.wash, colors) },
                pressed && styles.pressed,
              ]}
            >
              <View {...DECORATIVE_A11Y}>
                <IconWell backgroundColor={colors.surface} size={48} radius={16}>
                  <Icon name={path.icon} size={22} color={colors.text} />
                </IconWell>
              </View>
              <View style={styles.pathMeta}>
                <AppText
                  variant="labelMD"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  importantForAccessibility="no"
                >
                  {path.title}
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.textMuted}
                  numberOfLines={1}
                  importantForAccessibility="no"
                >
                  {path.subtitle}
                </AppText>
              </View>
              <View style={styles.pathCta} {...DECORATIVE_A11Y}>
                <AppText variant="labelXS" color={colors.purple}>
                  {path.playable ? path.cta : "Soon"}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {index + 1}/{LEARN_PATHS.length}
                </AppText>
              </View>
            </Pressable>
          </View>
        ))}
      </View>

      <AppText variant="headingSM" heading={2} style={styles.sectionTitle}>
        Featured practice
      </AppText>
      <Pressable
        onPress={() => onPlay("oware")}
        accessibilityRole="button"
        role="button"
        accessibilityLabel={`Play Ama's Market Day. Help Ama spend ${spendSpoken} safely. ${
          played
            ? `Best safety score ${progress.best} of ${progress.total}, ${stars} stars.`
            : "Not played yet."
        }`}
        accessibilityHint="Starts the safety practice story"
        style={({ pressed }) => [styles.feature, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={[colors.washPurple, colors.washBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureInner}
        >
          <View style={styles.featureTop}>
            <View {...DECORATIVE_A11Y}>
              <IconWell backgroundColor={colors.purple} size={52} radius={18}>
                <Icon name="storefront-outline" size={24} color={colors.white} />
              </IconWell>
            </View>
            <View style={styles.flex} importantForAccessibility="no">
              <AppText variant="labelXS" color={colors.purple}>
                SAFETY PRACTICE
              </AppText>
              <AppText variant="labelLG" numberOfLines={1} adjustsFontSizeToFit>
                Ama's Market Day
              </AppText>
              <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
                Help Ama spend safely and dodge scam traps
              </AppText>
            </View>
          </View>
          <View style={styles.featureFooter} importantForAccessibility="no">
            {played ? (
              <StarRow count={stars} size={20} filledColor={colors.warning} emptyColor={colors.borderMuted} />
            ) : (
              <AppText variant="caption" color={colors.textMuted}>
                New lesson
              </AppText>
            )}
            <View
              style={[styles.playPillEdge, { backgroundColor: darken(colors.purple, 40) }]}
              {...DECORATIVE_A11Y}
            >
              <View style={[styles.playPillTop, { backgroundColor: colors.purple }]}>
                <Icon name="play" size={16} color={colors.textOnYellow} />
                <AppText variant="labelSM" color={colors.textOnYellow}>
                  {played ? "Play again" : "Start"}
                </AppText>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      <AppText variant="headingSM" heading={2} style={styles.sectionTitle}>
        More ways to practice
      </AppText>
      <View
        style={styles.moreRow}
        accessibilityRole="list"
        role="list"
        accessibilityLabel={`Practice games, ${Math.min(practiceGames.length, 4)} items`}
      >
        {practiceGames.slice(0, 4).map((game) => (
          <View key={game.id} role="listitem" style={styles.moreItem}>
            <Pressable
              onPress={() => {
                if (game.playable) onPlay(game.id);
                else Alert.alert(game.title, "This practice is coming soon.");
              }}
              accessibilityRole="button"
              role="button"
              accessibilityState={{ disabled: !game.playable }}
              accessibilityLabel={`${game.title}. ${game.subtitle}${
                game.playable ? "" : ", coming soon"
              }`}
              accessibilityHint={
                game.playable ? `Starts ${game.title}` : "This practice is coming soon"
              }
              style={({ pressed }) => [styles.moreTile, pressed && styles.pressed]}
            >
              <View {...DECORATIVE_A11Y}>
                <IconWell backgroundColor={washFor(game.wash, colors)} size={44} radius={14}>
                  <Icon name={game.icon} size={22} color={colors.text} />
                </IconWell>
              </View>
              <AppText
                variant="caption"
                numberOfLines={1}
                style={styles.moreLabel}
                importantForAccessibility="no"
              >
                {game.title}
              </AppText>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return {
    body: { gap: spacing.md },
    flex: { flex: 1, minWidth: 0 },
    hero: {
      borderRadius: radii["3xl"],
      paddingHorizontal: spacing.xl,
      paddingTop: spacing["2xl"],
      paddingBottom: spacing.xl,
      overflow: "hidden" as const,
      minHeight: 200,
    },
    heroGlow: {
      position: "absolute" as const,
      right: -40,
      top: -30,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: "rgba(255,255,255,0.14)",
    },
    heroBrand: {
      marginBottom: spacing.sm,
      letterSpacing: 2,
    },
    heroTitle: {
      marginBottom: spacing.sm,
      maxWidth: "92%" as const,
    },
    heroLead: {
      maxWidth: "88%" as const,
      marginBottom: spacing.md,
    },
    heroWave: {
      alignSelf: "flex-start" as const,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    sectionTitle: {
      marginTop: spacing.xs,
    },
    pathList: {
      gap: 10,
    },
    pathRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      borderRadius: radii["2xl"],
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      minWidth: 0,
    },
    pathMeta: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    pathCta: {
      alignItems: "flex-end" as const,
      gap: 2,
    },
    feature: {
      borderRadius: radii["3xl"],
      overflow: "hidden" as const,
    },
    featureInner: {
      borderRadius: radii["3xl"],
      padding: spacing.lg,
      gap: spacing.md,
    },
    featureTop: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      minWidth: 0,
    },
    featureFooter: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    playPillEdge: {
      borderRadius: radii.full,
    },
    playPillTop: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      borderRadius: radii.full,
      paddingVertical: 9,
      paddingHorizontal: 16,
      marginBottom: 3,
    },
    moreRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      justifyContent: "space-between" as const,
      gap: 10,
    },
    moreItem: {
      width: "48%" as const,
    },
    moreTile: {
      width: "100%" as const,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceCard,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: "center" as const,
      gap: 8,
      minHeight: 88,
    },
    moreLabel: {
      textAlign: "center" as const,
      color: colors.text,
      width: "100%" as const,
    },
    pressed: {
      opacity: 0.9,
    },
  };
}
