import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MobilePreviewFrame from "./src/components/MobilePreviewFrame";
import TabBar, { TAB_ROOT_SCREENS } from "./src/components/TabBar";
import { AppPrefsProvider, useAppPrefs } from "./src/context/AppPrefs";
import type { FlowId } from "./src/content/flows";
import { useAppFonts } from "./src/hooks/useAppFonts";
import { documentTitleFor } from "./src/navigation/screenTitles";
import { useAppNavigation } from "./src/navigation/useAppNavigation";
import { ThemeProvider, useColors, useTheme } from "./src/theme";
import {
  SplashScreen,
  OnboardingScreen,
  AuthWelcomeScreen,
  SignupScreen,
  LoginScreen,
  ForgotPinScreen,
  OtpVerifyScreen,
  CreatePinScreen,
  LanguageScreen,
  AccessibilitySetupScreen,
  HomeScreen,
  ListeningScreen,
  SendMoneyScreen,
  TransferReceiptScreen,
  ConfirmationScreen,
  BiometricScreen,
  ProcessingScreen,
  SuccessScreen,
  ReceiptScreen,
  BalanceScreen,
  HistoryScreen,
  ServicesScreen,
  MerchantReceiveScreen,
  ProfileScreen,
  GameScreen,
  LeaderboardScreen,
  AccessibilitySettingsScreen,
  SecurityScreen,
  HelpScreen,
} from "./src/screens";

const LANG_HTML: Record<string, string> = {
  en: "en",
  tw: "tw",
  ee: "ee",
};

function focusMainContent() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const main = document.getElementById("main-content");
  if (main && typeof (main as HTMLElement).focus === "function") {
    (main as HTMLElement).focus({ preventScroll: true });
  }
}

