/**
 * Everything Aya says during a transaction, in Twi, Ewe and English.
 *
 * Each line has a stable key so fixed safety prompts can be swapped for
 * recordings by native speakers (architecture.md §4.3). Twi and Ewe wording
 * must be reviewed by native speakers before any real-user session.
 *
 * Amounts are shown as "GH₵150.00" in captions; phone numbers are only ever
 * spoken as the last four digits in pairs.
 */

import { maskAccount, transferFee, type Recipient } from "../content/send";
import { formatCurrency } from "../lib/currency";
import { lastFourSpoken } from "./text";
import type { Draft, Lang, RiskAssessment } from "./types";

type Line = Record<Lang, string>;

const L = {
  greet: {
    en: "What would you like to do? You can send money, check your balance, or buy airtime.",
    tw: "Ɛdeɛn na wopɛ sɛ meyɛ ma wo? Wobɛtumi amane sika, ahwɛ wo balance, anaa atɔ airtime.",
    ee: "Nukae nèdi be mawɔ na wò? Àte ŋu aɖo ga, akpɔ wò ga xexlẽme, alo aƒle airtime.",
  },
  not_understood: {
    en: 'Sorry, I didn\'t understand. You can say "send 50 cedis to Kwame", "check my balance", or "buy 10 cedis airtime".',
    tw: 'Kafra, mante aseɛ. Ka sɛ "sendi sidi 50 ma Kwame", "hwɛ me balance", anaa "tɔ airtime sidi 10".',
    ee: 'Meɖe kuku, nyemese egɔme o. Gblɔ be "ɖo ga 50 na Kwame", "kpɔ nye ga xexlẽme", alo "ƒle airtime 10".',
  },
  offer_tap: {
    en: "Let's do it on the screen instead. Tap what you want, or type it. Nothing is lost.",
    tw: "Ma yɛmfa screen no nyɛ. Mia deɛ wopɛ so, anaa kyerɛw. Hwee nyerae.",
    ee: "Na míawɔe le screen la dzi. Zi nu si nèdi dzi, alo ŋlɔe. Naneke mebu o.",
  },
  help: {
    en: 'I can send money, check your balance, and buy airtime or data. Just say it your way, for example "send 100 to Maame". Say "cancel" at any time.',
    tw: 'Metumi mane sika, mahwɛ wo balance, na matɔ airtime anaa data. Ka no sɛdeɛ wopɛ, sɛ "sendi 100 ma Maame". Ka "gyae" berɛ biara.',
    ee: 'Mate ŋu aɖo ga, akpɔ wò ga xexlẽme, eye maƒle airtime alo data. Gblɔe ɖe wò mɔ nu, abe "ɖo ga 100 na Dada" ene. Gblɔ "tɔ te" ɣesiaɣi.',
  },
  cancelled: {
    en: "Okay, I've cancelled it. Nothing was sent.",
    tw: "Yoo, magyae. Wɔamane hwee.",
    ee: "Enyo, metɔ te. Womeɖo naneke o.",
  },
  confirmed: {
    en: "Okay. The microphone is now off. Approve privately on your phone.",
    tw: "Yoo. Mafa microphone no ato hɔ. Pene so wɔ wo fon so kokoam.",
    ee: "Enyo. Metsi microphone la. Lɔ̃ ɖe edzi le wò fon dzi le adzame.",
  },
  confirm_unclear: {
    en: 'Please say "continue" to go ahead, or "cancel" to stop.',
    tw: 'Mepa wo kyɛw, ka "toa so" anaa "gyae".',
    ee: 'Meɖe kuku, gblɔ "yi edzi" alo "tɔ te".',
  },
  handoff_support: {
    en: "I'm here with you. Tell me what happened, and we'll sort it out together.",
    tw: "Mewɔ ha ma wo. Ka deɛ asi kyerɛ me, na yɛbɛyɛ ho adwuma abom.",
    ee: "Mele afi kpli wò. Gblɔ nu si dzɔ nam, eye míaɖɔe ɖo ɖekae.",
  },
  handoff_person: {
    en: "Of course. I'll connect you to a person who speaks your language. They will never ask for your PIN.",
    tw: "Yoo. Mede wo bɛhyia obi a ɔka wo kasa. Ɔremmisa wo PIN da.",
    ee: "Enyo. Mana nàdo go ame aɖe si doa wò gbe. Mabia wò PIN gbeɖe o.",
  },
  ask_amount_transfer: {
    en: "How much do you want to send to {name}?",
    tw: "Sika dodow sɛn na wopɛ sɛ wode kɔma {name}?",
    ee: "Ga nenie nèdi be yeaɖo na {name}?",
  },
  ask_amount_any: {
    en: "How much do you want to send?",
    tw: "Sika dodow sɛn na wopɛ sɛ wode kɔ?",
    ee: "Ga nenie nèdi be yeaɖo?",
  },
  ask_amount_airtime: {
    en: "How much airtime do you want?",
    tw: "Airtime sɛn na wopɛ?",
    ee: "Airtime nenie nèdi?",
  },
  ask_amount_data: {
    en: "How much data do you want, in cedis?",
    tw: "Data a ɛyɛ sidi sɛn na wopɛ?",
    ee: "Data si nye ga nenie nèdi?",
  },
  amount_unsure: {
    en: "I think you said {amount}. Please say the amount again so I'm sure.",
    tw: "Mete sɛ woka {amount}. Mepa wo kyɛw, san ka sika dodow no bio na mente aseɛ yie.",
    ee: "Mese be ègblɔ {amount}. Meɖe kuku, gagblɔ ga xexlẽme la ake be maka ɖe edzi.",
  },
  ask_recipient: {
    en: "Who should I send {amount} to? Say a name or a phone number.",
    tw: "Hwan na memfa {amount} nkɔma no? Ka ne din anaa ne nɔma.",
    ee: "Ameka maɖo {amount} na? Gblɔ ŋkɔ alo fon nɔmba.",
  },
  ask_recipient_any: {
    en: "Who do you want to send money to? Say a name or a phone number.",
    tw: "Hwan na wopɛ sɛ wo mane no sika? Ka ne din anaa ne nɔma.",
    ee: "Ameka nèdi be yeaɖo ga na? Gblɔ ŋkɔ alo fon nɔmba.",
  },
  unknown_recipient: {
    en: "I couldn't find {name} in your contacts. Please say their phone number.",
    tw: "Manhu {name} wɔ wo contacts mu. Mepa wo kyɛw, ka ne nɔma.",
    ee: "Nyemekpɔ {name} le wò contacts me o. Meɖe kuku, gblɔ eƒe fon nɔmba.",
  },
  unknown_number: {
    en: "I couldn't find a MoMo account for that number. Please check it and say it again.",
    tw: "Manhu MoMo akonta biara wɔ nɔma no so. Hwɛ na san ka bio.",
    ee: "Nyemekpɔ MoMo akɔnta aɖeke ɖe nɔmba ma dzi o. Kpɔe eye nàgagblɔe.",
  },
  choose_recipient: {
    en: "I found {list}. Which one?",
    tw: "Mahu {list}. Ɛhefa?",
    ee: "Mekpɔ {list}. Kae?",
  },
  confirm_candidate: {
    en: "Do you mean {list}? Say yes, or say the name again.",
    tw: "Wopɛ sɛ woka {list}? Ka aane, anaa san ka din no bio.",
    ee: "{list} gbɔe nèle? Gblɔ ɛ̃, alo gagblɔ ŋkɔ la.",
  },
  readback_transfer: {
    en: "You are about to send {amount} to {name}, number ending {last4}. {fee}Say continue or cancel.",
    tw: "Worebɛmane {amount} akɔma {name}, nɔma a ɛwiei yɛ {last4}. {fee}Ka toa so anaa gyae.",
    ee: "Èle {amount} ɖo ge na {name}, nɔmba si ƒe nuwuwu nye {last4}. {fee}Gblɔ yi edzi alo tɔ te.",
  },
  readback_transfer_gentle: {
    en: "Let's go slowly. You want to send {amount}. It goes to {name}. Their number ends {last4}. {fee}Is that right? Say continue or cancel.",
    tw: "Yɛnkɔ brɛoo. Wopɛ sɛ wo mane {amount}. Ɛbɛkɔ {name} hɔ. Ne nɔma wiei yɛ {last4}. {fee}Ɛyɛ ampa? Ka toa so anaa gyae.",
    ee: "Míazɔ blewu. Èdi be yeaɖo {amount}. Ayi na {name}. Eƒe nɔmba ƒe nuwuwu nye {last4}. {fee}Enye nyateƒea? Gblɔ yi edzi alo tɔ te.",
  },
  fee: {
    en: "The fee is {fee}. ",
    tw: "Ka no yɛ {fee}. ",
    ee: "Fe la nye {fee}. ",
  },
  readback_balance: {
    en: "You want to check your MTN MoMo balance. Say continue or cancel.",
    tw: "Wopɛ sɛ wohwɛ wo MTN MoMo balance. Ka toa so anaa gyae.",
    ee: "Èdi be yeakpɔ wò MTN MoMo ga xexlẽme. Gblɔ yi edzi alo tɔ te.",
  },
  readback_airtime_self: {
    en: "You are about to buy {amount} airtime for your own number. Say continue or cancel.",
    tw: "Worebɛtɔ airtime {amount} ama wo ankasa wo nɔma. Ka toa so anaa gyae.",
    ee: "Èle airtime {amount} ƒle ge na wò ŋutɔ wò nɔmba. Gblɔ yi edzi alo tɔ te.",
  },
  readback_airtime_other: {
    en: "You are about to buy {amount} airtime for {name}, number ending {last4}. Say continue or cancel.",
    tw: "Worebɛtɔ airtime {amount} ama {name}, nɔma a ɛwiei yɛ {last4}. Ka toa so anaa gyae.",
    ee: "Èle airtime {amount} ƒle ge na {name}, nɔmba si ƒe nuwuwu nye {last4}. Gblɔ yi edzi alo tɔ te.",
  },
  readback_data_self: {
    en: "You are about to buy {amount} of data for your own number. Say continue or cancel.",
    tw: "Worebɛtɔ data {amount} ama wo ankasa wo nɔma. Ka toa so anaa gyae.",
    ee: "Èle data {amount} ƒle ge na wò ŋutɔ wò nɔmba. Gblɔ yi edzi alo tɔ te.",
  },
  readback_data_other: {
    en: "You are about to buy {amount} of data for {name}, number ending {last4}. Say continue or cancel.",
    tw: "Worebɛtɔ data {amount} ama {name}, nɔma a ɛwiei yɛ {last4}. Ka toa so anaa gyae.",
    ee: "Èle data {amount} ƒle ge na {name}, nɔmba si ƒe nuwuwu nye {last4}. Gblɔ yi edzi alo tɔ te.",
  },
  name_mismatch: {
    en: "Careful: MTN has this number registered to {registered}, not {name}. ",
    tw: "Hwɛ yie: MTN akyerɛw nɔma yi wɔ {registered} din mu, ɛnyɛ {name}. ",
    ee: "Kpɔ nyuie: MTN ŋlɔ nɔmba sia ɖe {registered} ŋkɔ te, menye {name} o. ",
  },
  new_recipient: {
    en: "This is your first time sending to {name}. Make sure you know this person. ",
    tw: "Ɛyɛ deɛ edi kan a woremane {name} sika. Hwɛ sɛ wonim onipa yi. ",
    ee: "Esia nye zi gbãtɔ si nèle ga ɖo ge na {name}. Kpɔ be ènya ame sia. ",
  },
  cooling_off: {
    en: "Let's pause for a moment. MTN and Aya will never ask you to send money to unblock an account, claim a prize, or fix a mistake. If someone is telling you what to do, you can stop now. ",
    tw: "Ma yɛngyina kakra. MTN ne Aya remmisa wo da sɛ mane sika na wɔabue wo akonta, anaa wanya akyɛdeɛ. Sɛ obi rekyerɛ wo deɛ wobɛyɛ a, wobɛtumi agyae seesei. ",
    ee: "Na míatɔ te vie. MTN kple Aya mabia wò gbeɖe be nàɖo ga be woaʋu wò akɔnta alo nàxɔ nunana o. Ne ame aɖe le nu si nàwɔ gblɔm na wò la, àte ŋu atɔ te fifia. ",
  },
  cooling_off_ask: {
    en: "{summary} Do you still want to continue? Say continue or cancel.",
    tw: "{summary} Wopɛ sɛ wotoa so ara? Ka toa so anaa gyae.",
    ee: "{summary} Èdi kokoko be yeayi edzi? Gblɔ yi edzi alo tɔ te.",
  },
  summary_transfer: {
    en: "You asked to send {amount} to {name}.",
    tw: "Wopɛ sɛ wo mane {amount} ma {name}.",
    ee: "Èbia be yeaɖo {amount} na {name}.",
  },
  amount_invalid: {
    en: "That amount doesn't look right. Please say an amount above zero.",
    tw: "Sika dodow no nyɛ yie. Ka sika a ɛboro hwee so.",
    ee: "Ga xexlẽme ma medze o. Gblɔ ga si de ŋgɔ wu naneke.",
  },
  bank_airtime: {
    en: "Airtime can only go to a phone number. Please say the phone number.",
    tw: "Airtime kɔ fon nɔma so nko ara. Ka fon nɔma no.",
    ee: "Airtime yina fon nɔmba dzi ko. Gblɔ fon nɔmba la.",
  },
} satisfies Record<string, Line>;

