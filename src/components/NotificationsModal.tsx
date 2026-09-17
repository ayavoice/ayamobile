import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppText, Icon, IconWell } from "./ui";
import { DECORATIVE_A11Y } from "../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type IonName = ComponentProps<typeof Ionicons>["name"];

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  section: "today" | "earlier";
  icon: IonName;
  wash: "purple" | "blue" | "green" | "yellow";
  unread: boolean;
};

const INITIAL: NotificationItem[] = [
  {
    id: "1",
    title: "Money received",
    body: "Abena Mensah sent you GH₵300.00",
    time: "2h ago",
    section: "today",
    icon: "arrow-down",
    wash: "blue",
    unread: true,
  },
  {
    id: "2",
    title: "Transfer successful",
    body: "GH₵580.00 sent to Ricky Martin",
    time: "4h ago",
    section: "today",
    icon: "checkmark-circle",
    wash: "green",
    unread: true,
  },
  {
    id: "3",
    title: "Security tip",
    body: "Aya will never ask for your PIN over voice or chat",
    time: "Yesterday",
    section: "earlier",
    icon: "shield-checkmark",
    wash: "purple",
    unread: false,
  },
  {
    id: "4",
    title: "Airtime topped up",
    body: "GH₵10.00 added to your number",
    time: "6 Sep",
    section: "earlier",
    icon: "phone-portrait",
    wash: "purple",
    unread: false,
  },
  {
    id: "5",
    title: "New on Aya Play",
    body: "Climb the leaderboard and earn rewards this week",
    time: "5 Sep",
    section: "earlier",
    icon: "trophy",
    wash: "yellow",
    unread: false,
  },
];

const SPRING = { damping: 28, stiffness: 320, mass: 0.9 };
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;

function washColor(wash: NotificationItem["wash"], colors: Palette) {
  if (wash === "blue") return colors.washBlue;
  if (wash === "green") return colors.washGreen;
  if (wash === "yellow") return colors.washYellow;
  return colors.washPurple;
}

