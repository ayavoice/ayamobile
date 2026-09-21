import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { UssdPinMode } from "@aya/automator";
import {
  getFlowContent,
  type AppLanguage,
  type FlowContent,
  type FlowId,
} from "../content/flows";
import { buildFlowContent, type VoiceDraft } from "../content/draft";
import {
  loadContacts,
  requestContactsPermission,
  type AyaContact,
} from "../services/contacts";

export type AccessibilityPrefs = {
  voiceFirst: boolean;
  largeText: boolean;
  highContrast: boolean;
  haptics: boolean;
  captions: boolean;
  screenReader: boolean;
  textSize: 1 | 2 | 3;
  speechSpeed: 1 | 2 | 3;
};

type AppPrefsValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  accessibility: AccessibilityPrefs;
  setAccessibility: (
    patch: Partial<AccessibilityPrefs> | ((prev: AccessibilityPrefs) => AccessibilityPrefs),
  ) => void;
  activeFlow: FlowId;
  setActiveFlow: (flow: FlowId) => void;
  /** Last utterance Aya understood; drives dynamic screen copy. */
  draft: VoiceDraft | null;
  setDraft: (draft: VoiceDraft | null) => void;
  flow: FlowContent;
  textScale: number;
  highContrast: boolean;
  /** Cached device contacts (name + primary number), loaded at startup. */
  contacts: AyaContact[];
  contactsPermission: "unknown" | "granted" | "denied";
  /** Loads (or returns cached) contacts, re-requesting permission if needed. */
  ensureContacts: () => Promise<AyaContact[]>;
  /**
   * How the MoMo PIN is handled during a USSD session:
   *  - "manual" (default): the user types it into the USSD screen; Aya never sees it.
   *  - "auto": Aya fills it from expo-secure-store (device-local, never transmitted).
   */
  pinMode: UssdPinMode;
  setPinMode: (mode: UssdPinMode) => void;
};

const DEFAULT_A11Y: AccessibilityPrefs = {
  voiceFirst: true,
  largeText: true,
  highContrast: false,
  haptics: true,
  captions: true,
  screenReader: false,
  textSize: 2,
  speechSpeed: 2,
};

const AppPrefsContext = createContext<AppPrefsValue | null>(null);

export function AppPrefsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>("tw");
  const [accessibility, setAccessibilityState] =
    useState<AccessibilityPrefs>(DEFAULT_A11Y);
  const [activeFlow, setActiveFlow] = useState<FlowId>("transfer");
  const [draft, setDraft] = useState<VoiceDraft | null>(null);
  const [contacts, setContacts] = useState<AyaContact[]>([]);
  const [contactsPermission, setContactsPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [pinMode, setPinModeState] = useState<UssdPinMode>("manual");

  const PIN_MODE_KEY = "aya.pinMode";

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (Platform.OS === "web") return;
      try {
        const stored = await SecureStore.getItemAsync(PIN_MODE_KEY);
        if (mounted && (stored === "manual" || stored === "auto")) {
          setPinModeState(stored);
        }
      } catch {
        // No stored value → keep the manual default.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Contact access is resolved before the user starts using the app so a
  // mid-flow permission prompt never interrupts a transaction.
  useEffect(() => {
    void (async () => {
      if (Platform.OS === "web") return;
      const granted = await requestContactsPermission();
      setContactsPermission(granted ? "granted" : "denied");
      if (granted) setContacts(await loadContacts(true));
    })();
  }, []);

  const ensureContacts = useCallback(async (): Promise<AyaContact[]> => {
    if (Platform.OS === "web") return contacts;
    const granted = await requestContactsPermission();
    setContactsPermission(granted ? "granted" : "denied");
    if (granted) {
      const list = await loadContacts();
      if (list.length !== contacts.length) setContacts(list);
      return list;
    }
    return contacts;
  }, [contacts]);

  const setAccessibility = useCallback(
    (
      patch:
        | Partial<AccessibilityPrefs>
        | ((prev: AccessibilityPrefs) => AccessibilityPrefs),
    ) => {
      setAccessibilityState((prev) =>
        typeof patch === "function" ? patch(prev) : { ...prev, ...patch },
      );
    },
    [],
  );

  const setPinMode = useCallback((mode: UssdPinMode) => {
    setPinModeState(mode);
    if (Platform.OS === "web") return;
    void SecureStore.setItemAsync(PIN_MODE_KEY, mode).catch(() => {});
  }, []);

  const flow = useMemo(
    () =>
      draft && draft.flow === activeFlow
        ? buildFlowContent(draft, language)
        : getFlowContent(activeFlow, language),
    [activeFlow, language, draft],
  );

  const textScale = accessibility.largeText
    ? accessibility.textSize === 1
      ? 1
      : accessibility.textSize === 3
        ? 1.22
        : 1.1
    : accessibility.textSize === 3
      ? 1.12
      : 1;

  const value = useMemo<AppPrefsValue>(
    () => ({
      language,
      setLanguage,
      accessibility,
      setAccessibility,
      activeFlow,
      setActiveFlow,
      draft,
      setDraft,
      flow,
      textScale,
      highContrast: accessibility.highContrast,
      contacts,
      contactsPermission,
      ensureContacts,
      pinMode,
      setPinMode,
    }),
    [
      language,
      accessibility,
      setAccessibility,
      activeFlow,
      draft,
      flow,
      textScale,
      contacts,
      contactsPermission,
      ensureContacts,
      pinMode,
      setPinMode,
    ],
  );

  return (
    <AppPrefsContext.Provider value={value}>{children}</AppPrefsContext.Provider>
  );
}

export function useAppPrefs() {
  const ctx = useContext(AppPrefsContext);
  if (!ctx) {
    throw new Error("useAppPrefs must be used within AppPrefsProvider");
  }
  return ctx;
}

/** Safe outside provider (e.g. boot splash). */
export function useAppPrefsOptional() {
  return useContext(AppPrefsContext);
}
