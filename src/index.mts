import { cycleDeckToNext, handleResetMouseDown, startGame, undoLastMove } from "./toolbox.mjs";

$(() => {
    // Load events
    $("#stock").on("click", () => cycleDeckToNext()); // Bind cycle deck to stock
    $("#play-again-btn").on("click", () => startGame()); // Bind play again button
    $("#undo-btn").on("click", () => undoLastMove()); // Bind undo button

    // Bind reset button
    $("#reset-btn").on("mousedown", () => handleResetMouseDown());

    // Start game
    startGame();
});