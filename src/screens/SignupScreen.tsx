import PhoneNumberStep from "../components/PhoneNumberStep";
import { SIGNUP_STEPS, SIGNUP_TOTAL } from "../content/onboarding";

type Props = { onNext: (phone: string) => void; onBack: () => void };

export default function SignupScreen({ onNext, onBack }: Props) {
  return (
    <PhoneNumberStep
      title="What's your MTN number?"
      subtitle="We'll text you a code to confirm it."
      step={{ current: SIGNUP_STEPS.phone, total: SIGNUP_TOTAL }}
      onBack={onBack}
      onSubmit={onNext}
    />
  );
}
