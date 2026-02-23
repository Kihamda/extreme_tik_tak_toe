export type CellValue = string | null;
export type Board = CellValue[][];

export interface Player {
  name: string;
  mark: string;
  color: string;
}

export type GameMode = "classic" | "gravity";

export interface GameSettings {
  board: {
    width: number;
    height: number;
  };
  players: Player[];
  winLength: number;
  gameMode: GameMode;
}

type AppPhase = "before" | "in_progress" | "after";

export interface PersistedState {
  appState: AppPhase;
  gameSettings: GameSettings;
  board: Board;
  currentPlayerIndex: number;
  winner: string | null;
}

export interface DevicePreferences {
  confirmationMode: boolean;
  lastGameSettings: GameSettings;
}

export interface PendingMove {
  row: number;
  col: number;
}

export type GamePhase = AppPhase;
