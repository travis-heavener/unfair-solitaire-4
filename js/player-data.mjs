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
        case "Classic":
            handicapID = -1;
            break;
        case "Easy":
            handicapID = Math.floor(Math.random() * 8) + 1;
            break;
        case "Normal":
            handicapID = Math.floor(Math.random() * 6) + 9;
            break;
        case "Insane":
            handicapID = Math.floor(Math.random() * 6) + 15;
            break;
    }
    // Update display
    if (handicapID !== -1)
        $("#handicap-id").text("#" + handicapID);
    return handicapID;
};
export const getHandicapID = () => handicapID;
