import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MobilePreviewFrame from "./src/components/MobilePreviewFrame";
import TabBar, { TAB_ROOT_SCREENS } from "./src/components/TabBar";
import { AppPrefsProvider, useAppPrefs } from "./src/context/AppPrefs";
import type { FlowId } from "./src/content/flows";
import { AUTO_LOCK_MS, SIGNUP_STEPS, SIGNUP_TOTAL, lookupMomoName } from "./src/content/onboarding";
import type { ScreenId } from "./src/navigation/types";
import { DEMO_PAYER_NAME } from "./src/content/merchantPay";
import { formatCurrency } from "./src/lib/currency";
import { useAppFonts } from "./src/hooks/useAppFonts";
import { documentTitleFor } from "./src/navigation/screenTitles";
import { useAppNavigation } from "./src/navigation/useAppNavigation";
import { ThemeProvider, useColors, useTheme } from "./src/theme";
import {
  SplashScreen,
  OnboardingScreen,
  SignupScreen,
  LoginScreen,
  OtpVerifyScreen,
  SignInScreen,
  AppLockSetupScreen,
  LanguageScreen,
  AccessibilitySetupScreen,
  HomeScreen,
  ListeningScreen,
  SendMoneyScreen,
  ScanPayScreen,
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
  SupportScreen,
} from "./src/screens";

const LANG_HTML: Record<string, string> = {
  en: "en",
  tw: "tw",
};

function focusMainContent() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const main = document.getElementById("main-content");
  if (main && typeof (main as HTMLElement).focus === "function") {
    (main as HTMLElement).focus({ preventScroll: true });
  }
}

const PRE_AUTH_SCREENS: ScreenId[] = [
  "splash",
  "onboarding",
  "language",
  "accessibility-setup",
  "signup",
  "login",
  "otp-verify",
  "sign-in",
  "app-lock-setup",
  "unlock",
];

