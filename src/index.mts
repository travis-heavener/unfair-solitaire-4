import { DifficultyType } from "./player-data.mjs";
import { startGame } from "./toolbox.mjs";

$(() => {
    // Bind initial start functions
    $("#begin-btn").one("click", () => {
        // Get selected difficulty
        const difficulty = ($("#difficulty-select")[0] as HTMLSelectElement).value;
        $("#welcome-div").remove(); // Hide welcome content
        startGame(difficulty as DifficultyType); // Start game
    });
});