import { useState } from "react";
import { Button } from "../components/ui";
import SetupStep, { SetupChoice, SetupChoiceGroup } from "../components/SetupStep";
import { useAppPrefs } from "../context/AppPrefs";
import type { AppLanguage } from "../content/flows";
import { LANGUAGE_TILES, SIGNUP_STEPS, SIGNUP_TOTAL } from "../content/onboarding";
import { speak } from "../lib/speech";

type Props = { onNext: () => void; onBack: () => void };

export default function LanguageScreen({ onNext, onBack }: Props) {
  const { language, setLanguage } = useAppPrefs();
  const [selected, setSelected] = useState<AppLanguage>(language);

  return (
    <SetupStep
      title="Choose your language"
      step={{ current: SIGNUP_STEPS.language, total: SIGNUP_TOTAL }}
      onBack={onBack}
      footer={
        <Button
          onPress={() => {
            setLanguage(selected);
            onNext();
          }}
        >
          Continue
        </Button>
      }
    >
      <SetupChoiceGroup label="Language">
        {LANGUAGE_TILES.map((tile) => (
          <SetupChoice
            key={tile.code}
            label={tile.name}
            badge={tile.code.toUpperCase()}
            checked={selected === tile.code}
            onPress={() => {
              setSelected(tile.code);
              speak(tile.spoken);
            }}
          />
        ))}
      </SetupChoiceGroup>
    </SetupStep>
  );
}
