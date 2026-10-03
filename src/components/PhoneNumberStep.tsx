import { useState, type ComponentProps, type ReactNode } from "react";
import { View } from "react-native";
import { Button, TextField } from "./ui";
import SetupStep from "./SetupStep";
import { PHONE_LENGTH } from "../content/onboarding";

type Props = Pick<ComponentProps<typeof SetupStep>, "title" | "subtitle" | "step" | "onBack"> & {
  onSubmit: (phone: string) => void;
  /** Extra footer content under the Continue button. */
  secondary?: ReactNode;
};

export default function PhoneNumberStep({ title, subtitle, step, onBack, onSubmit, secondary }: Props) {
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = phone.length === PHONE_LENGTH;

  const submit = () => {
    setTouched(true);
    if (valid) onSubmit(phone);
  };

  return (
    <SetupStep
      title={title}
      subtitle={subtitle}
      step={step}
      onBack={onBack}
      footer={
        <>
          <Button onPress={submit} disabled={!valid}>
            Continue
          </Button>
          {secondary}
        </>
      }
    >
      <View role="form" aria-label={title}>
        <TextField
          label="Phone number"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, PHONE_LENGTH))}
          onBlur={() => setTouched(true)}
          placeholder="24 123 4567"
          prefix="+233"
          keyboardType="phone-pad"
          autoComplete="tel-national"
          textContentType="telephoneNumber"
          returnKeyType="done"
          onSubmitEditing={submit}
          maxLength={PHONE_LENGTH}
          autoFocus
          error={touched && phone.length > 0 && !valid ? `Enter all ${PHONE_LENGTH} digits.` : undefined}
        />
      </View>
    </SetupStep>
  );
}
