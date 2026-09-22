import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MobilePreviewFrame from "./src/components/MobilePreviewFrame";
import TabBar, { TAB_ROOT_SCREENS } from "./src/components/TabBar";
import { AppPrefsProvider, useAppPrefs } from "./src/context/AppPrefs";
import type { FlowId } from "./src/content/flows";
import type { VoiceDraft } from "./src/content/draft";
import { resolvePayee, type AyaContact } from "./src/services/contacts";
import { loadSession, saveSession, type AuthSession } from "./src/services/authSession";
import type { UssdResult } from "@aya/automator";
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
  LanguageScreen,
  AccessibilitySetupScreen,
  HomeScreen,
  ListeningScreen,
  PayeeListScreen,
  NumberEntryScreen,
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
  const { setActiveFlow, activeFlow, language, setDraft, contacts, ensureContacts } =
    useAppPrefs();
  const { screen, go, back, resetTo } = useAppNavigation("splash");
  const [authMode, setAuthMode] = useState<"signup" | "login" | "reset">("login");
  const [pendingPhone, setPendingPhone] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [lastResult, setLastResult] = useState<UssdResult | null>(null);
  const [preselectedRecipient, setPreselectedRecipient] = useState<AyaContact | null>(null);
  const [payeePicker, setPayeePicker] = useState<{
    spokenName: string;
    candidates: AyaContact[];
    notFound: boolean;
    draft: VoiceDraft;
  } | null>(null);
  const prevTitleRef = useRef<string>("");

  const goHome = useCallback(() => resetTo("home"), [resetTo]);
  const logout = useCallback(() => {
    void saveSession(null);
    setSession(null);
    resetTo("login");
  }, [resetTo]);

  // Restore a persisted session before the boot splash decides where to land.
  useEffect(() => {
    let active = true;
    void loadSession().then((s) => {
      if (!active) return;
      setSession(s);
      setAuthReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const onVerified = useCallback(
    async (verified: AuthSession) => {
      setSession(verified);
      await saveSession(verified);
      go(authMode === "signup" ? "language" : "home");
    },
    [authMode, go],
  );

  const startFlow = useCallback(
    (flow: FlowId) => {
      setDraft(null);
      setPreselectedRecipient(null);
      setActiveFlow(flow);
      go("listening");
    },
    [go, setActiveFlow, setDraft],
  );

  const startQuickSend = useCallback(
    (contact: AyaContact) => {
      setDraft(null);
      setPreselectedRecipient(contact);
      setActiveFlow("transfer");
      go("listening");
    },
    [go, setActiveFlow, setDraft],
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
      content = !authReady ? null : (
        <SplashScreen onNext={() => go(session ? "home" : "onboarding")} />
      );
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
          onNext={(phone) => {
            setPendingPhone(phone);
            setAuthMode("login");
            go("otp-verify");
          }}
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
        <OtpVerifyScreen
          phone={pendingPhone}
          onVerified={onVerified}
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
      content = (
        <HomeScreen
          onNav={go}
          onStartFlow={startFlow}
          quickSend={contacts}
          onQuickSend={startQuickSend}
        />
      );
      break;
    case "listening":
      content = (
        <ListeningScreen
          onResult={async (intent) => {
            if (!intent.flow) return;
            const isTransfer = intent.flow === "transfer";
            let recipient: { name: string; phone: string } | undefined;

            if (isTransfer) {
              if (intent.slots.phone) {
                recipient = { name: intent.slots.phone, phone: intent.slots.phone };
              } else {
                const spoken = intent.slots.payee ?? preselectedRecipient?.name ?? "";
                if (spoken) {
                  const contactList = await ensureContacts();
                  const { contact, candidates } = resolvePayee(spoken, contactList);
                  if (contact) {
                    recipient = { name: contact.name, phone: contact.phone };
                    console.log(
                      `[contacts] resolved "${spoken}" -> ${contact.name} ${contact.phone}`,
                    );
                  } else {
                    const notFound = candidates.length === 0;
                    setPayeePicker({
                      spokenName: spoken,
                      candidates: notFound ? contactList : candidates,
                      notFound,
                      draft: {
                        flow: intent.flow,
                        language: intent.language,
                        slots: intent.slots,
                        rawText: intent.rawText,
                        confidence: intent.confidence,
                      },
                    });
                    setActiveFlow(intent.flow);
                    setPreselectedRecipient(null);
                    go("payee-list");
                    return;
                  }
                } else if (preselectedRecipient) {
                  recipient = {
                    name: preselectedRecipient.name,
                    phone: preselectedRecipient.phone,
                  };
                } else {
                  const contactList = await ensureContacts();
                  setPayeePicker({
                    spokenName: "",
                    candidates: contactList,
                    notFound: true,
                    draft: {
                      flow: intent.flow,
                      language: intent.language,
                      slots: intent.slots,
                      rawText: intent.rawText,
                      confidence: intent.confidence,
                    },
                  });
                  setActiveFlow(intent.flow);
                  setPreselectedRecipient(null);
                  go("payee-list");
                  return;
                }
              }
            }

            setDraft({
              flow: intent.flow,
              language: intent.language,
              slots: intent.slots,
              rawText: intent.rawText,
              confidence: intent.confidence,
              recipient,
            });
            setActiveFlow(intent.flow);
            setPreselectedRecipient(null);
            go(isTransfer ? "send-money" : "confirmation");
          }}
          onBack={back}
        />
      );
      break;
    case "payee-list":
      content = payeePicker ? (
        <PayeeListScreen
          spokenName={payeePicker.spokenName}
          candidates={payeePicker.candidates}
          notFound={payeePicker.notFound}
          onSelect={(contact) => {
            setDraft({
              ...payeePicker.draft,
              recipient: { name: contact.name, phone: contact.phone },
            });
            console.log(`[contacts] picked ${contact.name} ${contact.phone}`);
            setPayeePicker(null);
            go("send-money");
          }}
          onRespeak={() => {
            setPayeePicker(null);
            go("listening");
          }}
          onEnterNumber={() => go("enter-number")}
          onBack={() => {
            setPayeePicker(null);
            back();
          }}
        />
      ) : null;
      break;
    case "enter-number":
      content = payeePicker ? (
        <NumberEntryScreen
          onConfirm={(number, e164) => {
            console.log(`[contacts] typed-number ${e164}`);
            setDraft({
              ...payeePicker.draft,
              recipient: { name: number, phone: e164 },
            });
            setPayeePicker(null);
            setPreselectedRecipient(null);
            go("send-money");
          }}
          onBack={back}
        />
      ) : null;
      break;
    case "send-money":
      content = (
        <SendMoneyScreen
          onSend={(amountMinor) => {
            setDraft((prev) =>
              prev ? { ...prev, slots: { ...prev.slots, amountMinor } } : prev,
            );
            go("biometric");
          }}
          onBack={back}
        />
      );
      break;
    case "transfer-receipt":
      content = (
        <TransferReceiptScreen
          onHome={goHome}
          onTransferMore={() => go("listening")}
          onBack={back}
          result={lastResult}
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
          onDone={(result) => {
            const ok = result && result.status === "completed";
            setLastResult(result);
            if (!ok) {
              go("error");
              return;
            }
            go(
              activeFlow === "balance"
                ? "balance"
                : activeFlow === "transfer"
                  ? "transfer-receipt"
                  : "success",
            );
          }}
          onCancel={back}
        />
      );
      break;
    case "balance":
      content = <BalanceScreen onBack={goHome} result={lastResult} />;
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
      content = (
        <HomeScreen onNav={go} onStartFlow={startFlow} quickSend={contacts} onQuickSend={startQuickSend} />
      );
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
