package com.ayavoice.mobile.automation

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.graphics.Rect
import android.net.Uri
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Drives a real MTN MoMo / Telecel / AT USSD session on behalf of the app:
 * dials the short code, reads the USSD dialog window via accessibility events,
 * taps/types by label, and streams progress + the terminal screen back to JS.
 *
 * The engine is intentionally generic: a USSD session is just an ordered list
 * of "click this label" / "type this value" steps supplied by the app layer.
 *
 * Timing policy (fast + fail-fast, no blind sleeps):
 *  - no fixed delay after actions; the engine polls at [DIAL_POLL_MS] and
 *    advances as soon as a new screen has been stable across two samples;
 *  - a strict step (menu selection / input) aborts with "no-change" if the
 *    screen does not advance within [STEP_CHANGE_MS] — we never crawl on a
 *    stale screen and never blind-tap the middle of a text-block menu;
 *  - button clicks (dismiss/OK) and the manual-PIN wait are lenient.
 *
 * Security invariants (enforced here, never relaxed):
 *  - the MoMo PIN is only ever written into the USSD dialog's edit field on the
 *    device, never logged, never emitted in events, never sent over the network;
 *    editable field text is excluded from every screen capture for the same reason;
 *  - no transaction-shaping text (recipient, amount, PIN) is ever logged at debug
 *    or info level. Only numbered *menu* screens (no editable field) are logged,
 *    so the MTN/Telecel/AT digit maps can be tuned from the device.
 */
class AyaAutomationService : AccessibilityService() {

  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
  @Volatile private var cancelled = false
  private var missionJob: Job? = null
  private var lastState: Map<String, Any?>? = null

  private data class Snapshot(val text: String) {
    val signature: String = text.replace(Regex("\\s+"), " ").trim()
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    AutomatorBus.service = this
    lastState = null
    Log.i(Companion.TAG, "service connected; session state = closed")
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    // Polling-driven engine; events only keep the watchdog awake. Nothing to do here.
  }

  override fun onInterrupt() {
    Log.w(Companion.TAG, "accessibility session interrupted")
  }

  override fun onUnbind(intent: Intent?): Boolean {
    teardown()
    return super.onUnbind(intent)
  }

  override fun onDestroy() {
    teardown()
    scope.cancel()
    super.onDestroy()
  }

  private fun teardown() {
    cancelled = true
    missionJob?.cancel()
    missionJob = null
    AutomatorBus.service = null
    Log.i(Companion.TAG, "service torn down")
  }

  fun startMission(mission: UssdMission) {
    cancelled = false
    missionJob?.cancel()
    missionJob = scope.launch {
      try {
        runMission(mission)
      } catch (t: Throwable) {
        // Never die silently: surface unexpected failures so the app can recover.
        if (cancelled) return@launch
        Log.w(Companion.TAG, "mission ${mission.id} crashed", t)
        AutomatorBus.emitError("unknown", "Aya hit an unexpected error during the USSD session.")
      }
    }
  }

  fun cancelMission() {
    cancelled = true
    missionJob?.cancel()
    missionJob = null
    emitCompleteResult(
      sessionId = lastState?.get("id") as? String ?: "unknown",
      status = "cancelled",
      message = "Cancelled by the user.",
      balanceMinor = null,
      stepsTaken = emptyList(),
    )
  }

  fun currentState(): Map<String, Any?>? = lastState

  // -------------------------------------------------------------------------
  // Session engine
  // -------------------------------------------------------------------------

