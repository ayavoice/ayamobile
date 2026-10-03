export type AppLanguage = "tw" | "en";
export type FlowId = "transfer" | "balance" | "airtime" | "support";

export type FlowDetail = { label: string; value: string };

export type LocalizedUtterance = {
  languageLabel: string;
  transcript: string;
  gloss: string;
};

export type FlowContent = {
  intentLabel: string;
  listenHint: string;
  utterance: LocalizedUtterance;
  details: FlowDetail[];
  confirmLead: string;
  confirmHero: string;
  confirmTarget: string;
  confirmMeta: string;
  readAloud: string;
  processingLabel: string;
  processingStep: string;
  successTitle: string;
  successAmount?: string;
  successSubtitle: string;
  successDetails: FlowDetail[];
  receiptAvailable: boolean;
};

const LANG_LABEL: Record<AppLanguage, string> = {
  tw: "Akan / Twi",
  en: "English",
};

const TRANSFER: Record<AppLanguage, FlowContent> = {
  tw: {
    intentLabel: "SEND MONEY",
    listenHint: "Speak naturally in Akan/Twi, code-switching is fine",
    utterance: {
      languageLabel: LANG_LABEL.tw,
      transcript: "Me pɛ sɛ me sendi GH₵580 ma Ricky Martin",
      gloss: "I want to send GH₵580 to Ricky Martin",
    },
    details: [
      { label: "Amount", value: "GH₵580.00" },
      { label: "To", value: "Ricky Martin" },
      { label: "Number", value: "Ac no. 8050530XXX" },
      { label: "Network", value: "Wallet" },
    ],
    confirmLead: "You are about to send",
    confirmHero: "GH₵580.00",
    confirmTarget: "to Ricky Martin",
    confirmMeta: "Ac no. 8050530XXX",
    readAloud:
      "You are about to send GH₵580 to Ricky Martin. Say continue or cancel.",
    processingLabel: "Sending GH₵580 to Ricky Martin",
    processingStep: "Processing transfer…",
    successTitle: "Transfer Success",
    successAmount: "GH₵580.00",
    successSubtitle: "Your money has been successfully sent to Ricky Martin.",
    successDetails: [
      { label: "Recipient", value: "Ricky Martin" },
      { label: "Number", value: "Ac no. 8050530XXX" },
      { label: "Reference", value: "AYA-2609-7K8X" },
      { label: "Date & time", value: "Today, 3:02 PM" },
      { label: "Status", value: "Completed" },
    ],
    receiptAvailable: true,
  },
  en: {
    intentLabel: "SEND MONEY",
    listenHint: "Speak naturally, mix in Twi if you want",
    utterance: {
      languageLabel: LANG_LABEL.en,
      transcript: "Send GH₵580 to Ricky Martin",
      gloss: "Send GH₵580 to Ricky Martin",
    },
    details: [
      { label: "Amount", value: "GH₵580.00" },
      { label: "To", value: "Ricky Martin" },
      { label: "Number", value: "Ac no. 8050530XXX" },
      { label: "Network", value: "Wallet" },
    ],
    confirmLead: "You are about to send",
    confirmHero: "GH₵580.00",
    confirmTarget: "to Ricky Martin",
    confirmMeta: "Ac no. 8050530XXX",
    readAloud:
      "You are about to send GH₵580 to Ricky Martin. Say continue or cancel.",
    processingLabel: "Sending GH₵580 to Ricky Martin",
    processingStep: "Processing transfer…",
    successTitle: "Transfer Success",
    successAmount: "GH₵580.00",
    successSubtitle: "Your money has been successfully sent to Ricky Martin.",
    successDetails: [
      { label: "Recipient", value: "Ricky Martin" },
      { label: "Number", value: "Ac no. 8050530XXX" },
      { label: "Reference", value: "AYA-2609-7K8X" },
      { label: "Date & time", value: "Today, 3:02 PM" },
      { label: "Status", value: "Completed" },
    ],
    receiptAvailable: true,
  },
};

