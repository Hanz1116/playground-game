export type Category = 
    'aces' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes' |
    'threeOfAKind' | 'fourOfAKind' | 'fullHouse' | 'smallStraight' | 'largeStraight' | 'yahtzee' | 'chance';

export type Scores = {
    [key in Category]: number | null;
} & {
    yahtzeeBonus: number;
};

export interface Player {
    id: 1 | 2;
    name: string;
    avatar: string; // Should be 'dog' or 'rabbit'
    scores: Scores;
}

export enum GameStatus {
    SETUP,
    IN_PROGRESS,
    GAME_OVER,
}

export type AvatarState = 'idle' | 'thinking' | 'happy' | 'sad' | 'celebrate';

export type AchievementId = 'perfectPair' | 'firstYahtzee' | 'dynamicDuo';

export interface GameState {
    players: [Player, Player];
    gameStatus: GameStatus;
    currentPlayerId: 1 | 2;
    currentRound: number;
    rollsLeft: number;
    dice: number[];
    heldDice: boolean[];
    potentialScores: { [key in Category]?: number };
    avatarStates: { 1: AvatarState; 2: AvatarState };
    emote: { targetPlayerId: 1 | 2; message: string; id: number } | null;
    unlockedAchievements: AchievementId[];
}

// Types for Matching Game
export interface CardData {
    id: number;
    icon: string;
    isFlipped: boolean;
    isMatched: boolean;
}

export interface MatchingPlayer {
    id: 1 | 2;
    name: string;
    avatar: string;
    score: number;
}

export interface MatchingGameState {
    players: [MatchingPlayer, MatchingPlayer];
    gameStatus: GameStatus;
    currentPlayerId: 1 | 2;
    grid: CardData[];
    flippedIndices: number[];
    isChecking: boolean; // To prevent clicking while checking for a match
}

// Types for Dots & Boxes Game
export interface DotsAndBoxesPlayer {
    id: 1 | 2;
    name: string;
    avatar: string;
    score: number;
}

export interface DotsAndBoxesGameState {
    players: [DotsAndBoxesPlayer, DotsAndBoxesPlayer];
    gameStatus: GameStatus;
    currentPlayerId: 1 | 2;
    gridSize: number;
    horizontalLines: (1 | 2 | null)[][];
    verticalLines: (1 | 2 | null)[][];
    boxes: (1 | 2 | null)[][];
}

// Types for Shut the Box Game
export interface Tile {
    number: number;
    isOpen: boolean;
}

export interface ShutTheBoxPlayer {
    id: 1 | 2;
    name: string;
    avatar: string;
    score: number | null; // Sum of remaining tiles at end of turn
    tiles: Tile[];
}

export interface ShutTheBoxGameState {
    players: [ShutTheBoxPlayer, ShutTheBoxPlayer];
    gameStatus: GameStatus;
    currentPlayerId: 1 | 2;
    dice: [number, number];
    selectedTileNumbers: number[];
    turnPhase: 'ROLL' | 'SELECT' | 'NO_MOVES' | 'TURN_OVER';
    useOneDie: boolean;
    isRolling: boolean;
}

// Types for Word Ladder Game
export interface WordLadderPlayer {
    id: 1 | 2;
    name: string;
    avatar: string;
}

export interface WordHistoryItem {
    word: string;
    playerId: 1 | 2;
}

export interface WordLadderGameState {
    players: [WordLadderPlayer, WordLadderPlayer];
    gameStatus: GameStatus;
    currentPlayerId: 1 | 2;
    startWord: string;
    endWord: string;
    wordHistory: WordHistoryItem[];
    errorMessage: string | null;
    winner: WordLadderPlayer | null;
}

// Types for Battleship Game
export interface BattleshipShip {
    id: number;
    length: number;
    positions: [number, number][]; // [x, y] cells the ship occupies
    hits: number;
}

export interface BattleshipShot {
    x: number;
    y: number;
    hit: boolean;
}

export interface BattleshipBoard {
    ships: BattleshipShip[];
    shotsReceived: BattleshipShot[]; // shots fired AT this board
}

export interface BattleshipPlayer {
    id: 1 | 2;
    name: string;
    avatar: string;
    board: BattleshipBoard;
}

export type BattleshipPhase =
    | 'PLACING'        // currentPlayerId is placing ships
    | 'HANDOFF_PLACE'  // pass device to currentPlayerId to place
    | 'HANDOFF_FIRE'   // pass device to currentPlayerId to fire
    | 'FIRING'         // currentPlayerId is choosing a target
    | 'SHOT_RESULT';   // showing the result of a shot before handoff

export interface BattleshipGameState {
    players: [BattleshipPlayer, BattleshipPlayer];
    gameStatus: GameStatus;
    currentPlayerId: 1 | 2;
    phase: BattleshipPhase;
    lastShot: { x: number; y: number; hit: boolean; sunkShipId: number | null } | null;
}