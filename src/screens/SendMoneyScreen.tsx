import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import { AppText, Avatar, Button, Icon, Screen, TextField } from "../components/ui";
import NotificationsModal from "../components/NotificationsModal";
import { brandImages } from "../content/brand";
import {
  BANKS,
  NAME_LOOKUP_MS,
  NETWORK_LABEL,
  SAVED_RECIPIENTS,
  demoLookupName,
  detectNetwork,
  digitsOnly,
  formatPhone,
  initials,
  isValidAccount,
  isValidPhone,
  recipientLine,
  transferFee,
  type Bank,
  type Recipient,
} from "../content/send";
import { useAppPrefs } from "../context/AppPrefs";
import { formatCurrency, formatCurrencySpoken } from "../lib/currency";
import { fonts, radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = {
  onSend: () => void;
  onBack: () => void;
  onScan?: () => void;
};

type Tab = Recipient["kind"];
type Lookup = { status: "idle" } | { status: "checking" } | { status: "found"; name: string };

function sanitizeAmount(raw: string) {
  let next = raw.replace(/[^0-9.]/g, "");
  const firstDot = next.indexOf(".");
  if (firstDot !== -1) {
    next = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, "");
    const [whole, decimals = ""] = next.split(".");
    next = `${whole}.${decimals.slice(0, 2)}`;
  }
  if (next.startsWith(".")) next = `0${next}`;
  return next;
}

function sameRecipient(a: Recipient, b: Recipient) {
  if (a.kind === "bank" && b.kind === "bank") return a.account === b.account && a.bank === b.bank;
  if (a.kind === "wallet" && b.kind === "wallet") return a.phone === b.phone;
  return false;
}

function RecipientAvatar({ recipient, size }: { recipient: Recipient; size: number }) {
  const styles = usePaletteStyles(createStyles);
  const colors = useColors();
  if (recipient.kind === "wallet" && recipient.network === "merchant") {
    return <Avatar source={brandImages.pratik} size={size} />;
  }
  if (recipient.name === "Ricky Martin") return <Avatar source={brandImages.ricky} size={size} />;
  return (
    <View style={[styles.initials, { width: size, height: size, borderRadius: size / 2 }]}>
      {recipient.kind === "bank" ? (
        <Icon name="business-outline" size={size * 0.42} color={colors.purple} />
      ) : (
        <AppText variant={size > 60 ? "heading" : "labelMD"} color={colors.purple}>
          {initials(recipient.name)}
        </AppText>
      )}
    </View>
  );
}

