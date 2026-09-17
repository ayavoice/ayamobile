import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export type IonName = ComponentProps<typeof Ionicons>["name"];

export type GameProgress = { best: number; total: number; plays: number };

export const INITIAL_PROGRESS: GameProgress = { best: 0, total: 0, plays: 0 };

export type LocalGameId =
  | "oware"
  | "ampe"
  | "pilolo"
  | "chaskele"
  | "baawa"
  | "alikoto"
  | "dame"
  | "antoakyire";

export type LocalGame = {
  id: LocalGameId;
  title: string;
  subtitle: string;
  icon: IonName;
  levelLabel: string;
  playable: boolean;
  wash: "purple" | "blue" | "yellow" | "green";
};

export const LOCAL_GAMES: LocalGame[] = [
  {
    id: "oware",
    title: "Ama's Market Day",
    subtitle: "Practice safe spending choices",
    icon: "cart-outline",
    levelLabel: "PRACTICE",
    playable: true,
    wash: "purple",
  },
  {
    id: "ampe",
    title: "Ampe",
    subtitle: "Clap, jump, and match your steps",
    icon: "footsteps-outline",
    levelLabel: "PLAY",
    playable: false,
    wash: "yellow",
  },
  {
    id: "pilolo",
    title: "Pilolo",
    subtitle: "Find the hidden stick and race back",
    icon: "search-outline",
    levelLabel: "PLAY",
    playable: false,
    wash: "blue",
  },
  {
    id: "chaskele",
    title: "Chaskele",
    subtitle: "Street cricket with a can and sticks",
    icon: "baseball-outline",
    levelLabel: "PLAY",
    playable: false,
    wash: "green",
  },
  {
    id: "baawa",
    title: "Ba-awa",
    subtitle: "Akan mancala sow seeds, capture fours",
    icon: "leaf-outline",
    levelLabel: "PLAY",
    playable: false,
    wash: "purple",
  },
  {
    id: "alikoto",
    title: "Alikoto",
    subtitle: "Spin the top and keep it dancing",
    icon: "sync-outline",
    levelLabel: "PLAY",
    playable: false,
    wash: "yellow",
  },
  {
    id: "dame",
    title: "Dame",
    subtitle: "Ghana draughts plan every jump",
    icon: "grid-outline",
    levelLabel: "PLAY",
    playable: false,
    wash: "blue",
  },
  {
    id: "antoakyire",
    title: "Antoakyire",
    subtitle: "Circle game catch who's behind you",
    icon: "ellipse-outline",
    levelLabel: "PLAY",
    playable: false,
    wash: "green",
  },
];

export type LearnPathId = "think" | "safety" | "scam-words" | "practice";

export type LearnPath = {
  id: LearnPathId;
  title: string;
  subtitle: string;
  icon: IonName;
  wash: "purple" | "blue" | "yellow" | "green";
  cta: string;
  playable: boolean;
};

export const LEARN_PATHS: LearnPath[] = [
  {
    id: "think",
    title: "Think first",
    subtitle: "Pause, check, then send money",
    icon: "bulb-outline",
    wash: "yellow",
    cta: "Learn",
    playable: false,
  },
  {
    id: "safety",
    title: "Stay safe",
    subtitle: "PIN privacy and MoMo habits",
    icon: "shield-checkmark-outline",
    wash: "green",
    cta: "Learn",
    playable: false,
  },
  {
    id: "scam-words",
    title: "Scam words",
    subtitle: "Spot pressure words before you tap",
    icon: "warning-outline",
    wash: "blue",
    cta: "Practice",
    playable: true,
  },
  {
    id: "practice",
    title: "Practice play",
    subtitle: "Try Ama's Market Day and more",
    icon: "game-controller-outline",
    wash: "purple",
    cta: "Play",
    playable: true,
  },
];

export type ScamWordRound = {
  id: string;
  message: string;
  options: string[];
  answer: string;
  tip: string;
};

export const SCAM_WORD_ROUNDS: ScamWordRound[] = [
  {
    id: "urgent",
    message: "URGENT: Your wallet will lock in 10 minutes. Send GH₵20 to keep it open.",
    options: ["URGENT", "wallet", "minutes"],
    answer: "URGENT",
    tip: "Real banks almost never rush you with URGENT threats.",
  },
  {
    id: "prize",
    message: "Congrats! You won GH₵5,000. Pay a small fee now to claim your prize.",
    options: ["Congrats", "prize", "fee"],
    answer: "fee",
    tip: "A real prize never asks you to pay a fee first.",
  },
  {
    id: "pin",
    message: "MTN support here. Share your PIN so we can fix your account today.",
    options: ["MTN", "PIN", "account"],
    answer: "PIN",
    tip: "Nobody from MTN or Aya will ask for your PIN.",
  },
  {
    id: "agent",
    message: "Secret agent deal. Send money now and get double back tonight.",
    options: ["Secret", "double", "tonight"],
    answer: "Secret",
    tip: "Secret deals and pressure for now are classic scam bait.",
  },
];

