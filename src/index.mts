import { cards, cardStacks, clearMoveHistory, cycleDeckToNext, generateCards, startGameClock, undoLastMove } from "./toolbox.mjs";

$(() => {
    // Load events

    // Bind cycle deck to stock
    $("#stock").on("click", () => cycleDeckToNext());

    // Bind play again button
    $("#play-again-btn").on("click", () => startGame());

    // Bind undo button
    $("#undo-btn").on("click", () => undoLastMove());

    // Start game
    startGame();
});

// Invoke to start the game
const startGame = () => {
    // Hide win screen
    $("#win-container").css("display", "");

    // Clear move history
    clearMoveHistory();

    // Clear board
    while (cards.length) cards.pop().remove();

    // Generate cards
    generateCards(cards);

    // Fill tableau
    for (let c = 0, i = 0; c < 7; ++c) {
        for (let r = 0; r < c+1; ++r) {
            const card = cards[i++];
            cardStacks.board[c].push( card );

            // Uncover top card
            if (r === c) card.uncover();
        }
    }

    // Push remaining cards to the deck
    for (let i = 51; i >= 28; --i)
        cardStacks.stock.push(cards[i]);

    // Start clock
    startGameClock();
};

// Expose globally
globalThis.restartGame = startGame;