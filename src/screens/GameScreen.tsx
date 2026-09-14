import { useState } from "react";
import { View } from "react-native";
import { Screen, ScreenHeader } from "../components/ui";
import {
  INITIAL_PROGRESS,
  LOCAL_GAMES,
  type LearnPathId,
  type LocalGameId,
} from "../content/play";
import { spacing, useColors, usePaletteStyles, type Palette } from "../theme";
import PlayHub from "./play/PlayHub";
import OwareGame from "./play/OwareGame";
import ScamWordsScreen from "./play/ScamWordsScreen";

type Props = { onBack: () => void };
type PlayView = "hub" | "scam-words" | LocalGameId;

export default function GameScreen({ onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);

  const [view, setView] = useState<PlayView>("hub");
  const [progress, setProgress] = useState(INITIAL_PROGRESS);

  function recordSession(_xpEarned: number, score: number, total: number) {
    setProgress((p) => ({ best: Math.max(p.best, score), total, plays: p.plays + 1 }));
  }

  function openGame(gameId: LocalGameId) {
    const game = LOCAL_GAMES.find((g) => g.id === gameId);
    if (game?.playable) setView(gameId);
  }

  function openPath(pathId: LearnPathId) {
    if (pathId === "scam-words") setView("scam-words");
    if (pathId === "practice") openGame("oware");
  }

  const activeGame = view === "hub" || view === "scam-words" ? null : LOCAL_GAMES.find((g) => g.id === view);
  const title =
    view === "scam-words"
      ? "Scam words"
      : activeGame?.title ?? "Think Genius";
  const headerBack = view === "hub" ? onBack : () => setView("hub");

  return (
    <Screen background={colors.background} scroll safeBottom={false}>
      <ScreenHeader title={title} onBack={headerBack} />
      <View style={styles.body}>
        {view === "oware" ? (
          <OwareGame
            bestScore={progress.best}
            onExit={() => setView("hub")}
            onFinish={(xpEarned, score, total) => recordSession(xpEarned, score, total)}
          />
        ) : view === "scam-words" ? (
          <ScamWordsScreen
            onExit={() => setView("hub")}
            onFinish={(score, total) => recordSession(0, score, total)}
          />
        ) : (
          <PlayHub progress={progress} onPlay={openGame} onOpenPath={openPath} />
        )}
      </View>
    </Screen>
  );
}

function createStyles(_colors: Palette) {
  return {
    body: {
      padding: spacing.xl,
      gap: spacing.md,
    },
  };
}
