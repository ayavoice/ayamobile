import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { Button } from "../components/ui";
import SetupStep, { SetupChoice, SetupChoiceGroup } from "../components/SetupStep";
import { useAppPrefs } from "../context/AppPrefs";
import { SETUP_MODES, SIGNUP_STEPS, SIGNUP_TOTAL, type SetupMode } from "../content/onboarding";

type Props = { onNext: () => void; onBack: () => void };

export default function AccessibilitySetupScreen({ onNext, onBack }: Props) {
  const { setupMode, chooseSetupMode, setAccessibility } = useAppPrefs();
  const [mode, setMode] = useState<SetupMode>(setupMode ?? "standard");
  const touched = useRef(setupMode !== null);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then((on) => {
        if (!on) return;
        setAccessibility({ screenReader: true });
        if (!touched.current) setMode("talk");
      })
      .catch(() => {});
  }, [setAccessibility]);

  const pick = (next: SetupMode) => {
    touched.current = true;
    setMode(next);
  };

  return (
    <SetupStep
      title="How do you want to use Aya?"
      subtitle="You can change this anytime in Settings."
      step={{ current: SIGNUP_STEPS.mode, total: SIGNUP_TOTAL }}
      onBack={onBack}
      footer={
        <Button
          onPress={() => {
            chooseSetupMode(mode);
            onNext();
          }}
        >
          Continue
        </Button>
      }
    >
      <SetupChoiceGroup label="How Aya works">
        {SETUP_MODES.map((m) => (
          <SetupChoice
            key={m.id}
            label={m.title}
            description={m.description}
            icon={m.icon}
            checked={mode === m.id}
            onPress={() => pick(m.id)}
          />
        ))}
      </SetupChoiceGroup>
    </SetupStep>
  );
}
