import { CardStack } from "./card-stack.mjs";
import { Card } from "./card.mjs";
const MAX_HISTORY_LENGTH = 50; // The maximum number of history elements
// Used to generate a new array of cards
const SUITS = ["hearts", "diamonds", "spades", "clubs"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const generateCards = (cards) => {
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
// Store a reference to all card stacks in the game
export const cardStacks = {
    "aces": [
        new CardStack($(".ace-stack")[0], "ace"),
        new CardStack($(".ace-stack")[1], "ace"),
        new CardStack($(".ace-stack")[2], "ace"),
        new CardStack($(".ace-stack")[3], "ace")
    ],
    "emptyDeck": new CardStack($("#deck-empty-stack")[0], "empty"),
    "deck": new CardStack($("#deck-stack")[0], "deck"),
    "board": [
        new CardStack($(".column")[0], "board"),
        new CardStack($(".column")[1], "board"),
        new CardStack($(".column")[2], "board"),
        new CardStack($(".column")[3], "board"),
        new CardStack($(".column")[4], "board"),
        new CardStack($(".column")[5], "board"),
        new CardStack($(".column")[6], "board")
    ]
};
// Generate and store the cards
export const cards = [];
// Returns the numeric card index from an element's data-index attribute
export const getCardIndexFromElem = (elem) => parseInt(elem.getAttribute("data-index"));
// Used to uncover the bottom card in a column, if it exists
export const uncoverTopOfColumn = (colNum) => {
    // Get the index of the top card
    const column = $(".column")[colNum - 1];
    if (column.lastChild !== null) {
        const index = getCardIndexFromElem(column.lastChild);
        const wasCovered = cards[index].getIsCovered();
        cards[index].uncover(true); // Handles locking the animation on its own
        // Update state
        if (wasCovered)
            updateHistoryState({ "cardIndex": index, "hasBeenCovered": false, "hasBeenUncovered": true, "originalParent": null, "lastPosition": null });
    }
};
// Returns either red or black based on the SuitType
const getColorFromSuit = (suit) => (suit === "hearts" || suit === "diamonds") ? "red" : "black";
// Returns true if the card can be stacked on the given element, false otherwise
export const canStackOnElem = (card, elem) => {
    if ($(elem).hasClass("ace-stack")) { // Handle ace stack
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
    const deck = $("#deck-stack")[0];
    const emptyDeck = $("#deck-empty-stack")[0];
    // Abort if the deck is empty
    if (emptyDeck.childElementCount === 0 && deck.childElementCount === 0)
        return;
    // Lock animations
    lockAnimations();
    if (deck.childElementCount === 0) { // Move all cards back from the empty deck
        // Play sound
        playSound("shuffle");
        [...emptyDeck.children].forEach(elem => {
            // Get card
            const index = getCardIndexFromElem(elem);
            cards[index].cover();
            // Get current screen position
            const offset = $(elem).offset();
            const lastPosition = { "x": offset.left, "y": offset.top };
            $(deck).prepend(elem);
            // Update history state
            updateHistoryState({ "cardIndex": index, "hasBeenCovered": true, "hasBeenUncovered": false, "originalParent": emptyDeck, "lastPosition": lastPosition });
        });
        // Animate top card, all others will just snap over
        $(deck.firstChild).css("animation", "moveCardBackToDeck 100ms linear");
        setTimeout(() => {
            $(deck.firstChild).css("animation", "");
            unlockAnimations(); // Unlock animations
        }, 100);
    }
    else {
        // Play sound
        playSound("flip");
        // Move the top card over
        const index = getCardIndexFromElem(deck.lastChild);
        const elem = cards[index].getElement();
        // Get current screen position
        const offset = $(elem).offset();
        const lastPosition = { "x": offset.left, "y": offset.top };
        // Update history state
        $(emptyDeck).append(elem);
        // Start animation
        $(elem).css("animation", "cycleCardFromDeck 100ms linear");
        setTimeout(() => cards[index].uncover(), 50); // Uncover halfway through
        setTimeout(() => {
            $(elem).css("animation", "");
            unlockAnimations(); // Unlock animations
        }, 100);
        // Update state
        updateHistoryState({ "cardIndex": index, "hasBeenUncovered": true, "hasBeenCovered": false, "originalParent": deck, "lastPosition": lastPosition });
    }
    // Save the history state
    saveHistoryState();
};
// Returns true if a win condition is met, false otherwise
export const checkForWinCondition = () => {
    // Check for all cards stacked on aces
    const aceStacks = [...$(".ace-stack")];
    let isWinByAces = true;
    for (let i = 0; i < aceStacks.length && isWinByAces; ++i) {
        if (aceStacks[i].childElementCount !== 13) {
            isWinByAces = false;
            break;
        }
        // Grab the suit from the ace
        let suit;
        // Check each child
        for (let c = 0; c < aceStacks[i].childElementCount && isWinByAces; ++c) {
            const index = getCardIndexFromElem(aceStacks[i].children[c]);
            // Verify value is correct
            if (c !== VALUES.indexOf(cards[index].getValue())) {
                isWinByAces = false;
                break;
            }
            // Verify the suit is correct
            if (c === 0) {
                suit = cards[index].getSuit();
            }
            else if (cards[index].getSuit() !== suit) {
                isWinByAces = false;
                break;
            }
        }
    }
    // Handle win by aces
    if (isWinByAces) // Trigger win sequence
        return triggerWinSequence("aces");
    // Get all card columns with children
    const columns = [...$(".column")].filter(elem => elem.childElementCount === 13);
    // Check for win by kings
    let isWinByKings = columns.length === 4;
    // Check each column
    for (let i = 0; i < 4 && isWinByKings; ++i) {
        // Check each card
        let lastSuitColor;
        for (let c = 0; c < 13 && isWinByKings; ++c) {
            const index = getCardIndexFromElem(columns[i].children[c]);
            // Check value
            if (12 - VALUES.indexOf(cards[index].getValue()) !== c) {
                isWinByKings = false;
                console.log("fuck");
                break;
            }
            // Check suit
            if (c === 0) {
                lastSuitColor = getColorFromSuit(cards[index].getSuit());
            }
            else if (lastSuitColor === getColorFromSuit(cards[index].getSuit())) {
                isWinByKings = false;
                break;
            }
            else { // Update last suit color
                lastSuitColor = getColorFromSuit(cards[index].getSuit());
            }
        }
    }
    if (isWinByKings) // Trigger win sequence
        return triggerWinSequence("kings");
};
// Used to trigger a win sequence
export const triggerWinSequence = (causedBy) => {
    // Lock animations
    lockAnimations();
    // Stop clock
    stopGameClock();
    // Unbind card events to lock gameplay
    for (let i = 0; i < cards.length; ++i)
        cards[i].removeEventListeners();
    // Animate each card
    let cardLocations = [];
    if (causedBy === "aces")
        cardLocations.push(...$(".ace-stack"));
    else
        cardLocations.push(...[...$(".column")].filter(elem => elem.hasChildNodes()));
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
    if (currentHistoryState.length)
        moveHistory.push(currentHistoryState);
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
    // Play sound
    playSound("flip");
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
