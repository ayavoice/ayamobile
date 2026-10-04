import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getFlowContent, type AppLanguage, type FlowContent, type FlowId } from "../content/flows";
import {
  LANGUAGE_NAME,
  categoryLabel,
  isMoneyRoute,
  newTicketReference,
  type SupportTicket,
  type TicketEvent,
  type TicketStatus,
} from "../content/support";
import { SETUP_MODES, type SetupMode } from "../content/onboarding";
import type { PreApproval } from "../content/authorization";
import { recipientLine, recipientNetworkLabel, type Recipient } from "../content/send";
import { formatCurrency } from "../lib/currency";

export type NewTicketInput = Pick<SupportTicket, "category" | "route" | "transaction" | "signalLevel"> & {
  note?: string;
  callback?: boolean;
};

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

export type Account = { name: string; phone: string };

export type TopUpKind = "airtime" | "data";
export type RiskLevel = "low" | "medium" | "high";

/** Set once the MoMo PIN has signed this phone in. The PIN itself is never stored. */
export type AppLock = { biometric: boolean };

export type ScanPayee = {
  id: string;
  name: string;
  account: string;
};

export type ShopPayment = {
  id: number;
  amount: string;
  from: string;
  shopId: string;
};

type AppPrefsValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  accessibility: AccessibilityPrefs;
  setAccessibility: (patch: Partial<AccessibilityPrefs> | ((prev: AccessibilityPrefs) => AccessibilityPrefs)) => void;
  activeFlow: FlowId;
  setActiveFlow: (flow: FlowId) => void;
  flow: FlowContent;
  setupMode: SetupMode | null;
  chooseSetupMode: (mode: SetupMode) => void;
  helperMode: boolean;
  setHelperMode: (on: boolean) => void;
  account: Account | null;
  setAccount: (account: Account | null) => void;
  appLock: AppLock | null;
  setAppLock: (lock: AppLock | null) => void;
  signOut: () => void;
  preApproval: PreApproval | null;
  setPreApproval: (limits: PreApproval | null) => void;
  spentToday: number;
  recordSpend: (amount: number) => void;
  textScale: number;
  highContrast: boolean;
  scanPayee: ScanPayee | null;
  setScanPayee: (payee: ScanPayee | null) => void;
  transferAmount: string | null;
  setTransferAmount: (amount: string | null) => void;
  transferRecipient: Recipient | null;
  setTransferRecipient: (recipient: Recipient | null) => void;
  /** Airtime or data, for the airtime flow. */
  topUpKind: TopUpKind;
  setTopUpKind: (kind: TopUpKind) => void;
  /** Only the level from the voice conversation is kept (architecture.md §6.5). */
  riskLevel: RiskLevel;
  setRiskLevel: (level: RiskLevel) => void;
  /** What the user said when a conversation was handed to support. */
  spokenRequest: string | null;
  setSpokenRequest: (text: string | null) => void;
  lastShopPayment: ShopPayment | null;
  publishShopPayment: (payment: Omit<ShopPayment, "id">) => void;
  clearScanPayment: () => void;
  supportTicket: SupportTicket | null;
  openSupportTicket: (input: NewTicketInput) => SupportTicket;
  addTicketEvent: (event: Omit<TicketEvent, "at">) => void;
  requestCallback: () => void;
};

type ScheduledUpdate = { afterMs: number; status: TicketStatus; event: Omit<TicketEvent, "at"> };

