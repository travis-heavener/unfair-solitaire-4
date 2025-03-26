import { cards, cardStacks, cycleDeckToNext, generateCards } from "./toolbox.mjs";
$(() => {
    // Load events
    // Bind cycle deck to deck-stack
    $("#deck-stack").on("click", () => cycleDeckToNext());
    // Start game
    startGame();
});
// Invoke to start the game
const startGame = () => {
    // Clear board
    while (cards.length)
        cards.pop().remove();
    // Generate cards
    generateCards(cards);
    // Fill columns
    for (let c = 0, i = 0; c < 7; ++c) {
        for (let r = 0; r < c + 1; ++r) {
            const card = cards[i++];
            cardStacks.board[c].push(card);
            // Uncover top card
            if (r === c)
                card.uncover();
        }
    }
    // Push remaining cards to the deck
    for (let i = 51; i >= 28; --i)
        cardStacks.deck.push(cards[i]);
};
// Expose globally
globalThis.restartGame = startGame;
