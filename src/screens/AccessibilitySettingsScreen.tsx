import { Pressable, View } from "react-native";
import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppText, Card, Icon, IconWell, Screen, ScreenHeader, Toggle } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import type { AccessibilityPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onBack: () => void };
type ToggleKey = keyof Pick<
  AccessibilityPrefs,
  "highContrast" | "voiceFirst" | "haptics" | "captions" | "screenReader" | "largeText"
>;
type IonName = ComponentProps<typeof Ionicons>["name"];

const TOGGLE_OPTS: { key: ToggleKey; icon: IonName; label: string; desc: string }[] = [
  { key: "voiceFirst", icon: "volume-high", label: "Voice-first mode", desc: "Read all actions aloud" },
  { key: "largeText", icon: "text", label: "Large text", desc: "Bigger fonts throughout" },
  { key: "highContrast", icon: "contrast", label: "High contrast", desc: "Stronger colour differences" },
  { key: "haptics", icon: "phone-portrait-outline", label: "Haptic feedback", desc: "Vibrations for confirmations" },
  { key: "captions", icon: "chatbubble-ellipses-outline", label: "Live captions", desc: "Show text for all speech" },
  { key: "screenReader", icon: "eye-outline", label: "Screen reader", desc: "TalkBack / VoiceOver support" },
];

const TEXT_SIZE_LABELS = ["Small", "Medium", "Large"] as const;

export default function AccessibilitySettingsScreen({ onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createA11yStyles);
  const { accessibility, setAccessibility, language, setLanguage } = useAppPrefs();

  return (
    <Screen scroll>
      <ScreenHeader title="Accessibility" onBack={onBack} />

      <View style={styles.body}>
        <AppText variant="caption" style={styles.cardTitle}>
          Light and dark appearance follow your phone settings. Logos switch with the mode.
        </AppText>
        <Card>
          <AppText variant="labelMD" style={styles.cardTitle} heading={2}>
            Language
          </AppText>
          <View
            style={styles.row}
            accessibilityRole="radiogroup"
            role="radiogroup"
            accessibilityLabel="Language"
          >
            {(
              [
                { code: "tw", label: "Twi" },
                { code: "ee", label: "Ewe" },
                { code: "en", label: "English" },
              ] as const
            ).map((lang) => {
              const on = language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  style={[styles.choice, on ? styles.choiceOn : styles.choiceOff]}
                  accessibilityRole="radio"
                  role="radio"
                  accessibilityState={{ checked: on, selected: on }}
                  aria-checked={on}
                  accessibilityLabel={lang.label}
                >
                  <AppText variant="labelXS" color={on ? colors.textOnYellow : colors.text} importantForAccessibility="no">
                    {lang.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <AppText variant="labelMD" style={styles.cardTitle} heading={2}>
            Text size
          </AppText>
          <View
            style={styles.row}
            accessibilityRole="radiogroup"
            role="radiogroup"
            accessibilityLabel="Text size"
          >
            {[16, 20, 26].map((size, i) => {
              const level = (i + 1) as 1 | 2 | 3;
              const on = accessibility.textSize === level;
              return (
                <Pressable
                  key={size}
                  onPress={() => setAccessibility({ textSize: level, largeText: level > 1 })}
                  style={[styles.choice, on ? styles.choiceOn : styles.choiceOff]}
                  accessibilityRole="radio"
                  role="radio"
                  accessibilityState={{ checked: on, selected: on }}
                  aria-checked={on}
                  accessibilityLabel={`A, ${TEXT_SIZE_LABELS[i]} text size`}
                  accessibilityHint="Makes text larger or smaller"
                >
                  <AppText style={{ fontSize: size, fontWeight: "700", color: on ? colors.textOnYellow : colors.text }} importantForAccessibility="no">
                    A
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <AppText variant="labelMD" style={styles.cardTitle} heading={2}>
            Speech speed
          </AppText>
          <View
            style={styles.row}
            accessibilityRole="radiogroup"
            role="radiogroup"
            accessibilityLabel="Speech speed"
          >
            {(["Slow", "Normal", "Fast"] as const).map((label, i) => {
              const level = (i + 1) as 1 | 2 | 3;
              const on = accessibility.speechSpeed === level;
              return (
                <Pressable
                  key={label}
                  onPress={() => setAccessibility({ speechSpeed: level })}
                  style={[styles.choice, on ? styles.choiceOn : styles.choiceOff]}
                  accessibilityRole="radio"
                  role="radio"
                  accessibilityState={{ checked: on, selected: on }}
                  aria-checked={on}
                  accessibilityLabel={`Speech speed: ${label}`}
                  accessibilityHint="Changes how fast Aya speaks"
                >
                  <AppText variant="labelXS" color={on ? colors.textOnYellow : colors.text} importantForAccessibility="no">
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {TOGGLE_OPTS.map((opt) => {
          const checked = accessibility[opt.key];
          return (
            <Pressable
              key={opt.key}
              onPress={() =>
                setAccessibility({ [opt.key]: !accessibility[opt.key] })
              }
              accessibilityRole="switch"
              role="switch"
              accessibilityState={{ checked }}
              aria-checked={checked}
              accessibilityLabel={opt.label}
              accessibilityHint={opt.desc}
            >
              <Card>
                <View style={styles.toggleRow}>
                  <View {...DECORATIVE_A11Y}>
                    <IconWell backgroundColor={colors.surfaceGhost} size={44} radius={14}>
                      <Icon name={opt.icon} size={22} color={colors.text} />
                    </IconWell>
                  </View>
                  <View style={styles.flex} importantForAccessibility="no">
                    <AppText variant="labelMD" importantForAccessibility="no">{opt.label}</AppText>
                    <AppText variant="caption" importantForAccessibility="no">{opt.desc}</AppText>
                  </View>
                  <View pointerEvents="none" {...DECORATIVE_A11Y}>
                    <Toggle
                      value={checked}
                      onValueChange={() => {}}
                      accessibilityLabel={opt.label}
                    />
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function createA11yStyles(colors: Palette) {
  return {
  body: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardTitle: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row" as const,
    gap: spacing.sm,
  },
  choice: {
    flex: 1,
    height: 48,
    borderRadius: radii["2xl"],
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  choiceOn: {
    backgroundColor: colors.purple,
  },
  choiceOff: {
    backgroundColor: colors.surfaceCard,
  },
  toggleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  };
}
