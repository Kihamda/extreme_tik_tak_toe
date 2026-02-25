import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

// ─── Web Audio ───────────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === "closed") {
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

function playFlipSound(): void {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // ignore: AudioContext not supported
  }
}

function playMatchSound(): void {
  try {
    const ctx = getCtx();
    const schedule = [
      { delay: 0, freq: 600 },
      { delay: 0.1, freq: 900 },
    ];
    for (const { delay, freq } of schedule) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    }
  } catch {
    // ignore
  }
}

function playMismatchSound(): void {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // ignore
  }
}

function playClearSound(): void {
  try {
    const ctx = getCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      const t = ctx.currentTime + i * 0.12;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch {
    // ignore
  }
}

// Pre-generated confetti data (deterministic spread)
const CONFETTI_PIECES = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left: (i * 1.6807) % 100,
  color: ["#facc15", "#38bdf8", "#f87171", "#4ade80", "#c084fc", "#fb923c"][i % 6],
  animDelay: (i * 0.033) % 2,
  animDuration: 1.5 + (i * 0.027) % 1.5,
}));

type Player = "p1" | "p2";
type Phase = "intro" | "playing";

type CardState = "down" | "up" | "matched";

type Card = {
  id: number;
  symbol: string;
  state: CardState;
  owner: Player | null;
};

type ScoreState = Record<Player, number>;

const SYMBOLS = ["🍙", "🍜", "🍣", "🍛", "🍤", "🍡", "🍓", "🍫"];

const PLAYER_LABEL: Record<Player, string> = {
  p1: "プレイヤー1",
  p2: "プレイヤー2",
};

const nextPlayer = (player: Player): Player => (player === "p1" ? "p2" : "p1");

const shuffle = <T,>(values: T[]): T[] => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const createDeck = (): Card[] => {
  const symbols = shuffle([...SYMBOLS, ...SYMBOLS]);
  return symbols.map((symbol, index) => ({
    id: index,
    symbol,
    state: "down",
    owner: null,
  }));
};

