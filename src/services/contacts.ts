import { Platform } from "react-native";
import * as Contacts from "expo-contacts/legacy";

/**
 * On-device contact lookup. Contacts never leave the phone: only the resolved
 * recipient name + number are carried into the transaction draft.
 */
export type AyaContact = {
  id: string;
  name: string;
  /** Raw number from the address book, kept for display. */
  phone: string;
  /** E.164 number (+233…) sent to the server as `destination`. */
  e164: string;
};

let cache: AyaContact[] | null = null;

/** Ghana-friendly normalization: `+233`, `0`, or bare `24…` all → `+23324…`. */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  let d = digits.startsWith("233") ? digits.slice(3) : digits;
  if (d.startsWith("0")) d = d.slice(1);
  if (!/^\d{9}$/.test(d)) return null;
  return `+233${d}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export async function requestContactsPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const res = await Contacts.requestPermissionsAsync();
  console.log("[contacts] permission:", res.granted ? "granted" : res.status);
  return res.granted;
}

export async function loadContacts(force = false): Promise<AyaContact[]> {
  if (Platform.OS === "web") return [];
  if (cache && !force) return cache;
  console.log("[contacts] loading contacts from device…");
  const res = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    pageSize: 0,
    sort: Contacts.SortTypes.FirstName,
  });
  const rows: AyaContact[] = [];
  for (const c of res.data) {
    const name = c.name?.trim();
    const numbers = c.phoneNumbers ?? [];
    if (!name || numbers.length === 0) continue;
    const primary = numbers.find((p) => p.isPrimary) ?? numbers[0];
    const e164 = toE164(primary.number ?? primary.digits);
    if (!e164) continue;
    rows.push({
      id: c.id ?? `${name}-${primary.number ?? ""}`,
      name,
      phone: primary.number ?? primary.digits ?? e164,
      e164,
    });
  }
  cache = rows;
  console.log(`[contacts] loaded ${rows.length} contacts; cached`);
  return rows;
}

function normTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Jaro–Winkler name similarity (0..1). Tolerates the substitutions and
 * transpositions ASR produces (e.g. spoken "akusia" vs contact "Akosua"),
 * which plain substring or edit-distance checks miss.
 */
function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const window = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - window);
    const hi = Math.min(i + window + 1, b.length);
    for (let j = lo; j < hi; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  const m = matches;
  const jaro = (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(a.length, b.length, 4); i++) {
    if (a[i] !== b[i]) break;
    prefix++;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Fuzzy name matching tolerant of ASR WER (e.g. "akusia" vs contact "Akosua").
 * Jaro–Winkler over token pairs; exact name wins, otherwise the best-scoring
 * pair plus a bonus when every spoken token landed somewhere. Unique top score
 * resolves; ties keep the picker flow.
 */
function scoreName(contactName: string, query: string[]): number {
  const nameTokens = normTokens(contactName);
  if (nameTokens.length === 0 || query.length === 0) return 0;
  if (nameTokens.join(" ") === query.join(" ")) return 1000;

  let best = 0;
  const landed = new Array<boolean>(query.length).fill(false);
  for (const nt of nameTokens) {
    if (nt.length < 2) continue;
    for (let qi = 0; qi < query.length; qi++) {
      const qt = query[qi];
      if (qt.length < 2) continue;
      const jw = jaroWinkler(qt, nt);
      let s = 0;
      if (jw >= 0.85) s = 700 + Math.round(300 * ((jw - 0.85) / 0.15));
      else if (jw >= 0.75) s = 400 + Math.round(250 * ((jw - 0.75) / 0.1));
      else if (nt.startsWith(qt) || qt.startsWith(nt)) s = 350;
      if (s > 0) {
        landed[qi] = true;
        if (s > best) best = s;
      }
    }
  }
  if (landed.every(Boolean)) best += 80;
  return best;
}

export type ResolveResult = { contact: AyaContact | null; candidates: AyaContact[] };

/**
 * Resolve a spoken payee name against cached contacts. Returns a single
 * contact only when it is the unique best match; otherwise hands back the
 * tied/near matches so the caller can show a pickable list.
 */
export function resolvePayee(spoken: string, contacts: AyaContact[]): ResolveResult {
  const query = normTokens(spoken);
  if (query.length === 0) return { contact: null, candidates: [] };

  const scored = contacts
    .map((c) => ({ c, s: scoreName(c.name, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  if (scored.length === 0) return { contact: null, candidates: [] };

  const best = scored[0];
  const ties = scored.filter((x) => x.s === best.s);
  if (ties.length === 1 && best.s >= 100) return { contact: best.c, candidates: [] };

  console.log(`[contacts] "${spoken}" ambiguous; ${scored.length} candidate(s)`);
  return { contact: null, candidates: scored.slice(0, 8).map((x) => x.c) };
}