export type OwareChoice = {
  id: string;
  label: string;
  delta: number;
  safetyDelta: number;
  tier: "best" | "okay" | "trap";
  feedback: string;
};

export type OwareRound = {
  id: string;
  icon: IonName;
  title: string;
  situation: string;
  choices: OwareChoice[];
};

export const OWARE_START_MONEY = 180;
export const OWARE_START_SAFETY = 70;

export const OWARE_ROUNDS: OwareRound[] = [
  {
    id: "transport",
    icon: "bus",
    title: "Transport to Kejetia",
    situation: "Ama needs GH₵30 for tro-tro fare to Kejetia market.",
    choices: [
      {
        id: "momo",
        label: "Pay the tro-tro fare with MoMo",
        delta: -30,
        safetyDelta: 5,
        tier: "best",
        feedback: "Smart — MoMo keeps a safe, clean record.",
      },
      {
        id: "pin",
        label: "\"MTN support\" offers a top-up if she reads her PIN",
        delta: -50,
        safetyDelta: -30,
        tier: "trap",
        feedback: "Scam — MTN never asks for your PIN.",
      },
      {
        id: "walk",
        label: "Walk instead to save the fare",
        delta: 0,
        safetyDelta: 0,
        tier: "okay",
        feedback: "Saved the cash, lost an hour of selling time.",
      },
    ],
  },
  {
    id: "school",
    icon: "book",
    title: "School supplies",
    situation: "Her daughter needs GH₵40 for exercise books today.",
    choices: [
      {
        id: "direct",
        label: "Pay the shop by MoMo herself",
        delta: -40,
        safetyDelta: 5,
        tier: "best",
        feedback: "Paying the shop directly gets the books there safely.",
      },
      {
        id: "runner",
        label: "A \"runner\" offers to buy them if she sends GH₵40 first",
        delta: -40,
        safetyDelta: -25,
        tier: "trap",
        feedback: "He disappears — never send money to a stranger first.",
      },
      {
        id: "wait",
        label: "Tell her to wait until tomorrow",
        delta: 0,
        safetyDelta: 0,
        tier: "okay",
        feedback: "Saved the cash, but she goes without books today.",
      },
    ],
  },
  {
    id: "customer",
    icon: "storefront",
    title: "A customer pays her",
    situation: "A customer sends GH₵70 by MoMo for fabric bought on credit.",
    choices: [
      {
        id: "separate",
        label: "Move it into her separate business wallet",
        delta: 70,
        safetyDelta: 10,
        tier: "best",
        feedback: "Keeping business money apart shows her real profit.",
      },
      {
        id: "mixed",
        label: "Spend GH₵15 of it on lunch right away",
        delta: 55,
        safetyDelta: -5,
        tier: "okay",
        feedback: "Mixed money is harder to track.",
      },
      {
        id: "untracked",
        label: "Not bother tracking it at all",
        delta: 70,
        safetyDelta: -10,
        tier: "trap",
        feedback: "No record means no proof if it's disputed.",
      },
    ],
  },
  {
    id: "message",
    icon: "mail",
    title: "A message arrives",
    situation: "\"You won GH₵2,000! Send GH₵50 now to claim it.\"",
    choices: [
      {
        id: "delete",
        label: "Delete it and block the number",
        delta: 0,
        safetyDelta: 20,
        tier: "best",
        feedback: "Real prizes never ask you to pay first.",
      },
      {
        id: "send",
        label: "Send the GH₵50 — it could be real",
        delta: -50,
        safetyDelta: -40,
        tier: "trap",
        feedback: "There was no prize — a common MoMo scam.",
      },
      {
        id: "reply",
        label: "Reply asking for more details first",
        delta: 0,
        safetyDelta: -10,
        tier: "okay",
        feedback: "Replying tells scammers your number is active.",
      },
    ],
  },
];

export function starsForSafety(safety: number): number {
  if (safety >= 85) return 3;
  if (safety >= 60) return 2;
  return 1;
}

export function xpForTier(tier: OwareChoice["tier"]): number {
  if (tier === "best") return 20;
  if (tier === "okay") return 10;
  return 5;
}