export type LineKey = keyof typeof L;

export function line(key: LineKey, lang: Lang, params: Record<string, string> = {}): string {
  return L[key][lang].replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? "");
}

export function recipientLast4(r: Recipient): string {
  return r.kind === "bank" ? lastFourSpoken(maskAccount(r.account)) : lastFourSpoken(r.phone);
}

function amountText(draft: Draft): string {
  return formatCurrency(draft.amount?.value ?? 0);
}

/** "Kwame Boateng, ending 66 31 or Kwame Addo, ending 34 56" for "which one?" questions. */
export function candidateList(candidates: Recipient[], lang: Lang): string {
  const ending = { en: "ending", tw: "a ɛwiei yɛ", ee: "si ƒe nuwuwu nye" }[lang];
  const or = { en: " or ", tw: " anaa ", ee: " alo " }[lang];
  return candidates.map((c) => `${c.name}, ${ending} ${recipientLast4(c)}`).join(or);
}

/** The full read-back, plus any warnings the risk level adds. */
export function readback(draft: Draft, lang: Lang, risk: RiskAssessment, gentle: boolean): { text: string; key: LineKey } {
  const amount = amountText(draft);
  const r = draft.recipient?.value;

  if (draft.intent === "CHECK_BALANCE") return { text: line("readback_balance", lang), key: "readback_balance" };

  if (draft.intent === "BUY_AIRTIME" || draft.intent === "BUY_DATA") {
    const data = draft.intent === "BUY_DATA";
    if (!r || draft.forSelf) {
      const key = data ? "readback_data_self" : "readback_airtime_self";
      return { text: line(key, lang, { amount }), key };
    }
    const key = data ? "readback_data_other" : "readback_airtime_other";
    return { text: line(key, lang, { amount, name: r.registeredName, last4: recipientLast4(r.recipient) }), key };
  }

  if (!r) return { text: line("ask_recipient", lang, { amount }), key: "ask_recipient" };
  const fee = r.recipient.kind === "wallet" && r.recipient.network === "merchant" ? 0 : transferFee(draft.amount?.value ?? 0, r.recipient.kind);
  const feeText = fee > 0 ? line("fee", lang, { fee: formatCurrency(fee) }) : "";
  const warnings =
    (r.nameMismatch ? line("name_mismatch", lang, { registered: r.registeredName, name: r.recipient.name }) : "") +
    (risk.reasons.includes("new_recipient") ? line("new_recipient", lang, { name: r.registeredName }) : "");
  const useGentle = gentle || risk.level !== "low";
  const key: LineKey = useGentle ? "readback_transfer_gentle" : "readback_transfer";
  return {
    text: warnings + line(key, lang, { amount, name: r.registeredName, last4: recipientLast4(r.recipient), fee: feeText }),
    key,
  };
}

/** Cooling-off: the safety message, then the request in one sentence, then the question again. */
export function coolingOff(draft: Draft, lang: Lang): { text: string; key: LineKey } {
  const r = draft.recipient?.value;
  const summary =
    draft.intent === "TRANSFER_MONEY" && r
      ? line("summary_transfer", lang, { amount: amountText(draft), name: r.registeredName })
      : "";
  return { text: line("cooling_off", lang) + line("cooling_off_ask", lang, { summary }), key: "cooling_off" };
}