const App = () => {
  const timerRef = useRef<number | null>(null);
  const comboTimerRef = useRef<number | null>(null);
  const comboCountRef = useRef(0);
  const lastMatchPlayerRef = useRef<Player | null>(null);

  const [phase, setPhase] = useState<Phase>("intro");
  const [cards, setCards] = useState<Card[]>(() => createDeck());
  const [turn, setTurn] = useState<Player>("p1");
  const [scores, setScores] = useState<ScoreState>({ p1: 0, p2: 0 });
  const [opened, setOpened] = useState<number[]>([]);
  const lockBoard = opened.length === 2;
  const isFinished =
    phase === "playing" && cards.every((card) => card.state === "matched");

  // ── エフェクト状態 ─────────────────────────────────────────────────────────
  const [matchAnim, setMatchAnim] = useState<ReadonlySet<number>>(new Set());
  const [mismatchShake, setMismatchShake] = useState(false);
  const [clearShake, setClearShake] = useState(false);
  const [comboDisplay, setComboDisplay] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [matchPopupPlayer, setMatchPopupPlayer] = useState<Player | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      if (comboTimerRef.current !== null) {
        window.clearTimeout(comboTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (opened.length !== 2) {
      return;
    }

    const [firstIndex, secondIndex] = opened;
    const first = cards[firstIndex];
    const second = cards[secondIndex];

    if (!first || !second) {
      return;
    }

    const isMatch = first.symbol === second.symbol;

    timerRef.current = window.setTimeout(() => {
      if (isMatch) {
        setCards((prev) =>
          prev.map((card, index) => {
            if (index !== firstIndex && index !== secondIndex) {
              return card;
            }

            return {
              ...card,
              state: "matched",
              owner: turn,
            };
          }),
        );

        setScores((prev) => ({
          ...prev,
          [turn]: prev[turn] + 1,
        }));

        // ── マッチエフェクト ──────────────────────────────────────────────
        playMatchSound();
        setMatchAnim(new Set([firstIndex, secondIndex]));
        window.setTimeout(() => setMatchAnim(new Set()), 700);
        setMatchPopupPlayer(turn);
        window.setTimeout(() => setMatchPopupPlayer(null), 1200);

        // コンボ更新
        if (lastMatchPlayerRef.current === turn) {
          comboCountRef.current += 1;
        } else {
          comboCountRef.current = 1;
        }
        lastMatchPlayerRef.current = turn;

        if (comboCountRef.current >= 2) {
          setComboDisplay(comboCountRef.current);
          setShowCombo(true);
          if (comboTimerRef.current !== null) {
            window.clearTimeout(comboTimerRef.current);
          }
          comboTimerRef.current = window.setTimeout(() => {
            setShowCombo(false);
            comboTimerRef.current = null;
          }, 1500);
        }
      } else {
        setCards((prev) =>
          prev.map((card, index) => {
            if (index !== firstIndex && index !== secondIndex) {
              return card;
            }

            return {
              ...card,
              state: "down",
            };
          }),
        );

        setTurn((prev) => nextPlayer(prev));

        // ── ミスマッチエフェクト ──────────────────────────────────────────
        playMismatchSound();
        setMismatchShake(true);
        window.setTimeout(() => setMismatchShake(false), 500);

        // ミスでコンボリセット
        comboCountRef.current = 0;
        lastMatchPlayerRef.current = null;
      }

      setOpened([]);
      timerRef.current = null;
    }, 700);
  }, [cards, opened, turn]);

  // ── ゲームクリア演出 ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFinished) {
      return;
    }
    const t0 = window.setTimeout(() => {
      playClearSound();
      setShowConfetti(true);
      setShowWinnerPopup(true);
      setClearShake(true);
    }, 0);
    const t1 = window.setTimeout(() => setClearShake(false), 600);
    const t2 = window.setTimeout(() => setShowConfetti(false), 4000);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isFinished]);

  const startGame = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (comboTimerRef.current !== null) {
      window.clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }

    // エフェクト状態リセット
    setMatchAnim(new Set());
    setMismatchShake(false);
    setClearShake(false);
    setComboDisplay(0);
    setShowCombo(false);
    setMatchPopupPlayer(null);
    setShowConfetti(false);
    setShowWinnerPopup(false);
    comboCountRef.current = 0;
    lastMatchPlayerRef.current = null;

    setCards(createDeck());
    setTurn("p1");
    setScores({ p1: 0, p2: 0 });
    setOpened([]);
    setPhase("playing");
  };

  const handleCardClick = (index: number) => {
    if (phase !== "playing" || isFinished || lockBoard) {
      return;
    }

    if (opened.length >= 2 || opened.includes(index)) {
      return;
    }

    const target = cards[index];
    if (!target || target.state !== "down") {
      return;
    }

    setCards((prev) =>
      prev.map((card, cardIndex) =>
        cardIndex === index
          ? {
              ...card,
              state: "up",
            }
          : card,
      ),
    );

    playFlipSound();
    setOpened((prev) => [...prev, index]);
  };

  const winnerText = useMemo(() => {
    if (scores.p1 === scores.p2) {
      return "引き分け";
    }

    return scores.p1 > scores.p2 ? "勝者 プレイヤー1" : "勝者 プレイヤー2";
  }, [scores.p1, scores.p2]);

  return (
    <main className={`app${mismatchShake ? " shake" : ""}${clearShake ? " clearShake" : ""}`}>
      {/* コンフェッティオーバーレイ */}
      {showConfetti && (
        <div className="confettiOverlay" aria-hidden="true">
          {CONFETTI_PIECES.map((p) => (
            <span
              key={p.id}
              className="confettiPiece"
              style={{
                left: `${p.left}%`,
                backgroundColor: p.color,
                animationDelay: `${p.animDelay}s`,
                animationDuration: `${p.animDuration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 勝者ポップアップ */}
      {showWinnerPopup && (
        <div
          className="winnerPopup"
          role="status"
          onClick={() => setShowWinnerPopup(false)}
        >
          <span className="winnerIcon">🏆</span>
          <span className="winnerText">{winnerText}</span>
          <span className="winnerSub">クリックで閉じる</span>
        </div>
      )}

      <section className="panel">
        <h1>Memory Duel</h1>
        <p className="subtitle">ローカル2人の神経衰弱バトル</p>

        <div className="ruleBox">
          <h2>ルール</h2>
          <ul>
            <li>1ターンで2枚をめくる</li>
            <li>同じ絵柄なら獲得して連続ターン</li>
            <li>そろわなければ相手のターンへ交代</li>
            <li>最終的に獲得ペア数の多い方が勝ち</li>
          </ul>
        </div>

        {phase === "intro" && (
          <div className="introBlock">
            <p>16枚 8ペアで対戦開始</p>
            <button className="action" type="button" onClick={startGame}>
              対戦開始
            </button>
          </div>
        )}

        {phase !== "intro" && (
          <>
            <p className="statusText">
              {!isFinished && <>手番 {PLAYER_LABEL[turn]}</>}
              {isFinished && <>{winnerText}</>}
            </p>

            {/* コンボ表示 */}
            {showCombo && (
              <div
                className={`comboDisplay${comboDisplay >= 3 ? " onFire" : ""}`}
                aria-live="polite"
              >
                {comboDisplay >= 3 && <span className="fireLabel">🔥 ON FIRE! </span>}
                <span>COMBO ×{comboDisplay}</span>
              </div>
            )}

            <div className="scoreRow">
              {(["p1", "p2"] as const).map((player) => (
                <div
                  key={player}
                  className={`scoreCard${turn === player && !isFinished ? " active" : ""}`}
                >
                  <span>{PLAYER_LABEL[player]}</span>
                  <strong>{scores[player]}</strong>
                  {/* MATCH ポップアップ */}
                  {matchPopupPlayer === player && (
                    <span className="matchPopup" aria-hidden="true">
                      ✨ MATCH!
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="board" role="grid" aria-label="memory duel board">
              {cards.map((card, index) => {
                const faceUp = card.state === "up" || card.state === "matched";
                const ownerClass = card.owner ? `owner-${card.owner}` : "";
                const hasParticle = matchAnim.has(index);

                return (
                  <button
                    key={card.id}
                    className={`card ${faceUp ? "open" : ""} ${card.state === "matched" ? "matched" : ""} ${ownerClass}`}
                    type="button"
                    onClick={() => handleCardClick(index)}
                    disabled={
                      phase !== "playing" ||
                      isFinished ||
                      lockBoard ||
                      card.state !== "down"
                    }
                  >
                    <span>{faceUp ? card.symbol : "?"}</span>
                    {hasParticle && (
                      <span className="particleBurst" aria-hidden="true">
                        {Array.from({ length: 8 }, (_, i) => (
                          <span key={i} className={`particle p${i}`} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="actionRow">
              <button className="action" type="button" onClick={startGame}>
                もう一戦
              </button>
              <button
                className="action secondary"
                type="button"
                onClick={() => setPhase("intro")}
              >
                タイトルへ
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default App;
