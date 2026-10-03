import { useEffect, type ComponentProps, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText, Icon, IconWell, Screen, ScreenFooter, ScreenHeader } from "./ui";
import { useAppPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y } from "../lib/currency";
import { speak } from "../lib/speech";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

const HAND_BACK_LINE = "Please hand the phone back to the owner. Only they can do this step.";

type Props = {
  title: string;
  /** One short line under the title. Spoken with the title on arrival. */
  subtitle?: string;
  /** Position in the sign-up journey, shown as a progress bar. */
  step?: { current: number; total: number };
  onBack?: () => void;
  /** Owner must act here, so helpers are asked to hand the phone back. */
  ownerOnly?: boolean;
  /** Pinned below the scrolling content so the main action is always in reach. */
  footer?: ReactNode;
  children?: ReactNode;
};

export default function SetupStep({ title, subtitle, step, onBack, ownerOnly, footer, children }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { helperMode } = useAppPrefs();
  const handBack = ownerOnly && helperMode;

  useEffect(() => {
    speak([handBack ? HAND_BACK_LINE : null, title, subtitle].filter(Boolean).join(" "));
  }, [title, subtitle, handBack]);

  return (
    <Screen>
      <ScreenHeader onBack={onBack} />
      {step ? <StepProgress current={step.current} total={step.total} /> : null}

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.intro}>
          <AppText variant="titleMD" heading={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="bodyMD" color={colors.textSecondary}>
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {handBack ? (
          <View style={styles.handBack} accessibilityRole="alert" role="alert">
            <View {...DECORATIVE_A11Y}>
              <Icon name="hand-right" size={22} color={colors.text} />
            </View>
            <AppText variant="labelSM" style={styles.flex}>
              {HAND_BACK_LINE}
            </AppText>
          </View>
        ) : null}

        <View style={styles.body}>{children}</View>
      </ScrollView>

      {footer ? <ScreenFooter>{footer}</ScreenFooter> : null}
    </Screen>
  );
}

function StepProgress({ current, total }: { current: number; total: number }) {
  const styles = usePaletteStyles(createStyles);
  const label = `Step ${current} of ${total}`;
  return (
    <View
      style={styles.progress}
      accessible
      accessibilityRole="progressbar"
      role="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: current, text: label }}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={label}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.segment, i < current && styles.segmentOn]} />
      ))}
    </View>
  );
}

type ChoiceProps = {
  label: string;
  description?: string;
  icon?: ComponentProps<typeof Icon>["name"];
  badge?: string;
  checked: boolean;
  onPress: () => void;
};

/** Large radio tile used by every setup choice. Put inside a `SetupChoiceGroup`. */
export function SetupChoice({ label, description, icon, badge, checked, onPress }: ChoiceProps) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      role="radio"
      accessibilityState={{ checked, selected: checked }}
      aria-checked={checked}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={[styles.choice, checked && styles.choiceOn]}
    >
      <View {...DECORATIVE_A11Y}>
        <IconWell backgroundColor={checked ? colors.surface : colors.washPurple} size={44} radius={14}>
          {icon ? (
            <Icon name={icon} size={22} color={colors.text} />
          ) : (
            <AppText variant="labelSM">{badge}</AppText>
          )}
        </IconWell>
      </View>
      <View style={styles.flex} importantForAccessibility="no">
        <AppText variant="headingSM" importantForAccessibility="no">
          {label}
        </AppText>
        {description ? (
          <AppText variant="bodyXS" color={colors.textMuted} importantForAccessibility="no">
            {description}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.check, checked ? styles.checkOn : styles.checkOff]} {...DECORATIVE_A11Y}>
        {checked ? <Icon name="checkmark" size={16} color={colors.textOnYellow} /> : null}
      </View>
    </Pressable>
  );
}

export function SetupChoiceGroup({ label, children }: { label: string; children: ReactNode }) {
  const styles = usePaletteStyles(createStyles);
  return (
    <View accessibilityRole="radiogroup" role="radiogroup" accessibilityLabel={label} style={styles.group}>
      {children}
    </View>
  );
}

/** Inline text button for secondary links such as "Not you?" or "Resend code". */
export function SetupLink({
  label,
  lead,
  onPress,
  disabled,
}: {
  label: string;
  lead?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      role="button"
      accessibilityLabel={lead ? `${lead} ${label}` : label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={({ pressed }) => [styles.link, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {lead ? (
        <AppText variant="bodySM" color={colors.textSecondary} importantForAccessibility="no">
          {lead}{" "}
        </AppText>
      ) : null}
      <AppText variant="labelSM" color={colors.text} style={styles.linkText} importantForAccessibility="no">
        {label}
      </AppText>
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return {
    flex: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.xl,
    },
    intro: {
      gap: spacing.sm,
    },
    body: {
      gap: spacing.md,
    },
    progress: {
      flexDirection: "row" as const,
      gap: spacing.xs,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.xs,
    },
    segment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.trackIdle,
    },
    segmentOn: {
      backgroundColor: colors.purple,
    },
    group: {
      gap: spacing.sm,
    },
    choice: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      minHeight: 72,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.xl,
      borderWidth: 2,
      borderColor: "transparent",
      backgroundColor: colors.surfaceCard,
    },
    choiceOn: {
      borderColor: colors.purple,
      backgroundColor: colors.washPurple,
    },
    check: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    checkOn: {
      backgroundColor: colors.purple,
    },
    checkOff: {
      backgroundColor: colors.surface,
    },
    handBack: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.washYellow,
    },
    link: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      flexWrap: "wrap" as const,
      minHeight: 44,
    },
    linkText: {
      textDecorationLine: "underline" as const,
    },
    pressed: {
      opacity: 0.6,
    },
    disabled: {
      opacity: 0.5,
    },
  };
}
