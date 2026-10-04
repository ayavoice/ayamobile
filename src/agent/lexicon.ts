/**
 * Vocabulary for the rules layer of the intent engine (architecture.md §4.2).
 *
 * Every entry is written the way people actually say it in Ghana, including
 * borrowed English words ("sendi", "airtime", "balance") that are part of
 * everyday Twi and Ewe. Entries are normalised once at load so they compare
 * equal to normalised speech.
 */

import { normalize } from "./text";
import type { Lang } from "./types";

const n = (words: string[]) => words.map(normalize);

/** Words that mark a language. Shared borrowings are deliberately left out. */
export const LANGUAGE_MARKERS: Record<Lang, string[]> = {
  tw: n([
    "me", "mepɛ", "pɛ", "sɛ", "sendi", "mane", "fa", "kɔma", "sika", "sidi", "tɔ", "aane", "daabi",
    "gyae", "toa", "san", "bio", "boa", "ntɛm", "wɔ", "hɔ", "sɛn", "dodow", "akonta", "yɛ", "kɔ",
    "mepa", "kyɛw", "medaase", "yoo", "hwɛ", "nɔma", "ɔha", "aduonum", "aduonu", "apem", "mmienu",
    "enum", "baako", "obi", "onipa", "nipa", "sesa", "mfomso", "ankɔ", "worebɛ", "ɛyɛ", "ampa",
    "ma", "no", "na", "wo", "mewɔ", "tua", "ka", "deɛ",
  ]),
  ee: n([
    "medi", "be", "maɖo", "ɖo", "ga", "nye", "le", "asinye", "ƒle", "maƒle", "ao", "yi", "edzi",
    "ŋgɔ", "gbugbɔ", "gblɔ", "gblɔe", "kpe", "ɖe", "ŋunye", "kaba", "nenie", "alafa", "akpe",
    "blaatɔ̃", "ɖeka", "eve", "etɔ̃", "ene", "atɔ̃", "nam", "mele", "gbɔwò", "meɖe", "kuku", "kpɔ",
    "nɔmba", "ame", "tsɔ", "tɔ te", "vodada", "woblem", "ɛ̃", "enyo", "nyuie", "wò", "la", "na",
    "ke", "ake", "ɖa", "ɖokuinye", "xexlẽme",
  ]),
  en: n([
    "send", "transfer", "pay", "give", "to", "for", "my", "the", "please", "money", "cedis",
    "balance", "check", "what", "is", "how", "much", "buy", "airtime", "credit", "data", "bundle",
    "top", "up", "yes", "no", "cancel", "continue", "repeat", "again", "help", "person", "someone",
    "i", "want", "and", "hundred", "fifty", "twenty", "ten", "five", "number", "me", "stop", "wrong",
  ]),
};

/** Letters that only Ewe uses. A single one is a strong signal. */
export const EWE_LETTERS = /[ɖŋɣ]|ƒ|ʋ/u;

export type Cue = { phrase: string; weight: number };

const cues = (entries: [string, number][]): Cue[] =>
  entries.map(([phrase, weight]) => ({ phrase: normalize(phrase), weight }));