function AppNavigator() {
  const {
    setActiveFlow,
    activeFlow,
    language,
    scanPayee,
    transferAmount,
    publishShopPayment,
    clearScanPayment,
    setScanPayee,
    account,
    setAccount,
    appLock,
    setAppLock,
    signOut,
  } = useAppPrefs();
  const { screen, go, back, resetTo } = useAppNavigation("splash");
  const [pendingPhone, setPendingPhone] = useState("");
  const [authEntry, setAuthEntry] = useState<"signup" | "login">("signup");
  const prevTitleRef = useRef<string>("");

  const goHome = useCallback(() => {
    clearScanPayment();
    resetTo("home");
  }, [clearScanPayment, resetTo]);
  const logout = useCallback(() => {
    signOut();
    resetTo("login");
  }, [signOut, resetTo]);

  const screenRef = useRef(screen);
  screenRef.current = screen;
  const appLockRef = useRef(appLock);
  appLockRef.current = appLock;
  useEffect(() => {
    let leftAt = 0;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        leftAt = leftAt || Date.now();
        return;
      }
      const away = leftAt ? Date.now() - leftAt : 0;
      leftAt = 0;
      if (appLockRef.current && !PRE_AUTH_SCREENS.includes(screenRef.current) && away >= AUTO_LOCK_MS) {
        resetTo("unlock");
      }
    });
    return () => sub.remove();
  }, [resetTo]);

  const startFlow = useCallback(
    (flow: FlowId) => {
      setScanPayee(null);
      setActiveFlow(flow);
      go("listening");
    },
    [go, setActiveFlow, setScanPayee],
  );

  const openScanPay = useCallback(() => go("scan-pay"), [go]);

  const finishProcessing = useCallback(() => {
    if (activeFlow === "transfer" && scanPayee) {
      publishShopPayment({
        amount: formatCurrency(transferAmount ?? "45"),
        from: DEMO_PAYER_NAME,
        shopId: scanPayee.id,
      });
    }
    go(
      activeFlow === "balance"
        ? "balance"
        : activeFlow === "transfer"
          ? "transfer-receipt"
          : "success",
    );
  }, [activeFlow, go, publishShopPayment, scanPayee, transferAmount]);

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
      content = <SplashScreen onNext={() => (appLock ? resetTo("unlock") : go("onboarding"))} />;
      break;
    case "onboarding":
      content = <OnboardingScreen onNext={() => go("language")} onLogin={() => go("login")} />;
      break;
    case "language":
      content = <LanguageScreen onNext={() => go("accessibility-setup")} onBack={back} />;
      break;
    case "accessibility-setup":
      content = <AccessibilitySetupScreen onNext={() => go("signup")} onBack={back} />;
      break;
    case "signup":
      content = (
        <SignupScreen
          onNext={(phone) => {
            setPendingPhone(phone);
            setAuthEntry("signup");
            go("otp-verify");
          }}
          onBack={back}
        />
      );
      break;
    case "login":
      content = (
        <LoginScreen
          onNext={(phone) => {
            setPendingPhone(phone);
            setAuthEntry("login");
            go("otp-verify");
          }}
          onBack={back}
          onSignup={() => go("language")}
        />
      );
      break;
    case "otp-verify":
      content = (
        <OtpVerifyScreen
          phone={pendingPhone}
          showProgress={authEntry === "signup"}
          onVerified={() => resetTo("sign-in")}
          onBack={back}
        />
      );
      break;
    case "sign-in": {
      const name = lookupMomoName(pendingPhone);
      const isSignup = authEntry === "signup";
      content = (
        <SignInScreen
          phone={pendingPhone}
          name={name}
          returning={!isSignup}
          allowBiometrics={!isSignup}
          step={isSignup ? { current: SIGNUP_STEPS.pin, total: SIGNUP_TOTAL } : undefined}
          onSignedIn={(method) => {
            setAccount({ name, phone: pendingPhone });
            if (isSignup) {
              go("app-lock-setup");
              return;
            }
            setAppLock({ biometric: method === "biometric" });
            goHome();
          }}
          onSwitchAccount={() => resetTo(authEntry)}
          onBack={() => resetTo(authEntry)}
        />
      );
      break;
    }
    case "app-lock-setup":
      content = <AppLockSetupScreen onDone={goHome} onBack={back} />;
      break;
    case "unlock":
      content = account ? (
        <SignInScreen
          phone={account.phone}
          name={account.name}
          returning
          allowBiometrics={appLock?.biometric ?? false}
          onSignedIn={goHome}
          onSwitchAccount={logout}
        />
      ) : null;
      break;
    case "home":
      content = <HomeScreen onNav={go} onStartFlow={startFlow} />;
      break;
    case "listening":
      content = (
        <ListeningScreen
          onNext={() =>
            go(
              activeFlow === "transfer"
                ? "send-money"
                : activeFlow === "support"
                  ? "support"
                  : "biometric",
            )
          }
          onBack={back}
          onScan={openScanPay}
        />
      );
      break;
    case "scan-pay":
      content = (
        <ScanPayScreen onScanned={() => go("send-money")} onBack={back} />
      );
      break;
    case "send-money":
      content = (
        <SendMoneyScreen
          onSend={() => go("biometric")}
          onBack={back}
          onScan={openScanPay}
        />
      );
      break;
    case "transfer-receipt":
      content = (
        <TransferReceiptScreen
          onHome={goHome}
          onTransferMore={() => {
            clearScanPayment();
            go("listening");
          }}
          onBack={back}
          onViewShopSpeaker={scanPayee ? () => go("merchant-receive") : undefined}
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
      content = <ProcessingScreen onDone={finishProcessing} />;
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
      content = <HelpScreen onBack={back} onGetHelp={() => startFlow("support")} />;
      break;
    case "support":
      content = <SupportScreen onDone={goHome} onBack={back} />;
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