  private suspend fun runMission(m: UssdMission) {
    cancelled = false
    val stepsTaken = mutableListOf<String>()
    val deadline = SystemClock.elapsedRealtime() + m.timeoutMs
    var lastSnap: Snapshot? = null

    if (m.pin != null) Log.w(Companion.TAG, "mission ${m.id} auto-pin mode active")
    else Log.i(Companion.TAG, "mission ${m.id} pinMode=${m.pinMode}")

    emitState(m.id, "dialed", "Calling *${m.shortCode}#", -1)
    dial(m.shortCode)

    val first = waitForFirstDialog(m, stepsTaken)
    if (cancelled) return
    if (first == null) {
      AutomatorBus.emitError(
        "no-dialog",
        "The *${m.shortCode}# dialog did not appear. Dial *${m.shortCode}# yourself and Aya will take over.",
      )
      return
    }
    lastSnap = first
    logMenuIfPresent(first)
    // The first screen is never a success: only hard failures abort here (e.g. a
    // dead menu that already reports "Invalid selection"). Success words such as
    // "your balance" can appear in the first screen and must not end a mission.
    checkTerminal(m, first, allowSuccess = false)?.let { emitComplete(it); return }
    emitState(m.id, "menu", first.text, 0)

    var stepIndex = 0
    for (step in m.steps) {
      if (cancelled) return

      // Refresh the reference snapshot so "before" is always the live screen.
      var snap = dialogSnapshot()
      if (snap == null) {
        delay(300)
        snap = dialogSnapshot()
      }
      if (snap != null) {
        lastSnap = snap
        checkTerminal(m, snap, allowSuccess = stepIndex >= m.steps.lastIndex)
          ?.let { emitComplete(it); return }
      }
      val before = lastSnap?.signature

      when (step.action) {
        "await-dialog" -> {
          emitState(m.id, "awaiting-input", step.label, stepIndex)
          stepsTaken += step.label
          emitStep(step.label, stepIndex)
          waitForSettledChange(before, AWAIT_CHANGE_MS, deadline)
            ?.takeIf { it.signature != before }
            ?.let { lastSnap = it }
          logMenuIfPresent(lastSnap)
        }
        "click" -> {
          emitState(m.id, "menu", step.label, stepIndex)
          performClickOrType(step)
          stepsTaken += step.label
          emitStep(step.label, stepIndex)
          val strict = hasLeadingDigit(step.fallback)
          val changed = waitForSettledChange(before, STEP_CHANGE_MS, deadline)
          if (!resolveChange(changed, before, step.label, strict)) return
          if (changed != null) lastSnap = changed
          logMenuIfPresent(lastSnap)
        }
        "input" -> {
          emitState(m.id, "awaiting-input", step.label, stepIndex)
          setTextAndSubmit(step.value.orEmpty())
          stepsTaken += step.label
          emitStep(step.label, stepIndex)
          val changed = waitForSettledChange(before, STEP_CHANGE_MS, deadline)
          if (!resolveChange(changed, before, step.label, strict = true)) return
          if (changed != null) lastSnap = changed
          logMenuIfPresent(lastSnap)
        }
        "await-user-input" -> {
          // Manual PIN: hand the screen back to the user, then wait for the
          // post-PIN result screen (PIN prompt, then a *different* screen that
          // follows it — the balance/authorization/processing reply).
          emit(mapOf("type" to "pin-required"))
          emitState(m.id, "awaiting-input", step.label, stepIndex)
          stepsTaken += step.label
          waitForPinResult(before, deadline)?.let { lastSnap = it }
          logMenuIfPresent(lastSnap)
        }
        "done" -> {
          // fall through to final capture
        }
      }
      stepIndex++
    }

    if (cancelled) return
    val finalSnap = dialogSnapshot() ?: lastSnap
    val safeSnap = checkTerminal(m, finalSnap, allowSuccess = true)
    if (safeSnap != null) {
      emitComplete(safeSnap)
    } else {
      emitCompleteResult(
        sessionId = m.id,
        status = "failed",
        message = finalSnap?.text?.takeIf { it.isNotBlank() } ?: "Aya could not confirm the outcome.",
        balanceMinor = parseBalanceMinor(finalSnap?.text),
        stepsTaken = stepsTaken,
      )
    }
  }

  private suspend fun waitForFirstDialog(m: UssdMission, stepsTaken: MutableList<String>): Snapshot? {
    val firstDeadline = SystemClock.elapsedRealtime() + FIRST_DIALOG_MS
    var redials = 0
    while (!cancelled) {
      val snap = dialogSnapshot()
      if (snap != null) return snap
      if (SystemClock.elapsedRealtime() > firstDeadline) {
        if (redials < 1) {
          redials++
          stepsTaken += "Re-dialing"
          emitState(m.id, "awaiting-input", "Re-dialing *${m.shortCode}#", -1)
          dial(m.shortCode)
          continue
        }
        return null
      }
      delay(DIAL_POLL_MS)
    }
    return null
  }