const BALANCE: Record<AppLanguage, FlowContent> = {
  tw: {
    intentLabel: "CHECK BALANCE",
    listenHint: "Ask for your balance in Akan/Twi",
    utterance: {
      languageLabel: LANG_LABEL.tw,
      transcript: "Me balance yɛ sɛn?",
      gloss: "What is my balance?",
    },
    details: [
      { label: "Action", value: "Balance inquiry" },
      { label: "Account", value: "Your MTN MoMo" },
      { label: "Network", value: "MTN" },
    ],
    confirmLead: "Aya will show your balance",
    confirmHero: "Ready to check",
    confirmTarget: "Your MTN MoMo",
    confirmMeta: "Amount stays hidden until you reveal it",
    readAloud:
      "You asked for your MTN MoMo balance. After you confirm privately, I will show you the amount. Say continue or cancel.",
    processingLabel: "Checking your MTN MoMo balance",
    processingStep: "Secure inquiry in progress…",
    successTitle: "Your balance",
    successAmount: "GH₵2,648.34",
    successSubtitle: "MTN MoMo · as of today, 9:41am",
    successDetails: [
      { label: "Wallet", value: "MTN MoMo" },
      { label: "Available", value: "GH₵2,648.34" },
      { label: "Reference", value: "AYA-2609-BAL1" },
      { label: "Status", value: "Successful" },
    ],
    receiptAvailable: false,
  },
  en: {
    intentLabel: "CHECK BALANCE",
    listenHint: "Ask for your balance naturally",
    utterance: {
      languageLabel: LANG_LABEL.en,
      transcript: "What is my balance?",
      gloss: "Check MTN MoMo balance",
    },
    details: [
      { label: "Action", value: "Balance inquiry" },
      { label: "Account", value: "Your MTN MoMo" },
      { label: "Network", value: "MTN" },
    ],
    confirmLead: "Aya will show your balance",
    confirmHero: "Ready to check",
    confirmTarget: "Your MTN MoMo",
    confirmMeta: "Amount stays hidden until you reveal it",
    readAloud:
      "You asked for your MTN MoMo balance. After you confirm privately, I will show you the amount. Say continue or cancel.",
    processingLabel: "Checking your MTN MoMo balance",
    processingStep: "Secure inquiry in progress…",
    successTitle: "Your balance",
    successAmount: "GH₵2,648.34",
    successSubtitle: "MTN MoMo · as of today, 9:41am",
    successDetails: [
      { label: "Wallet", value: "MTN MoMo" },
      { label: "Available", value: "GH₵2,648.34" },
      { label: "Reference", value: "AYA-2609-BAL1" },
      { label: "Status", value: "Successful" },
    ],
    receiptAvailable: false,
  },
};