/** Action intents. Phrases score higher than single words. */
export const ACTION_CUES = {
  TRANSFER_MONEY: cues([
    // English
    ["send money", 3], ["send", 2], ["transfer", 2], ["pay", 2], ["give", 1.5], ["forward", 1.5],
    ["wire", 1.5], ["remit", 1.5],
    // Twi
    ["sendi", 2.5], ["mane", 2.5], ["kɔma", 2], ["fa sika", 2.5], ["fa", 1], ["tua", 2], ["ma no sika", 2.5],
    ["mane sika", 3], ["sika ma", 2],
    // Ewe
    ["ɖo ga", 3], ["maɖo ga", 3], ["ɖo", 1.5], ["maɖo", 2], ["ɖoe", 1.5], ["tsɔ ga", 2.5], ["ga na", 1.5],
    ["dzɔ ga", 2],
  ]),
  CHECK_BALANCE: cues([
    // English
    ["balance", 3], ["how much do i have", 3], ["how much money", 2.5], ["money left", 2.5], ["what's left", 2.5],
    ["what is left", 2.5], ["account balance", 3], ["my account", 1.5], ["my money", 1.5], ["check my money", 2.5],
    // Twi
    ["me balance", 3], ["sika dodow", 3], ["sika sɛn", 3], ["mewɔ sika sɛn", 3], ["me sika", 2], ["akonta", 2],
    ["hwɛ me sika", 3], ["sika a ɛwɔ", 2.5], ["sika a mewɔ", 2.5],
    // Ewe
    ["ga nenie", 3], ["nye ga", 2], ["ga si le asinye", 3], ["ga le asinye", 3], ["kpɔ nye ga", 3],
    ["ga xexlẽme", 3], ["xexlẽme", 2], ["asinye", 1.5],
  ]),
  BUY_AIRTIME: cues([
    ["airtime", 3], ["call credit", 3], ["credit", 2], ["top up", 2.5], ["topup", 2.5], ["recharge", 2.5],
    ["units", 2], ["call time", 2], ["phone credit", 3],
    // Twi
    ["tɔ airtime", 3], ["tɔ credit", 3], ["kaadi", 1.5],
    // Ewe
    ["ƒle airtime", 3], ["ƒle credit", 3],
  ]),
  BUY_DATA: cues([
    ["data", 3], ["bundle", 2.5], ["data bundle", 3.5], ["internet", 2.5], ["mb", 2], ["gb", 2], ["gig", 2],
    ["tɔ data", 3], ["ƒle data", 3],
  ]),
} as const;

/** Buying verbs: raise airtime/data confidence, lower transfer confidence. */
export const BUY_VERBS = n(["buy", "get", "load", "top up", "recharge", "tɔ", "ƒle", "maƒle", "metɔ", "tɔ ma me"]);

export const SYSTEM_CUES: Record<"CONFIRM" | "CANCEL" | "REPEAT" | "HELP" | "CHANGE_AMOUNT" | "CHANGE_RECIPIENT", string[]> = {
  CONFIRM: n([
    "continue", "yes", "yeah", "yep", "yup", "ok", "okay", "go ahead", "proceed", "confirm", "correct",
    "that's right", "that is right", "thats right", "sure", "fine", "do it", "send it", "go on", "alright",
    "all right", "exactly",
    // Twi
    "aane", "toa so", "kɔ so", "yoo", "ɛyɛ", "ɛno ara", "ɛno ara ne no", "ampa", "pene", "mepene",
    // Ewe
    "ɛ̃", "ee", "yi edzi", "yi ŋgɔ", "enyo", "nyuie", "eɖo", "melɔ̃", "lɔ̃", "yoo",
  ]),
  CANCEL: n([
    "cancel", "no", "nope", "stop", "don't", "do not", "never mind", "nevermind", "abort", "forget it",
    "leave it", "not now", "wait", "hold on", "quit", "exit",
    // Twi
    "daabi", "gyae", "twa mu", "nnyɛ", "nyɛ", "ma ɛnka", "gyae no",
    // Ewe
    "ao", "tɔ te", "ɖe asi le eŋu", "megawɔe o", "gbe", "ɖe asi",
  ]),
  REPEAT: n([
    "repeat", "again", "say that again", "say it again", "what did you say", "pardon", "come again",
    "once more", "i didn't hear", "didn't hear", "sorry what",
    // Twi
    "san ka", "ka bio", "san ka bio", "bio", "ka no bio", "mante",
    // Ewe
    "gbugbɔ gblɔe", "gagblɔe", "gblɔe ake", "ake", "nyemese o", "gbugbɔe",
  ]),
  HELP: n([
    "help", "what can you do", "how does this work", "what can i say", "options", "menu",
    "boa me", "kpe ɖe ŋunye", "ɛte sɛn", "mɛyɛ dɛn",
  ]),
  CHANGE_AMOUNT: n([
    "change the amount", "change amount", "not that amount", "wrong amount", "different amount",
    "sesa sika", "sesa sika no", "sika no nyɛ", "ɖɔli ga la", "menye ga ma o",
  ]),
  CHANGE_RECIPIENT: n([
    "change the person", "change person", "change recipient", "not that person", "wrong person", "someone else",
    "different person", "not him", "not her", "change the number", "wrong number",
    "sesa onipa", "ɛnyɛ ɔno", "ɖɔli ame la", "menye eya o", "menye ame ma o",
  ]),
};