  /**
   * Polls until the visible screen becomes a stable signature *different* from
   * [previousSignature] (seen twice across two consecutive samples, so
   * transitional/loading overlays never count as progress). Returns the latest
   * screen on timeout (possibly unchanged) so callers can decide strict/lenient.
   */
  private suspend fun waitForSettledChange(
    previousSignature: String?,
    timeoutMs: Long,
    deadline: Long,
  ): Snapshot? {
    val until = SystemClock.elapsedRealtime() + timeoutMs
    var candidate: Snapshot? = null
    while (!cancelled) {
      if (SystemClock.elapsedRealtime() >= until || SystemClock.elapsedRealtime() >= deadline) break
      val snap = dialogSnapshot()
      if (snap != null && (previousSignature == null || snap.signature != previousSignature)) {
        if (candidate == null || candidate.signature != snap.signature) {
          candidate = snap
        } else {
          return snap
        }
      } else {
        candidate = null
      }
      delay(DIAL_POLL_MS)
    }
    return candidate
  }

  /**
   * Manual-PIN wait: first screens to settle = the PIN prompt; then wait until a
   * *different* screen follows it (the post-PIN reply). The user types on the OS
   * USSD keyboard, never through Aya.
   */
  private suspend fun waitForPinResult(previousSignature: String?, deadline: Long): Snapshot? {
    val until = SystemClock.elapsedRealtime() + PIN_WAIT_MS
    var pinPrompt: String? = null
    var candidate: Snapshot? = null
    while (!cancelled) {
      if (SystemClock.elapsedRealtime() >= until || SystemClock.elapsedRealtime() >= deadline) return candidate
      val snap = dialogSnapshot()
      if (snap != null) {
        val sig = snap.signature
        if (pinPrompt == null) {
          if (previousSignature == null || sig != previousSignature) pinPrompt = sig
        } else if (sig != pinPrompt && sig != previousSignature) {
          if (candidate == null || candidate.signature != sig) candidate = snap
          else return snap
        } else {
          candidate = null
        }
      } else {
        candidate = null
      }
      delay(DIAL_POLL_MS)
    }
    return null
  }

  private fun resolveChange(changed: Snapshot?, before: String?, label: String, strict: Boolean): Boolean {
    if (strict && (changed == null)) {
      AutomatorBus.emitError(
        "no-change",
        "The USSD screen did not advance after \"$label\". Dial *170# and try again.",
      )
      return false
    }
    return true
  }

  private fun hasLeadingDigit(s: String?): Boolean = s?.firstOrNull()?.isDigit() == true

  private fun checkTerminal(m: UssdMission, snap: Snapshot?, allowSuccess: Boolean): Map<String, Any?>? {
    if (snap == null) return null
    val t = snap.text.lowercase()
    val failed =
      listOf("insufficient", "failed", "unsuccessful", "not been completed", "declined", "invalid")
    val success =
      listOf(
        "successfully", "successful", "completed", "confirmed",
        "your balance", "credited", "received",
        "processe", // "Your request is being processed" / "Request processing"
        "submitted", // "Transaction submitted."
      )
    val isFailed = failed.any { t.contains(it) }
    val isSuccess =
      success.any { t.contains(it) } || (t.contains("balance") && (t.contains("ghs") || t.contains("gh\u00a2")))
    // Failure words abort anywhere (the session is over); success words only
    // count near/at the mission's final step so a first-screen keyword can't
    // fake a "completed" and end the flow early.
    if (isFailed) {
      return resultMap(
        sessionId = m.id,
        status = "failed",
        message = snap.text,
        balanceMinor = null,
        stepsTaken = null,
      )
    }
    if (!allowSuccess || !isSuccess) return null
    return resultMap(
      sessionId = m.id,
      status = "completed",
      message = snap.text,
      balanceMinor = parseBalanceMinor(snap.text),
      stepsTaken = null,
    )
  }

