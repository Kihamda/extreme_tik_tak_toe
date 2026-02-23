import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type Phase = "ready" | "waiting" | "go" | "roundResult" | "finished";

const TOTAL_ROUNDS = 5;
const FALSE_START_PENALTY_MS = 700;

function App() {
  const timerRef = useRef<number | null>(null);
  const goTimeRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState<number[]>([]);
  const [statusText, setStatusText] = useState(
    "スタートを押して準備しよう",
  );

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const average = useMemo(() => {
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, value) => sum + value, 0);
    return Math.round(total / scores.length);
  }, [scores]);

  const best = useMemo(() => {
    if (scores.length === 0) return 0;
    return Math.min(...scores);
  }, [scores]);

  const falseStarts = useMemo(
    () => scores.filter((score) => score === FALSE_START_PENALTY_MS).length,
    [scores],
  );

  const clearRoundTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const beginWaiting = () => {
    clearRoundTimer();
    goTimeRef.current = null;
    setPhase("waiting");
    setStatusText("赤の間は待機 緑に変わった瞬間にタップ");

    const delay = Math.floor(Math.random() * 2000) + 1200;
    timerRef.current = window.setTimeout(() => {
      goTimeRef.current = performance.now();
      setPhase("go");
      setStatusText("今だ タップ");
    }, delay);
  };

  const finishRound = (reactionMs: number) => {
    const nextScores = [...scores, reactionMs];
    setScores(nextScores);

    if (round >= TOTAL_ROUNDS) {
      setPhase("finished");
      setStatusText("計測完了");
      return;
    }

    setPhase("roundResult");
    setStatusText(`ラウンド ${round} 完了`);
  };

  const startGame = () => {
    setRound(1);
    setScores([]);
    setStatusText("集中していこう");
    beginWaiting();
  };

  const nextRound = () => {
    setRound((prev) => prev + 1);
    beginWaiting();
  };

  const retryGame = () => {
    setRound(1);
    setScores([]);
    setStatusText("リトライ開始");
    beginWaiting();
  };

  const handleTap = () => {
    if (phase === "waiting") {
      clearRoundTimer();
      setStatusText("フライング 700ms ペナルティ");
      finishRound(FALSE_START_PENALTY_MS);
      return;
    }

    if (phase !== "go") {
      return;
    }

    const now = performance.now();
    const start = goTimeRef.current;
    if (start === null) return;

    const reaction = Math.max(1, Math.round(now - start));
    setStatusText(`${reaction} ms`);
    finishRound(reaction);
  };

  const latestScore = scores[scores.length - 1] ?? 0;

  return (
    <main className="app">
      <section className="panel">
        <h1>Flash Reflex</h1>
        <p className="subtitle">5ラウンド反応速度チャレンジ</p>

        <div className="ruleBox">
          <h2>ルール</h2>
          <ul>
            <li>赤の間は待機 緑になったらすぐタップ</li>
            <li>早押しはフライングで 700ms 扱い</li>
            <li>5ラウンドの平均が小さいほど強い</li>
          </ul>
        </div>

        <p className="statusText">{statusText}</p>

        <button
          className={`tapArea ${phase === "go" ? "go" : "wait"}`}
          onClick={handleTap}
          type="button"
        >
          {phase === "go" ? "TAP" : "WAIT"}
        </button>

        <div className="hud">
          <span>Round {Math.min(round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}</span>
          <span>Best {best > 0 ? `${best} ms` : "-"}</span>
          <span>Avg {average > 0 ? `${average} ms` : "-"}</span>
        </div>

        {phase === "ready" && (
          <button className="action" onClick={startGame} type="button">
            スタート
          </button>
        )}

        {phase === "roundResult" && (
          <div className="resultBlock">
            <p>今回の記録 {latestScore} ms</p>
            <button className="action" onClick={nextRound} type="button">
              次のラウンド
            </button>
          </div>
        )}

        {phase === "finished" && (
          <div className="resultBlock">
            <p>ベスト {best} ms</p>
            <p>平均 {average} ms</p>
            <p>フライング {falseStarts} 回</p>
            <button className="action" onClick={retryGame} type="button">
              もう一回
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