export const SUPPORT_CUES = {
  REPORT_SCAM: cues([
    ["scam", 3], ["scammed", 3], ["tricked", 3], ["fraud", 3], ["fake", 2], ["419", 3], ["cheated", 2.5],
    ["asked for my pin", 3], ["asked for my code", 3], ["from mtn", 2], ["says he is from", 2], ["said he was from", 2],
    ["daadaa", 3], ["wɔadaadaa me", 3], ["sisi", 2], ["woblem", 3], ["ble", 2], ["flum", 2.5],
  ]),
  WRONG_TRANSFER: cues([
    ["wrong person", 3], ["wrong number", 3], ["wrong amount", 3], ["by mistake", 3], ["mistake", 2],
    ["too much", 2], ["extra zero", 3], ["went to the wrong", 3], ["ankɔ baabi", 3], ["mfomso", 3],
    ["ɛnyɛ onipa no", 2.5], ["vodada", 3], ["meyi afi si", 2.5], ["didn't go where", 3],
  ]),
  UNAUTHORISED_TRANSACTION: cues([
    ["i didn't send", 3], ["i did not send", 3], ["didn't send it", 3], ["money left", 2.5], ["someone took", 3],
    ["stolen", 3], ["taken from my wallet", 3], ["without me", 2], ["manmane", 2.5], ["obi afa me sika", 3],
    ["ame aɖe tsɔ nye ga", 3], ["nyemeɖoe o", 3],
  ]),
  MISTAKE_CLAIM_CHECK: cues([
    ["sent me money by mistake", 3.5], ["says they sent", 3], ["sent me by mistake", 3.5], ["send it back", 3],
    ["reversal", 2.5], ["reverse", 2], ["asked me to send back", 3.5], ["ɔse wamane me sika", 3],
    ["sika aba me so", 2.5], ["egblɔ be yeɖo ga nam", 3],
  ]),
  TICKET_STATUS: cues([
    ["my complaint", 3], ["my case", 3], ["ticket", 3], ["what's happening with", 2.5], ["any update", 3],
    ["status of my", 3], ["me case", 2.5], ["nye nya la", 2.5],
  ]),
  REPORT_PROBLEM: cues([
    ["something is wrong", 3], ["something went wrong", 3], ["problem", 2.5], ["not working", 2], ["help me", 2],
    ["didn't arrive", 3], ["not received", 3], ["never got", 3], ["pending", 2], ["complain", 2.5], ["report", 2],
    ["boa me", 2], ["biribi asɛe", 3], ["ɛnyɛ yie", 2.5], ["me sika ankɔ", 3], ["kpe ɖe ŋunye", 2],
    ["nane gblẽ", 3], ["nye ga meva o", 3], ["meɖo o", 2],
  ]),
  TALK_TO_PERSON: cues([
    ["talk to a person", 4], ["speak to a person", 4], ["talk to someone", 4], ["speak to someone", 4],
    ["real person", 4], ["human", 3], ["agent", 3], ["customer care", 3], ["call me", 2.5], ["person", 2],
    ["somebody", 2], ["someone", 1.5], ["onipa", 2], ["nipa", 2], ["obi", 1.5], ["mepɛ sɛ me kasa kyerɛ obi", 4],
    ["ame", 2], ["medi be maƒo nu kple ame", 4], ["ame aɖe", 2.5],
  ]),
} as const;

