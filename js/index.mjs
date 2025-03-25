import { generateCards } from "./toolbox.mjs";
$(() => {
    // Load events
    startGame();
});
// Invoke to start the game
const startGame = () => {
    // Clear board
    // Generate cards
    const cards = [];
    generateCards(cards);
    console.log(cards);
};
