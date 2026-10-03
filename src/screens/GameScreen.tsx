import { useState } from "react";
import { View } from "react-native";
import { Screen, ScreenHeader } from "../components/ui";
import { LESSONS, type LessonId } from "../content/learn";
import { INITIAL_PROGRESS } from "../content/play";
import { spacing, useColors, usePaletteStyles, type Palette } from "../theme";
import LearnHub from "./play/LearnHub";
import LessonView from "./play/LessonView";
import OwareGame from "./play/OwareGame";
import ScamWordsScreen from "./play/ScamWordsScreen";

type Props = { onBack: () => void };
type LearnView = { kind: "hub" } | { kind: "lesson"; id: LessonId } | { kind: "scam-words" } | { kind: "market-day" };

const TITLES: Record<Exclude<LearnView["kind"], "lesson">, string> = {
  hub: "Learn",
  "scam-words": "Spot the scam words",
  "market-day": "Ama's market day",
};

export default function GameScreen({ onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);

  const [view, setView] = useState<LearnView>({ kind: "hub" });
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [completed, setCompleted] = useState<LessonId[]>([]);

  const toHub = () => setView({ kind: "hub" });

  function recordSession(score: number, total: number) {
    setProgress((p) => ({ best: Math.max(p.best, score), total, plays: p.plays + 1 }));
  }

  function finishLesson(id: LessonId) {
    setCompleted((done) => (done.includes(id) ? done : [...done, id]));
    toHub();
  }

  const lessonIndex = view.kind === "lesson" ? LESSONS.findIndex((l) => l.id === view.id) : -1;
  const lesson = lessonIndex >= 0 ? LESSONS[lessonIndex] : null;
  const title = view.kind === "lesson" ? "Lesson" : TITLES[view.kind];

  return (
    <Screen background={colors.background} scroll safeBottom={false}>
      <ScreenHeader title={title} onBack={view.kind === "hub" ? onBack : toHub} />
      <View style={styles.body}>
        {view.kind === "lesson" && lesson ? (
          <LessonView
            key={lesson.id}
            lesson={lesson}
            position={{ current: lessonIndex + 1, total: LESSONS.length }}
            onDone={() => finishLesson(lesson.id)}
          />
        ) : view.kind === "market-day" ? (
          <OwareGame
            bestScore={progress.best}
            onExit={toHub}
            onFinish={(_xp, score, total) => recordSession(score, total)}
          />
        ) : view.kind === "scam-words" ? (
          <ScamWordsScreen onExit={toHub} onFinish={() => {}} />
        ) : (
          <LearnHub
            completed={completed}
            progress={progress}
            onOpenLesson={(id) => setView({ kind: "lesson", id })}
            onScamWords={() => setView({ kind: "scam-words" })}
            onMarketDay={() => setView({ kind: "market-day" })}
          />
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
