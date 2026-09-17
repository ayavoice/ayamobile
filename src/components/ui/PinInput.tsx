import { useEffect, useRef } from "react";
import { Pressable, TextInput, View, type TextInput as RNTextInput } from "react-native";
import PinDots from "./PinDots";
import { usePaletteStyles } from "../../theme";

type PinInputProps = {
  length: number;
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
  editable?: boolean;
  error?: boolean;
  accessibilityLabel?: string;
  textContentType?: "oneTimeCode" | "password" | "newPassword" | "none";
};

export default function PinInput({
  length,
  value,
  onChangeText,
  autoFocus,
  editable = true,
  error,
  accessibilityLabel,
  textContentType,
}: PinInputProps) {
  const styles = usePaletteStyles(createStyles);
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (editable && value === "") {
      inputRef.current?.focus();
    }
  }, [value, editable]);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={styles.wrap}
      accessibilityRole="none"
    >
      <View pointerEvents="none">
        <PinDots length={length} filled={value.length} error={error} />
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/\D/g, "").slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        editable={editable}
        caretHidden
        textContentType={textContentType}
        style={styles.hiddenInput}
        accessibilityLabel={accessibilityLabel ?? "PIN"}
        accessibilityValue={{
          text: `${value.length} of ${length} digits entered`,
        }}
        accessibilityState={{ disabled: !editable }}
        aria-invalid={error ? true : undefined}
        aria-disabled={!editable || undefined}
      />
    </Pressable>
  );
}

function createStyles() {
  return {
    wrap: {
      alignSelf: "stretch" as const,
      position: "relative" as const,
    },
    hiddenInput: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0,
      fontSize: 16,
      textAlign: "center" as const,
    },
  };
}
