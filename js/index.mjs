import { startGame } from "./toolbox.mjs";
$(() => {
    // Bind initial start functions
    $("#begin-btn").one("click", () => {
        // Get selected difficulty
        const difficulty = $("#difficulty-select")[0].value;
        $("#welcome-div").remove(); // Hide welcome content
        startGame(difficulty); // Start game
    });
});