/** Urgency and coercion vocabulary (architecture.md §6). Only ever adds safety steps. */
export const PRESSURE_WORDS = n([
  "hurry", "hurry up", "quickly", "quick", "fast", "urgent", "right now", "immediately", "before it's too late",
  "they said", "he said i should", "she said i should", "the man on the phone", "the woman on the phone",
  "the man said", "customer care called", "mtn called", "someone called", "asked for my pin", "asked for my code",
  "told me to", "they told me", "he told me", "to unblock", "to win", "prize", "promotion", "lottery", "reward",
  "my account will be blocked", "verify my account",
  // Twi
  "ntɛm", "ntɛm ntɛm", "ka wo ho", "yɛ no ntɛm", "ɔse memfa", "ɔse mane", "wɔse", "ɔkaa sɛ", "ɔbarima no",
  "mtn frɛɛ me", "obi frɛɛ me", "ɔbisaa me pin", "ɔbisaa me code", "ɔse menyɛ", "adaadaa",
  // Ewe
  "kaba", "kaba kaba", "egblɔ be", "wogblɔ be", "ŋutsu la gblɔ", "mtn yɔm", "ame aɖe yɔm", "ebia nye pin",
  "ebia nye code", "egblɔ nam be",
]);

/** Fear or distress vocabulary. Adds care, never friction on the money itself. */
export const DISTRESS_WORDS = n([
  "scared", "afraid", "worried", "frightened", "crying", "i don't know what to do", "please help", "help me",
  "i'm confused", "confused", "i don't understand", "panic",
  "mesuro", "ehu aka me", "me ho adwiri me", "mente aseɛ", "boa me", "minnim deɛ menyɛ",
  "mevɔ̃", "vɔvɔ̃ le ŋunye", "nyemenya nu si mawɔ o", "kpe ɖe ŋunye", "nyemese egɔme o",
]);

/** The speaker means their own number ("buy airtime for me"). */
export const SELF_WORDS = n([
  "me", "myself", "my number", "my phone", "my line", "my own", "for me", "ma me", "me nɔma", "me ara", "nam",
  "nye nɔmba", "ɖokuinye", "na nye", "nye ŋutɔ",
]);

/** Words that end a recipient name capture. */
export const RECIPIENT_STOP_WORDS = n([
  "cedis", "cedi", "sidi", "sika", "ga", "money", "now", "today", "please", "nnɛ", "egbe", "mepa", "meɖe", "kuku",
  "airtime", "credit", "data", "for", "ma", "na", "and", "ne", "kple", "with", "on", "number", "nɔma", "nɔmba",
  "momo", "mtn", "telecel", "at", "wallet", "then", "afei", "ekema", "ok", "okay", "yoo", "gbɔ", "to", "the",
  "some", "that", "this", "it",
]);

/** "give him money": a pronoun is not a name, so Aya must ask who. */
export const PRONOUNS = n(["no", "ɔno", "him", "her", "them", "eya", "e", "wo", "wò", "you"]);

/** Words that introduce the person receiving money. */
export const RECIPIENT_PREPOSITIONS = n(["to", "for", "ma", "na", "kɔma", "give", "ɖe"]);

/** Verbs after which the next word may be the recipient ("mane Kwame sika 50", "pay Kofi"). */
export const RECIPIENT_VERBS = n(["send", "sendi", "mane", "pay", "transfer", "give", "tua", "ɖo", "maɖo", "fa"]);

/** Fillers trimmed off the end of a recipient name. */
export const TRAILING_FILLERS = n(["please", "now", "ok", "okay", "for me", "mepa wo kyɛw", "meɖe kuku", "yoo", "nnɛ", "egbe"]);

export const NETWORK_WORDS: Record<"mtn" | "telecel" | "at", string[]> = {
  mtn: n(["mtn", "momo", "mobile money"]),
  telecel: n(["telecel", "vodafone", "telecel cash", "vodafone cash"]),
  at: n(["at", "airteltigo", "airtel", "tigo", "at money"]),
};
