import { cards, clearMoveHistory, cycleDeckToNext, generateCards, resetMoves, resetScore, startGameClock, undoLastMove } from "./toolbox.mjs";

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

    // Reset control elements
    $("#score-display").text(0);
    $("#moves-display").text(0);
    $("#time-display").text("0:00");

    // Reset state & stats
    clearMoveHistory();
    resetScore();
    resetMoves();

    // Clear board
    while (cards.length) cards.pop().remove();

    // Generate cards
    generateCards(cards);

    // Fill tableau
    const jTalbleaus = [...$(".tableau")];
    const jStock = $("#stock");
    for (let c = 0, i = 0; c < 7; ++c) {
        for (let r = 0; r < c+1; ++r) {
            const card = cards[i++];
            jTalbleaus[c].append( card.getElement() );
            if (r === c) card.uncover(); // Uncover top card
        }
    }

    // Push remaining cards to the deck
    for (let i = 51; i >= 28; --i)
        jStock.append(cards[i].getElement());

    // Start clock
    startGameClock();
};

// Expose globally
globalThis.restartGame = startGame;