import { registerWebModule, NativeModule } from "expo";
import type { UssdEvent, UssdMission, UssdState } from "./AyaAutomator.types";

/**
 * Web has no accessibility service: every capability is a safe no-op that
 * resolves to the "unsupported" state. `automator.ts` (in the app) uses this
 * to route patiently back to a friendly message instead of crashing.
 */
class AyaAutomatorModule extends NativeModule<{ onEvent: (event: UssdEvent) => void }> {
  async isEnabled(): Promise<boolean> {
    return false;
  }
  openAccessibilitySettings(): void {}
  async requestCallPermission(): Promise<boolean> {
    return false;
  }
  async startMission(_missionJson: string): Promise<boolean> {
    return false;
  }
  async stop(): Promise<void> {}
  async currentState(): Promise<UssdState | null> {
    return null;
  }
}

const Automator = registerWebModule(AyaAutomatorModule, "AyaAutomator");

export default Automator;