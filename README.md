# Aya — Accessibility-First Local-Language Financial Action Agent

Aya is an on-device, accessibility-first voice agent that lets Ghanaians complete mobile money
transactions — sending money, checking balance, buying airtime — by speaking naturally in
**Akan (Twi)** or **Ewe**, without navigating USSD menus, shortcodes, or English-only text prompts.

## Who it's for

Visually impaired persons, low-literacy users, elderly citizens, and fintech users who face
barriers using visual menus, shortcodes, or English-centric interfaces for mobile money and
digital finance.

## The problem

Ghana reports 81% financial inclusion, yet 72% of persons with disabilities already hold mobile
money accounts they cannot independently use. The barrier isn't account access — it's interface
usability. Existing mobile money interfaces rely on visual menus, formal English prompts, and
rigid nested USSD flows that time out quickly and vary by carrier (MTN, Telecel, AT). Users who
think in Akan or Ewe, and who naturally code-switch between them and English, are forced to hand
their phone to a sighted or literate third party — or risk speaking their PIN aloud in public,
turning a usability gap into a security and privacy risk.

The core challenge isn't "add voice to mobile money." It's making voice useful **without turning
speech into a security vulnerability.**

## How Aya solves it

Aya abstracts USSD menus and carrier-specific interfaces into natural spoken dialogue:

1. **Speak naturally, in your own mix of languages.** "Me pɛ sɛ me sendi 150 ma Kwame" works as-is
   — Aya handles Akan/Ewe/English code-switching without asking the user to repeat themselves in
   "cleaner" language.
2. **On-device intent parsing.** A lightweight NLU model extracts the financial action
   (`TRANSFER_MONEY`, `CHECK_BALANCE`, `BUY_AIRTIME`), the target (recipient/biller), and
   parameters (amount, meter number, etc.) as structured intent — fast local keyword spotting
   handles system commands like "Continue," "Cancel," "Repeat."
3. **Spoken confirmation, every time.** Aya reads the transaction back before anything executes:
   *"You are about to send GH₵150 to Kwame Boateng, number ending 6631. Say continue or cancel."*
4. **Voice never touches money.** The instant a transaction is confirmed, the microphone closes
   and authorization hands off to the user's own device authentication (biometric or PIN via
   Android's BiometricPrompt, or a locally encrypted saved PIN). The PIN is never spoken, heard,
   or transmitted.
5. **Background execution.** An Android AccessibilityService reads the live UI tree of the
   existing mobile money app/USSD flow to drive it directly, bypassing aggressive USSD session
   timeouts without requiring a new backend integration.

Core principles: **voice controls the experience, private device authentication controls the
money, and every transaction is reviewable and cancellable before it executes.**

## Current status

This repo is the hackathon deliverable: a cross-platform (Expo/React Native) mobile app
implementing the accessibility-first UI shell and the three flows — **transfer, balance inquiry,
and airtime top-up** — with spoken confirmation read-back and settings for voice, language, and
accessibility. Underneath, the money path is **real**:

- Auth is OTP/JWT against `ayavoice/ayaserver` (6-digit codes, session kept in `expo-secure-store`).
- Transfers/balance/airtime drive a real MTN MoMo USSD session through `modules/aya-automator`, a
  native Android **AccessibilityService** that reads the live UI tree and executes the flow. All MTN
  menu intelligence lives in `src/lib/ussdMissions.ts`, so flow tuning is a JS reload — never a
  native rebuild. Nothing on the money path is simulated on the device.
- The `@aya/shared` contracts are **vendored** into this repo (`packages/shared`) so the app
  builds standalone; keep it in sync with `ayavoice/ayaserver`.

See [AGENTS.md](AGENTS.md) for engineering notes and constraints on the current implementation.

## Tech stack

- [Expo](https://expo.dev) / React Native (`~57`), TypeScript
- `react-native-safe-area-context`, `react-native-reanimated`, `react-native-svg`
- `modules/aya-automator` — Kotlin module exposing the USSD AccessibilityService
  (`com.ayavoice.mobile.automation.AyaAutomationService`)

## Architecture

```
ayamobile ── OTP/JWT ──▶ ayavoice/ayaserver ── /v1/transcribe,/v1/speak ──▶ ayavoice/ayaai
   │                      Fastify + Neon/Drizzle                        Python FastAPI
   └─ modules/aya-automator (AccessibilityService drives live MTN MoMo USSD)
```

## Getting started

Prerequisites: Node.js 20+, Expo Go **or** a dev build (to exercise the USSD automator you need a
dev client — `eas build --platform android --profile development --apk`, sideloaded).

```bash
npm install
npm run start        # or: npm run android / npm run ios / npm run web
```

The app auto-detects the backend host (`src/services/api.ts`): `EXPO_PUBLIC_API_URL` env override
> the Expo dev-server host on your LAN (`http://<pc-ip>:4000`) > emulator loopback. To target a
shared server explicitly, create a local `.env` (gitignored):

```
EXPO_PUBLIC_API_URL=http://192.168.1.50:4000
```

Expo 57 has changed significantly from earlier versions — see [AGENTS.md](AGENTS.md) before writing
code against it.

## Related repositories

| repo | role |
| --- | --- |
| `ayavoice/ayaserver` | Fastify API: auth, wallet ledger, voice proxy |
| `ayavoice/ayaai` | Python ASR/TTS service (local CPU or Kaggle GPU) |

## Scale and impact

Because intent parsing and execution are decoupled, adding more Ghanaian languages (Ga, Dagbani,
Hausa, Nzema) only requires new speech/intent models, not a new pipeline. At scale, Aya targets an
independent financial control layer for the 3M+ Ghanaians living with disabilities or low digital
literacy — reducing transactions that require third-party assistance, PIN exposure incidents, and
misdirected transfers caused by USSD parsing errors.