  private fun emitComplete(r: Map<String, Any?>) {
    emit(r)
  }

  private fun emitCompleteResult(
    sessionId: String,
    status: String,
    message: String,
    balanceMinor: Long?,
    stepsTaken: List<String>,
  ) {
    emit(resultMap(sessionId, status, message, balanceMinor, stepsTaken))
  }

  private fun resultMap(
    sessionId: String,
    status: String,
    message: String,
    balanceMinor: Long?,
    stepsTaken: List<String>?,
  ): Map<String, Any?> = mapOf(
    "type" to "complete",
    "result" to mapOf(
      "sessionId" to sessionId,
      "status" to status,
      "message" to message,
      "reference" to null,
      "balanceMinor" to balanceMinor,
      "stepsTaken" to (stepsTaken ?: emptyList()),
      "at" to System.currentTimeMillis(),
    ),
  )

  private fun emit(map: Map<String, Any?>) {
    AutomatorBus.emit(map)
  }

  private fun emitState(id: String, status: String, label: String, stepIndex: Int) {
    val state = mapOf(
      "id" to id,
      "status" to status,
      "label" to label,
      "screenText" to null,
      "stepIndex" to stepIndex,
    )
    lastState = state
    emit(mapOf("type" to "state", "state" to state))
  }

  private fun emitStep(label: String, stepIndex: Int) {
    emit(mapOf("type" to "step", "label" to label, "stepIndex" to stepIndex))
  }

  // -------------------------------------------------------------------------
  // Actions against the dialog window
  // -------------------------------------------------------------------------

