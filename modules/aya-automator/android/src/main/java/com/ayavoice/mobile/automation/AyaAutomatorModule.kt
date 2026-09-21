package com.ayavoice.mobile.automation

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AyaAutomatorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AyaAutomator")
    Events("onEvent")

    AutomatorBus.module = this@AyaAutomatorModule

    Function("isEnabled") {
      isServiceEnabled()
    }

    Function("openAccessibilitySettings") {
      openAccessibilitySettings()
    }

    AsyncFunction("startMission") { missionJson: String ->
      val mission = UssdMissionParser.fromJson(missionJson)
      val svc = AutomatorBus.service
      if (svc == null) {
        false
      } else {
        svc.startMission(mission)
        true
      }
    }

    AsyncFunction("stop") {
      AutomatorBus.service?.cancelMission()
    }

    AsyncFunction("currentState") {
      AutomatorBus.service?.currentState()
    }
  }

  private fun isServiceEnabled(): Boolean {
    val ctx = appContext.reactContext ?: return false
    val expected = ComponentName(ctx, AyaAutomationService::class.java).flattenToString()
    val enabledSetting =
      Settings.Secure.getString(ctx.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        ?: return false
    return enabledSetting
      .split(':')
      .any { it.equals(expected, ignoreCase = true) }
  }

  private fun openAccessibilitySettings() {
    val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
    val activity = appContext.currentActivity
    if (activity != null) {
      activity.startActivity(intent)
    } else {
      appContext.reactContext?.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }
}