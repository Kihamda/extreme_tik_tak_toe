import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type Player = "p1" | "p2";
type Phase = "intro" | "playing" | "finished";

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

  const [phase, setPhase] = useState<Phase>("intro");
  const [cards, setCards] = useState<Card[]>(() => createDeck());
  const [turn, setTurn] = useState<Player>("p1");
  const [scores, setScores] = useState<ScoreState>({ p1: 0, p2: 0 });
  const [opened, setOpened] = useState<number[]>([]);
  const [lockBoard, setLockBoard] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
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
      setOpened([]);
      return;
    }

    const isMatch = first.symbol === second.symbol;
    setLockBoard(true);

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
      }

      setOpened([]);
      setLockBoard(false);
      timerRef.current = null;
    }, 700);
  }, [cards, opened, turn]);

  useEffect(() => {
    if (phase !== "playing") {
      return;
    }

    if (cards.every((card) => card.state === "matched")) {
      setPhase("finished");
    }
  }, [cards, phase]);

  const startGame = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setCards(createDeck());
    setTurn("p1");
    setScores({ p1: 0, p2: 0 });
    setOpened([]);
    setLockBoard(false);
    setPhase("playing");
  };

  const handleCardClick = (index: number) => {
    if (phase !== "playing" || lockBoard) {
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

    setOpened((prev) => [...prev, index]);
  };

  const winnerText = useMemo(() => {
    if (scores.p1 === scores.p2) {
      return "引き分け";
    }

    return scores.p1 > scores.p2 ? "勝者 プレイヤー1" : "勝者 プレイヤー2";
  }, [scores.p1, scores.p2]);

  return (
    <main className="app">
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
              {phase === "playing" && <>手番 {PLAYER_LABEL[turn]}</>}
              {phase === "finished" && <>{winnerText}</>}
            </p>

            <div className="scoreRow">
              <div
                className={`scoreCard ${turn === "p1" && phase === "playing" ? "active" : ""}`}
              >
                <span>プレイヤー1</span>
                <strong>{scores.p1}</strong>
              </div>
              <div
                className={`scoreCard ${turn === "p2" && phase === "playing" ? "active" : ""}`}
              >
                <span>プレイヤー2</span>
                <strong>{scores.p2}</strong>
              </div>
            </div>

            <div className="board" role="grid" aria-label="memory duel board">
              {cards.map((card, index) => {
                const faceUp = card.state === "up" || card.state === "matched";
                const ownerClass = card.owner ? `owner-${card.owner}` : "";

                return (
                  <button
                    key={card.id}
                    className={`card ${faceUp ? "open" : ""} ${card.state === "matched" ? "matched" : ""} ${ownerClass}`}
                    type="button"
                    onClick={() => handleCardClick(index)}
                    disabled={
                      phase !== "playing" || lockBoard || card.state !== "down"
                    }
                  >
                    <span>{faceUp ? card.symbol : "?"}</span>
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
