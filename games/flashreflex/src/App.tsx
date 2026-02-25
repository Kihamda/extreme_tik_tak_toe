import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type Phase = "ready" | "waiting" | "go" | "roundResult" | "finished";

interface ParticleDef {
  id: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
  dur: number;
}

const TOTAL_ROUNDS = 5;
const FALSE_START_PENALTY_MS = 700;
const STREAK_THRESHOLD_MS = 350;
const PARTICLE_COLORS = ["#facc15", "#f59e0b", "#fb923c", "#22d3ee", "#a78bfa", "#34d399", "#f472b6"];

function getRank(avg: number, falseStartCount: number): string {
  if (falseStartCount >= 2) return "";
  if (avg <= 200) return "💎 PERFECT!";
  if (avg <= 280) return "⚡ EXCELLENT!";
  if (avg <= 350) return "🔥 GREAT!";
  if (avg <= 450) return "👍 GOOD";
  return "";
}

function App() {
  const timerRef = useRef<number | null>(null);
  const goTimeRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const particleIdRef = useRef(0);
  const prevBestRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState<number[]>([]);
  const [statusText, setStatusText] = useState("スタートを押して準備しよう");

  // Effect states
  const [particles, setParticles] = useState<ParticleDef[]>([]);
  const [scorePopup, setScorePopup] = useState<string | null>(null);
  const [scorePopupKey, setScorePopupKey] = useState(0);
  const [streak, setStreak] = useState(0);
  const [shakeClass, setShakeClass] = useState<"" | "shake" | "celebrate">("" );
  const [rankLabel, setRankLabel] = useState("");

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  // ---- Audio helpers ----
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq: number, duration: number, type: OscillatorType = "sine", gainVal = 0.3) => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      /* audio unavailable */
    }
  };

  const playFanfare = () => {
    try {
      const ctx = getAudioCtx();
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = "triangle";
        const t0 = ctx.currentTime + i * 0.13;
        osc.frequency.setValueAtTime(freq, t0);
        gainNode.gain.setValueAtTime(0.3, t0);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
        osc.start(t0);
        osc.stop(t0 + 0.15);
      });
    } catch {
      /* audio unavailable */
    }
  };

  // ---- Particle helpers ----
  const spawnParticles = (count: number, mega = false) => {
    const newParticles: ParticleDef[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = (mega ? 160 : 100) * (0.5 + Math.random());
      return {
        id: particleIdRef.current++,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: mega ? 10 + Math.random() * 12 : 6 + Math.random() * 8,
        dur: mega ? 900 + Math.random() * 400 : 600 + Math.random() * 300,
      };
    });
    setParticles((prev) => [...prev, ...newParticles]);
    const maxDur = Math.max(...newParticles.map((p) => p.dur));
    window.setTimeout(() => {
      const ids = new Set(newParticles.map((p) => p.id));
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, maxDur + 50);
  };

  const triggerShake = (type: "shake" | "celebrate") => {
    setShakeClass(type);
    window.setTimeout(() => setShakeClass(""), 650);
  };

  const showPopup = (text: string) => {
    setScorePopup(text);
    setScorePopupKey((k) => k + 1);
    window.setTimeout(() => setScorePopup(null), 1400);
  };

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
      // Go signal: short warning beep
      playTone(880, 0.08, "square", 0.2);
    }, delay);
  };

  const finishRound = (reactionMs: number) => {
    const nextScores = [...scores, reactionMs];
    setScores(nextScores);

    const isFalseStart = reactionMs === FALSE_START_PENALTY_MS;
    const isSlow = !isFalseStart && reactionMs > 500;
    const isGood = !isFalseStart && reactionMs <= STREAK_THRESHOLD_MS;

    // Streak tracking
    const newStreak = isGood ? streak + 1 : 0;
    setStreak(newStreak);

    // Best score tracking
    const currentBest = prevBestRef.current;
    const isBestUpdate = !isFalseStart && (currentBest === null || reactionMs < currentBest);
    if (isBestUpdate) prevBestRef.current = reactionMs;

    // Shake / particle / sound
    if (isFalseStart || isSlow) {
      triggerShake("shake");
      playTone(110, 0.4, "sawtooth", 0.2);
    } else if (isBestUpdate) {
      spawnParticles(24, true);
      triggerShake("celebrate");
      playFanfare();
    } else {
      spawnParticles(12, false);
      playTone(660, 0.1, "triangle", 0.22);
      window.setTimeout(() => playTone(880, 0.08, "triangle", 0.18), 60);
    }

    // Score popup
    if (!isFalseStart) {
      let label = "";
      if (reactionMs <= 200) label = "⚡ INSANE!";
      else if (reactionMs <= 280) label = "🔥 FAST!";
      else if (reactionMs <= 350) label = "✨ GOOD!";
      else if (reactionMs <= 500) label = "👍 OK";
      showPopup(`+${reactionMs}ms ${label}`);
    }

    if (round >= TOTAL_ROUNDS) {
      setPhase("finished");
      setStatusText("計測完了");

      // Perfect run?
      const allGood = nextScores.every((s) => s !== FALSE_START_PENALTY_MS && s <= STREAK_THRESHOLD_MS);
      if (allGood) {
        window.setTimeout(() => spawnParticles(40, true), 200);
        window.setTimeout(() => spawnParticles(30, true), 550);
      }

      // Rank
      const finalAvg = Math.round(nextScores.reduce((a, b) => a + b, 0) / nextScores.length);
      const finalFs = nextScores.filter((s) => s === FALSE_START_PENALTY_MS).length;
      const rank = getRank(finalAvg, finalFs);
      if (rank) window.setTimeout(() => setRankLabel(rank), 800);
      return;
    }

    setPhase("roundResult");
    setStatusText(`ラウンド ${round} 完了`);
  };

  const startGame = () => {
    setRound(1);
    setScores([]);
    setStreak(0);
    setRankLabel("");
    prevBestRef.current = null;
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
    setStreak(0);
    setRankLabel("");
    prevBestRef.current = null;
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
    <main className={`app${shakeClass ? ` ${shakeClass}` : ""}`}>
      <section className="panel">
        {/* Particle layer */}
        <div className="particleLayer" aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              className="particle"
              style={
                {
                  "--ptx": `${p.tx}px`,
                  "--pty": `${p.ty}px`,
                  "--pdur": `${p.dur}ms`,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

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

        <div className="tapWrapper">
          <button
            className={`tapArea ${phase === "go" ? "go" : "wait"}`}
            onClick={handleTap}
            type="button"
          >
            {phase === "go" ? "TAP" : "WAIT"}
          </button>
          {scorePopup && (
            <div className="scorePopup" key={scorePopupKey}>
              {scorePopup}
            </div>
          )}
        </div>

        {streak >= 2 && phase !== "finished" && (
          <div className="streakWrap">
            <div className="streakBadge">STREAK ×{streak}</div>
          </div>
        )}

        <div className="hud">
          <span>
            Round {Math.min(round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
          </span>
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
            {rankLabel && <p className="rankLabel">{rankLabel}</p>}
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
