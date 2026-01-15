
export type GameStatus = 'landing' | 'playing' | 'won' | 'lost' | 'loading';

export interface GameState {
  targetWord: string;
  guessedLetters: Set<string>;
  fails: string[];
  status: GameStatus;
  definition: string;
}

export const MAX_FAILS = 8;
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
