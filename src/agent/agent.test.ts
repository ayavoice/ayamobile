import { describe, expect, it } from "vitest";
import { SAVED_RECIPIENTS } from "../content/send";
import { initialState, step, toAppRequest, DEFAULT_NICKNAMES } from "./index";
import { parseUtterance } from "./nlu";
import { findAmount, parseBareAmount } from "./numbers";
import { normalize } from "./text";
import type { AgentContext, DialogueState, Lang, StepResult } from "./types";

const ctx: AgentContext = {
  preferredLang: "tw",
  contacts: SAVED_RECIPIENTS,
  nicknames: DEFAULT_NICKNAMES,
  lookupName: (phone) => SAVED_RECIPIENTS.find((r) => r.kind === "wallet" && r.phone === phone)?.name ?? (phone === "0209998877" ? "Yaw Asante" : null),
  largeAmount: 500,
  veryLargeAmount: 1000,
};

const parse = (text: string, preferredLang: Lang = "tw") => parseUtterance(text, { expecting: "open", preferredLang });

function talk(...utterances: string[]): StepResult {
  let r: StepResult = step(initialState("tw"), { type: "start" }, ctx);
  for (const u of utterances) r = step(r.state, { type: "utterance", text: u }, ctx);
  return r;
}

const state = (r: StepResult): DialogueState => r.state;

describe("numbers", () => {
  it.each([
    ["150", 150],
    ["gh₵150", 150],
    ["12.50 cedis", 12.5],
    ["1,500 cedis", 1500],
    ["one hundred and fifty", 150],
    ["two thousand five hundred", 2500],
    ["twenty five cedis", 25],
    ["ɔha ne aduonum", 150],
    ["ahanu", 200],
    ["apem", 1000],
    ["alafa ɖeka kple blaatɔ̃", 150],
    ["alafa eve", 200],
    ["akpe ɖeka", 1000],
  ])("reads %s as %d", (text, value) => {
    expect(findAmount(normalize(text))?.value).toBe(value);
  });

  it("never reads a phone number as money", () => {
    expect(parse("send to 024 412 3456").amount).toBeUndefined();
  });

  it("is less sure about spoken numbers than digits", () => {
    expect(findAmount(normalize("150 cedis"))!.confidence).toBeGreaterThan(findAmount(normalize("one fifty"))!.confidence);
    expect(findAmount(normalize("one fifty"))!.confidence).toBeLessThan(0.75);
  });

  it("recognises a bare amount answer", () => {
    expect(parseBareAmount("fifty cedis")?.value).toBe(50);
    expect(parseBareAmount("please send fifty cedis to my mother tomorrow morning")).toBeNull();
  });
});

describe("language identification", () => {
  it.each([
    ["Me pɛ sɛ me sendi 150 ma Kwame", "tw"],
    ["Medi be maɖo ga 150 na Kwame", "ee"],
    ["I want to send 150 cedis to Kwame", "en"],
  ] as const)("%s -> %s", (text, lang) => {
    expect(parse(text, "en").language.lang).toBe(lang);
  });

  it("notices code-switching", () => {
    expect(parse("Me pɛ sɛ me send money to Kwame please", "tw").language.mixed).toBe(true);
  });
});