function AppNavigator() {
  const { setActiveFlow, activeFlow, language } = useAppPrefs();
  const { screen, go, back, resetTo } = useAppNavigation("splash");
  const [authMode, setAuthMode] = useState<"signup" | "reset">("signup");
  const [pendingPhone, setPendingPhone] = useState("");
  const prevTitleRef = useRef<string>("");

  const goHome = useCallback(() => resetTo("home"), [resetTo]);
  const logout = useCallback(() => resetTo("login"), [resetTo]);

  const startFlow = useCallback(
    (flow: FlowId) => {
      setActiveFlow(flow);
      go("listening");
    },
    [go, setActiveFlow],
  );

  const { isDark } = useTheme();
  const statusStyle = isDark ? "light" : "dark";

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const title = documentTitleFor(screen);
    document.title = title;
    document.documentElement.lang = LANG_HTML[language] ?? "en";
    if (prevTitleRef.current && prevTitleRef.current !== title) {
      requestAnimationFrame(() => focusMainContent());
    }
    prevTitleRef.current = title;
  }, [screen, language]);

  let content = null;
  switch (screen) {
    case "splash":
      content = <SplashScreen onNext={() => go("onboarding")} />;
      break;
    case "onboarding":
      content = <OnboardingScreen onNext={() => go("auth-welcome")} />;
      break;
    case "auth-welcome":
      content = (
        <AuthWelcomeScreen onSignup={() => go("signup")} onLogin={() => go("login")} />
      );
      break;
    case "signup":
      content = (
        <SignupScreen
          onNext={(phone) => {
            setPendingPhone(phone);
            setAuthMode("signup");
            go("otp-verify");
          }}
          onBack={back}
          onLogin={() => go("login")}
        />
      );
      break;
    case "login":
      content = (
        <LoginScreen
          onNext={goHome}
          onBack={back}
          onForgotPin={() => go("forgot-pin")}
          onSignup={() => go("signup")}
        />
      );
      break;
    case "forgot-pin":
      content = (
        <ForgotPinScreen
          onNext={(phone) => {
            setPendingPhone(phone);
            setAuthMode("reset");
            go("otp-verify");
          }}
          onBack={back}
        />
      );
      break;
    case "otp-verify":
      content = (
        <OtpVerifyScreen phone={pendingPhone} onVerified={() => go("create-pin")} onBack={back} />
      );
      break;
    case "create-pin":
      content = (
        <CreatePinScreen
          mode={authMode}
          onDone={() => go(authMode === "signup" ? "language" : "home")}
          onBack={back}
        />
      );
      break;
    case "language":
      content = <LanguageScreen onNext={() => go("accessibility-setup")} />;
      break;
    case "accessibility-setup":
      content = <AccessibilitySetupScreen onNext={() => go("home")} />;
      break;
    case "home":
      content = <HomeScreen onNav={go} onStartFlow={startFlow} />;
      break;
    case "listening":
      content = (
        <ListeningScreen
          onNext={() => go(activeFlow === "transfer" ? "send-money" : "confirmation")}
          onBack={back}
        />
      );
      break;
    case "send-money":
      content = <SendMoneyScreen onSend={() => go("biometric")} onBack={back} />;
      break;
    case "transfer-receipt":
      content = (
        <TransferReceiptScreen
          onHome={goHome}
          onTransferMore={() => go("listening")}
          onBack={back}
        />
      );
      break;
    case "confirmation":
      content = <ConfirmationScreen onConfirm={() => go("biometric")} onBack={back} />;
      break;
    case "biometric":
      content = <BiometricScreen onSuccess={() => go("processing")} onBack={back} />;
      break;
    case "processing":
      content = (
        <ProcessingScreen
          onDone={() =>
            go(
              activeFlow === "balance"
                ? "balance"
                : activeFlow === "transfer"
                  ? "transfer-receipt"
                  : "success",
            )
          }
        />
      );
      break;
    case "balance":
      content = <BalanceScreen onBack={goHome} />;
      break;
    case "success":
      content = <SuccessScreen onDone={goHome} onReceipt={() => go("receipt")} />;
      break;
    case "receipt":
      content = <ReceiptScreen onBack={back} />;
      break;
    case "history":
      content = <HistoryScreen onBack={back} />;
      break;
    case "services":
      content = <ServicesScreen onBack={back} onStartFlow={startFlow} onNav={go} />;
      break;
    case "merchant-receive":
      content = <MerchantReceiveScreen onBack={back} />;
      break;
    case "profile":
      content = <ProfileScreen onBack={back} onNav={go} onLogout={logout} />;
      break;
    case "game":
      content = <GameScreen onBack={back} />;
      break;
    case "leaderboard":
      content = <LeaderboardScreen onBack={back} />;
      break;
    case "accessibility-settings":
      content = <AccessibilitySettingsScreen onBack={back} />;
      break;
    case "security":
      content = <SecurityScreen onBack={back} />;
      break;
    case "help":
    case "error":
      content = <HelpScreen onBack={back} />;
      break;
    default:
      content = <HomeScreen onNav={go} onStartFlow={startFlow} />;
  }

  const showTabBar = TAB_ROOT_SCREENS.includes(screen);

  return (
    <View style={styles.app}>
      <MobilePreviewFrame>
        <View style={styles.stage}>
          <View style={styles.screenArea}>{content}</View>
          {showTabBar ? <TabBar current={screen} onNav={go} onStartFlow={startFlow} /> : null}
        </View>
      </MobilePreviewFrame>
      {Platform.OS !== "web" ? <StatusBar style={statusStyle} /> : null}
    </View>
  );
}

function BootScreen() {
  const colors = useColors();
  const { isDark } = useTheme();
  return (
    <>
      <MobilePreviewFrame>
        <View
          style={[styles.boot, { backgroundColor: colors.background }]}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Loading Aya"
          nativeID="main-content"
          {...(Platform.OS === "web" ? ({ id: "main-content", tabIndex: -1 } as object) : null)}
        >
          <ActivityIndicator
            size="large"
            color={colors.purple}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>
      </MobilePreviewFrame>
      {Platform.OS !== "web" ? <StatusBar style={isDark ? "light" : "dark"} /> : null}
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useAppFonts();

  return (
    <GestureHandlerRootView style={styles.app}>
      <SafeAreaProvider style={styles.app}>
        <ThemeProvider>
          {fontsLoaded ? (
            <AppPrefsProvider>
              <AppNavigator />
            </AppPrefsProvider>
          ) : (
            <BootScreen />
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
  stage: {
    flex: 1,
  },
  screenArea: {
    flex: 1,
    minHeight: 0,
  },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
