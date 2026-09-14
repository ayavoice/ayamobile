import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText, Card, Icon, IconWell, Screen, ScreenHeader, Toggle } from "../components/ui";
import { DECORATIVE_A11Y } from "../lib/currency";
import { colors, radii, spacing } from "../theme";

type Props = { onBack: () => void };

export default function SecurityScreen({ onBack }: Props) {
  const [biometric, setBiometric] = useState(true);

  return (
    <Screen background={colors.white} scroll>
      <ScreenHeader title="Security & Privacy" onBack={onBack} />

      <View style={styles.body}>
        <View
          style={styles.banner}
          accessible
          accessibilityLabel="Your PIN is always safe. Aya will NEVER ask for your Mobile Money PIN or OTP by voice. Voice stops before authorization. If anyone asks, it is a scam."
        >
          <View style={styles.bannerTitle} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <Icon name="lock-closed" size={20} color={colors.white} />
            </View>
            <AppText variant="labelMD" color={colors.white} importantForAccessibility="no">
              Your PIN is always safe
            </AppText>
          </View>
          <AppText variant="bodySM" color={colors.dangerOnDark} style={styles.bannerBody} importantForAccessibility="no">
            Aya will NEVER ask for your Mobile Money PIN or OTP by voice. Voice stops before authorization. If anyone asks, it is a scam.
          </AppText>
        </View>

        <Card>
          <View style={styles.row}>
            <View {...DECORATIVE_A11Y}>
              <IconWell backgroundColor={colors.washPurple} size={48} radius={14}>
                <Icon name="finger-print" size={24} color={colors.text} />
              </IconWell>
            </View>
            <View style={styles.flex} importantForAccessibility="no">
              <AppText variant="labelMD" importantForAccessibility="no">Biometric authentication</AppText>
              <AppText variant="caption" importantForAccessibility="no">
                Fingerprint, face, or device unlock after confirmation
              </AppText>
            </View>
            <Toggle
              value={biometric}
              onValueChange={setBiometric}
              accessibilityLabel="Biometric authentication"
              accessibilityHint={
                biometric
                  ? "On. Money moves only after private device auth"
                  : "Off. Less secure"
              }
            />
          </View>
          <View
            accessible
            accessibilityLabel={
              biometric
                ? "Biometrics ON, money moves only after private device auth"
                : "Biometrics OFF, less secure"
            }
            style={[
              styles.status,
              { backgroundColor: biometric ? colors.successSurface : colors.surfaceWarningSoft },
            ]}
          >
            <View {...DECORATIVE_A11Y}>
              <Icon
                name={biometric ? "checkmark-circle" : "warning"}
                size={16}
                color={biometric ? colors.success : colors.warningDark}
              />
            </View>
            <AppText
              variant="caption"
              color={biometric ? colors.success : colors.warningDark}
              style={styles.statusText}
              importantForAccessibility="no"
            >
              {biometric
                ? "Biometrics ON, money moves only after private device auth"
                : "Biometrics OFF, less secure"}
            </AppText>
          </View>
        </Card>

        <Card
          accessible
          accessibilityLabel="Voice PIN capture. Allow Aya to capture PIN by voice. NEVER. Permanently disabled. MoMo PINs are never spoken, captured, or stored by voice."
        >
          <View style={styles.row} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <IconWell backgroundColor={colors.dangerSurface} size={48} radius={14}>
                <Icon name="mic" size={24} color={colors.danger} />
              </IconWell>
            </View>
            <View style={styles.flex}>
              <AppText variant="labelMD" importantForAccessibility="no">Voice PIN capture</AppText>
              <AppText variant="caption" importantForAccessibility="no">Allow Aya to capture PIN by voice</AppText>
            </View>
            <View style={styles.never}>
              <AppText variant="labelXS" color={colors.danger} importantForAccessibility="no">
                NEVER
              </AppText>
            </View>
          </View>
          <View style={[styles.status, { backgroundColor: colors.dangerSurface }]} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <Icon name="lock-closed" size={16} color={colors.danger} />
            </View>
            <AppText variant="caption" color={colors.danger} style={styles.statusText} importantForAccessibility="no">
              Permanently disabled. MoMo PINs are never spoken, captured, or stored by voice.
            </AppText>
          </View>
        </Card>

        <Card
          accessible
          accessibilityLabel="Microphone during authentication. Required off before BiometricPrompt. OFF. Locked OFF. After you say continue, Aya closes the mic and hands auth to the device."
        >
          <View style={styles.row} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <IconWell backgroundColor={colors.washBlue} size={48} radius={14}>
                <Icon name="mic-off" size={24} color={colors.text} />
              </IconWell>
            </View>
            <View style={styles.flex}>
              <AppText variant="labelMD" importantForAccessibility="no">Microphone during authentication</AppText>
              <AppText variant="caption" importantForAccessibility="no">Required off before BiometricPrompt</AppText>
            </View>
            <View style={styles.never}>
              <AppText variant="labelXS" color={colors.success} importantForAccessibility="no">
                OFF
              </AppText>
            </View>
          </View>
          <View style={[styles.status, { backgroundColor: colors.successSurface }]} importantForAccessibility="no">
            <View {...DECORATIVE_A11Y}>
              <Icon name="checkmark-circle" size={16} color={colors.success} />
            </View>
            <AppText variant="caption" color={colors.success} style={styles.statusText} importantForAccessibility="no">
              Locked OFF. After you say continue, Aya closes the mic and hands auth to the device.
            </AppText>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  banner: {
    backgroundColor: colors.danger,
    borderRadius: radii["2xl"],
    padding: spacing.xl,
  },
  bannerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerBody: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  never: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSurface,
  },
  status: {
    marginTop: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  statusText: {
    flex: 1,
  },
});
