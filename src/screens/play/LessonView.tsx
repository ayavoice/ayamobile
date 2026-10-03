import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Button, Icon, ScreenFooter } from "../../components/ui";
import type { Lesson } from "../../content/learn";
import { useAppPrefs } from "../../context/AppPrefs";
import { DECORATIVE_A11Y } from "../../lib/currency";
import { vibrate } from "../../lib/haptics";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../../theme";

type Props = {
  lesson: Lesson;
  position: { current: number; total: number };
  onDone: () => void;
};

export default function LessonView({ lesson, position, onDone }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { accessibility } = useAppPrefs();
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === lesson.check.answer;

  const choose = (index: number) => {
    if (picked !== null) return;
    setPicked(index);
    vibrate(index === lesson.check.answer ? "success" : "failed", accessibility.haptics);
  };

  return (
    <View style={styles.body}>
      <View style={styles.head}>
        <AppText variant="caption" color={colors.textMuted}>
          Lesson {position.current} of {position.total} · {lesson.minutes} min
        </AppText>
        <AppText variant="titleSM" heading={2}>
          {lesson.title}
        </AppText>
      </View>

      <View style={styles.story}>
        <AppText variant="overline" color={colors.textMuted} heading={3}>
          What happens
        </AppText>
        <AppText variant="bodyMD" color={colors.text}>
          {lesson.story}
        </AppText>
      </View>

      {lesson.signs ? (
        <View style={styles.section}>
          <AppText variant="labelLG" heading={3}>
            Warning signs
          </AppText>
          <View role="list" style={styles.list}>
            {lesson.signs.map((sign) => (
              <View key={sign} role="listitem" style={styles.item}>
                <View {...DECORATIVE_A11Y} style={styles.itemIcon}>
                  <Icon name="alert-circle-outline" size={20} color={colors.danger} />
                </View>
                <AppText variant="bodyMD" color={colors.text} style={styles.flex}>
                  {sign}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="labelLG" heading={3}>
          What to do
        </AppText>
        <View role="list" style={styles.list}>
          {lesson.steps.map((step, i) => (
            <View
              key={step}
              role="listitem"
              style={styles.item}
              accessible
              accessibilityLabel={`Step ${i + 1}. ${step}`}
            >
              <View style={styles.num} {...DECORATIVE_A11Y}>
                <AppText variant="labelXS" color={colors.white}>
                  {i + 1}
                </AppText>
              </View>
              <AppText variant="bodyMD" color={colors.text} style={styles.flex} importantForAccessibility="no">
                {step}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.remember} role="note" accessible accessibilityLabel={`Remember. ${lesson.remember}`}>
        <View {...DECORATIVE_A11Y}>
          <Icon name="shield-checkmark" size={22} color={colors.purple} />
        </View>
        <AppText variant="labelMD" style={styles.flex} importantForAccessibility="no">
          {lesson.remember}
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="labelLG" heading={3}>
          Quick check
        </AppText>
        <AppText variant="bodyMD" color={colors.text}>
          {lesson.check.question}
        </AppText>
        <View role="radiogroup" accessibilityRole="radiogroup" aria-label="Answers" style={styles.list}>
          {lesson.check.options.map((option, i) => {
            const selected = picked === i;
            const reveal = picked !== null;
            const isAnswer = i === lesson.check.answer;
            const tone = reveal && isAnswer ? "right" : reveal && selected ? "wrong" : null;
            return (
              <Pressable
                key={option}
                onPress={() => choose(i)}
                disabled={reveal}
                role="radio"
                accessibilityRole="radio"
                aria-checked={selected}
                accessibilityState={{ checked: selected, disabled: reveal }}
                accessibilityLabel={`${option}${tone === "right" ? ", correct answer" : tone === "wrong" ? ", not quite" : ""}`}
                style={[
                  styles.option,
                  tone === "right" && styles.optionRight,
                  tone === "wrong" && styles.optionWrong,
                ]}
              >
                <AppText variant="labelMD" style={styles.flex} importantForAccessibility="no">
                  {option}
                </AppText>
                {tone ? (
                  <View {...DECORATIVE_A11Y}>
                    <Icon
                      name={tone === "right" ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={tone === "right" ? colors.success : colors.danger}
                    />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {picked !== null ? (
          <View role="status" aria-live="polite" accessibilityLiveRegion="polite">
            <AppText variant="bodySM" color={colors.text}>
              <AppText variant="labelSM" color={correct ? colors.success : colors.danger}>
                {correct ? "Correct. " : "Not quite. "}
              </AppText>
              {lesson.check.explain}
            </AppText>
          </View>
        ) : null}
      </View>

      <ScreenFooter>
        <Button onPress={onDone}>{picked !== null ? "Done" : "Finish lesson"}</Button>
      </ScreenFooter>
    </View>
  );
}

function createStyles(colors: Palette) {
  return {
    body: { gap: spacing["2xl"], flex: 1 },
    flex: { flex: 1, minWidth: 0 },
    head: { gap: spacing.xs },
    story: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii["2xl"],
      backgroundColor: colors.surfaceCard,
    },
    section: { gap: spacing.md },
    list: { gap: spacing.md },
    item: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: spacing.md,
    },
    itemIcon: { marginTop: 1 },
    num: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginTop: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: colors.purple,
    },
    remember: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii["2xl"],
      backgroundColor: colors.washPurple,
    },
    option: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      minHeight: 52,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.xl,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    optionRight: { borderColor: colors.success, backgroundColor: colors.successSurface },
    optionWrong: { borderColor: colors.danger, backgroundColor: colors.dangerSurface },
  };
}
