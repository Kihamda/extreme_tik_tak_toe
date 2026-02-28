import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// ─── Types ────────────────────────────────────────────────────────────────────
type MoleType = "normal" | "golden" | "bomb";
type GamePhase = "idle" | "playing" | "gameover";

interface MoleData {
  active: boolean;
  type: MoleType;
  hitAnim: boolean;
}

interface ScorePopup {
  id: number;
  x: number;
  y: number;
  value: number;
  isBomb: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const HOLE_COUNT = 9;
const GAME_DURATION = 60;
const HIGH_SCORE_KEY = "molemania_highscore";
const BASE_SPAWN_INTERVAL = 800;

const MOLE_EMOJI: Record<MoleType, string> = {
  normal: "🐹",
  golden: "🏅",
  bomb: "💣",
};

const MOLE_POINTS: Record<MoleType, number> = {
  normal: 10,
  golden: 30,
  bomb: -20,
};

const BASE_VISIBLE_DURATION: Record<MoleType, number> = {
  normal: 800,
  golden: 500,
  bomb: 700,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSpeedFactor(elapsed: number): number {
  // 1.0 at start → 2.5 at 60 s
  return 1 + (elapsed / GAME_DURATION) * 1.5;
}

function makeMoles(): MoleData[] {
  return Array.from({ length: HOLE_COUNT }, () => ({
    active: false,
    type: "normal" as MoleType,
    hitAnim: false,
  }));
}

// ─── Web Audio ────────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playNormalHit(): void {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.28, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

function playGoldenHit(): void {
  const ctx = getAudioCtx();
  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    const t = ctx.currentTime + i * 0.09;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.start(t);
    osc.stop(t + 0.18);
  });
}

function playBombHit(): void {
  const ctx = getAudioCtx();
  const bufferSize = Math.ceil(ctx.sampleRate * 0.3);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  src.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  src.start(ctx.currentTime);
}

