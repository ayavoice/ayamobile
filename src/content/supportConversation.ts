import type { AppLanguage } from "./flows";
import {
  COMFORT_LINE,
  LANGUAGE_NAME,
  SUPPORT_TRANSACTIONS,
  type SupportCategory,
  type SupportRoute,
  type SupportTransaction,
} from "./support";

/**
 * Scripted voice conversation for support (support.md §3). Aya resolves what it
 * can in the conversation (reversal requests, status checks) and only opens a
 * ticket when a person has to act: MTN investigations, scams, app faults, or
 * when the user asks for a human.
 */

export type NodeId =
  | "safety"
  | "hangUp"
  | "askWhat"
  | "reversalOffer"
  | "reversalSent"
  | "checking"
  | "arrived"
  | "stillPending"
  | "mtnCase"
  | "fraud"
  | "appIssue"
  | "ticketDone"
  | "person"
  | "anythingElse"
  | "bye";

export type CardKind = "transaction" | "checking" | "arrived" | "reversal" | "ticket";

export type Reply = {
  /** What the user says, shown on the chip and used as the voice answer. */
  label: string;
  to: NodeId;
  txId?: string;
  category?: SupportCategory;
  pressured?: boolean;
  alertTrusted?: boolean;
  correction?: boolean;
  /** "Not that payment": Aya moves to her next best guess instead of asking. */
  nextTx?: boolean;
};

export type NodeAction =
  | { kind: "openTicket"; route: SupportRoute; callback?: boolean; note: string }
  | { kind: "callback" }
  | { kind: "end" };

export type SupportNode = {
  say: string;
  /** Shorter wording once Aya is going gently. */
  simple?: string;
  card?: CardKind;
  replies: Reply[];
  action?: NodeAction;
  /** Moves on by itself after the card has shown, e.g. a status check. */
  autoNext?: { to: NodeId; afterMs: number };
};

export type ConversationContext = {
  language: AppLanguage;
  tx: SupportTransaction;
  category: SupportCategory | null;
  gentle: boolean;
  pressured: boolean;
  alertTrusted: boolean;
  ticketRef: string | null;
  firstTurn: boolean;
  /** Aya names the payment she found, so the user never has to recall it. */
  announceTx: boolean;
};

export const AGENT_NAME = "Ama";
export const STATUS_CHECK_MS = 1800;

const CATEGORY_REPLIES: Omit<Reply, "to">[] = [
  { label: "I sent it to the wrong person", category: "wrong_person" },
  { label: "I sent the wrong amount", category: "wrong_amount" },
  { label: "It didn't arrive", category: "not_received" },
  { label: "Someone tricked me", category: "scam" },
  { label: "Aya didn't work right", category: "app_issue" },
];

/** Where the conversation goes once Aya knows the payment and the problem. */
export function routeNode(category: SupportCategory | null, tx: SupportTransaction): NodeId {
  switch (category) {
    case "wrong_person":
    case "wrong_amount":
      return tx.hoursAgo < 24 ? "reversalOffer" : "mtnCase";
    case "not_received":
      return "checking";
    case "scam":
      return "fraud";
    case "app_issue":
      return "appIssue";
    case "other":
      return "person";
    default:
      return "askWhat";
  }
}

export function startNode(category: SupportCategory | null, pressured: boolean, tx: SupportTransaction): NodeId {
  return pressured || category === "scam" ? "safety" : routeNode(category, tx);
}

/** Next most likely payment after a "Not that payment", most recent first. */
export function nextGuess(current: SupportTransaction): SupportTransaction {
  const i = SUPPORT_TRANSACTIONS.findIndex((t) => t.id === current.id);
  return SUPPORT_TRANSACTIONS[(i + 1) % SUPPORT_TRANSACTIONS.length];
}

function firstName(name: string) {
  return name.startsWith("Your") ? "the recipient" : name.split(" ")[0];
}

function deadline(tx: SupportTransaction) {
  return tx.hoursAgo < 24 ? `tomorrow, ${tx.when.replace(/^Today, /, "")}` : "within 24 hours";
}

