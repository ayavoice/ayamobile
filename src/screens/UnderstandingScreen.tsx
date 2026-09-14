import { Pressable, ScrollView, View } from "react-native";
import {
  AppText,
  Button,
  Card,
  DetailRow,
  Icon,
  Screen,
  ScreenFooter,
  ScreenHeader,
} from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y } from "../lib/currency";
import { fonts, radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onConfirm: () => void; onBack: () => void };

export default function UnderstandingScreen({ onConfirm, onBack }: Props) {
  const { flow } = useAppPrefs();
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);

  return (
    <Screen>
      <ScreenHeader title="Review" onBack={onBack} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          accessible
          accessibilityLabel="Ready to continue"
          style={styles.badge}
        >
          <View {...DECORATIVE_A11Y}>
            <Icon name="checkmark-circle" size={20} color={colors.successDark} />
          </View>
          <AppText variant="labelSM" color={colors.successDark} importantForAccessibility="no">
            Ready to continue
          </AppText>
        </View>

        <AppText variant="titleMD" style={styles.title} heading={2}>
          {flow.intentLabel}
        </AppText>

        <Card style={styles.summary}>
          {flow.details.map((row, i) => (
            <DetailRow
              key={row.label}
              label={row.label}
              value={row.value}
              last={i === flow.details.length - 1}
            />
          ))}
        </Card>
      </ScrollView>

      <ScreenFooter>
        <Button onPress={onConfirm}>Continue</Button>
        <View style={styles.linkRow}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Change"
            hitSlop={8}
            style={styles.linkHit}
          >
            <AppText
              variant="bodySM"
              color={colors.text}
              style={styles.linkStrong}
              importantForAccessibility="no"
            >
              Change
            </AppText>
          </Pressable>
          <AppText variant="bodySM" color={colors.textSubtle} importantForAccessibility="no">
            {" "}
            ·{" "}
          </AppText>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Cancel"
            hitSlop={8}
            style={styles.linkHit}
          >
            <AppText variant="bodySM" color={colors.textSecondary} importantForAccessibility="no">
              Cancel
            </AppText>
          </Pressable>
        </View>
      </ScreenFooter>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    flex: {
      flex: 1,
      minHeight: 0,
    },
    body: {
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    badge: {
      alignSelf: "flex-start" as const,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      backgroundColor: colors.successSurface,
      borderRadius: radii.full,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xl,
    },
    title: {
      marginBottom: spacing.xl,
    },
    summary: {
      marginBottom: spacing.xl,
    },
    linkRow: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      minHeight: 44,
    },
    linkHit: {
      minHeight: 44,
      justifyContent: "center" as const,
      paddingHorizontal: spacing.xs,
    },
    linkStrong: {
      fontFamily: fonts.body.bold,
    },
  };
}