function playCombo(): void {
  const ctx = getAudioCtx();
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    const t = ctx.currentTime + i * 0.07;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
const App = () => {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [moles, setMoles] = useState<MoleData[]>(makeMoles());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [combo, setCombo] = useState(0);
  const [popups, setPopups] = useState<ScorePopup[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shaking, setShaking] = useState(false);
  const [fever, setFever] = useState(false);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  // mutable refs that don't trigger re-renders
  const popupIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const startTimeRef = useRef(0);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moleTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  // ref holding current spawn fn to allow self-recursion without stale closure
  const spawnMoleFnRef = useRef<() => void>(() => undefined);

  // ── Timer cleanup ────────────────────────────────────────────────────────
  const clearAllTimers = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    moleTimersRef.current.forEach((t) => clearTimeout(t));
    moleTimersRef.current.clear();
  }, []);

  // ── End game ─────────────────────────────────────────────────────────────
  const endGame = useCallback(() => {
    clearAllTimers();
    setPhase("gameover");
    setMoles(makeMoles());
    const finalScore = scoreRef.current;
    setHighScore((prev) => {
      const next = Math.max(prev, finalScore);
      localStorage.setItem(HIGH_SCORE_KEY, String(next));
      return next;
    });
  }, [clearAllTimers]);

  // ── Spawn logic ──────────────────────────────────────────────────────────
  const doSpawn = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const factor = getSpeedFactor(elapsed);

    // Capture spawn result outside the updater so we can run side effects after
    let spawnIdx: number | null = null;
    let spawnType: MoleType = "normal";

    setMoles((prev) => {
      const freeIdxs = prev.reduce<number[]>((acc, m, i) => {
        if (!m.active) acc.push(i);
        return acc;
      }, []);
      if (freeIdxs.length === 0) return prev;

      spawnIdx = freeIdxs[Math.floor(Math.random() * freeIdxs.length)];
      const r = Math.random();
      spawnType = r < 0.15 ? "golden" : r < 0.3 ? "bomb" : "normal";

      return prev.map((m, i) =>
        i === spawnIdx ? { active: true, type: spawnType, hitAnim: false } : m,
      );
    });

    // Register auto-hide timer outside the updater (side effect)
    if (spawnIdx !== null) {
      const idx = spawnIdx;
      const duration = BASE_VISIBLE_DURATION[spawnType] / factor;
      const t = setTimeout(() => {
        let missed = false;
        setMoles((cur) => {
          if (!cur[idx].active || cur[idx].hitAnim) return cur;
          missed = true;
          return cur.map((m, i) =>
            i === idx ? { ...m, active: false } : m,
          );
        });
        // reset combo outside the updater
        if (missed) {
          comboRef.current = 0;
          setCombo(0);
        }
      }, duration);
      moleTimersRef.current.set(idx, t);
    }

    const interval = BASE_SPAWN_INTERVAL / factor;
    spawnTimerRef.current = setTimeout(spawnMoleFnRef.current, interval);
  }, []);

  // keep the ref in sync with the latest callback (must be in effect, not render)
  useEffect(() => {
    spawnMoleFnRef.current = doSpawn;
  });

  // ── Particles / popups ───────────────────────────────────────────────────
  const addParticles = useCallback((x: number, y: number) => {
    const id = particleIdRef.current++;
    setParticles((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), 700);
  }, []);

  const addPopup = useCallback(
    (x: number, y: number, value: number, isBomb: boolean) => {
      const id = popupIdRef.current++;
      setPopups((prev) => [...prev, { id, x, y, value, isBomb }]);
      setTimeout(
        () => setPopups((prev) => prev.filter((p) => p.id !== id)),
        900,
      );
    },
    [],
  );

  // ── Whack ────────────────────────────────────────────────────────────────
  const whackMole = useCallback(
    (idx: number, e: React.SyntheticEvent<HTMLDivElement>) => {
      // Capture position before React may null currentTarget
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Capture hit info from inside updater (updater runs synchronously)
      let hitPoints = 0;
      let hitType: MoleType | null = null;

      setMoles((prev) => {
        const mole = prev[idx];
        if (!mole.active || mole.hitAnim) return prev;
        hitPoints = MOLE_POINTS[mole.type];
        hitType = mole.type;
        return prev.map((m, i) =>
          i === idx ? { ...m, hitAnim: true } : m,
        );
      });

      // No hit registered (already inactive / animating)
      if (hitType === null) return;

      const isBomb = hitType === "bomb";

      // All side effects outside the updater
      scoreRef.current = Math.max(0, scoreRef.current + hitPoints);
      setScore(scoreRef.current);

      if (isBomb) {
        comboRef.current = 0;
        setCombo(0);
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        playBombHit();
      } else {
        comboRef.current += 1;
        const newCombo = comboRef.current;
        setCombo(newCombo);
        if (newCombo >= 5 && newCombo % 5 === 0) {
          setFever(true);
          playCombo();
          setTimeout(() => setFever(false), 900);
        } else if (hitType === "golden") {
          playGoldenHit();
        } else {
          playNormalHit();
        }
      }

      addParticles(cx, cy);
      addPopup(cx, cy, hitPoints, isBomb);

      // cancel auto-hide timer
      const existing = moleTimersRef.current.get(idx);
      if (existing !== undefined) {
        clearTimeout(existing);
        moleTimersRef.current.delete(idx);
      }

      // hit animation → deactivate
      setTimeout(() => {
        setMoles((cur) =>
          cur.map((m, i) =>
            i === idx ? { ...m, active: false, hitAnim: false } : m,
          ),
        );
      }, 280);
    },
    [addParticles, addPopup],
  );

  // ── Start game ───────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    clearAllTimers();
    setPhase("playing");
    setMoles(makeMoles());
    scoreRef.current = 0;
    setScore(0);
    comboRef.current = 0;
    setCombo(0);
    setTimeLeft(GAME_DURATION);
    setPopups([]);
    setParticles([]);
    setShaking(false);
    setFever(false);
    startTimeRef.current = Date.now();

    tickTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    spawnTimerRef.current = setTimeout(spawnMoleFnRef.current, BASE_SPAWN_INTERVAL);
  }, [clearAllTimers, endGame]);

  // cleanup on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const timePercent = (timeLeft / GAME_DURATION) * 100;
  const timerColor =
    timePercent > 50 ? "#4ade80" : timePercent > 25 ? "#facc15" : "#f87171";

  return (
    <div className={`app${shaking ? " shake" : ""}`}>
      {/* ── Idle screen ── */}
      {phase === "idle" && (
        <div className="screen">
          <h1 className="title">🐹 Mole Mania</h1>
          <p className="desc">叩いて叩いて叩きまくれ</p>
          {highScore > 0 && <p className="hi">Best: {highScore}</p>}
          <button className="btn-start" onClick={startGame}>
            START
          </button>
        </div>
      )}

      {/* ── Game over screen ── */}
      {phase === "gameover" && (
        <div className="screen">
          <h1 className="title">Time Up!</h1>
          <p className="final-score">{score}</p>
          <p className="score-unit">点</p>
          {score > 0 && score >= highScore && (
            <p className="new-record">NEW RECORD!</p>
          )}
          <p className="hi">Best: {highScore}</p>
          <button className="btn-start" onClick={startGame}>
            RETRY
          </button>
        </div>
      )}

      {/* ── Playing ── */}
      {phase === "playing" && (
        <div className="game-wrap">
          {/* HUD */}
          <div className="hud">
            <div className="hud-block">
              <span className="hud-label">SCORE</span>
              <span className="hud-value">{score}</span>
            </div>

            <div className="hud-center">
              {combo > 1 && (
                <div className={`combo${fever ? " fever" : ""}`}>
                  {fever ? "🔥 FEVER!" : `x${combo} COMBO`}
                </div>
              )}
            </div>

            <div className="hud-block">
              <span className="hud-label">TIME</span>
              <span className="hud-value">{timeLeft}</span>
            </div>
          </div>

          {/* Time bar */}
          <div className="time-bar-track">
            <div
              className="time-bar-fill"
              style={{ width: `${timePercent}%`, background: timerColor }}
            />
          </div>

          {/* Grid */}
          <div className="grid">
            {moles.map((mole, i) => (
              <div key={i} className="hole-wrap">
                <div className="hole" />
                {mole.active && (
                  <div
                    className={`mole mole-${mole.type}${mole.hitAnim ? " squish" : " rising"}`}
                    onClick={(e) => !mole.hitAnim && whackMole(i, e)}
                    onTouchStart={(e) => !mole.hitAnim && whackMole(i, e)}
                  >
                    {MOLE_EMOJI[mole.type]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Particles ── */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle-root"
          style={{ left: p.x, top: p.y }}
        >
          {(["✨", "⭐", "✨", "⭐"] as const).map((s, i) => (
            <span key={i} className={`particle p${i}`}>
              {s}
            </span>
          ))}
        </div>
      ))}

      {/* ── Score popups ── */}
      {popups.map((pop) => (
        <div
          key={pop.id}
          className={`score-popup${pop.isBomb ? " popup-bomb" : pop.value >= 30 ? " popup-gold" : ""}`}
          style={{ left: pop.x, top: pop.y }}
        >
          {pop.value > 0 ? `+${pop.value}` : pop.value}
        </div>
      ))}
    </div>
  );
};

export default App;
