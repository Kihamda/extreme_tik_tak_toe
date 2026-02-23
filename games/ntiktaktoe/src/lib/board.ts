import type { Board, GameSettings, PendingMove } from "./types";

export const createEmptyBoard = (settings: GameSettings): Board => {
  return Array(settings.board.height)
    .fill(null)
    .map(() => Array(settings.board.width).fill(null));
};

export const cloneBoard = (board: Board): Board => board.map((row) => [...row]);

export const resolveMovePosition = (
  board: Board,
  row: number,
  col: number,
  settings: GameSettings,
): PendingMove | null => {
  const {
    board: { width, height },
    gameMode,
  } = settings;

  if (col < 0 || col >= width || row < 0 || row >= height) {
    return null;
  }

  if (gameMode === "gravity") {
    for (let currentRow = height - 1; currentRow >= 0; currentRow--) {
      if (board[currentRow][col] === null) {
        return { row: currentRow, col };
      }
    }

    return null;
  }

  if (board[row][col] !== null) {
    return null;
  }

  return { row, col };
};

export const checkWin = (
  board: Board,
  row: number,
  col: number,
  mark: string,
  settings: GameSettings,
): boolean => {
  const {
    board: { width, height },
    winLength,
  } = settings;

  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    let count = 1;

    for (let i = 1; i < winLength; i++) {
      const newRow = row + dr * i;
      const newCol = col + dc * i;
      if (
        newRow >= 0 &&
        newRow < height &&
        newCol >= 0 &&
        newCol < width &&
        board[newRow][newCol] === mark
      ) {
        count++;
      } else {
        break;
      }
    }

    for (let i = 1; i < winLength; i++) {
      const newRow = row - dr * i;
      const newCol = col - dc * i;
      if (
        newRow >= 0 &&
        newRow < height &&
        newCol >= 0 &&
        newCol < width &&
        board[newRow][newCol] === mark
      ) {
        count++;
      } else {
        break;
      }
    }

    if (count >= winLength) {
      return true;
    }
  }

  return false;
};