describe("intent engine", () => {
  it.each([
    ["Me pɛ sɛ me sendi 150 ma Kwame", "TRANSFER_MONEY", 150, "Kwame"],
    ["sendi 580 ma Ricky Martin", "TRANSFER_MONEY", 580, "Ricky Martin"],
    ["Sendi 150 cedis ma Kwame", "TRANSFER_MONEY", 150, "Kwame"],
    ["send GH₵150 to Kwame Boateng please", "TRANSFER_MONEY", 150, "Kwame Boateng"],
    ["mane Ama sika 50", "TRANSFER_MONEY", 50, "Ama"],
    ["Medi be maɖo ga 100 na Kojo", "TRANSFER_MONEY", 100, "Kojo"],
    ["pay 12.50 to Kofi", "TRANSFER_MONEY", 12.5, "Kofi"],
    ["50 to Ricky", "TRANSFER_MONEY", 50, "Ricky"],
  ] as const)("%s", (text, intent, amount, name) => {
    const r = parse(text);
    expect(r.intent).toBe(intent);
    expect(r.amount?.value).toBe(amount);
    expect(r.recipientName?.value).toBe(name);
  });

  it.each([
    ["check my balance", "CHECK_BALANCE"],
    ["Me balance yɛ sɛn?", "CHECK_BALANCE"],
    ["mewɔ sika sɛn", "CHECK_BALANCE"],
    ["ga nenie le asinye", "CHECK_BALANCE"],
    ["buy 10 airtime", "BUY_AIRTIME"],
    ["Me pɛ sɛ me tɔ airtime GH₵10", "BUY_AIRTIME"],
    ["top up 5 cedis", "BUY_AIRTIME"],
    ["maƒle airtime 20", "BUY_AIRTIME"],
    ["buy 20 cedis data bundle", "BUY_DATA"],
    ["someone tricked me", "REPORT_SCAM"],
    ["I sent money to the wrong person", "WRONG_TRANSFER"],
    ["I want to talk to a person", "TALK_TO_PERSON"],
    ["someone says they sent me money by mistake", "MISTAKE_CLAIM_CHECK"],
    ["hello aya", "UNKNOWN"],
  ] as const)("%s -> %s", (text, intent) => {
    expect(parse(text).intent).toBe(intent);
  });

  it("airtime defaults to the speaker's own number", () => {
    expect(parse("buy 10 cedis airtime").forSelf).toBe(true);
  });

  it.each([
    ["continue", "CONFIRM"],
    ["aane", "CONFIRM"],
    ["yi edzi", "CONFIRM"],
    ["toa so", "CONFIRM"],
    ["cancel", "CANCEL"],
    ["gyae", "CANCEL"],
    ["tɔ te", "CANCEL"],
    ["daabi", "CANCEL"],
    ["san ka bio", "REPEAT"],
    ["repeat", "REPEAT"],
  ] as const)("command %s -> %s", (text, intent) => {
    expect(parseUtterance(text, { expecting: "confirm", preferredLang: "tw" }).intent).toBe(intent);
  });

  it("hears pressure words", () => {
    expect(parse("send 900 to 0209998877 quickly the man on the phone said").pressureWords.length).toBeGreaterThan(0);
  });

  it("reads a spoken phone number", () => {
    expect(parse("send 20 cedis to 024 555 6631").phone?.value).toBe("0245556631");
    expect(parse("send 20 cedis to +233 24 555 6631").phone?.value).toBe("0245556631");
  });
});

