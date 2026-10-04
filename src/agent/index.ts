export { initialState, step, MONEY_CONFIDENCE, TAP_AFTER_MISSES } from "./dialogue";
export { parseUtterance } from "./nlu";
export { DEFAULT_NICKNAMES } from "./recipients";
export { line } from "./responses";
export type * from "./types";

import type { Recipient } from "../content/send";
import type { Draft } from "./types";

export type AppRequest = {
  flow: "transfer" | "balance" | "airtime";
  topUpKind: "airtime" | "data" | null;
  amountRaw: string | null;
  recipient: Recipient | null;
};

/** What the transaction screens need from a confirmed draft. */
export function toAppRequest(draft: Draft): AppRequest {
  const amountRaw = draft.amount ? String(draft.amount.value) : null;
  const recipient = draft.recipient?.value.recipient ?? null;
  switch (draft.intent) {
    case "TRANSFER_MONEY":
      return { flow: "transfer", topUpKind: null, amountRaw, recipient };
    case "CHECK_BALANCE":
      return { flow: "balance", topUpKind: null, amountRaw: null, recipient: null };
    case "BUY_AIRTIME":
    case "BUY_DATA":
      return {
        flow: "airtime",
        topUpKind: draft.intent === "BUY_DATA" ? "data" : "airtime",
        amountRaw,
        recipient: draft.forSelf ? null : recipient,
      };
  }
}
