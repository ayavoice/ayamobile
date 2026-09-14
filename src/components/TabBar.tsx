import { Pressable, StyleSheet, View } from "react-native";
import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Icon, WaveIcon } from "./ui";
import type { FlowId } from "../content/flows";
import type { ScreenId } from "../navigation/types";
import { fonts, useColors } from "../theme";

type IonName = ComponentProps<typeof Ionicons>["name"];

type TabItem =
  | { kind: "nav"; icon: IonName; label: string; screen: ScreenId }
  | { kind: "speech"; label: string };

const TABS: TabItem[] = [
  { kind: "nav", icon: "home", label: "Home", screen: "home" },
  { kind: "nav", icon: "grid-outline", label: "Services", screen: "services" },
  { kind: "speech", label: "Talk" },
  { kind: "nav", icon: "bulb-outline", label: "Learn", screen: "game" },
  { kind: "nav", icon: "person-outline", label: "Profile", screen: "profile" },
];

export const TAB_ROOT_SCREENS: ScreenId[] = ["home", "services", "game", "profile"];

const DECORATIVE = {
  accessible: false as const,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants" as const,
};

type Props = {
  current: ScreenId;
  onNav: (screen: ScreenId) => void;
  onStartFlow: (flow: FlowId) => void;
};

export default function TabBar({ current, onNav, onStartFlow }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View
      accessibilityRole="tablist"
      role="tablist"
      accessibilityLabel="Main navigation"
      style={[
        styles.tabBar,
        { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      {TABS.map((tab) => {
        if (tab.kind === "speech") {
          return (
            <Pressable
              key={tab.label}
              onPress={() => onStartFlow("transfer")}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Talk to send money"
              accessibilityHint="Starts a voice-guided money transfer"
              hitSlop={6}
              style={styles.tab}
            >
              <View style={[styles.speechIcon, { backgroundColor: colors.purple }]} {...DECORATIVE}>
                <WaveIcon size={28} color={colors.textOnYellow} />
              </View>
              <AppText
                variant="tab"
                numberOfLines={1}
                style={[styles.tabLabel, styles.speechLabel]}
                color={colors.text}
                importantForAccessibility="no"
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        }

        const active = tab.screen === current;
        return (
          <Pressable
            key={tab.label}
            onPress={() => onNav(tab.screen)}
            accessibilityRole="tab"
            role="tab"
            accessibilityLabel={tab.label}
            accessibilityHint={`Opens ${tab.label}`}
            accessibilityState={{ selected: active }}
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            hitSlop={6}
            style={styles.tab}
          >
            <View
              style={[styles.tabIcon, active && { backgroundColor: colors.purple }]}
              {...DECORATIVE}
            >
              <Icon name={tab.icon} size={22} color={active ? colors.textOnYellow : colors.textSubtle} />
            </View>
            <AppText
              variant="tab"
              numberOfLines={1}
              style={styles.tabLabel}
              color={active ? colors.text : colors.textSubtle}
              importantForAccessibility="no"
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingHorizontal: 4,
    paddingTop: 10,
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 2,
    minWidth: 0,
    minHeight: 48,
  },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  speechIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -14,
  },
  tabLabel: {
    fontSize: 11,
  },
  speechLabel: {
    fontFamily: fonts.body.bold,
  },
});