export default function SendMoneyScreen({ onSend, onBack, onScan }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow, scanPayee, transferRecipient, setTransferAmount, setTransferRecipient } = useAppPrefs();
  const inputRef = useRef<RNTextInput>(null);

  const initialRecipient = useMemo<Recipient>(() => {
    if (transferRecipient) return transferRecipient;
    if (scanPayee) {
      return { kind: "wallet", name: scanPayee.name, phone: scanPayee.account, network: "merchant", saved: false };
    }
    return SAVED_RECIPIENTS[0];
  }, [transferRecipient, scanPayee]);
  const initialAmount = useMemo(() => flow.confirmHero.replace(/[^0-9.]/g, "") || "580.00", [flow.confirmHero]);

  const [recipient, setRecipient] = useState<Recipient>(initialRecipient);
  const [picking, setPicking] = useState(false);
  const [tab, setTab] = useState<Tab>("wallet");
  const [phone, setPhone] = useState("");
  const [bank, setBank] = useState<Bank | null>(null);
  const [account, setAccount] = useState("");
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" });
  const [amount, setAmount] = useState(initialAmount);
  const [reference, setReference] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => setAmount(initialAmount), [initialAmount]);

  const lookupKey =
    tab === "wallet"
      ? isValidPhone(phone)
        ? digitsOnly(phone)
        : null
      : bank && isValidAccount(account)
        ? `${bank}:${digitsOnly(account)}`
        : null;

  useEffect(() => {
    if (!picking || !lookupKey) {
      setLookup({ status: "idle" });
      return;
    }
    setLookup({ status: "checking" });
    const t = setTimeout(() => {
      const saved = SAVED_RECIPIENTS.find((r) =>
        r.kind === "wallet" ? r.phone === lookupKey : `${r.bank}:${r.account}` === lookupKey,
      );
      setLookup({ status: "found", name: saved?.name ?? demoLookupName(lookupKey) });
    }, NAME_LOOKUP_MS);
    return () => clearTimeout(t);
  }, [picking, lookupKey]);

  const network = tab === "wallet" ? detectNetwork(phone) : null;
  const phoneDigits = digitsOnly(phone);
  const phoneError =
    phoneDigits.length >= 3 && !network
      ? "That isn't a Ghana mobile money number"
      : phoneDigits.length > 10
        ? "Mobile numbers have 10 digits"
        : undefined;

  const amountValue = Number(amount) || 0;
  const isMerchant = recipient.kind === "wallet" && recipient.network === "merchant";
  const fee = isMerchant ? 0 : transferFee(amountValue, recipient.kind);
  const feeLine = isMerchant
    ? "No fee for merchant payments"
    : recipient.kind === "bank"
      ? `Free to bank accounts · Total ${formatCurrency(amountValue)}`
      : `Fee ${formatCurrency(fee)} · Total ${formatCurrency(amountValue + fee)}`;

  const openPicker = () => {
    Keyboard.dismiss();
    setPhone("");
    setAccount("");
    setBank(null);
    setTab(recipient.kind);
    setPicking(true);
  };

  const choose = (next: Recipient) => {
    const saved = SAVED_RECIPIENTS.find((r) => sameRecipient(r, next));
    setRecipient(saved ?? next);
    setReference("");
    setPicking(false);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const chooseLookedUp = () => {
    if (lookup.status !== "found") return;
    if (tab === "wallet" && network) {
      choose({ kind: "wallet", name: lookup.name, phone: phoneDigits, network, saved: false });
    } else if (tab === "bank" && bank) {
      choose({ kind: "bank", name: lookup.name, account: digitsOnly(account), bank, saved: false });
    }
  };

  const handleSend = () => {
    setTransferRecipient(recipient);
    setTransferAmount(amount);
    onSend();
  };

  const savedForTab = SAVED_RECIPIENTS.filter((r) => r.kind === tab);

  return (
    <Screen style={styles.root}>
      <NotificationsModal visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <View style={styles.top}>
        <Pressable
          onPress={picking ? () => setPicking(false) : onBack}
          accessibilityRole="button"
          role="button"
          accessibilityLabel={picking ? "Back to amount" : "Go back"}
          hitSlop={8}
          style={styles.topBtn}
        >
          <Icon name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <AppText variant="headingSM" heading={1}>
          {picking ? "Send to" : "Send money"}
        </AppText>
        <View style={styles.topRight}>
          {onScan ? (
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                onScan();
              }}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Scan to pay"
              accessibilityHint="Opens the camera to scan a merchant QR code"
              hitSlop={8}
              style={styles.topBtn}
            >
              <Icon name="scan-outline" size={22} color={colors.text} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setNotificationsOpen(true);
              }}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Notifications"
              accessibilityHint="Opens your notifications"
              hitSlop={8}
              style={styles.topBtn}
            >
              <Icon name="notifications-outline" size={22} color={colors.text} />
            </Pressable>
          )}
        </View>
      </View>

      {picking ? (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.segment} accessibilityRole="tablist" role="tablist">
            {(["wallet", "bank"] as const).map((t) => {
              const on = tab === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  accessibilityRole="tab"
                  role="tab"
                  accessibilityState={{ selected: on }}
                  style={[styles.segmentItem, on && styles.segmentItemOn]}
                >
                  <AppText variant="labelMD" color={on ? colors.text : colors.textMuted}>
                    {t === "wallet" ? "Phone number" : "Bank account"}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {tab === "wallet" ? (
            <TextField
              label="Mobile number"
              value={formatPhone(phone)}
              onChangeText={(text) => setPhone(digitsOnly(text).slice(0, 10))}
              placeholder="024 000 0000"
              keyboardType="phone-pad"
              autoFocus
              helper={network ? NETWORK_LABEL[network] : "MTN, Telecel or AT"}
              error={phoneError}
              accessibilityLabel="Mobile number, any network"
            />
          ) : (
            <View style={styles.group}>
              <AppText variant="labelMD" color={colors.textSecondary}>
                Bank
              </AppText>
              <View style={styles.chips} accessibilityRole="radiogroup" role="radiogroup">
                {BANKS.map((b) => {
                  const on = bank === b;
                  return (
                    <Pressable
                      key={b}
                      onPress={() => setBank(b)}
                      accessibilityRole="radio"
                      role="radio"
                      accessibilityState={{ selected: on, checked: on }}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <AppText variant="labelSM" color={on ? colors.textInverse : colors.text}>
                        {b}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
              {bank ? (
                <TextField
                  label="Account number"
                  value={account}
                  onChangeText={(text) => setAccount(digitsOnly(text).slice(0, 16))}
                  placeholder="10 to 16 digits"
                  keyboardType="number-pad"
                  autoFocus
                  accessibilityLabel={`${bank} account number`}
                />
              ) : null}
            </View>
          )}

          {lookup.status === "checking" ? (
            <View style={styles.lookup} accessibilityLiveRegion="polite">
              <ActivityIndicator color={colors.purple} />
              <AppText variant="bodySM" color={colors.textMuted}>
                Checking name…
              </AppText>
            </View>
          ) : null}

          {lookup.status === "found" ? (
            <Pressable
              onPress={chooseLookedUp}
              accessibilityRole="button"
              role="button"
              accessibilityLabel={`Send to ${lookup.name}`}
              accessibilityHint="Make sure this is the right person"
              style={styles.found}
            >
              <View style={styles.foundText}>
                <View style={styles.nameRow}>
                  <AppText variant="labelLG" color={colors.text}>
                    {lookup.name}
                  </AppText>
                  <Icon name="checkmark-circle" size={18} color={colors.success} />
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  Registered name. Make sure it's right.
                </AppText>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}

          {savedForTab.length > 0 ? (
            <View style={styles.group}>
              <AppText variant="labelMD" color={colors.textSecondary}>
                Saved
              </AppText>
              {savedForTab.map((r) => (
                <Pressable
                  key={r.name}
                  onPress={() => choose(r)}
                  accessibilityRole="button"
                  role="button"
                  accessibilityLabel={`${r.name}, ${recipientLine(r)}`}
                  style={styles.savedRow}
                >
                  <RecipientAvatar recipient={r} size={44} />
                  <View style={styles.foundText}>
                    <AppText variant="labelLG" color={colors.text}>
                      {r.name}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {recipientLine(r)}
                    </AppText>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.recipient}>
            <View
              accessible
              accessibilityLabel={`${recipient.name}, ${recipientLine(recipient)}`}
              style={styles.recipientInfo}
            >
              <RecipientAvatar recipient={recipient} size={96} />
              <AppText variant="heading" color={colors.text} style={styles.name} importantForAccessibility="no">
                {recipient.name}
              </AppText>
              <AppText variant="bodySM" color={colors.textSubtle} importantForAccessibility="no">
                {recipientLine(recipient)}
              </AppText>
            </View>
            <Pressable
              onPress={openPicker}
              accessibilityRole="button"
              role="button"
              accessibilityLabel="Change recipient"
              accessibilityHint="Send to another number, network or bank account"
              hitSlop={8}
              style={styles.changeBtn}
            >
              <AppText variant="labelSM" color={colors.purple}>
                Change
              </AppText>
            </Pressable>
          </View>

          <View style={styles.amountBlock}>
            <Pressable onPress={() => inputRef.current?.focus()} accessibilityRole="none" style={styles.amountWrap}>
              <AppText
                variant="displayLG"
                color={colors.text}
                style={styles.currencyPrefix}
                importantForAccessibility="no"
              >
                GH₵
              </AppText>
              <TextInput
                ref={inputRef}
                value={amount}
                onChangeText={(text) => setAmount(sanitizeAmount(text))}
                keyboardType="decimal-pad"
                autoFocus
                returnKeyType="done"
                selectTextOnFocus
                placeholder="0.00"
                placeholderTextColor={colors.textSubtle}
                style={[styles.amountInput, { color: colors.text }]}
                accessibilityLabel={`Amount, ${formatCurrencySpoken(amount || "0")}`}
                accessibilityHint="Edit the amount using the system keyboard"
              />
            </Pressable>
            {amountValue > 0 ? (
              <AppText
                variant="caption"
                color={colors.textMuted}
                style={styles.center}
                accessibilityLiveRegion="polite"
              >
                {feeLine}
              </AppText>
            ) : null}
          </View>

          {recipient.kind === "bank" ? (
            <TextField
              label="What's it for? (optional)"
              value={reference}
              onChangeText={(text) => setReference(text.slice(0, 30))}
              placeholder="e.g. Rent"
              maxLength={30}
            />
          ) : null}

          <Button
            onPress={handleSend}
            disabled={amountValue <= 0}
            variant="purple"
            style={styles.mainBtn}
            accessibilityHint="Continues to approve the payment"
          >
            Continue
          </Button>
        </ScrollView>
      )}
    </Screen>
  );
}

const createStyles = (colors: Palette) => ({
  root: { flex: 1 },
  top: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: spacing.sm,
    minHeight: 52,
    flexShrink: 0,
  },
  topRight: { flexDirection: "row" as const, alignItems: "center" as const },
  topBtn: { width: 48, height: 48, alignItems: "center" as const, justifyContent: "center" as const },
  body: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing["2xl"],
    gap: spacing.xl,
  },
  segment: {
    flexDirection: "row" as const,
    backgroundColor: colors.surfaceGhost,
    borderRadius: radii.pill,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: radii.pill,
  },
  segmentItemOn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  group: { gap: spacing.md },
  chips: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: spacing.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    justifyContent: "center" as const,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.purple, borderColor: colors.purple },
  lookup: { flexDirection: "row" as const, alignItems: "center" as const, gap: spacing.sm },
  found: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.successSurface,
  },
  foundText: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6 },
  savedRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
    minHeight: 56,
  },
  initials: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.washPurple,
  },
  recipient: { alignItems: "center" as const, paddingTop: spacing.sm },
  recipientInfo: { alignItems: "center" as const },
  name: { marginTop: spacing.md },
  changeBtn: {
    marginTop: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    justifyContent: "center" as const,
    borderRadius: radii.pill,
    backgroundColor: colors.washPurple,
  },
  amountBlock: { gap: spacing.xs },
  amountWrap: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: 64,
    paddingHorizontal: spacing.sm,
  },
  currencyPrefix: { letterSpacing: -1 },
  amountInput: {
    flexShrink: 1,
    minWidth: 120,
    maxWidth: "70%" as const,
    fontFamily: fonts.display.black,
    fontSize: 38,
    letterSpacing: -1.2,
    padding: 0,
    margin: 0,
    textAlign: "left" as const,
    ...({ outlineStyle: "none", outlineWidth: 0 } as object),
  },
  center: { textAlign: "center" as const },
  mainBtn: { alignSelf: "center" as const, minWidth: 240, paddingHorizontal: spacing["2xl"] },
});
