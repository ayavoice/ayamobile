import { Pressable, View } from "react-native";
import { AppText, Icon } from "./ui";
import { BREATHING_STEPS, COMFORT_LINES, COMFORT_REACH_OUT, COMFORT_TITLE } from "../content/emotionalSupport";
import { DECORATIVE_A11Y } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = {
  onTalkToPerson: () => void;
  onHide: () => void;
};

export default function ComfortCard({ onTalkToPerson, onHide }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);

  return (
    <View style={styles.card} role="region" aria-label={COMFORT_TITLE}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <View {...DECORATIVE_A11Y}>
            <Icon name="heart" size={20} color={colors.purple} />
          </View>
          <AppText variant="headingSM" heading={2}>
            {COMFORT_TITLE}
          </AppText>
        </View>
        <Pressable
          onPress={onHide}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Hide this message"
          hitSlop={8}
          style={styles.hide}
        >
          <Icon name="close" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <View role="list" style={styles.list}>
        {COMFORT_LINES.map((line) => (
          <View key={line.text} role="listitem" style={styles.row}>
            <View {...DECORATIVE_A11Y}>
              <Icon name={line.icon} size={18} color={colors.purple} />
            </View>
            <AppText variant="bodyMD" color={colors.text} style={styles.flex}>
              {line.text}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.breath} accessible accessibilityLabel={`Take a slow breath. ${BREATHING_STEPS.join(", ")}.`}>
        <AppText variant="labelSM" importantForAccessibility="no">
          Take a slow breath
        </AppText>
        <View style={styles.breathSteps} importantForAccessibility="no-hide-descendants">
          {BREATHING_STEPS.map((step, i) => (
            <View key={step} style={styles.breathStep}>
              <View style={styles.breathNum}>
                <AppText variant="labelXS" color={colors.purple}>
                  {i + 1}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.text} align="center">
                {step}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.list}>
        <AppText variant="overline" color={colors.textMuted} heading={3}>
          Reach out
        </AppText>
        {COMFORT_REACH_OUT.map((item, i) => {
          const content = (
            <>
              <View {...DECORATIVE_A11Y}>
                <Icon name={item.icon} size={18} color={colors.text} />
              </View>
              <View style={styles.flex} importantForAccessibility="no">
                <AppText variant="labelSM">{item.title}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {item.detail}
                </AppText>
              </View>
            </>
          );
          return i === 0 ? (
            <Pressable
              key={item.title}
              onPress={onTalkToPerson}
              accessibilityRole="button"
              role="button"
              accessibilityLabel={`${item.title}. ${item.detail}`}
              style={({ pressed }) => [styles.row, styles.action, pressed && styles.pressed]}
            >
              {content}
              <View {...DECORATIVE_A11Y}>
                <Icon name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          ) : (
            <View key={item.title} style={styles.row} accessible accessibilityLabel={`${item.title}. ${item.detail}`}>
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return {
    card: {
      marginTop: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.washPurple,
      gap: spacing.lg,
    },
    head: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    titleRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
    },
    hide: {
      width: 44,
      height: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginRight: -spacing.sm,
    },
    list: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
    },
    flex: {
      flex: 1,
      minWidth: 0,
    },
    breath: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
    },
    breathSteps: {
      flexDirection: "row" as const,
      gap: spacing.sm,
    },
    breathStep: {
      flex: 1,
      alignItems: "center" as const,
      gap: spacing.xs,
    },
    breathNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: colors.washPurple,
    },
    action: {
      minHeight: 56,
      paddingHorizontal: spacing.md,
      marginHorizontal: -spacing.md,
      borderRadius: radii.lg,
    },
    pressed: {
      opacity: 0.6,
    },
  };
}
