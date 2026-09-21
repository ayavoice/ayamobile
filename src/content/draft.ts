import { formatMinorToGhs, type ParsedIntent } from "@aya/shared";
import {
  getFlowContent,
  type AppLanguage,
  type FlowContent,
  type FlowDetail,
  type FlowId,
} from "./flows";
import { formatCurrencySpoken } from "../lib/currency";

/**
 * A draft is the last utterance Aya understood: which flow, the language it was
 * spoken in, and whatever slots the matcher pulled out. Screens read the draft
 * through AppPrefs so confirmations/receipts reflect what the user actually
 * said instead of static demo copy.
 */
export type VoiceDraft = {
  flow: FlowId;
  language: AppLanguage;
  slots: ParsedIntent["slots"];
  rawText: string;
  confidence: number;
  /** Resolved on-device contact (or spoken digits) carrying the real phone. */
  recipient?: { name: string; phone: string };
};

const NETWORK_LABEL: Record<string, string> = {
  mtn: "MTN",
  telecel: "Telecel",
  at: "AirtelTigo",
};

const CONTINUE: Record<AppLanguage, string> = {
  tw: "Ka continue anaa cancel.",
  ee: "Gblɔ continue alo cancel.",
  en: "Say continue or cancel.",
};

/** Spoken prompt for an amount aya did not understand before sending. */
const ASK_AMOUNT: Record<AppLanguage, string> = {
  tw: "Sika bɛn?",
  ee: "Ga kae?",
  en: "How much in Ghana cedis?",
};

/**
 * Read-aloud used when a money flow is missing its amount. Aya must never
 * invent or echo a template amount on the money path — it asks instead.
 */
function noAmountReadAloud(
  language: AppLanguage,
  flow: VoiceDraft["flow"],
  subject: string,
): string {
  const how = ASK_AMOUNT[language];
  switch (flow) {
    case "transfer":
      if (language === "tw") return `Worebɛ soma ama ${subject}. ${how}`;
      if (language === "ee") return `Èle ɖo ge na ${subject}. ${how}`;
      return `You want to send to ${subject}. ${how}`;
    case "airtime":
      if (language === "tw") return `Wopɛ sɛɛ wotɔ airtime ma ${subject}. ${how}`;
      if (language === "ee") return `Èle airtime ƒle ge na ${subject}. ${how}`;
      return `You want to buy airtime for ${subject}. ${how}`;
    case "data":
      if (language === "tw") return `Wore bɛto data bundle ama ${subject}. ${how}`;
      if (language === "ee") return `Èle data bundle ƒle ge na ${subject}. ${how}`;
      return `You want to buy data for ${subject}. ${how}`;
    case "bill":
      if (language === "tw") return `Wore betua ${subject} bill. ${how}`;
      if (language === "ee") return `Èle ${subject} bill tua ge. ${how}`;
      return `You want to pay your ${subject} bill. ${how}`;
    default:
      return how;
  }
}

function spokenAmount(amountMinor: number): string {
  const cedis = amountMinor / 100;
  if (Number.isInteger(cedis)) return `${cedis} Ghana cedis`;
  return formatCurrencySpoken(cedis);
}

function stripTo(value: string): string {
  return value.replace(/^to\s+/i, "");
}

function withRows(
  rows: FlowDetail[],
  overrides: Record<string, string>,
): FlowDetail[] {
  return rows.map((row) =>
    overrides[row.label] != null ? { ...row, value: overrides[row.label] } : row,
  );
}

function transferReadAloud(
  language: AppLanguage,
  amount: string,
  payee: string,
): string {
  switch (language) {
    case "tw":
      return `Worebɛ soma ${amount} ama ${payee}.`;
    case "ee":
      return `Èle ${amount} ɖo ge na ${payee}.`;
    default:
      return `You are about to send ${amount} to ${payee}.`;
  }
}

function airtimeReadAloud(
  language: AppLanguage,
  amount: string,
  network: string,
): string {
  switch (language) {
    case "tw":
      return `Wopɛ sɛɛ wotɔ ${amount} airtime ma w0 ${network} number.`;
    case "ee":
      return `Èle ${amount} airtime ƒle ge na wò ${network} number.`;
    default:
      return `You are about to buy ${amount} airtime for your ${network} number.`;
  }
}

function dataReadAloud(
  language: AppLanguage,
  amount: string,
  network: string,
): string {
  switch (language) {
    case "tw":
      return `Wore bɛto ${amount} data bundle ama wo ${network} number.`;
    case "ee":
      return `Èle ${amount} data bundle ƒle ge na wò ${network} number.`;
    default:
      return `You are about to buy ${amount} data for your ${network} number.`;
  }
}

function billReadAloud(
  language: AppLanguage,
  amount: string,
  biller: string,
): string {
  switch (language) {
    case "tw":
      return `Wore betua ${amount} ama ${biller} bill.`;
    case "ee":
      return `Èle ${amount} ${biller} bill tua ge.`;
    default:
      return `You are about to pay ${amount} towards your ${biller} bill.`;
  }
}

/**
 * Turn a draft into localized screen copy. Unrecognized slots fall back to the
 * static template so a partial parse (e.g. no amount) still renders sensibly.
 */
