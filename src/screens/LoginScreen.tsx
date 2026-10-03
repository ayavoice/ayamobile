import PhoneNumberStep from "../components/PhoneNumberStep";
import { SetupLink } from "../components/SetupStep";

type Props = {
  onNext: (phone: string) => void;
  onBack: () => void;
  onSignup: () => void;
};

export default function LoginScreen({ onNext, onBack, onSignup }: Props) {
  return (
    <PhoneNumberStep
      title="Welcome back"
      subtitle="Enter your MTN number to sign in."
      onBack={onBack}
      onSubmit={onNext}
      secondary={<SetupLink lead="New to Aya?" label="Create an account" onPress={onSignup} />}
    />
  );
}