export function getNode(id: NodeId, ctx: ConversationContext): SupportNode {
  const { tx, gentle } = ctx;
  const comfort = COMFORT_LINE[ctx.language];
  const lang = LANGUAGE_NAME[ctx.language];
  const who = firstName(tx.counterpart);
  const after = { to: routeNode(ctx.category, tx) };
  const toWhom = tx.counterpart.startsWith("Your") ? "your MTN number" : tx.counterpart;
  const open = !ctx.firstTurn
    ? ""
    : gentle
      ? `${comfort} I can hear this is stressful. We'll fix it together, one small step at a time. `
      : `${comfort} `;
  const lead = `${open}${ctx.announceTx ? `I found it: ${tx.amount} to ${toWhom}, ${tx.when.toLowerCase()}. ` : ""}`;
  const simpleLead = `${ctx.firstTurn ? `${comfort} ` : ""}${ctx.announceTx ? `It's the ${tx.amount} to ${who}. ` : ""}`;
  const notThis: Reply = { label: "Not that payment", to: "askWhat", nextTx: true, correction: true };
  const withGuess = (replies: Reply[]) => (ctx.announceTx ? [...replies, notThis] : replies);

  switch (id) {
    case "safety":
      return {
        say: `${comfort} Before anything else, are you safe right now? If someone is on the phone telling you what to do, you can hang up. I'll wait.`,
        simple: `${comfort} Are you safe right now? You can hang up on them.`,
        replies: [
          { label: "I'm safe", to: after.to },
          { label: "Someone is pressuring me", to: "hangUp", pressured: true, category: "scam" },
        ],
      };
    case "hangUp":
      return {
        say: "Thank you for telling me. You don't have to do anything they say, and you're not in trouble. Hang up now if you can. This is not your fault.",
        simple: "Thank you. You don't have to do what they say. Hang up if you can.",
        replies: [{ label: "I've hung up", to: "fraud" }],
      };
    case "askWhat":
      return {
        say: `${lead}What went wrong with it?`,
        simple: `${simpleLead}What went wrong?`,
        card: ctx.announceTx ? "transaction" : undefined,
        replies: withGuess(CATEGORY_REPLIES.map((r) => ({ ...r, to: routeNode(r.category ?? null, tx) }))),
      };
    case "reversalOffer": {
      const amountLine =
        ctx.category === "wrong_amount"
          ? `I can ask MTN to send back the full ${tx.amount}, then you send the right amount.`
          : `I can ask MTN to reverse it right now, from here.`;
      return {
        say: `${lead}That happens to a lot of people, don't worry. Because it was ${tx.when.toLowerCase()}, ${amountLine} ${who} gets a message and has 24 hours to approve. Shall I send it?`,
        simple: `${simpleLead}Don't worry. I can ask MTN to send it back now. Shall I?`,
        card: ctx.announceTx ? "transaction" : undefined,
        replies: withGuess([{ label: "Yes, reverse it", to: "reversalSent" }]),
      };
    }
    case "reversalSent":
      return {
        say: `Done. I've asked MTN to send back ${tx.amount}. You don't need to dial anything. If ${who} hasn't approved by ${deadline(tx)}, I'll open a case with MTN for you automatically.`,
        simple: `Done. I asked MTN to send back ${tx.amount}. I'll follow up for you.`,
        card: "reversal",
        replies: [
          { label: "Thank you", to: "anythingElse" },
          { label: "Talk to a person", to: "person" },
        ],
      };
    case "checking":
      return {
        say: `${lead}Let me check it with MTN. One moment.`,
        simple: `${simpleLead}Let me check with MTN.`,
        card: "checking",
        replies: [],
        autoNext: { to: tx.hoursAgo < 24 ? "arrived" : "stillPending", afterMs: STATUS_CHECK_MS },
      };
    case "arrived":
      return {
        say: `Good news. MTN shows it arrived in ${who}'s wallet two minutes after you sent it. Sometimes the SMS comes late. Your money is safe.`,
        simple: `Good news. It arrived. Your money is safe.`,
        card: "arrived",
        replies: [
          { label: "Great, thanks", to: "anythingElse" },
          { label: `${who} says it didn't come`, to: "mtnCase", category: "not_received" },
        ],
      };
    case "stillPending":
      return {
        say: "MTN still shows it as pending. Your money isn't lost; it either arrives or comes back to you. Someone at MTN needs to look at it, so I'll open a case and watch it for you.",
        simple: "It's still pending. Your money isn't lost. I'll open a case for you.",
        replies: [
          { label: "Okay, open it", to: "ticketDone" },
          { label: "Talk to a person", to: "person" },
        ],
      };
    case "mtnCase":
      return {
        say: `${lead}A person at MTN has to look into this one. I've filled in everything they ask for, so you don't have to remember any numbers. Shall I send your case?`,
        simple: `${simpleLead}MTN needs to check this. I've filled it all in. Shall I send it?`,
        card: "transaction",
        replies: withGuess([{ label: "Yes, send it", to: "ticketDone" }]),
      };
    case "fraud":
      return {
        say: `You did the right thing telling me. This isn't your fault; these people trick careful people every day. ${ctx.announceTx ? `I found the payment: ${tx.amount} to ${toWhom}, ${tx.when.toLowerCase()}. ` : ""}Every minute counts, so I'll report it to MTN's fraud team as urgent and ask them to hold the money.`,
        simple: `You did the right thing. It's not your fault. ${simpleLead}I'll report it as urgent now.`,
        card: "transaction",
        replies: withGuess([
          { label: "Yes, report it now", to: "ticketDone" },
          { label: "Report it and tell Maame", to: "ticketDone", alertTrusted: true },
        ]),
      };
    case "appIssue":
      return {
        say: "I'm sorry Aya gave you trouble. I'll pass this to our team with what happened, so you won't need to explain it again.",
        simple: "Sorry about that. I'll tell our team.",
        replies: [
          { label: "Okay, send it", to: "ticketDone" },
          { label: "Talk to a person", to: "person" },
        ],
      };
    case "ticketDone": {
      const urgent = ctx.category === "scam";
      const ref = ctx.ticketRef ?? "";
      const maame = ctx.alertTrusted ? " I've let Maame know you asked for help, without any amounts." : "";
      return {
        say: urgent
          ? `It's reported as urgent. Your case number is ${ref}, and I've texted it to you. ${AGENT_NAME} from our team will call you in ${lang} within 15 minutes. The call shows in Aya first, so you'll know it's really us.${maame}`
          : `I've sent it. Your case number is ${ref}, and I've texted it to you too. A person will handle it, and I'll tell you the moment anything changes.${maame}`,
        simple: `Sent. Your number is ${ref}. I'll keep you updated.`,
        card: "ticket",
        action: {
          kind: "openTicket",
          route:
            ctx.category === "scam"
              ? "fraud_urgent"
              : ctx.category === "not_received"
                ? "status_check"
                : ctx.category === "app_issue" || !ctx.category
                  ? "aya_queue"
                  : "mtn_case",
          callback: urgent,
          note: urgent ? "Scam reported by voice. Urgent callback." : "Opened by voice with Aya",
        },
        replies: [
          { label: "Thank you", to: "anythingElse" },
          ...(urgent ? [] : [{ label: `Call me back in ${lang}`, to: "person" as const }]),
        ],
      };
    }
    case "person":
      return {
        say: `Of course. ${AGENT_NAME} from our team will call you in ${lang} in about 10 minutes. I've passed on everything, so you won't have to repeat yourself. The call shows in Aya first, so you know it's really us.`,
        simple: `Of course. ${AGENT_NAME} will call you in ${lang} soon.`,
        card: "ticket",
        action: ctx.ticketRef
          ? { kind: "callback" }
          : { kind: "openTicket", route: "aya_queue", callback: true, note: "Asked to talk to a person" },
        replies: [{ label: "Thank you", to: "anythingElse" }],
      };
    case "anythingElse":
      return {
        say: "Is there anything else I can help with?",
        replies: [
          { label: "No, that's all", to: "bye" },
          { label: "Something else", to: "askWhat" },
        ],
      };
    case "bye":
      return {
        say: gentle
          ? "You did really well today. I'm here whenever you need me."
          : "Glad I could help. I'm here whenever you need me.",
        replies: [],
        action: { kind: "end" },
      };
  }
}
