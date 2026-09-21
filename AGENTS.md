# Aya

Aya is an accessibility-first, local-language financial voice agent for Ghana. It lets visually
impaired, low-literacy, and elderly mobile money users complete transactions (send money, check
balance, buy airtime) by speaking naturally in Akan (Twi) or Ewe — including code-switched
Akan/Ewe/English — instead of navigating USSD menus or English-only text prompts.

Non-negotiable product principle: **voice controls the experience, private device authentication
controls the money.** Every transaction gets a spoken read-back and explicit confirm/cancel before
it executes; the microphone closes before any PIN/biometric handoff, and PINs/OTPs are never
spoken, captured, or transmitted. Keep this invariant in mind for any change touching a
transaction flow, confirmation step, or auth handoff. Full product context: [README.md](README.md).

This repo (`mobile/`) is the Expo/React Native app for the hackathon deliverable. The money path
is REAL: auth is OTP/JWT against `../ayaserver` (6-digit codes, session kept in expo-secure-store),
and transfers/balance/airtime drive a real MTN MoMo USSD session through the local native module
`modules/aya-automator` (an Android AccessibilityService that is a generic mission executor). All
MTN menu intelligence lives in `src/lib/ussdMissions.ts`, so flow tuning is a JS reload — never a
native rebuild. Nothing on the money path is simulated on device.

Build model: no local Android build. Use EAS cloud builds — `eas build --platform android
--profile development --apk` — and sideload the dev client. The AccessibilityService is
`com.ayavoice.mobile.automation.AyaAutomationService`.

# Engineering constraints

- `npx tsc --noEmit` must stay clean after every change.
- `npx expo install <pkg>` for any new Expo-native dependency (Expo SDK 57).
- PINs/OTPs: never logged, never transmitted, never spoken. Auto-PIN mode stores the MoMo PIN in
  expo-secure-store and hands it in-process to the USSD dialog only.
- Aya Drive (the accessibility service) and the CALL_PHONE runtime permission are preflighted in
  `src/screens/ProcessingScreen.tsx` before any mission starts.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.
