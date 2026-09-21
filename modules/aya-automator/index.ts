// Re-export the native module. On web, it resolves to AyaAutomatorModule.web.ts
// and on native platforms to AyaAutomatorModule.ts
export { default, useAutomatorEvents } from "./src/AyaAutomatorModule";
export type { UssdSubscription } from "./src/AyaAutomatorModule";
export * from "./src/AyaAutomator.types";