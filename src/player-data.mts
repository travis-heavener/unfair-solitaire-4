// Stores data relating to player functions

// Player scoring
let playerScore = 0;
export const addScore = (pts: number) => $("#score-display").text(playerScore += pts);
export const getScore = (): number => playerScore;
export const resetScore = () => $("#score-display").text(playerScore = 0);

// Player moves tracking
let playerMoves = 0;
export const incrementMoves = () => $("#moves-display").text(++playerMoves);
export const resetMoves = () => $("#moves-display").text(playerMoves = 0);

export const getHighScore = (): number => parseInt(localStorage.getItem("uf4.highScore") ?? "0");
export const setHighScore = (score: number) => localStorage.setItem("uf4.highScore", score + "");

// Difficulty information
export type DifficultyType = "Classic" | "Easy" | "Normal" | "Insane";
let difficulty: DifficultyType;
export const setDifficulty = (diff: DifficultyType) => difficulty = diff;
export const getDifficulty = (): DifficultyType => difficulty;