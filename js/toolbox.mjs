import { Card } from "./card.mjs";
const MAX_HISTORY_LENGTH = 50; // The maximum number of history elements
// Used to generate a new array of cards
const SUITS = ["hearts", "diamonds", "spades", "clubs"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const generateCards = (cards) => {
    for (let s = 0; s < 4; ++s)
        for (let v = 0; v < 13; ++v)
            cards.push(new Card(SUITS[s], VALUES[v]));
    // Shuffle the deck
    shuffleCards(cards);
    cards.forEach((card, i) => card.setIndex(i));
};
// Shuffles an array
const shuffleCards = (arr) => {
    let currentPos = arr.length;
    while (currentPos != 0) {
        const newPos = ~~(Math.random() * currentPos--);
        [arr[currentPos], arr[newPos]] = [arr[newPos], arr[currentPos]];
    }
};
// Generate and store the cards
export const cards = [];
// Returns the numeric card index from an element's data-index attribute
export const getCardIndexFromElem = (elem) => parseInt(elem.getAttribute("data-index"));
// Used to uncover the bottom card in the tableau, if it exists
export const uncoverTopOfColumn = (colNum) => {
    // Get the index of the top card
    const column = $(".tableau")[colNum - 1];
    if (column.lastChild !== null) {
        const index = getCardIndexFromElem(column.lastChild);
        const wasCovered = cards[index].getIsCovered();
        cards[index].uncover(true); // Handles locking the animation on its own
        // Update state & points
        if (wasCovered) {
            updateHistoryState({ "cardIndex": index, "hasBeenCovered": false, "hasBeenUncovered": true, "originalParent": null, "lastPosition": null });
            addScore(5); // Uncovered card in tableau
        }
    }
};
// Returns either red or black based on the SuitType
const getColorFromSuit = (suit) => (suit === "hearts" || suit === "diamonds") ? "red" : "black";
// Returns true if the card can be stacked on the given element, false otherwise
export const canStackOnElem = (card, elem) => {
    if ($(elem).hasClass("foundation")) { // Handle ace stack
        // Verify the card doesn't have children
        if (card.getMovingStackChlidCount() > 1)
            return false;
        // Check if there aren't any cards
        if (elem.childElementCount === 0)
            return card.getValue() === "A";
        // Check top card
        const index = getCardIndexFromElem(elem.lastChild);
        // Force to be same suit
        if (cards[index].getSuit() !== card.getSuit())
            return false;
        // Force top card value to be 1 less than this card
        const existingValue = cards[index].getValue();
        const newValue = card.getValue();
        return (VALUES.indexOf(existingValue) === (VALUES.indexOf(newValue) - 1));
    }
    else { // Handle column
        // Check if there aren't any cards
        if (elem.childElementCount === 0)
            return card.getValue() === "K";
        const index = getCardIndexFromElem(elem.lastChild);
        const existingColor = getColorFromSuit(cards[index].getSuit());
        const newColor = getColorFromSuit(card.getSuit());
        // Force to be different colors
        if (newColor === existingColor)
            return false;
        // Force top card value to be 1 more than this card
        const existingValue = cards[index].getValue();
        const newValue = card.getValue();
        return ((VALUES.indexOf(existingValue) - 1) === VALUES.indexOf(newValue)) || (existingValue === "2" && newValue === "A");
    }
};
// Cycles to the next card in the deck
export const cycleDeckToNext = () => {
    // Abort if animating
    if (isAnimLocked())
        return;
    // Check if the deck is empty
    const stock = $("#stock")[0];
    const waste = $("#waste")[0];
    // Abort if the deck is empty
    if (waste.childElementCount === 0 && stock.childElementCount === 0)
        return;
    // Lock animations
    lockAnimations();
    if (stock.childElementCount === 0) { // Move all cards back from the empty deck
        // Play sound
        playSound("shuffle");
        // Update score
        addScore(-100); // Cycling deck
        [...waste.children].forEach(elem => {
            // Get card
            const index = getCardIndexFromElem(elem);
            cards[index].cover();
            // Get current screen position
            const offset = $(elem).offset();
            const lastPosition = { "x": offset.left, "y": offset.top };
            $(stock).prepend(elem);
            // Update history state
            updateHistoryState({ "cardIndex": index, "hasBeenCovered": true, "hasBeenUncovered": false, "originalParent": waste, "lastPosition": lastPosition });
        });
        // Animate top card, all others will just snap over
        $(stock.firstChild).css("animation", "moveCardBackToDeck 100ms linear");
        setTimeout(() => {
            $(stock.firstChild).css("animation", "");
            unlockAnimations(); // Unlock animations
        }, 100);
    }
    else {
        // Play sound
        playSound("flip");
        // Move the top card over
        const index = getCardIndexFromElem(stock.lastChild);
        const elem = cards[index].getElement();
        // Get current screen position
        const offset = $(elem).offset();
        const lastPosition = { "x": offset.left, "y": offset.top };
        // Update history state
        $(waste).append(elem);
        // Start animation
        $(elem).css("animation", "cycleCardFromDeck 100ms linear");
        setTimeout(() => cards[index].uncover(), 50); // Uncover halfway through
        setTimeout(() => {
            $(elem).css("animation", "");
            unlockAnimations(); // Unlock animations
        }, 100);
        // Update state
        updateHistoryState({ "cardIndex": index, "hasBeenUncovered": true, "hasBeenCovered": false, "originalParent": stock, "lastPosition": lastPosition });
    }
    // Save the history state
    saveHistoryState();
};
// Returns true if a win condition is met, false otherwise
export const checkForWinCondition = () => {
    // Check for all cards stacked on aces
    const aceStacks = [...$(".foundation")];
    for (let i = 0; i < aceStacks.length; ++i) {
        // Verify there are 13 cards on this stack
        if (aceStacks[i].childElementCount !== 13)
            return;
        // Check each child
        let suit; // Grab the suit from the ace
        for (let c = 0; c < aceStacks[i].childElementCount; ++c) {
            const index = getCardIndexFromElem(aceStacks[i].children[c]);
            // Verify value is correct
            if (c !== VALUES.indexOf(cards[index].getValue()))
                return;
            // Verify the suit is correct
            if (c === 0)
                suit = cards[index].getSuit();
            else if (cards[index].getSuit() !== suit)
                return;
        }
    }
    // Base case, trigger win sequence
    triggerWinSequence();
};
// Used to trigger a win sequence
export const triggerWinSequence = () => {
    lockAnimations(); // Lock animations
    stopGameClock(); // Stop clock
    // Update high score
    const highScore = Math.max(parseInt(localStorage.getItem("uf4.highScore") ?? "0"), getScore());
    localStorage.setItem("uf4.highScore", highScore + "");
    // Unbind card events to lock gameplay
    for (let i = 0; i < cards.length; ++i)
        cards[i].removeEventListeners();
    // Animate each card
    const cardLocations = [...$(".foundation")];
    // Get children in order going across
    const children = [];
    let cardChildrenBuf = cardLocations.map(c => [...c.children]); // Array of all children to remove
    while (cardChildrenBuf.length) {
        for (let i = 0; i < cardChildrenBuf.length; ++i)
            children.push(cardChildrenBuf[i].pop());
        // Remove empty card locations
        cardChildrenBuf = cardChildrenBuf.filter(arr => arr.length);
    }
    // Animate each layer of cards
    for (let i = 0; i < children.length; ++i) {
        // Queue child
        setTimeout(() => {
            const elem = children[i];
            const { top, left } = $(elem).offset(); // Grab offset before removing from old parent
            // Pop bottom element
            $(elem).remove();
            $("body").append(elem);
            // Determine horizontal end position on bottom
            const endLeftPerc = 25 + ~~(Math.random() * 50);
            // Set animation
            $(elem).css({
                "opacity": "0",
                "position": "absolute",
                "zIndex": (children.length - i) + 999999,
                "--start-top": top + "px",
                "--start-left": left + "px",
                "--end-left": `calc(${endLeftPerc}% - var(--card-width) / 2)`,
                "animation": "cardEndAnimation 1s cubic-bezier(.81,0,1,1) 1"
            });
            // Play sound
            playSound("flip");
        }, i * 100);
    }
    // Fade in win screen
    setTimeout(() => {
        $("#win-container").css("display", "flex");
        unlockAnimations(); // Unlock animations
        // Update high score elem
        $("#high-score-display").text(localStorage.getItem("uf4.highScore"));
    }, children.length * 100 + 500);
};
// Locks and unlocks the animation state to prevent events from firing
let animLocks = 0;
export const lockAnimations = () => void (++animLocks);
export const unlockAnimations = () => void (animLocks = Math.max(0, animLocks - 1));
export const isAnimLocked = () => animLocks > 0;
// The last few moves' data
const moveHistory = [];
// The current history data
let currentHistoryState = [];
// Adds an update to the current state
export const updateHistoryState = (data) => currentHistoryState.push(data);
// Adds the current state to the user's move history
export const saveHistoryState = () => {
    if (currentHistoryState.length) {
        moveHistory.push(currentHistoryState);
        incrementMoves(); // Count move
    }
    currentHistoryState = []; // Reset history state
    // Shift the oldest element
    if (moveHistory.length > MAX_HISTORY_LENGTH)
        moveHistory.shift();
};
// Clears the move history
export const clearMoveHistory = () => { while (moveHistory.length)
    moveHistory.pop(); };
// Undoes the last move up to 20 times
export const undoLastMove = () => {
    // Abort if anim locked
    if (isAnimLocked())
        return;
    // Lookup last move
    if (moveHistory.length === 0)
        return;
    playSound("flip"); // Play sound
    incrementMoves(); // Count move
    const lastState = moveHistory.pop();
    // Handle each state change
    for (let i = 0; i < lastState.length; ++i) {
        const stateData = lastState[i];
        const card = cards[stateData.cardIndex];
        // Handle covering/uncovering
        if (stateData.hasBeenCovered)
            card.uncover();
        else if (stateData.hasBeenUncovered)
            card.cover();
        // Undo move
        if (stateData.originalParent !== null) {
            const elem = card.getElement();
            // Calculate offset
            const offset = $(elem).offset();
            const top = offset.top - stateData.lastPosition.y;
            const left = offset.left - stateData.lastPosition.x;
            // Move to previous parent
            $(stateData.originalParent).append(elem);
            // Lock animations
            lockAnimations();
            // Handle animation to previous position
            $(elem).css({
                "--start-top": top + "px",
                "--start-left": left + "px",
                "animation": "cardMoveBackToStart 150ms ease 1"
            });
            // Remove animation once done
            setTimeout(() => {
                $(elem).css({ "position": "", "--start-top": "", "--start-left": "", "animation": "" });
                unlockAnimations(); // Unlock animations
            }, 150);
        }
    }
    // Update score
    addScore(-15); // -15 penalty for undoing
};
// Starts the game clock
let _clockInterval = null;
let elapsedSec = 0;
export const startGameClock = () => {
    // Stop any running intervals
    if (_clockInterval !== null)
        clearInterval(_clockInterval);
    const jTimeDisplay = $("#time-display");
    _clockInterval = setInterval(() => {
        ++elapsedSec;
        jTimeDisplay.text(`${Math.floor(elapsedSec / 60)}:${(elapsedSec % 60 + "").padStart(2, "0")}`);
        // Subtract 2 from score for every 10 seconds that elapse
        if (elapsedSec % 10 === 0)
            addScore(-2);
    }, 1e3);
};
// Used to stop the game clock
export const stopGameClock = () => {
    clearInterval(_clockInterval);
    elapsedSec = 0;
    _clockInterval = null;
};
// Sound functionality below
const createAudioElem = (src) => {
    const elem = document.createElement("AUDIO");
    elem.src = `/res/audio/${src}.mp3`;
    return elem;
};
const sounds = {
    "shuffle": [createAudioElem("shuffle1"), createAudioElem("shuffle2")],
    "flip": [createAudioElem("flip1"), createAudioElem("flip2"), createAudioElem("flip3"), createAudioElem("flip4")]
};
// Plays a random sound from the category provided
export const playSound = (name) => {
    sounds[name][~~(Math.random() * sounds[name].length)].play()
        .catch(() => { }); // Ignore, cannot autoplay
};
// Scoring & moves counting functionality below
let playerScore = 0, playerMoves = 0;
export const addScore = (pts) => {
    playerScore += pts;
    $("#score-display").text(playerScore);
};
export const incrementMoves = () => {
    ++playerMoves;
    $("#moves-display").text(playerMoves);
};
const getScore = () => playerScore;
export const resetScore = () => {
    playerScore = 0;
    $("#score-display").text(0);
};
export const resetMoves = () => {
    playerMoves = 0;
    $("#moves-display").text(0);
};
// Used to get the element that best overlaps the current card element
export const getOverlappingElements = (card) => {
    // Get the card's bounding box
    const cardElem = card.getElement();
    const bounds = cardElem.getBoundingClientRect();
    // Iterate over potential matches
    const dropLocations = $(".foundation, .tableau");
    let overlapArea = 0; // The overlap of the best match
    let bestDropLocation = null;
    for (let i = 0; i < dropLocations.length; ++i) {
        const elem = dropLocations[i];
        const targetBounds = elem.getBoundingClientRect();
        if (bounds.right > targetBounds.left && bounds.left < targetBounds.right &&
            bounds.bottom > targetBounds.top && bounds.top < targetBounds.bottom) {
            // Calculate overlap
            const width = Math.min(bounds.right, targetBounds.right) - Math.max(bounds.left, targetBounds.left);
            const height = Math.min(bounds.bottom, targetBounds.bottom) - Math.max(bounds.top, targetBounds.top);
            const area = width * height;
            if (area > overlapArea) {
                overlapArea = area;
                bestDropLocation = elem;
            }
        }
    }
    // Return the matching elements
    return bestDropLocation;
};
// Handles resetting the game
let lastResetMouseDown = null;
let resetTooltipTimeout = null;
export const handleResetMouseDown = () => {
    // Clear reset tooltip timeout
    if (resetTooltipTimeout !== null) {
        clearTimeout(resetTooltipTimeout);
        $("#reset-btn").removeClass("scanning"); // Fix animation
    }
    // Update last mouse down timestamp
    lastResetMouseDown = Date.now();
    // Add visual indicator
    $("#reset-btn").addClass("scanning");
    $("#reset-tooltip").css("display", "");
    // Bind mouse up
    $(window).one("mouseup", () => handleResetMouseUp());
};
const handleResetMouseUp = () => {
    // Measure duration
    $("#reset-btn").removeClass("scanning");
    if (Date.now() - lastResetMouseDown > 500) {
        startGame(); // Reset
        lastResetMouseDown = null;
    }
    else {
        // Show notification
        $("#reset-tooltip").css("display", "block");
        // Queue hide again
        resetTooltipTimeout = setTimeout(() => {
            $("#reset-tooltip").css("display", "");
            resetTooltipTimeout = null; // Reset timeout ID
        }, 2200);
    }
};
// Invoke to start the game
export const startGame = () => {
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
    while (cards.length)
        cards.pop().remove();
    // Generate cards
    generateCards(cards);
    // Fill tableau
    const jTableaus = [...$(".tableau")];
    const jStock = $("#stock");
    for (let c = 0, i = 0; c < 7; ++c) {
        for (let r = 0; r < c + 1; ++r) {
            const card = cards[i++];
            jTableaus[c].append(card.getElement());
            if (r === c)
                card.uncover(); // Uncover top card
        }
    }
    // Push remaining cards to the deck
    for (let i = 51; i >= 28; --i)
        jStock.append(cards[i].getElement());
    // Start clock
    startGameClock();
};