  private fun dial(shortCode: String) {
    val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:*$shortCode%23"))
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      startActivity(intent)
      Log.i(Companion.TAG, "dispatched ACTION_CALL for *$shortCode#")
    } catch (se: SecurityException) {
      Log.w(Companion.TAG, "CALL_PHONE permission missing")
      AutomatorBus.emitError("no-call-permission", "Aya needs call permission to dial USSD.")
      cancelled = true
    } catch (anf: android.content.ActivityNotFoundException) {
      Log.w(Companion.TAG, "no dialer available")
      AutomatorBus.emitError("dial-blocked", "No dialer available — dial *$shortCode# yourself.")
      cancelled = true
    }
  }

  private fun dialogSnapshot(): Snapshot? {
    val text = readScreenText() ?: return null
    return Snapshot(text)
  }

  private fun readScreenText(): String? {
    val root = dialogRoot() ?: return null
    try {
      return textOf(root)
    } finally {
      root.recycle()
    }
  }

  private fun textOf(root: AccessibilityNodeInfo): String {
    val lines = LinkedHashSet<String>()
    collectText(root, lines, 0)
    return lines.filter { it.isNotBlank() }.joinToString("\n")
  }

  private fun dialogRoot(): AccessibilityNodeInfo? {
    rootInActiveWindow?.let { r ->
      if (looksLikeDialog(r)) return r
      r.recycle()
    }
    for (w in windows) {
      val r = w.root
      if (r != null && looksLikeDialog(r)) return r
    }
    return null
  }

  private fun looksLikeDialog(root: AccessibilityNodeInfo): Boolean {
    val pkg = root.packageName?.toString() ?: ""
    if (pkg.contains("phone", ignoreCase = true) || pkg.contains("dialer", ignoreCase = true)) return true
    return hasEditable(root)
  }

  private fun hasEditable(node: AccessibilityNodeInfo): Boolean {
    val stack = ArrayDeque<AccessibilityNodeInfo>()
    stack.add(node)
    var guard = 0
    while (stack.isNotEmpty() && guard++ < 200) {
      val n = stack.removeLast()
      if (n.isEditable) return true
      val cls = n.className?.toString()?.lowercase() ?: ""
      if (cls.contains("edittext")) return true
      for (i in 0 until n.childCount) n.getChild(i)?.let { stack.add(it) }
    }
    return false
  }

  private fun collectText(node: AccessibilityNodeInfo, out: MutableSet<String>, depth: Int) {
    if (depth > 12 || out.size >= 120) return
    // Never capture typed input (PIN/recipient/amount): editable fields are
    // excluded from every screen snapshot, in whole or in part.
    if (node.isEditable) return
    if (node.isVisibleToUser) {
      val text = node.text?.toString()?.trim()
      if (!text.isNullOrBlank()) out.add(collapseWhitespace(text))
      val desc = node.contentDescription?.toString()?.trim()
      if (!desc.isNullOrBlank() && node.text == null) out.add(collapseWhitespace(desc))
    }
    for (i in 0 until node.childCount) {
      node.getChild(i)?.let { collectText(it, out, depth + 1) }
    }
  }

  private fun performClickOrType(step: UssdMissionStep) {
    val roots = listOf(step.match, step.fallback).filterNotNull().map { it.trim() }.filter { it.isNotEmpty() }
    if (roots.isEmpty()) return
    val root = dialogRoot() ?: return
    try {
      val fullText = textOf(root).lowercase()
      // Try each candidate matcher in order; fall back to typing the leading
      // digit when the menu is a single text block (no clickable node).
      for (candidate in roots) {
        val matchLower = candidate.lowercase()
        val node = findNode(root, matchLower)
        if (node != null && isClickableTarget(node, fullText) && performClick(node)) return

        val leadingDigit = candidate.first().digitToIntOrNull()
        val edit = findEditable(root)
        if (leadingDigit != null && edit != null) {
          setTextTo(edit, leadingDigit.toString())
          if (clickSubmit(root, fullText)) return
        }
      }
    } finally {
      root.recycle()
    }
  }

  private fun setTextAndSubmit(value: String) {
    if (value.isEmpty()) return
    val root = dialogRoot() ?: return
    try {
      val edit = findEditable(root)
      if (edit == null) {
        Log.w(Companion.TAG, "no editable input found")
        return
      }
      if (!setTextTo(edit, value)) {
        Log.w(Companion.TAG, "setText failed — user may need to type manually")
      }
      clickSubmit(root, textOf(root).lowercase())
    } finally {
      root.recycle()
    }
  }

  private fun findNode(root: AccessibilityNodeInfo, queryLower: String): AccessibilityNodeInfo? {
    var best: AccessibilityNodeInfo? = null
    var bestScore = Int.MIN_VALUE
    val stack = ArrayDeque<AccessibilityNodeInfo>()
    stack.add(root)
    var guard = 0
    while (stack.isNotEmpty() && guard++ < 500) {
      val n = stack.removeLast()
      val label = nodeLabel(n)
      if (label.isNotEmpty()) {
        val l = label.lowercase()
        val score = when {
          l == queryLower -> 1000
          l.startsWith(queryLower) -> 700
          l.contains(queryLower) -> 500
          else -> -1
        }
        if (score > bestScore) {
          best = n
          bestScore = score
        }
      }
      for (i in n.childCount - 1 downTo 0) n.getChild(i)?.let { stack.add(it) }
    }
    return best
  }

  private fun nodeLabel(node: AccessibilityNodeInfo): String {
    val text = node.text?.toString()?.trim()
    if (!text.isNullOrBlank()) return collapseWhitespace(text)
    return collapseWhitespace(node.contentDescription?.toString()?.trim().orEmpty())
  }

  /**
   * A node is only a valid click target if its label is a short, real button /
   * option — never a node whose label is (part of) the whole dialog text. The
   * system USSD menu is one giant TextView; clicking it taps the *center* of the
   * menu and picks a random option. Parking-lot guard for that bug.
   */
  private fun isClickableTarget(node: AccessibilityNodeInfo, fullDialogText: String): Boolean {
    val label = nodeLabel(node).lowercase()
    if (label.isEmpty()) return false
    if (label == fullDialogText) return false
    if (label.length > MENU_BLOB_MAX) return false
    return true
  }

  private fun findEditable(root: AccessibilityNodeInfo): AccessibilityNodeInfo? {
    val stack = ArrayDeque<AccessibilityNodeInfo>()
    stack.add(root)
    var guard = 0
    while (stack.isNotEmpty() && guard++ < 500) {
      val n = stack.removeLast()
      if (n.isEditable) return n
      val cls = n.className?.toString()?.lowercase() ?: ""
      if (cls.contains("edittext")) return n
      for (i in n.childCount - 1 downTo 0) n.getChild(i)?.let { stack.add(it) }
    }
    return null
  }

  private fun performClick(node: AccessibilityNodeInfo): Boolean {
    var n = node
    var hops = 0
    while (n != null && hops++ < 5) {
      if (n.isClickable) {
        val b = Rect()
        n.getBoundsInScreen(b)
        // A small clickable container (a menu row) is fine; a huge one (the
        // whole dialog) would blind-tap the middle — tap the leaf instead.
        if (!b.isEmpty && b.height() <= MAX_ROW_HEIGHT_PX) {
          return n.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        }
        return tapBounds(node)
      }
      n = n.parent
    }
    return tapBounds(node)
  }

  private fun setTextTo(node: AccessibilityNodeInfo, value: String): Boolean {
    if (!node.isEditable) return false
    val args = Bundle().apply {
      putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, value)
    }
    val ok = node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
    if (!ok) {
      node.performAction(AccessibilityNodeInfo.ACTION_FOCUS)
    }
    return ok
  }

  private fun clickSubmit(root: AccessibilityNodeInfo, fullText: String): Boolean {
    val candidates = listOf("send", "ok", "submit", "done", "yes", "confirm", "enter")
    for (c in candidates) {
      val node = findNode(root, c)
      if (node != null && isClickableTarget(node, fullText) && performClick(node)) return true
    }
    return false
  }

  private fun tapBounds(node: AccessibilityNodeInfo): Boolean {
    val bounds = Rect()
    node.getBoundsInScreen(bounds)
    if (bounds.isEmpty) return false
    return dispatchTap(bounds.centerX(), bounds.centerY())
  }

  private fun dispatchTap(x: Int, y: Int): Boolean {
    val path = Path().apply { moveTo(x.toFloat(), y.toFloat()) }
    val stroke = GestureDescription.StrokeDescription(path, 0L, 60L)
    val gesture = GestureDescription.Builder().addStroke(stroke).build()
    return dispatchGesture(gesture, null, null)
  }

  /**
   * Sanitized tuning aid: log only numbered *menu* screens that have no input
   * field (never PIN/amount/phone prompts). Text like "MENU 1| Transfer Money ..."
   * lets us correct the digit maps in ussdMissions.ts from a real device run.
   */
  private fun logMenuIfPresent(snap: Snapshot?) {
    if (snap == null) return
    if (!Regex("(^|\\n)\\s*\\d{1,2}\\.\\s").containsMatchIn(snap.text)) return
    val root = dialogRoot() ?: return
    try {
      if (hasEditable(root)) return
      Log.i(Companion.TAG, "MENU " + snap.text.replace('\n', ' '))
    } finally {
      root.recycle()
    }
  }

  private fun parseBalanceMinor(text: String?): Long? {
    if (text == null) return null
    val m = Regex("balance[^0-9]*\\s*(?:ghs|gh\\u00a2)?\\s*([0-9]+(?:\\.\\d{1,2})?)", RegexOption.IGNORE_CASE)
      .find(text.replace(",", ""))
      ?: return null
    val v = m.groupValues[1].toDoubleOrNull() ?: return null
    return (v * 100).toLong()
  }

  private fun collapseWhitespace(s: String): String = s.replace(Regex("\\s+"), " ").trim()

  companion object {
    private const val TAG = "AyaAutomator"
    private const val DIAL_POLL_MS = 200L
    private const val FIRST_DIALOG_MS = 8_000L
    private const val STEP_CHANGE_MS = 8_000L
    private const val AWAIT_CHANGE_MS = 10_000L
    private const val PIN_WAIT_MS = 180_000L
    private const val MENU_BLOB_MAX = 40
    private const val MAX_ROW_HEIGHT_PX = 240
  }
}