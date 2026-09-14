import { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Button, Icon, IconWell, Screen, ScreenFooter } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import type { AppLanguage } from "../content/flows";
import { DECORATIVE_A11Y } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

const LANGUAGES: {
  code: AppLanguage;
  name: string;
  badge: string;
  sample: string;
}[] = [
  { code: "tw", name: "Akan / Twi", badge: "TW", sample: "Yɛ ka Twi" },
  { code: "ee", name: "Ewe", badge: "EE", sample: "Míawɔ Eʋegbe" },
  { code: "en", name: "English", badge: "EN", sample: "We speak English" },
];

type Props = { onNext: () => void };

export default function LanguageScreen({ onNext }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { language, setLanguage } = useAppPrefs();
  const [selected, setSelected] = useState<AppLanguage>(language);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <AppText variant="titleLG" heading={1}>Choose your language</AppText>
        <AppText variant="bodyMD" style={styles.sub}>
          Aya will speak and understand you in this language, including mixing in English.
        </AppText>
      </View>

      <View
        style={styles.list}
        accessibilityRole="list"
        role="list"
        accessibilityLabel={`Languages, ${LANGUAGES.length} items`}
      >
        {LANGUAGES.map((lang) => {
          const active = selected === lang.code;
          return (
            <View key={lang.code} role="listitem">
              <Pressable
                onPress={() => setSelected(lang.code)}
                accessibilityRole="button"
                role="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${lang.name}, sample: ${lang.sample}`}
                style={[styles.row, active && styles.rowActive]}
              >
                <View {...DECORATIVE_A11Y}>
                  <IconWell
                    backgroundColor={active ? colors.surface : colors.washPurple}
                    size={52}
                    radius={18}
                  >
                    <AppText variant="labelMD" color={colors.text}>
                      {lang.badge}
                    </AppText>
                  </IconWell>
                </View>

                <View style={styles.meta} importantForAccessibility="no">
                  <AppText variant="heading" numberOfLines={1} importantForAccessibility="no">
                    {lang.name}
                  </AppText>
                  <AppText variant="bodySM" style={styles.sample} numberOfLines={1} importantForAccessibility="no">
                    {lang.sample}
                  </AppText>
                </View>

                <View
                  style={[styles.check, active ? styles.checkOn : styles.checkOff]}
                  {...DECORATIVE_A11Y}
                >
                  {active ? <Icon name="checkmark" size={16} color={colors.textOnYellow} /> : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>

      <ScreenFooter>
        <Button
          onPress={() => {
            setLanguage(selected);
            onNext();
          }}
        >
          Continue
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    header: {
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.screenX,
      flexShrink: 0,
    },
    sub: {
      marginTop: spacing.sm,
    },
    list: {
      flex: 1,
      paddingHorizontal: spacing.screenX,
      paddingVertical: spacing["2xl"],
    },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      minHeight: 84,
      marginBottom: 12,
      borderRadius: radii["2xl"],
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      backgroundColor: colors.surfaceCard,
    },
    rowActive: {
      backgroundColor: colors.washPurple,
    },
    meta: {
      flex: 1,
      marginLeft: spacing.lg,
      marginRight: spacing.md,
      minWidth: 0,
    },
    sample: {
      marginTop: 2,
    },
    check: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      flexShrink: 0,
    },
    checkOn: {
      backgroundColor: colors.purple,
    },
    checkOff: {
      backgroundColor: colors.surface,
    },
  };
}