export default function NotificationsModal({ visible, onClose }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [items, setItems] = useState(INITIAL);
  const [mounted, setMounted] = useState(visible);

  const sheetHeight = Math.min(windowHeight * 0.78, 620);
  const translateY = useSharedValue(sheetHeight);
  const scrollY = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  const unreadCount = useMemo(() => items.filter((n) => n.unread).length, [items]);
  const today = items.filter((n) => n.section === "today");
  const earlier = items.filter((n) => n.section === "earlier");

  const unmount = () => setMounted(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = sheetHeight;
      translateY.value = withSpring(0, SPRING);
      return;
    }
    if (!mounted) return;
    translateY.value = withTiming(sheetHeight, { duration: 220 }, (finished) => {
      if (finished) runOnJS(unmount)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sheetHeight]);

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .failOffsetY(-8)
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((e) => {
      const atTop = scrollY.value <= 1;
      if (!atTop && e.translationY < 0) return;
      const next = Math.max(0, dragStartY.value + e.translationY);
      translateY.value = next;
    })
    .onEnd((e) => {
      const shouldClose =
        translateY.value > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY;
      if (shouldClose) {
        runOnJS(onClose)();
        return;
      }
      translateY.value = withSpring(0, SPRING);
    });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, sheetHeight],
      [0.45, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.root} accessibilityViewIsModal aria-modal>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Dismiss notifications"
          >
            <Animated.View
              style={[styles.backdrop, { backgroundColor: "#000" }, backdropStyle]}
              pointerEvents="none"
            />
          </Pressable>

          <GestureDetector gesture={pan}>
            <Animated.View
              accessibilityRole="none"
              role="dialog"
              accessibilityLabel="Notifications"
              style={[
                styles.sheet,
                {
                  height: sheetHeight,
                  paddingBottom: Math.max(insets.bottom, spacing.md),
                  backgroundColor: colors.surface,
                },
                sheetStyle,
              ]}
            >
              <View
                style={styles.handleHit}
                accessibilityRole="adjustable"
                accessibilityLabel="Notifications sheet"
                accessibilityHint="Swipe down to close"
              >
                <View style={[styles.handle, { backgroundColor: colors.textSubtle }]} />
              </View>

              <View style={styles.header}>
                <AppText variant="headingSM" heading={2}>
                  Notifications
                </AppText>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  role="button"
                  accessibilityLabel="Close notifications"
                  hitSlop={10}
                  style={styles.closeBtn}
                >
                  <Icon name="close" size={22} color={colors.text} />
                </Pressable>
              </View>

              {unreadCount > 0 ? (
                <View style={styles.toolbar}>
                  <AppText variant="caption" color={colors.textMuted}>
                    {unreadCount} new
                  </AppText>
                  <Pressable
                    onPress={markAllRead}
                    accessibilityRole="button"
                    role="button"
                    accessibilityLabel="Mark all as read"
                    hitSlop={8}
                    style={styles.markAll}
                  >
                    <AppText variant="caption" color={colors.purple} importantForAccessibility="no">
                      Mark all read
                    </AppText>
                  </Pressable>
                </View>
              ) : null}

              <Animated.ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                bounces
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                accessibilityLabel={`Notifications, ${items.length} items`}
              >
                {today.length > 0 ? (
                  <Section
                    title="Today"
                    items={today}
                    colors={colors}
                    styles={styles}
                    onPress={markRead}
                  />
                ) : null}
                {earlier.length > 0 ? (
                  <Section
                    title="Earlier"
                    items={earlier}
                    colors={colors}
                    styles={styles}
                    onPress={markRead}
                  />
                ) : null}
              </Animated.ScrollView>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function Section({
  title,
  items,
  colors,
  styles,
  onPress,
}: {
  title: string;
  items: NotificationItem[];
  colors: Palette;
  styles: ReturnType<typeof createStyles>;
  onPress: (id: string) => void;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" color={colors.textMuted} style={styles.sectionTitle} heading={2}>
        {title}
      </AppText>
      <View style={styles.group} accessibilityRole="list" role="list" accessibilityLabel={title}>
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => onPress(item.id)}
            accessibilityRole="button"
            role="button"
            accessibilityLabel={`${item.unread ? "Unread. " : ""}${item.title}. ${item.body}. ${item.time}`}
            accessibilityHint={item.unread ? "Marks this notification as read" : undefined}
            style={[styles.row, index < items.length - 1 && styles.rowDivider]}
          >
            <View {...DECORATIVE_A11Y}>
              <IconWell backgroundColor={washColor(item.wash, colors)} size={44} radius={14}>
                <Icon name={item.icon} size={20} color={colors.text} />
              </IconWell>
            </View>
            <View style={styles.copy} importantForAccessibility="no">
              <View style={styles.titleRow}>
                <AppText variant="labelSM" numberOfLines={1} style={styles.flex}>
                  {item.title}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {item.time}
                </AppText>
              </View>
              <AppText variant="caption" numberOfLines={2} color={colors.textSecondary}>
                {item.body}
              </AppText>
            </View>
            {item.unread ? (
              <View style={styles.dot} {...DECORATIVE_A11Y} />
            ) : (
              <View style={styles.dotSpacer} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return {
    root: {
      flex: 1,
      justifyContent: "flex-end" as const,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    sheet: {
      borderTopLeftRadius: radii["3xl"],
      borderTopRightRadius: radii["3xl"],
      overflow: "hidden" as const,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.22,
      shadowRadius: 24,
      elevation: 24,
    },
    handleHit: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      minHeight: 28,
    },
    handle: {
      width: 42,
      height: 5,
      borderRadius: 3,
      opacity: 0.45,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: spacing.xl,
      minHeight: 44,
      marginBottom: spacing.xs,
    },
    closeBtn: {
      width: 44,
      height: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderRadius: 22,
      backgroundColor: colors.surfaceCard,
    },
    toolbar: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.sm,
      minHeight: 36,
    },
    markAll: {
      minHeight: 36,
      justifyContent: "center" as const,
      paddingHorizontal: spacing.xs,
    },
    scroll: {
      flex: 1,
    },
    list: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      marginLeft: spacing.xs,
    },
    group: {
      backgroundColor: colors.surfaceCard,
      borderRadius: radii["2xl"],
      overflow: "hidden" as const,
    },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      minHeight: 72,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderMuted,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    titleRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
    },
    flex: { flex: 1, minWidth: 0 },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.purple,
    },
    dotSpacer: {
      width: 8,
      height: 8,
    },
  };
}
