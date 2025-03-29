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