const AIRTIME: Record<AppLanguage, FlowContent> = {
  tw: {
    intentLabel: "BUY AIRTIME",
    listenHint: "Say the airtime or data you need in Akan/Twi",
    utterance: {
      languageLabel: LANG_LABEL.tw,
      transcript: "Me pɛ sɛ me tɔ airtime GH₵10",
      gloss: "I want to buy GH₵10 airtime",
    },
    details: [
      { label: "Amount", value: "GH₵10.00" },
      { label: "For", value: "Your number" },
      { label: "Network", value: "MTN" },
      { label: "Type", value: "Airtime" },
    ],
    confirmLead: "You are about to buy",
    confirmHero: "GH₵10.00",
    confirmTarget: "airtime for your MTN number",
    confirmMeta: "Self top-up · MTN",
    readAloud:
      "You are about to buy GH₵10 airtime for your MTN number. Say continue or cancel.",
    processingLabel: "Buying GH₵10 MTN airtime",
    processingStep: "USSD sandbox · airtime top-up…",
    successTitle: "Airtime purchased!",
    successAmount: "GH₵10.00",
    successSubtitle: "Airtime added to your MTN number",
    successDetails: [
      { label: "For", value: "Your MTN number" },
      { label: "Amount", value: "GH₵10.00" },
      { label: "Reference", value: "AYA-2609-RT9M" },
      { label: "Date & time", value: "7 Sep 2026, 9:41am" },
      { label: "Status", value: "Successful" },
    ],
    receiptAvailable: true,
  },
  en: {
    intentLabel: "BUY AIRTIME",
    listenHint: "Say the airtime or data you need",
    utterance: {
      languageLabel: LANG_LABEL.en,
      transcript: "Buy GH₵10 airtime for me",
      gloss: "Top up my MTN number with GH₵10",
    },
    details: [
      { label: "Amount", value: "GH₵10.00" },
      { label: "For", value: "Your number" },
      { label: "Network", value: "MTN" },
      { label: "Type", value: "Airtime" },
    ],
    confirmLead: "You are about to buy",
    confirmHero: "GH₵10.00",
    confirmTarget: "airtime for your MTN number",
    confirmMeta: "Self top-up · MTN",
    readAloud:
      "You are about to buy GH₵10 airtime for your MTN number. Say continue or cancel.",
    processingLabel: "Buying GH₵10 MTN airtime",
    processingStep: "USSD sandbox · airtime top-up…",
    successTitle: "Airtime purchased!",
    successAmount: "GH₵10.00",
    successSubtitle: "Airtime added to your MTN number",
    successDetails: [
      { label: "For", value: "Your MTN number" },
      { label: "Amount", value: "GH₵10.00" },
      { label: "Reference", value: "AYA-2609-RT9M" },
      { label: "Date & time", value: "7 Sep 2026, 9:41am" },
      { label: "Status", value: "Successful" },
    ],
    receiptAvailable: true,
  },
};

const SUPPORT_BASE: Omit<FlowContent, "listenHint" | "utterance"> = {
  intentLabel: "GET HELP",
  details: [
    { label: "Payment", value: "GH₵580.00 to Ricky Martin" },
    { label: "When", value: "Today, 3:02 PM" },
    { label: "Reference", value: "AYA-2609-7K8X" },
  ],
  confirmLead: "Aya will help you report this",
  confirmHero: "Support request",
  confirmTarget: "Aya support",
  confirmMeta: "GH₵580.00 to Ricky Martin · Today, 3:02 PM",
  readAloud: "I'm here to help. We will sort this out together.",
  processingLabel: "Opening your support request",
  processingStep: "Preparing your case…",
  successTitle: "Request opened",
  successSubtitle: "Aya will keep you updated as your request moves forward.",
  successDetails: [],
  receiptAvailable: false,
};

const SUPPORT: Record<AppLanguage, FlowContent> = {
  tw: {
    ...SUPPORT_BASE,
    listenHint: "Tell Aya what went wrong in Akan/Twi. Take your time",
    utterance: {
      languageLabel: LANG_LABEL.tw,
      transcript: "Mepa wo kyɛw boa me, me sika no ankɔ baabi a ɛsɛ sɛ ɛkɔ",
      gloss: "Please help me, my money didn't go where it should",
    },
  },
  en: {
    ...SUPPORT_BASE,
    listenHint: "Tell Aya what went wrong. Take your time",
    utterance: {
      languageLabel: LANG_LABEL.en,
      transcript: "Please help me, my money went to the wrong person",
      gloss: "Please help me, my money went to the wrong person",
    },
  },
};

const FLOW_MAP: Record<FlowId, Record<AppLanguage, FlowContent>> = {
  transfer: TRANSFER,
  balance: BALANCE,
  airtime: AIRTIME,
  support: SUPPORT,
};

export function getFlowContent(flow: FlowId, language: AppLanguage): FlowContent {
  return FLOW_MAP[flow][language];
}

export function languageDisplayName(language: AppLanguage): string {
  return LANG_LABEL[language];
}