/** Simulated agent/MTN progress so the demo shows live updates (support.md §4). */
function scheduleFor(ticket: SupportTicket): ScheduledUpdate[] {
  const fast = ticket.priority === "urgent";
  const lang = LANGUAGE_NAME[ticket.language];
  const updates: ScheduledUpdate[] = [
    {
      afterMs: fast ? 2500 : 4500,
      status: "acknowledged",
      event: {
        title: "Ama from Aya support picked this up",
        detail: `She will speak with you in ${lang}. She will never ask for your PIN.`,
      },
    },
  ];
  if (isMoneyRoute(ticket.route)) {
    updates.push(
      {
        afterMs: fast ? 6000 : 9000,
        status: "in_progress",
        event: {
          title: "Your case is ready",
          detail: "Amount, recipient, time and reference are filled in for you.",
        },
      },
      {
        afterMs: fast ? 10000 : 14000,
        status: "waiting_on_mtn",
        event: {
          title: fast ? "Sent to MTN fraud team as urgent" : "Sent to MTN",
          detail:
            "MTN checks with the recipient and can take up to 15 working days. We'll tell you the moment they reply.",
        },
      },
    );
  } else {
    updates.push({
      afterMs: 9000,
      status: "in_progress",
      event: { title: "Our team is looking into it", detail: "We'll update you here." },
    });
  }
  return updates;
}

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

function withTransferOverrides(
  base: FlowContent,
  payee: ScanPayee | null,
  amountRaw: string | null,
  recipient: Recipient | null,
): FlowContent {
  if (!payee && !amountRaw && !recipient) return base;

  const name = recipient?.name ?? payee?.name ?? base.details.find((d) => d.label === "To")?.value ?? "Recipient";
  const number = recipient
    ? recipientLine(recipient)
    : (payee?.account ?? base.details.find((d) => d.label === "Number")?.value ?? "");
  const network = recipient ? recipientNetworkLabel(recipient) : payee ? "Aya Merchant" : "Wallet";
  const amountLabel = amountRaw ? formatCurrency(amountRaw) : (base.confirmHero ?? formatCurrency(0));
  const amountSpoken = amountLabel.replace("GH₵", "GH₵");

  return {
    ...base,
    details: [
      { label: "Amount", value: amountLabel },
      { label: "To", value: name },
      { label: "Number", value: number },
      { label: "Network", value: network },
    ],
    confirmHero: amountLabel,
    confirmTarget: `to ${name}`,
    confirmMeta: number,
    readAloud: `You are about to send ${amountSpoken} to ${name}. Say continue or cancel.`,
    processingLabel: `Sending ${amountLabel} to ${name}`,
    processingStep: payee ? "Settling merchant payment…" : base.processingStep,
    successAmount: amountLabel,
    successSubtitle: `Your money has been successfully sent to ${name}.`,
    successDetails: [
      { label: "Recipient", value: name },
      { label: "Number", value: number },
      { label: "Reference", value: payee ? "AYA-SCAN-7K8X" : "AYA-2609-7K8X" },
      { label: "Date & time", value: "Today, 3:02 PM" },
      { label: "Status", value: "Completed" },
    ],
  };
}

function withTopUpOverrides(
  base: FlowContent,
  amountRaw: string | null,
  recipient: Recipient | null,
  kind: TopUpKind,
): FlowContent {
  if (!amountRaw && !recipient && kind === "airtime") return base;

  const amountLabel = amountRaw ? formatCurrency(amountRaw) : base.confirmHero;
  const type = kind === "data" ? "Data" : "Airtime";
  const who = recipient ? recipient.name : "your MTN number";
  const meta = recipient ? recipientLine(recipient) : "Self top-up · MTN";
  const network = recipient ? recipientNetworkLabel(recipient) : "MTN";

  return {
    ...base,
    intentLabel: kind === "data" ? "BUY DATA" : "BUY AIRTIME",
    details: [
      { label: "Amount", value: amountLabel },
      { label: "For", value: recipient ? recipient.name : "Your number" },
      { label: "Network", value: network },
      { label: "Type", value: type },
    ],
    confirmHero: amountLabel,
    confirmTarget: `${type.toLowerCase()} for ${who}`,
    confirmMeta: meta,
    readAloud: `You are about to buy ${amountLabel} ${type.toLowerCase()} for ${who}. Say continue or cancel.`,
    processingLabel: `Buying ${amountLabel} ${type.toLowerCase()} for ${who}`,
    successTitle: `${type} purchased!`,
    successAmount: amountLabel,
    successSubtitle: `${type} added to ${who}`,
    successDetails: base.successDetails.map((d) =>
      d.label === "For"
        ? { ...d, value: recipient ? recipient.name : "Your MTN number" }
        : d.label === "Amount"
          ? { ...d, value: amountLabel }
          : d,
    ),
  };
}

