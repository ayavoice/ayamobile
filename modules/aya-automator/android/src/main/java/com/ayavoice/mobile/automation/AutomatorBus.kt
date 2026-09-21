package com.ayavoice.mobile.automation

/**
 * Process-wide rendezvous between the Expo module (JS bridge) and the
 * AccessibilityService. Both live in the same app process, so a plain object
 * reference is a safe, low-latency conduit for mission hand-off and events.
 */
object AutomatorBus {
  @Volatile var module: AyaAutomatorModule? = null
  @Volatile var service: AyaAutomationService? = null

  fun emit(event: Map<String, Any?>) {
    module?.sendEvent("onEvent", event)
  }

  fun emitError(code: String, message: String) {
    emit(mapOf("type" to "error", "code" to code, "message" to message))
  }
}