import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText, Button, Card, Icon, IconWell, Screen, ScreenHeader } from "../components/ui";
import { STATUS_LABEL, categoryLabel, spokenReference } from "../content/support";
import { useAppPrefs } from "../context/AppPrefs";
import { DECORATIVE_A11Y } from "../lib/currency";
import { colors, radii, spacing } from "../theme";

type Props = { onBack: () => void; onGetHelp: () => void };

const FAQS = [
  {
    q: "How do I send money?",
    a: "Tap Talk and say who you want to send to and how much. Aya does the rest.",
  },
  {
    q: "Is my PIN safe?",
    a: "Yes. You only type your MoMo PIN in MTN's secure PIN box, and it goes to MTN only. Aya never sees it or asks for it out loud. You can use biometrics instead.",
  },
  {
    q: "What languages does Aya speak?",
    a: "Akan/Twi and English. You chose your preferred language during setup.",
  },
  {
    q: "What if Aya doesn't understand me?",
    a: "Say it again slowly, or tap Change. You can also call support.",
  },
  {
    q: "Will Aya support ask for my PIN?",
    a: "Never. If anyone says they are from Aya or MTN and asks for your PIN or code, it is a scam. Hang up and tell Aya.",
  },
  {
    q: "I sent money to the wrong person. What do I do?",
    a: "Tap Talk and say what happened, or tap Report a problem. Aya finds the payment, fills in the details for MTN, and keeps you updated.",
  },
];

