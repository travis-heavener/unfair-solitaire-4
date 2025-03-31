import { startGame } from "./toolbox.mjs";
$(() => {
    // Bind initial start functions
    $("#begin-btn").one("click", () => {
        if (window.innerWidth < 900) {
            $("#mobile-warning-div").css("display", "flex");
            $("#ignore-mobile-warning-btn").one("click", () => {
                $("#mobile-warning-div").css("display", "");
            });
        }
        // Get selected difficulty
        const difficulty = $("#difficulty-select")[0].value;
        $("#welcome-div").remove(); // Hide welcome content
        startGame(difficulty); // Start game
    });
    // Resize dimensions
    resizeBody();
});
// Update main content sizing dynamically
const resizeBody = () => {
    $("#main-content").css({
        "width": Math.min(window.innerWidth, window.innerHeight * 16 / 9) + "px",
        "height": Math.min(window.innerHeight, window.innerWidth * 9 / 16) + "px"
    });
};
$(window).on("resize", resizeBody);