export function AppPrefsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>("tw");
  const [accessibility, setAccessibilityState] = useState<AccessibilityPrefs>(DEFAULT_A11Y);
  const [activeFlow, setActiveFlowState] = useState<FlowId>("transfer");
  const [scanPayee, setScanPayeeState] = useState<ScanPayee | null>(null);
  const [transferAmount, setTransferAmount] = useState<string | null>(null);
  const [transferRecipient, setTransferRecipient] = useState<Recipient | null>(null);
  const [topUpKind, setTopUpKind] = useState<TopUpKind>("airtime");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("low");
  const [spokenRequest, setSpokenRequest] = useState<string | null>(null);
  const [lastShopPayment, setLastShopPayment] = useState<ShopPayment | null>(null);
  const [shopPaymentSeq, setShopPaymentSeq] = useState(0);
  const [supportTicket, setSupportTicket] = useState<SupportTicket | null>(null);
  const [setupMode, setSetupMode] = useState<SetupMode | null>(null);
  const [helperMode, setHelperMode] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [appLock, setAppLock] = useState<AppLock | null>(null);
  const signOut = useCallback(() => {
    setAccount(null);
    setAppLock(null);
  }, []);
  const [preApproval, setPreApproval] = useState<PreApproval | null>(null);
  const [spentToday, setSpentToday] = useState(0);
  const recordSpend = useCallback((amount: number) => setSpentToday((s) => s + amount), []);

  const chooseSetupMode = useCallback((mode: SetupMode) => {
    const preset = SETUP_MODES.find((m) => m.id === mode)!;
    setSetupMode(mode);
    setAccessibilityState((prev) => ({ ...prev, ...preset.prefs }));
  }, []);

  const openSupportTicket = useCallback(
    (input: NewTicketInput) => {
      const now = Date.now();
      const events: TicketEvent[] = [
        {
          at: now,
          title: "Request opened",
          detail: input.note ?? categoryLabel(input.category),
        },
      ];
      if (input.callback) {
        events.push({
          at: now,
          title: `Callback requested in ${LANGUAGE_NAME[language]}`,
          detail: "Aya will show the call here before your phone rings, so you know it's real.",
        });
      }
      const ticket: SupportTicket = {
        reference: newTicketReference(),
        category: input.category,
        route: input.route,
        priority: input.route === "fraud_urgent" ? "urgent" : "normal",
        status: "open",
        language,
        createdAt: now,
        transaction: input.transaction,
        signalLevel: input.signalLevel,
        callbackRequested: Boolean(input.callback),
        events,
      };
      setSupportTicket(ticket);
      return ticket;
    },
    [language],
  );

  const addTicketEvent = useCallback((event: Omit<TicketEvent, "at">) => {
    setSupportTicket((t) => (t ? { ...t, events: [...t.events, { ...event, at: Date.now() }] } : t));
  }, []);

  const requestCallback = useCallback(() => {
    setSupportTicket((t) =>
      t && !t.callbackRequested
        ? {
            ...t,
            callbackRequested: true,
            events: [
              ...t.events,
              {
                at: Date.now(),
                title: `Callback requested in ${LANGUAGE_NAME[t.language]}`,
                detail: "Aya will show the call here before your phone rings, so you know it's real.",
              },
            ],
          }
        : t,
    );
  }, []);

  const ticketReference = supportTicket?.reference;
  useEffect(() => {
    if (!supportTicket || supportTicket.status !== "open") return;
    const timers = scheduleFor(supportTicket).map((u) =>
      setTimeout(() => {
        setSupportTicket((t) =>
          t && t.reference === supportTicket.reference
            ? { ...t, status: u.status, events: [...t.events, { ...u.event, at: Date.now() }] }
            : t,
        );
      }, u.afterMs),
    );
    return () => timers.forEach(clearTimeout);
    // Schedule once per new ticket; later status changes must not reschedule.
  }, [ticketReference]);

  const setAccessibility = useCallback(
    (patch: Partial<AccessibilityPrefs> | ((prev: AccessibilityPrefs) => AccessibilityPrefs)) => {
      setAccessibilityState((prev) => (typeof patch === "function" ? patch(prev) : { ...prev, ...patch }));
    },
    [],
  );

  const clearScanPayment = useCallback(() => {
    setScanPayeeState(null);
    setTransferAmount(null);
    setTransferRecipient(null);
  }, []);

  const setScanPayee = useCallback((payee: ScanPayee | null) => {
    setScanPayeeState(payee);
    if (!payee) setTransferAmount(null);
  }, []);

  const setActiveFlow = useCallback((flow: FlowId) => {
    setActiveFlowState(flow);
    setTransferRecipient(null);
    setTopUpKind("airtime");
    setRiskLevel("low");
    setSpokenRequest(null);
    if (flow !== "transfer") {
      setScanPayeeState(null);
      setTransferAmount(null);
    }
  }, []);

  const publishShopPayment = useCallback((payment: Omit<ShopPayment, "id">) => {
    setShopPaymentSeq((n) => {
      const id = n + 1;
      setLastShopPayment({ ...payment, id });
      return id;
    });
  }, []);

  const flow = useMemo(() => {
    const base = getFlowContent(activeFlow, language);
    if (activeFlow === "airtime") return withTopUpOverrides(base, transferAmount, transferRecipient, topUpKind);
    if (activeFlow === "support" && spokenRequest) {
      return { ...base, utterance: { ...base.utterance, transcript: spokenRequest, gloss: spokenRequest } };
    }
    if (activeFlow !== "transfer") return base;
    return withTransferOverrides(base, scanPayee, transferAmount, transferRecipient);
  }, [activeFlow, language, scanPayee, transferAmount, transferRecipient, topUpKind, spokenRequest]);

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
      flow,
      setupMode,
      chooseSetupMode,
      helperMode,
      setHelperMode,
      account,
      setAccount,
      appLock,
      setAppLock,
      signOut,
      preApproval,
      setPreApproval,
      spentToday,
      recordSpend,
      textScale,
      highContrast: accessibility.highContrast,
      scanPayee,
      setScanPayee,
      transferAmount,
      setTransferAmount,
      transferRecipient,
      setTransferRecipient,
      topUpKind,
      setTopUpKind,
      riskLevel,
      setRiskLevel,
      spokenRequest,
      setSpokenRequest,
      lastShopPayment,
      publishShopPayment,
      clearScanPayment,
      supportTicket,
      openSupportTicket,
      addTicketEvent,
      requestCallback,
    }),
    [
      topUpKind,
      riskLevel,
      spokenRequest,
      supportTicket,
      openSupportTicket,
      addTicketEvent,
      requestCallback,
      language,
      accessibility,
      setAccessibility,
      activeFlow,
      setActiveFlow,
      flow,
      setupMode,
      chooseSetupMode,
      helperMode,
      account,
      appLock,
      signOut,
      preApproval,
      spentToday,
      recordSpend,
      textScale,
      scanPayee,
      setScanPayee,
      transferAmount,
      transferRecipient,
      lastShopPayment,
      publishShopPayment,
      clearScanPayment,
    ],
  );

  return <AppPrefsContext.Provider value={value}>{children}</AppPrefsContext.Provider>;
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