export default function HelpScreen({ onBack, onGetHelp }: Props) {
  const [errorDemo, setErrorDemo] = useState(false);
  const { supportTicket } = useAppPrefs();

  return (
    <Screen background={colors.white} scroll>
      <ScreenHeader title="Help" onBack={onBack} />

      <View style={styles.body}>
        {supportTicket ? (
          <View
            style={styles.ticket}
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel={`Your request ${spokenReference(supportTicket.reference)}. ${categoryLabel(supportTicket.category)}. Status: ${STATUS_LABEL[supportTicket.status]}. Latest: ${supportTicket.events[supportTicket.events.length - 1]?.title ?? ""}`}
          >
            <AppText variant="caption" color={colors.textMuted} importantForAccessibility="no">
              Your request · {categoryLabel(supportTicket.category)}
            </AppText>
            <AppText variant="labelLG" importantForAccessibility="no">
              {supportTicket.reference}
            </AppText>
            <AppText variant="labelSM" color={colors.purple} importantForAccessibility="no">
              {STATUS_LABEL[supportTicket.status]}
            </AppText>
            <AppText variant="bodySM" importantForAccessibility="no">
              {supportTicket.events[supportTicket.events.length - 1]?.title}
            </AppText>
          </View>
        ) : null}

        <Button
          variant="purple"
          onPress={onGetHelp}
          accessibilityHint="Tell Aya what went wrong by voice. Aya fills in the details and opens a request"
        >
          Report a problem
        </Button>

        <View style={styles.call} accessible={false}>
          <View {...DECORATIVE_A11Y}>
            <IconWell backgroundColor={colors.white} size={64} radius={20}>
              <Icon name="call" size={28} color={colors.text} />
            </IconWell>
          </View>
          <AppText variant="heading" align="center" color={colors.textOnYellow} style={styles.callTitle}>
            Speak to a support agent
          </AppText>
          <AppText variant="bodySM" align="center" color={colors.textInverseMuted} style={styles.callSub}>
            Free call, 24/7, in Twi or English
          </AppText>
          <Pressable
            style={styles.callBtn}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Call support at 0800-AYA-HELP"
            accessibilityHint="Starts a free support call"
          >
            <View {...DECORATIVE_A11Y}>
              <Icon name="call-outline" size={18} color={colors.text} />
            </View>
            <AppText variant="labelMD" color={colors.text} importantForAccessibility="no">
              Call 0800-AYA-HELP
            </AppText>
          </Pressable>
        </View>

        <View
          accessibilityRole="list"
          role="list"
          accessibilityLabel="Frequently asked questions"
          style={styles.faqList}
        >
          {FAQS.map((faq) => (
            <View
              key={faq.q}
              role="listitem"
              accessible
              accessibilityLabel={`${faq.q}. ${faq.a}`}
            >
              <Card>
                <View style={styles.faqHead} importantForAccessibility="no">
                  <View {...DECORATIVE_A11Y}>
                    <Icon name="help-circle" size={20} color={colors.text} />
                  </View>
                  <AppText variant="labelSM" style={styles.q} importantForAccessibility="no">
                    {faq.q}
                  </AppText>
                </View>
                <AppText variant="bodySM" importantForAccessibility="no">{faq.a}</AppText>
              </Card>
            </View>
          ))}
        </View>

        <AppText variant="headingSM" heading={2}>
          Accessible error examples
        </AppText>
        <Pressable
          onPress={() => setErrorDemo((v) => !v)}
          style={styles.toggleErrors}
          accessibilityRole="button"
          role="button"
          accessibilityLabel={errorDemo ? "Hide error states" : "Show error states"}
          accessibilityState={{ expanded: errorDemo }}
          aria-expanded={errorDemo}
        >
          <AppText variant="labelSM" importantForAccessibility="no">
            {errorDemo ? "Hide" : "Show"} error states
          </AppText>
        </Pressable>

        {errorDemo ? (
          <>
            <View style={styles.fail} accessible={false}>
              <View style={styles.errHead}>
                <View {...DECORATIVE_A11Y}>
                  <Icon name="warning" size={28} color={colors.danger} />
                </View>
                <AppText variant="labelMD" color={colors.danger}>
                  Transaction failed
                </AppText>
              </View>
              <AppText variant="bodySM" color={colors.dangerDark}>
                Your money was not sent. No money was taken from your account.
              </AppText>
              <View style={styles.errActions}>
                <Pressable
                  style={styles.tryAgain}
                  accessibilityRole="button"
                  role="button"
                  accessibilityLabel="Try again"
                  accessibilityHint="Retries the failed transaction"
                >
                  <AppText variant="labelXS" color={colors.white} importantForAccessibility="no">
                    Try again
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={onGetHelp}
                  style={styles.callSupport}
                  accessibilityRole="button"
                  role="button"
                  accessibilityLabel="Get help"
                  accessibilityHint="Opens a support request about this error"
                >
                  <AppText variant="labelXS" color={colors.danger} importantForAccessibility="no">
                    Get help
                  </AppText>
                </Pressable>
              </View>
            </View>

            <View style={styles.offline} accessible={false}>
              <View style={styles.errHead}>
                <View {...DECORATIVE_A11Y}>
                  <Icon name="cloud-offline" size={28} color={colors.warningDark} />
                </View>
                <AppText variant="labelMD" color={colors.warningDark}>
                  No internet connection
                </AppText>
              </View>
              <AppText variant="bodySM" color={colors.warningText}>
                Check your mobile data or Wi-Fi. Aya needs a connection to send money.
              </AppText>
              <Pressable
                style={styles.retry}
                accessibilityRole="button"
                role="button"
                accessibilityLabel="Retry"
                accessibilityHint="Tries connecting again"
              >
                <AppText variant="labelXS" color={colors.textOnYellow} importantForAccessibility="no">
                  Retry
                </AppText>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  ticket: {
    backgroundColor: colors.washPurple,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    gap: 4,
  },
  call: {
    backgroundColor: colors.purple,
    borderRadius: radii["3xl"],
    padding: spacing["2xl"],
    alignItems: "center",
  },
  callTitle: {
    marginTop: spacing.md,
  },
  callSub: {
    marginTop: 6,
  },
  callBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii["2xl"],
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  faqList: {
    gap: spacing.md,
  },
  faqHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  q: {
    flex: 1,
  },
  toggleErrors: {
    width: "100%",
    padding: 14,
    borderRadius: radii["2xl"],
    backgroundColor: colors.surfaceCard,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  fail: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radii["2xl"],
    padding: spacing.xl,
  },
  offline: {
    backgroundColor: colors.surfaceWarning,
    borderRadius: radii["2xl"],
    padding: spacing.xl,
  },
  errHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: 10,
  },
  errActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  tryAgain: {
    flex: 1,
    height: 48,
    borderRadius: radii["2xl"],
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  callSupport: {
    flex: 1,
    height: 48,
    borderRadius: radii["2xl"],
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  retry: {
    width: "100%",
    height: 48,
    marginTop: 14,
    borderRadius: radii["2xl"],
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
});