export function buildFlowContent(
  draft: VoiceDraft,
  language: AppLanguage,
): FlowContent {
  const base = getFlowContent(draft.flow, language);
  const { amountMinor, payee, phone, networkId } = draft.slots;
  const network = NETWORK_LABEL[networkId ?? ""] ?? "MTN";
  const hasAmount = amountMinor != null;
  const amountDisplay = hasAmount ? formatMinorToGhs(amountMinor) : "—";
  const confirmPrompt = hasAmount ? amountDisplay : ASK_AMOUNT[language];
  const amount = hasAmount ? spokenAmount(amountMinor) : "";

  switch (draft.flow) {
    case "transfer": {
      const resolvedName = draft.recipient?.name;
      const resolvedPhone = draft.recipient?.phone;
      const recipient = resolvedName ?? payee ?? "Unknown recipient";
      const number = resolvedPhone ?? (phone ? `MoMo ${phone}` : "Unknown number");
      return {
        ...base,
        details: [
          { label: "Amount", value: amountDisplay },
          { label: "To", value: recipient },
          { label: "Number", value: number },
          { label: "Network", value: network === "MTN" ? "Wallet" : network },
        ],
        confirmHero: confirmPrompt,
        confirmTarget: `to ${recipient}`,
        confirmMeta: number,
        readAloud: `${
          hasAmount
            ? transferReadAloud(language, amount, recipient)
            : noAmountReadAloud(language, "transfer", recipient)
        } ${CONTINUE[language]}`,
        processingLabel: hasAmount
          ? `Sending ${amountDisplay} to ${recipient}`
          : `Preparing transfer to ${recipient}`,
        successAmount: amountDisplay,
        successSubtitle: `Your money has been successfully sent to ${recipient}.`,
        successDetails: withRows(base.successDetails, {
          Recipient: recipient,
          Number: number,
        }),
      };
    }
    case "airtime": {
      const forValue = `${network} number`;
      return {
        ...base,
        details: [
          { label: "Amount", value: amountDisplay },
          { label: "For", value: forValue },
          { label: "Network", value: network },
          { label: "Type", value: "Airtime" },
        ],
        confirmHero: confirmPrompt,
        confirmTarget: `airtime for your ${network} number`,
        confirmMeta: `Self top-up · ${network}`,
        readAloud: `${
          hasAmount
            ? airtimeReadAloud(language, amount, network)
            : noAmountReadAloud(language, "airtime", network)
        } ${CONTINUE[language]}`,
        processingLabel: hasAmount
          ? `Buying ${amountDisplay} ${network} airtime`
          : `Preparing ${network} airtime`,
        successAmount: amountDisplay,
        successSubtitle: `Airtime added to your ${network} number`,
        successDetails: withRows(base.successDetails, {
          For: forValue,
          Amount: amountDisplay,
        }),
      };
    }
    case "data": {
      const forValue = `${network} number`;
      return {
        ...base,
        details: [
          { label: "Amount", value: amountDisplay },
          { label: "For", value: forValue },
          { label: "Network", value: network },
          { label: "Type", value: "Data bundle" },
        ],
        confirmHero: confirmPrompt,
        confirmTarget: `data bundle for your ${network} number`,
        confirmMeta: `Self top-up · ${network}`,
        readAloud: `${
          hasAmount
            ? dataReadAloud(language, amount, network)
            : noAmountReadAloud(language, "data", network)
        } ${CONTINUE[language]}`,
        processingLabel: hasAmount
          ? `Buying ${amountDisplay} ${network} data`
          : `Preparing ${network} data`,
        successAmount: amountDisplay,
        successSubtitle: `Data bundle added to your ${network} number`,
        successDetails: withRows(base.successDetails, {
          For: forValue,
          Amount: amountDisplay,
        }),
      };
    }
    case "bill": {
      const biller = payee ?? stripTo(base.confirmTarget);
      return {
        ...base,
        details: [
          { label: "Amount", value: amountDisplay },
          { label: "Biller", value: biller },
          { label: "Type", value: base.confirmMeta.split("·")[0].trim() || "Bill" },
          { label: "Network", value: network },
        ],
        confirmHero: confirmPrompt,
        confirmTarget: `towards ${biller}`,
        confirmMeta: `${biller} bill · ${network} MoMo`,
        readAloud: `${
          hasAmount
            ? billReadAloud(language, amount, biller)
            : noAmountReadAloud(language, "bill", biller)
        } ${CONTINUE[language]}`,
        processingLabel: hasAmount
          ? `Paying ${amountDisplay} to ${biller}`
          : `Preparing ${biller} bill payment`,
        successAmount: amountDisplay,
        successSubtitle: `Your ${biller} bill has been paid.`,
        successDetails: withRows(base.successDetails, {
          Biller: biller,
          Amount: amountDisplay,
        }),
      };
    }
    case "balance":
    default:
      return {
        ...base,
        details: [
          { label: "Action", value: "Balance inquiry" },
          { label: "Account", value: `${network} MoMo` },
          { label: "Network", value: network },
        ],
        confirmTarget: `${network} MoMo`,
        successAmount: hasAmount ? amountDisplay : base.successAmount,
        successSubtitle: `${network} MoMo · as of today`,
        successDetails: withRows(base.successDetails, {
          Wallet: `${network} MoMo`,
          Available: hasAmount ? amountDisplay : (base.successAmount ?? ""),
        }),
      };
  }
}
