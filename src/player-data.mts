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

// Selects a random handicap
let handicapID: number;
const easyDifficulties = [1, 2, 3, 4, 5, 6, 7, 8];
const normalDifficulties = [9, 10, 11, 12, 13, 14, 21];
const insaneDifficulties = [15, 16, 17, 18, 19, 20];
export const setRandomHandicapID = (): number => {
    switch (difficulty) {
        case "Classic": handicapID = -1; break;
        case "Easy":    handicapID = easyDifficulties.random(); break;
        case "Normal":  handicapID = normalDifficulties.random(); break;
        case "Insane":  handicapID = insaneDifficulties.random(); break;
    }

    // Update display
    if (handicapID !== -1)
        $("#handicap-id").text("#" + handicapID);

    return handicapID;
};
export const getHandicapID = (): number => handicapID;