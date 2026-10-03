import { Linking, Pressable, View } from "react-native";
import { AppText, Icon, IconWell } from "../../components/ui";
import { LESSONS, REPORT_CHANNELS, STOP_CHECK_ACT, type LessonId } from "../../content/learn";
import { OWARE_ROUNDS, SCAM_WORD_ROUNDS, type GameProgress, type IonName } from "../../content/play";
import { DECORATIVE_A11Y } from "../../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../../theme";
import { starsFor } from "./shared";

type Props = {
  completed: LessonId[];
  progress: GameProgress;
  onOpenLesson: (id: LessonId) => void;
  onScamWords: () => void;
  onMarketDay: () => void;
};

export default function LearnHub({ completed, progress, onOpenLesson, onScamWords, onMarketDay }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const doneCount = LESSONS.filter((l) => completed.includes(l.id)).length;
  const stars = starsFor(progress.best, progress.total);

  return (
    <View style={styles.body}>
      <View style={styles.intro}>
        <AppText variant="bodyMD" color={colors.textSecondary}>
          Real situations MoMo users face, and what to do. One minute each.
        </AppText>
        <View
          style={styles.track}
          role="progressbar"
          accessibilityRole="progressbar"
          aria-valuemin={0}
          aria-valuemax={LESSONS.length}
          aria-valuenow={doneCount}
          accessibilityLabel={`${doneCount} of ${LESSONS.length} lessons done`}
        >
          <View style={[styles.fill, { width: `${(doneCount / LESSONS.length) * 100}%` }]} />
        </View>
        <AppText variant="caption" color={colors.textMuted} importantForAccessibility="no">
          {doneCount} of {LESSONS.length} done
        </AppText>
      </View>

      <View style={styles.rule} role="region" aria-label="Stop, check, act">
        <AppText variant="labelMD" heading={2}>
          When something feels wrong
        </AppText>
        <View role="list" style={styles.ruleSteps}>
          {STOP_CHECK_ACT.map((step, i) => (
            <View key={step.title} role="listitem" style={styles.ruleStep}>
              <View style={styles.ruleNum} {...DECORATIVE_A11Y}>
                <AppText variant="labelXS" color={colors.white}>
                  {i + 1}
                </AppText>
              </View>
              <AppText variant="bodySM" color={colors.text} style={styles.flex}>
                <AppText variant="labelSM">{step.title}. </AppText>
                {step.detail}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <Section title="Real situations">
        {LESSONS.map((lesson) => {
          const done = completed.includes(lesson.id);
          return (
            <Row
              key={lesson.id}
              icon={lesson.icon}
              title={lesson.title}
              detail={lesson.summary}
              meta={done ? "Done" : `${lesson.minutes} min`}
              done={done}
              onPress={() => onOpenLesson(lesson.id)}
              label={`${lesson.title}. ${lesson.summary}. ${done ? "Done" : `${lesson.minutes} minute read`}`}
            />
          );
        })}
      </Section>

      <Section title="Practice">
        <Row
          icon="chatbubble-ellipses-outline"
          title="Spot the scam words"
          detail="Find the pressure word in real messages"
          meta={`${SCAM_WORD_ROUNDS.length} messages`}
          onPress={onScamWords}
          label={`Spot the scam words. Find the pressure word in real messages. ${SCAM_WORD_ROUNDS.length} messages.`}
        />
        <Row
          icon="cart-outline"
          title="Ama's market day"
          detail="Make safe choices through her day"
          meta={progress.plays > 0 ? `${stars} of 3 stars` : `${OWARE_ROUNDS.length} choices`}
          onPress={onMarketDay}
          label={`Ama's market day. Make safe choices through her day. ${
            progress.plays > 0 ? `Best: ${stars} of 3 stars.` : "Not played yet."
          }`}
        />
      </Section>

      <Section title="Report a scam">
        {REPORT_CHANNELS.map((channel) => (
          <Row
            key={channel.href}
            icon={channel.icon}
            title={channel.title}
            detail={channel.detail}
            onPress={() => {
              Linking.openURL(channel.href).catch(() => {});
            }}
            label={`${channel.title}. ${channel.detail}`}
            trailing="open-outline"
          />
        ))}
      </Section>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = usePaletteStyles(createStyles);
  return (
    <View style={styles.section}>
      <AppText variant="headingSM" heading={2}>
        {title}
      </AppText>
      <View role="list" style={styles.list}>
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  title,
  detail,
  meta,
  done,
  trailing = "chevron-forward",
  onPress,
  label,
}: {
  icon: IonName;
  title: string;
  detail: string;
  meta?: string;
  done?: boolean;
  trailing?: IonName;
  onPress: () => void;
  label: string;
}) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  return (
    <View role="listitem">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        role="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View {...DECORATIVE_A11Y}>
          <IconWell backgroundColor={done ? colors.successSurface : colors.surface} size={44} radius={14}>
            <Icon name={done ? "checkmark" : icon} size={20} color={done ? colors.success : colors.text} />
          </IconWell>
        </View>
        <View style={styles.flex} importantForAccessibility="no-hide-descendants">
          <AppText variant="labelMD">{title}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {detail}
          </AppText>
        </View>
        {meta ? (
          <AppText
            variant="caption"
            color={done ? colors.success : colors.textMuted}
            importantForAccessibility="no"
          >
            {meta}
          </AppText>
        ) : null}
        <View {...DECORATIVE_A11Y}>
          <Icon name={trailing} size={18} color={colors.textMuted} />
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(colors: Palette) {
  return {
    body: { gap: spacing["2xl"] },
    flex: { flex: 1, minWidth: 0, gap: 2 },
    intro: { gap: spacing.sm },
    track: {
      height: 6,
      borderRadius: radii.full,
      backgroundColor: colors.trackIdle,
      overflow: "hidden" as const,
      marginTop: spacing.xs,
    },
    fill: {
      height: 6,
      borderRadius: radii.full,
      backgroundColor: colors.success,
    },
    rule: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii["2xl"],
      backgroundColor: colors.washPurple,
    },
    ruleSteps: { gap: spacing.sm },
    ruleStep: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
    },
    ruleNum: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: colors.purple,
    },
    section: { gap: spacing.md },
    list: { gap: spacing.sm },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      minHeight: 64,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceCard,
    },
    pressed: { opacity: 0.7 },
  };
}
