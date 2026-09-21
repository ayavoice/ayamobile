package com.ayavoice.mobile.automation

import org.json.JSONObject

/**
 * Declarative USSD mission supplied by the JS layer. The native side is a dumb
 * executor; all MTN menu intelligence (labels, order, PIN policy) lives in the
 * mission, so flow tuning is a JS reload, not a native rebuild.
 */
data class UssdMissionStep(
  val action: String, // "click" | "input" | "await-dialog" | "await-user-input" | "done"
  val match: String?,
  val value: String?,
  val label: String,
  val fallback: String?,
)

data class UssdMission(
  val id: String,
  val shortCode: String,
  val steps: List<UssdMissionStep>,
  val pinMode: String, // "manual" | "auto"
  val pin: String?, // auto mode only; never logged, never transmitted
  val timeoutMs: Long,
)

object UssdMissionParser {
  fun fromJson(raw: String): UssdMission {
    val o = JSONObject(raw)
    val stepsArr = o.optJSONArray("steps")
    val steps = mutableListOf<UssdMissionStep>()
    if (stepsArr != null) {
      for (i in 0 until stepsArr.length()) {
        val s = stepsArr.getJSONObject(i)
        steps += UssdMissionStep(
          action = s.optString("action", "click"),
          match = s.optStringOrNull("match"),
          value = s.optStringOrNull("value"),
          label = s.optString("label", s.optString("action", "step")),
          fallback = s.optStringOrNull("fallback"),
        )
      }
    }
    return UssdMission(
      id = o.optString("id", "unknown"),
      shortCode = o.optString("shortCode", "170"),
      steps = steps,
      pinMode = o.optString("pinMode", "manual"),
      pin = if (o.has("pin")) o.optString("pin") else null,
      timeoutMs = o.optLong("timeoutMs", 180_000L),
    )
  }

  private fun JSONObject.optStringOrNull(key: String): String? {
    if (!has(key) || isNull(key)) return null
    val v = optString(key)
    return if (v.isEmpty()) null else v
  }
}