import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, PinInput, Screen, ScreenHeader } from "../components/ui";
import { api, ApiError } from "../services/api";
import {
  saveSession,
  sessionTtl,
  type AuthSession,
} from "../services/authSession";
import { DECORATIVE_A11Y } from "../lib/currency";
import { fonts, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

const CODE_LENGTH = 6;

type Props = {
  phone: string;
  onVerified: (session: AuthSession) => void;
  onBack: () => void;
};

export default function OtpVerifyScreen({ phone, onVerified, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(true);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const phoneDisplay = phone ? `+233 ${phone}` : "your phone";

  const requestCode = useCallback(async () => {
    setSending(true);
    try {
      const res = await api.auth.requestOtp(phone);
      setDevCode(res.devCode);
    } catch (err) {
      console.warn("[otp] requestCode failed:", err);
      setDevCode(null);
    } finally {
      setSending(false);
    }
  }, [phone]);

  useEffect(() => {
    void requestCode();
  }, [requestCode]);

  useEffect(() => {
    if (code.length !== CODE_LENGTH || verifying) return;
    let active = true;
    setVerifying(true);
    setError(null);
    void (async () => {
      try {
        const result = await api.auth.verifyOtp(phone, code);
        const session: AuthSession = {
          token: result.token,
          user: result.user,
          wallet: result.wallet,
          expiresAt: Date.now() + sessionTtl(),
        };
        await saveSession(session);
        if (active) onVerified(session);
      } catch (err) {
        if (!active) return;
        console.warn("[otp] verify failed:", err);
        setError(
          err instanceof ApiError && err.status === 401
            ? "That code was not correct. Try again."
            : "Aya could not verify the code. Check your internet and try again.",
        );
        setVerifying(false);
        setCode("");
      }
    })();
    return () => {
      active = false;
    };
  }, [code, phone, onVerified, verifying]);

  const resend = async () => {
    setCode("");
    setError(null);
    setResending(true);
    await requestCode();
    setResending(false);
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Verify your number" onBack={onBack} />

      <View style={styles.body}>
        <AppText
          variant="bodyMD"
          align="center"
          accessibilityLabel={`Enter the ${CODE_LENGTH}-digit code sent to ${phoneDisplay}. It expires after 5 minutes.`}
        >
          Enter the {CODE_LENGTH}-digit code sent to {phoneDisplay}. It expires.
        </AppText>

        <View style={styles.dotsWrap}>
          {sending ? (
            <ActivityIndicator color={colors.text} style={styles.spinner} {...DECORATIVE_A11Y} />
          ) : (
            <PinInput
              length={CODE_LENGTH}
              value={code}
              onChangeText={(t) => {
                setError(null);
                setCode(t.replace(/\D/g, ""));
              }}
              editable={!verifying}
              autoFocus
              textContentType="oneTimeCode"
              accessibilityLabel="Verification code"
            />
          )}

          {devCode ? (
            <AppText
              variant="caption"
              color={colors.textSecondary}
              align="center"
              accessibilityLabel={`Demo code: ${devCode}`}
            >
              Demo shortcut code: {devCode}
            </AppText>
          ) : null}

          {verifying ? (
            <>
              <ActivityIndicator color={colors.text} style={styles.spinner} {...DECORATIVE_A11Y} />
              <AppText
                variant="bodySM"
                color={colors.textSecondary}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                role="status"
                aria-live="polite"
              >
                Signing you in
              </AppText>
            </>
          ) : null}

          {error ? (
            <AppText
              variant="bodySM"
              color={colors.danger}
              accessibilityRole="alert"
              role="alert"
              accessibilityLiveRegion="polite"
            >
              {error}
            </AppText>
          ) : null}
        </View>

        <Pressable
          onPress={resend}
          disabled={verifying || resending}
          accessibilityRole="button"
          role="button"
          accessibilityLabel={resending ? "Resending code" : "Resend code"}
          accessibilityState={{ disabled: verifying || resending }}
          aria-disabled={verifying || resending}
          hitSlop={8}
          style={styles.resend}
        >
          <AppText variant="bodySM" color={colors.textSecondary} importantForAccessibility="no">
            {resending ? "Resending…" : "Didn't get it? "}
          </AppText>
          <AppText variant="bodySM" color={colors.text} style={styles.resendStrong} importantForAccessibility="no">
            Resend code
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    body: {
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.xl,
      gap: spacing["2xl"],
    },
    dotsWrap: {
      alignItems: "center" as const,
      gap: spacing.md,
    },
    spinner: {
      marginTop: spacing.xs,
    },
    resend: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      minHeight: 44,
      alignItems: "center" as const,
    },
    resendStrong: {
      fontFamily: fonts.body.bold,
    },
  };
}