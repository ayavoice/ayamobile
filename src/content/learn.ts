import type { IonName } from "./play";

/**
 * Real-world MoMo situations. Report channels and reversal steps follow
 * MTN Ghana's help centre; "Stop, Check, Act" follows IPA's Uganda
 * fraud-education study. Re-check numbers before each release.
 */

export type LessonId = "fake-reversal" | "fake-mtn" | "prize" | "wrong-number" | "sim-swap" | "agent";

export type QuickCheck = {
  question: string;
  options: string[];
  answer: number;
  explain: string;
};

export type Lesson = {
  id: LessonId;
  icon: IonName;
  title: string;
  summary: string;
  minutes: number;
  story: string;
  signs?: string[];
  steps: string[];
  remember: string;
  check: QuickCheck;
};

export const STOP_CHECK_ACT: { title: string; detail: string }[] = [
  { title: "Stop", detail: "Don't send, tap or share anything yet." },
  { title: "Check", detail: "Ask someone you trust, or call MTN on 100." },
  { title: "Act", detail: "Hang up, block and report the number." },
];

export const LESSONS: Lesson[] = [
  {
    id: "fake-reversal",
    icon: "swap-horizontal-outline",
    title: "\u201CI sent you money by mistake\u201D",
    summary: "A stranger asks you to send it back",
    minutes: 1,
    story:
      "You get a message saying GH₵300 came in. Minutes later, someone calls and begs you to send it back.",
    signs: [
      "The alert came as a normal SMS, not from MoMo",
      "The caller is rushed, upset or pushy",
      "They ask you to send money, not MTN to reverse it",
    ],
    steps: [
      "Don't send anything back.",
      "Check your real balance in Aya or on *170#.",
      "If money truly came in, tell them to ask MTN for a reversal. MTN moves it, not you.",
    ],
    remember: "Real mistakes are fixed by MTN. Never send money back yourself.",
    check: {
      question: "The caller says \u201CPlease send my GH₵300 back now.\u201D What do you do first?",
      options: ["Send it back quickly", "Check your real balance", "Give them your PIN to fix it"],
      answer: 1,
      explain: "Fake alerts look real. Your balance is the only proof.",
    },
  },
  {
    id: "fake-mtn",
    icon: "call-outline",
    title: "A caller says they're from MTN",
    summary: "They ask for your PIN or a code",
    minutes: 1,
    story:
      "Someone calls saying your wallet will be blocked today unless you confirm your PIN or read out a code.",
    signs: [
      "They ask for your PIN or a code sent to you",
      "They threaten to block your account",
      "They call from an ordinary mobile number",
    ],
    steps: [
      "Hang up.",
      "Call MTN yourself on 100. It's free.",
      "Text the caller's number and what happened to 1515.",
    ],
    remember: "MTN and Aya will never ask for your PIN or codes.",
    check: {
      question: "\u201CThis is MTN. Read me the code we just sent you.\u201D What do you do?",
      options: ["Read the code", "Hang up and call 100", "Ask them to call back later"],
      answer: 1,
      explain: "Codes and PINs are only for you. Calling 100 yourself is always safe.",
    },
  },
  {
    id: "prize",
    icon: "gift-outline",
    title: "\u201CYou've won a prize\u201D",
    summary: "A fee or a link to claim it",
    minutes: 1,
    story:
      "A message says you won GH₵5,000. To claim it, pay a small fee or tap a link to verify your account.",
    signs: [
      "You never entered a promo",
      "You must pay before you get paid",
      "A link asks you to verify or update details",
    ],
    steps: [
      "Don't tap the link or reply.",
      "Check with MTN on 100 or in official apps only.",
      "Delete the message and report the number to 1515.",
    ],
    remember: "A real prize never asks you to pay first.",
    check: {
      question: "To claim your prize, pay a GH₵50 fee. Is this real?",
      options: ["Yes, the fee is small", "No, it's a scam", "Only if they send a link"],
      answer: 1,
      explain: "Asking for a fee first is the clearest sign of a prize scam.",
    },
  },
  {
    id: "wrong-number",
    icon: "return-up-back-outline",
    title: "You sent money to the wrong number",
    summary: "Get it back the official way",
    minutes: 1,
    story: "You typed one digit wrong and the money went to a stranger. Act quickly, but calmly.",
    steps: [
      "Dial *170#, choose 6 My Wallet, then 8 Reversals.",
      "Pick the transaction and confirm with your PIN.",
      "The receiver gets a prompt to approve. If they don't within 24 hours, the money stays held. Call MTN on 100.",
    ],
    remember: "Agent, merchant and international payments can't be reversed this way. Call 100.",
    check: {
      question: "The receiver won't approve your reversal. What happens to the money?",
      options: ["It's lost for good", "MTN holds it while you follow up", "You must pay a fee"],
      answer: 1,
      explain: "MTN keeps it reserved. Contact them on 100 to finish the reversal.",
    },
  },
  {
    id: "sim-swap",
    icon: "cellular-outline",
    title: "Your SIM suddenly stops working",
    summary: "Someone may have taken your number",
    minutes: 1,
    story:
      "Your phone shows no network, but people around you have signal. Someone may have moved your number to their SIM.",
    signs: [
      "No network for no clear reason",
      "A SIM change message you didn't ask for",
      "Calls and *170# stop working",
    ],
    steps: [
      "Use another phone to call MTN on 100 right away.",
      "Ask them to block your SIM and MoMo wallet.",
      "Take your Ghana Card to an MTN service centre for a new SIM.",
    ],
    remember: "Minutes matter. Call 100 straight away.",
    check: {
      question: "Your SIM loses network while others have signal. What do you do?",
      options: ["Wait until tomorrow", "Restart the phone and forget it", "Call 100 from another phone"],
      answer: 2,
      explain: "If it's a SIM swap, blocking quickly protects your wallet.",
    },
  },
  {
    id: "agent",
    icon: "storefront-outline",
    title: "At a MoMo agent",
    summary: "Cash in and out safely",
    minutes: 1,
    story: "You're withdrawing cash at a busy agent. Someone offers to type the details for you to save time.",
    signs: [
      "Someone offers to enter your PIN for you",
      "No MTN confirmation message arrives",
      "The shop has no agent ID or MTN sign",
    ],
    steps: [
      "Type your own PIN, hidden from others.",
      "Wait for MTN's confirmation message before you leave.",
      "Count your cash in front of the agent.",
    ],
    remember: "Your PIN stays with you, even at the agent.",
    check: {
      question: "The agent says \u201CGive me your phone, I'll enter your PIN.\u201D What do you do?",
      options: ["Hand over the phone", "Enter the PIN yourself", "Say your PIN out loud"],
      answer: 1,
      explain: "Nobody else should ever see or type your PIN.",
    },
  },
];

export type ReportChannel = { icon: IonName; title: string; detail: string; href: string };

export const REPORT_CHANNELS: ReportChannel[] = [
  { icon: "call-outline", title: "Call MTN on 100", detail: "Free, any time", href: "tel:100" },
  {
    icon: "chatbox-outline",
    title: "Text 1515",
    detail: "Send the number, date, amount and what happened",
    href: "sms:1515",
  },
  { icon: "keypad-outline", title: "Dial *170#", detail: "My Wallet, then report a number", href: "tel:*170%23" },
  { icon: "shield-outline", title: "Police on 0800 311 311", detail: "Free", href: "tel:0800311311" },
];
