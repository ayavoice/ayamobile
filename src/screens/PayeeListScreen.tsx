import { FlatList, Pressable, View, type ListRenderItem } from "react-native";
import { AppText, Button, Icon, Screen, ScreenFooter, ScreenHeader } from "../components/ui";
import { useScreenAnnounce } from "../hooks/useScreenAnnounce";
import { initials, type AyaContact } from "../services/contacts";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = {
  /** Spoken payee we could not uniquely resolve. */
  spokenName: string;
  /** Candidate contacts to choose from (falls back to all contacts). */
  candidates: AyaContact[];
  /** True when no match was found at all (candidates is the full list). */
  notFound?: boolean;
  onSelect: (contact: AyaContact) => void;
  onRespeak: () => void;
  onBack: () => void;
  /** Opens the manual number entry screen instead of picking a contact. */
  onEnterNumber?: () => void;
};

export default function PayeeListScreen({
  spokenName,
  candidates,
  notFound = false,
  onSelect,
  onRespeak,
  onBack,
  onEnterNumber,
}: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);

  const showNotFound = notFound || candidates.length === 0;
  const lead = showNotFound
    ? spokenName
      ? `"${spokenName}" was not found in your contacts.`
      : "Who do you want to send to?"
    : `Several contacts match ${spokenName}.`;
  const announceText = showNotFound
    ? spokenName
      ? `${spokenName} was not found in your contacts. Choose a recipient from the list, enter a number instead, or say the name again. Each row says the name, then the number.`
      : `I did not catch a name. Choose a recipient from the list, enter a number instead, or say the name again. Each row says the name, then the number.`
    : `Several contacts match ${spokenName}. Choose a recipient. You can also enter a number instead. Each row says the name, then the number.`;
  useScreenAnnounce(announceText);

  const renderItem: ListRenderItem<AyaContact> = ({ item, index }) => (
    <Pressable
      onPress={() => onSelect(item)}
      accessibilityRole="button"
      role="button"
      accessibilityLabel={`${item.name}, ${item.phone}`}
      accessibilityHint="Chooses this person as the recipient"
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.initials} {...DECORATIVE_A11Y}>
        <AppText variant="labelSM" color={colors.text} style={styles.initialsText}>
          {initials(item.name)}
        </AppText>
      </View>
      <View style={styles.rowText}>
        <AppText variant="body" color={colors.text} numberOfLines={1}>
          {item.name}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
          {item.phone}
        </AppText>
      </View>
      <View {...DECORATIVE_A11Y}>
        <Icon name="chevron-forward" size={20} color={colors.textSubtle} />
      </View>
    </Pressable>
  );

  return (
    <Screen>
      <ScreenHeader title="Choose recipient" onBack={onBack} />

      <FlatList
        data={candidates}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View>
            <AppText variant="headingSM" heading={2} color={colors.text} style={styles.lead}>
              {lead}
            </AppText>
            {onEnterNumber ? (
              <Button
                onPress={onEnterNumber}
                variant="outline"
                style={styles.numberEntry}
                accessibilityLabel="Enter the number instead"
                accessibilityHint="Types the recipient's mobile money number by hand"
              >
                <AppText variant="button" color={colors.text}>
                  Enter the number instead
                </AppText>
              </Button>
            ) : null}
            {candidates.length === 0 ? (
              <AppText variant="bodySM" color={colors.textMuted} style={styles.empty}>
                No contacts are available. Enter a number, or say the person&apos;s name again,
                or allow contacts in your phone&apos;s settings under Aya.
              </AppText>
            ) : null}
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <ScreenFooter>
        <Button onPress={onRespeak} variant="outline">
          <Icon name="mic" size={20} color={colors.text} />
          <AppText variant="button" color={colors.text}>
            Say the name again
          </AppText>
        </Button>
      </ScreenFooter>
    </Screen>
  );
}

const DECORATIVE_A11Y = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants" as const,
};

function createStyles(colors: Palette) {
  return {
    list: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      gap: spacing.sm,
    },
    lead: {
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    empty: {
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    numberEntry: {
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.md,
      minHeight: 64,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surfaceCard,
      borderRadius: radii["2xl"],
    },
    rowPressed: {
      opacity: 0.8,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    initials: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.washPurple,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    initialsText: {
      fontSize: 18,
      fontWeight: "700" as const,
    },
  };
}