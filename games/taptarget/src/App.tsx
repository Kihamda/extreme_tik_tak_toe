import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type TargetType = "normal" | "golden" | "bomb";
type GamePhase = "idle" | "playing" | "gameover";
type SoundType = "hit" | "perfect" | "golden" | "bomb" | "miss";

interface Target {
  id: string;
  x: number;        // % from left
  y: number;        // % from top
  type: TargetType;
  spawnedAt: number;
  lifetime: number; // ms until fully shrunk
  baseSize: number; // initial diameter px
}

interface Particle {
  id: string;
  x: number;
  y: number;
  angle: number;  // degrees
  color: string;
  delay: number;  // animation-delay seconds
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  isPerfect: boolean;
}

/** Target enriched with its pre-computed size for the current render frame */
interface DisplayTarget extends Target {
  currentSizePx: number;
}

interface MutableGameState {
  targets: Target[];
  score: number;
  misses: number;
  timeLeft: number;
  combo: number;
  lastSpawnAt: number;
  nextSpawnInterval: number;
  timeSinceLastTick: number;
  elapsedMs: number;
}

interface DisplayState {
  phase: GamePhase;
  targets: DisplayTarget[];
  score: number;
  misses: number;
  timeLeft: number;
  combo: number;
  particles: Particle[];
  floatingTexts: FloatingText[];
  shaking: boolean;
  highScore: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_MISSES = 5;
const GAME_DURATION = 60;
const BASE_SIZE = 80;
const HS_KEY = "taptarget_highscore";

function loadHighScore(): number {
  return parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
}

function saveHighScore(score: number): void {
  const prev = loadHighScore();
  if (score > prev) localStorage.setItem(HS_KEY, String(score));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function pickType(): TargetType {
  const r = Math.random();
  if (r < 0.10) return "bomb";
  if (r < 0.25) return "golden";
  return "normal";
}

/** 0 = just expired, 1 = just spawned */
function sizeRatio(target: Target, now: number): number {
  return Math.max(0, 1 - (now - target.spawnedAt) / target.lifetime);
}

function currentSize(target: Target, now: number): number {
  return target.baseSize * sizeRatio(target, now);
}

// ─── Web Audio synthesis ──────────────────────────────────────────────────────

function synthesize(ctx: AudioContext, type: SoundType): void {
  const t = ctx.currentTime;
  switch (type) {
    case "hit": {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = 880;
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t); osc.stop(t + 0.12);
      break;
    }
    case "perfect": {
      [1047, 1319].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.frequency.value = freq;
        const start = t + i * 0.09;
        g.gain.setValueAtTime(0.3, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        osc.start(start); osc.stop(start + 0.18);
      });
      break;
    }
    case "golden": {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(2400, t + 0.15);
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.2);
      break;
    }
    case "bomb": {
      const bufSize = Math.floor(ctx.sampleRate * 0.35);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.15));
      }
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();
      filter.type = "lowpass"; filter.frequency.value = 400;
      src.buffer = buf;
      src.connect(filter); filter.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.5, t);
      src.start(t);
      break;
    }
    case "miss": {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = 220;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t); osc.stop(t + 0.22);
      break;
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const App = () => {
  // ── Audio context (lazy-init on first interaction)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudio = useCallback((): AudioContext | null => {
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new AudioContext(); } catch { return null; }
    }
    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    const ctx = getAudio();
    if (ctx) synthesize(ctx, type);
  }, [getAudio]);

  // ── Mutable game state in ref (no stale-closure issues)
  const gsRef = useRef<MutableGameState>({
    targets: [], score: 0, misses: 0, timeLeft: GAME_DURATION,
    combo: 0, lastSpawnAt: 0, nextSpawnInterval: 1200,
    timeSinceLastTick: 0, elapsedMs: 0,
  });

  const phaseRef     = useRef<GamePhase>("idle");
  const rafRef       = useRef<number>(0);
  const lastTsRef    = useRef<number>(0);
  const particlesRef  = useRef<Particle[]>([]);
  const textsRef      = useRef<FloatingText[]>([]);
  const shakingRef    = useRef(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── React display state (drives renders)
  const [display, setDisplay] = useState<DisplayState>({
    phase: "idle", targets: [] as DisplayTarget[], score: 0, misses: 0,
    timeLeft: GAME_DURATION, combo: 0, particles: [],
    floatingTexts: [], shaking: false, highScore: loadHighScore(),
  });

  // ── Shake helper
  const triggerShake = useCallback(() => {
    shakingRef.current = true;
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => { shakingRef.current = false; }, 500);
  }, []);

  // ── Particle spawn
  const spawnParticles = useCallback((x: number, y: number, type: TargetType) => {
    const palette =
      type === "golden" ? ["#FFD700", "#FFA500", "#FFEC5C"] :
      type === "bomb"   ? ["#FF4500", "#FF6347", "#DC143C"] :
                          ["#FF6B6B", "#FFFFFF", "#FF9F43"];
    const newOnes: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: uid(), x, y,
      angle: i * 45,
      color: palette[i % palette.length],
      delay: i * 0.04,
    }));
    particlesRef.current = [...particlesRef.current, ...newOnes];
    setTimeout(() => {
      const ids = new Set(newOnes.map(p => p.id));
      particlesRef.current = particlesRef.current.filter(p => !ids.has(p.id));
    }, 900);
  }, []);

  // ── Floating text spawn
  const addText = useCallback((
    text: string, x: number, y: number, color: string, isPerfect = false
  ) => {
    const ft: FloatingText = { id: uid(), text, x, y, color, isPerfect };
    textsRef.current = [...textsRef.current, ft];
    setTimeout(() => {
      textsRef.current = textsRef.current.filter(f => f.id !== ft.id);
    }, 1100);
  }, []);

  // ── sync helper (called every RAF frame)
  const syncDisplay = useCallback(() => {
    const gs  = gsRef.current;
    const now = performance.now();
    setDisplay({
      phase: "playing",
      targets: gs.targets.map(t => ({ ...t, currentSizePx: currentSize(t, now) })),
      score:        gs.score,
      misses:       gs.misses,
      timeLeft:     gs.timeLeft,
      combo:        gs.combo,
      particles:    [...particlesRef.current],
      floatingTexts:[...textsRef.current],
      shaking:      shakingRef.current,
      highScore:    loadHighScore(),
    });
  }, []);

  // ── Game over
  const endGame = useCallback(() => {
    phaseRef.current = "gameover";
    cancelAnimationFrame(rafRef.current);
    triggerShake();
    const gs = gsRef.current;
    saveHighScore(gs.score);
    setDisplay(d => ({
      ...d,
      phase: "gameover",
      score: gs.score,
      highScore: loadHighScore(),
      shaking: true,
    }));
  }, [triggerShake]);

  // ── Game loop (useCallback so deps are explicit; loopRef keeps the latest version)
  const loopRef = useRef<(ts: number) => void>(() => { /* no-op initial */ });

  const gameLoopFn = useCallback((timestamp: number) => {
    if (phaseRef.current !== "playing") return;

    if (lastTsRef.current === 0) lastTsRef.current = timestamp;
    const dt = Math.min(timestamp - lastTsRef.current, 100);
    lastTsRef.current = timestamp;

    const gs  = gsRef.current;
    const now = performance.now();
    gs.elapsedMs         += dt;
    gs.timeSinceLastTick += dt;

    // 1-second countdown
    if (gs.timeSinceLastTick >= 1000) {
      gs.timeSinceLastTick -= 1000;
      gs.timeLeft -= 1;
      if (gs.timeLeft <= 0) { endGame(); return; }
    }

    // Expire targets → miss
    const expired = gs.targets.filter(t => sizeRatio(t, now) <= 0);
    if (expired.length > 0) {
      gs.targets = gs.targets.filter(t => sizeRatio(t, now) > 0);
      gs.misses += expired.length;
      gs.combo = 0;
      for (let i = 0; i < expired.length; i++) playSound("miss");
      if (gs.misses >= MAX_MISSES) { endGame(); return; }
    }

    // Spawn
    const maxTargets = gs.elapsedMs > 30_000 ? 5 : 3;
    if (gs.targets.length < maxTargets && now - gs.lastSpawnAt >= gs.nextSpawnInterval) {
      gs.targets = [...gs.targets, {
        id: uid(),
        x: 10 + Math.random() * 80,
        y: 18 + Math.random() * 67,
        type: pickType(),
        spawnedAt: now,
        lifetime: 1000 + Math.random() * 1000,
        baseSize: BASE_SIZE,
      }];
      gs.lastSpawnAt = now;
      gs.nextSpawnInterval = 700 + Math.random() * 700;
    }

    syncDisplay();
    // Recurse via ref to always use the latest closure
    rafRef.current = requestAnimationFrame(ts => loopRef.current(ts));
  }, [endGame, playSound, syncDisplay]);

  // Keep loopRef up-to-date after each render (avoids stale closure in RAF)
  useEffect(() => {
    loopRef.current = gameLoopFn;
  }, [gameLoopFn]);

  // ── Start / stop RAF based on phase
  useEffect(() => {
    if (display.phase !== "playing") return;
    lastTsRef.current = 0;
    rafRef.current = requestAnimationFrame(ts => loopRef.current(ts));
    return () => cancelAnimationFrame(rafRef.current);
  }, [display.phase]);

  // ── Target click handler
  const handleTargetClick = useCallback((targetId: string) => {
    getAudio(); // ensure AudioContext on first user gesture
    const gs = gsRef.current;
    if (phaseRef.current !== "playing") return;

    const target = gs.targets.find(t => t.id === targetId);
    if (!target) return; // already expired or removed

    const now   = performance.now();
    const ratio = sizeRatio(target, now);
    const pct   = ratio * 100;

    // Remove from active targets
    gs.targets = gs.targets.filter(t => t.id !== targetId);

    let baseScore: number;
    let isPerfect = false;
    let sound: SoundType = "hit";

    if (target.type === "bomb") {
      baseScore = -30;
      sound     = "bomb";
      triggerShake();
      addText("-30", target.x, target.y, "#FF4500");
    } else {
      if (pct > 60)      { baseScore = 10; }
      else if (pct > 30) { baseScore = 20; }
      else               { baseScore = 50; isPerfect = true; }

      if (target.type === "golden") {
        baseScore *= 3;
        sound = "golden";
      } else if (isPerfect) {
        sound = "perfect";
      }

      gs.combo += 1;
    }

    const mult = (target.type !== "bomb")
      ? Math.min(3, 1 + Math.floor(gs.combo / 5) * 0.5)
      : 1;
    const finalScore = Math.round(baseScore * mult);
    gs.score = Math.max(0, gs.score + finalScore);

    playSound(sound);
    spawnParticles(target.x, target.y, target.type);

    if (isPerfect) {
      addText("PERFECT!", target.x, target.y - 6, "#FFD700", true);
    } else if (target.type !== "bomb") {
      const label = target.type === "golden" ? `⭐+${finalScore}` : `+${finalScore}`;
      addText(label, target.x, target.y, target.type === "golden" ? "#FFD700" : "#7BED9F");
    }

    if (gs.combo > 0 && gs.combo % 5 === 0) {
      addText(`${gs.combo} COMBO!`, 50, 45, "#FF6B81");
    }
  }, [getAudio, triggerShake, addText, playSound, spawnParticles]);

  // ── Start game
  const startGame = useCallback(() => {
    particlesRef.current  = [];
    textsRef.current      = [];
    shakingRef.current    = false;
    phaseRef.current      = "playing";
    gsRef.current = {
      targets: [], score: 0, misses: 0, timeLeft: GAME_DURATION,
      combo: 0, lastSpawnAt: 0, nextSpawnInterval: 1200,
      timeSinceLastTick: 0, elapsedMs: 0,
    };
    setDisplay(d => ({
      ...d, phase: "playing", targets: [], score: 0,
      misses: 0, timeLeft: GAME_DURATION, combo: 0,
      particles: [], floatingTexts: [], shaking: false,
    }));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  const {
    phase, targets, score, misses, timeLeft,
    combo, particles, floatingTexts, shaking, highScore,
  } = display;

  const isNewRecord = phase === "gameover" && score >= highScore && score > 0;

  return (
    <div className={`tt-app${shaking ? " shake" : ""}`}>

      {phase === "idle" && (
        <div className="tt-overlay">
          <h1 className="tt-title">Tap Target</h1>
          <p className="tt-subtitle">縮むターゲットをすばやくタップ</p>
          <ul className="tt-rules">
            <li>🔴 通常: +10 / +20 / +50pts</li>
            <li>⭐ ゴールデン: スコア×3</li>
            <li>💣 爆弾: -30pts（放置OK）</li>
            <li>5ミスでゲームオーバー</li>
          </ul>
          {highScore > 0 && (
            <p className="tt-hs">ベストスコア: {highScore}</p>
          )}
          <button className="tt-btn" onClick={startGame}>スタート</button>
        </div>
      )}

      {phase === "gameover" && (
        <div className="tt-overlay">
          <h1 className="tt-title">GAME OVER</h1>
          <p className="tt-final-score">{score} pts</p>
          {isNewRecord && <p className="tt-new-record">✨ NEW RECORD ✨</p>}
          <p className="tt-hs">ベストスコア: {highScore}</p>
          <button className="tt-btn" onClick={startGame}>もう一度</button>
        </div>
      )}

      {phase === "playing" && (
        <>
          {/* HUD */}
          <div className="tt-hud">
            <span className="tt-hud-score">🎯 {score}</span>
            {combo >= 2 && (
              <span className="tt-hud-combo">×{combo} COMBO</span>
            )}
            <span className={`tt-hud-time${timeLeft <= 10 ? " pulse-red" : ""}`}>
              ⏱ {timeLeft}s
            </span>
            <span className="tt-hud-misses">
              {Array.from({ length: MAX_MISSES }, (_, i) => (
                <span
                  key={i}
                  className={`miss-dot${i < misses ? " filled" : ""}`}
                >
                  ●
                </span>
              ))}
            </span>
          </div>

          {/* Game area */}
          <div className="tt-field">
            {targets.map(t => (
                <button
                  key={t.id}
                  className={`tt-target tt-target--${t.type}`}
                  style={{
                    left:      `${t.x}%`,
                    top:       `${t.y}%`,
                    width:     `${t.currentSizePx}px`,
                    height:    `${t.currentSizePx}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => handleTargetClick(t.id)}
                >
                  {t.type === "golden" ? "⭐" : t.type === "bomb" ? "💣" : ""}
                </button>
            ))}

            {particles.map(p => (
              <div
                key={p.id}
                className="tt-particle"
                style={{
                  left:             `${p.x}%`,
                  top:              `${p.y}%`,
                  "--pt-angle":     `${p.angle}deg`,
                  "--pt-color":     p.color,
                  animationDelay:   `${p.delay}s`,
                } as React.CSSProperties}
              />
            ))}

            {floatingTexts.map(ft => (
              <div
                key={ft.id}
                className={`tt-float${ft.isPerfect ? " tt-float--perfect" : ""}`}
                style={{
                  left:  `${ft.x}%`,
                  top:   `${ft.y}%`,
                  color: ft.color,
                }}
              >
                {ft.text}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default App;
