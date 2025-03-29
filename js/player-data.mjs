// Stores data relating to player functions
// Player scoring
let playerScore = 0;
export const addScore = (pts) => $("#score-display").text(playerScore += pts);
export const getScore = () => playerScore;
export const resetScore = () => $("#score-display").text(playerScore = 0);
// Player moves tracking
let playerMoves = 0;
export const incrementMoves = () => $("#moves-display").text(++playerMoves);
export const resetMoves = () => $("#moves-display").text(playerMoves = 0);
export const getHighScore = () => parseInt(localStorage.getItem("uf4.highScore") ?? "0");
export const setHighScore = (score) => localStorage.setItem("uf4.highScore", score + "");
let difficulty;
export const setDifficulty = (diff) => difficulty = diff;
export const getDifficulty = () => difficulty;
// Selects a random handicap
let handicapID;
export const setRandomHandicapID = () => {
    switch (difficulty) {
        case "Classic": return handicapID = -1;
        case "Easy": return handicapID = Math.floor(Math.random() * 8) + 1;
        case "Normal": return handicapID = Math.floor(Math.random() * 6) + 9;
        case "Insane": return handicapID = Math.floor(Math.random() * 6) + 15;
    }
};
export const getHandicapID = () => handicapID;