describe("dialogue manager", () => {
  it("reads back a complete Twi transfer and waits for confirmation", () => {
    const r = talk("Me pɛ sɛ me sendi 150 ma Kwame Boateng");
    expect(state(r).phase).toBe("readback");
    expect(state(r).lang).toBe("tw");
    expect(r.say?.text).toContain("GH₵150.00");
    expect(r.say?.text).toContain("Kwame Boateng");
    expect(r.say?.text).toContain("66 31");
  });

  it("closes the microphone only after an explicit confirm", () => {
    const r = talk("send 150 to Kwame Boateng", "continue");
    expect(state(r).phase).toBe("confirmed");
    expect(r.effects).toContain("mic:close");
    expect(r.effects).toContain("navigate:confirmed");
    expect(toAppRequest(state(r).draft!)).toMatchObject({ flow: "transfer", amountRaw: "150" });
  });

  it("asks which Kwame when the name is ambiguous, then accepts last digits", () => {
    let r = talk("send 50 to Kwame");
    expect(state(r).phase).toBe("clarifying");
    expect(state(r).expecting).toBe("recipient_choice");
    r = step(state(r), { type: "utterance", text: "the one ending 9012" }, ctx);
    expect(state(r).phase).toBe("readback");
    expect(state(r).draft?.recipient?.value.recipient.name).toBe("Kwame Asante");
  });

  it("asks for a missing amount and accepts a one-word answer", () => {
    let r = talk("send money to Ricky Martin");
    expect(state(r).expecting).toBe("amount");
    r = step(state(r), { type: "utterance", text: "aduonum" }, ctx);
    expect(state(r).draft?.amount?.value).toBe(50);
  });

  it("never guesses an uncertain amount", () => {
    let r = talk("send one fifty to Ricky Martin");
    expect(state(r).phase).toBe("clarifying");
    expect(state(r).expecting).toBe("amount");
    r = step(state(r), { type: "utterance", text: "one fifty" }, ctx);
    expect(state(r).phase).toBe("readback");
  });

  it("resolves nicknames", () => {
    const r = talk("sendi 100 ma Maame");
    expect(state(r).draft?.recipient?.value.recipient.name).toBe("Ama Serwaa");
  });

  it("asks for a number when the name is not a contact", () => {
    let r = talk("send 30 to Nana Yaa");
    expect(state(r).expecting).toBe("recipient");
    r = step(state(r), { type: "utterance", text: "020 999 8877" }, ctx);
    expect(state(r).draft?.recipient?.value.registeredName).toBe("Yaw Asante");
  });

  it("cancel works in every state", () => {
    expect(state(talk("send money", "cancel")).phase).toBe("cancelled");
    expect(state(talk("send 50 to Ricky Martin", "gyae")).phase).toBe("cancelled");
  });

  it("treats 'no, 80' during read-back as a correction", () => {
    const r = talk("send 50 to Ricky Martin", "no, 80");
    expect(state(r).phase).toBe("readback");
    expect(state(r).draft?.amount?.value).toBe(80);
  });

  it("adds a cooling-off pause under scam pressure, then still lets the user decide", () => {
    let r = talk("hurry, the man on the phone said send 900 to 020 999 8877");
    expect(state(r).phase).toBe("cooling_off");
    expect(state(r).risk?.level).toBe("high");
    r = step(state(r), { type: "utterance", text: "continue" }, ctx);
    expect(state(r).phase).toBe("confirmed");
  });

  it("calm users with saved contacts get no extra friction", () => {
    const r = talk("send 20 to Ricky Martin");
    expect(state(r).risk?.level).toBe("low");
    expect(state(r).phase).toBe("readback");
  });

  it("warns about a first transfer to a new number", () => {
    const r = talk("send 30 to 020 999 8877");
    expect(state(r).risk?.reasons).toContain("new_recipient");
    expect(r.say?.text).toMatch(/first time/i);
  });

  it("hands support requests to the support flow", () => {
    const r = talk("someone tricked me");
    expect(state(r).phase).toBe("handoff");
    expect(state(r).handoff?.intent).toBe("REPORT_SCAM");
    expect(r.effects).toContain("navigate:handoff");
  });

  it("offers tap mode after three misunderstandings", () => {
    const r = talk("blah", "hmm blah", "something odd");
    expect(r.effects).toContain("offer_tap");
  });

  it("replies in Ewe when spoken to in Ewe", () => {
    const r = talk("Medi be maɖo ga 100 na Kojo Mensah");
    expect(state(r).lang).toBe("ee");
    expect(r.say?.text).toContain("Èle");
  });

  it("balance needs no slots", () => {
    const r = talk("check my balance", "yes");
    expect(state(r).phase).toBe("confirmed");
    expect(toAppRequest(state(r).draft!).flow).toBe("balance");
  });

  it("airtime for self", () => {
    const r = talk("buy 10 cedis airtime", "continue");
    expect(toAppRequest(state(r).draft!)).toMatchObject({ flow: "airtime", topUpKind: "airtime", amountRaw: "10", recipient: null });
  });
});
