import { CardStack } from "./card-stack.mjs";
import { Card } from "./card.mjs";
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
// Used to uncover the bottom card in a column, if it exists
export const uncoverTopOfColumn = (colNum) => {
    // Get the index of the top card
    const column = $(".column")[colNum - 1];
    if (column.lastChild !== null) {
        const index = parseInt($(column.lastChild).attr("data-index"));
        cards[index].uncover(true); // Handles locking the animation on its own
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
        const index = parseInt($(elem.lastChild).attr("data-index"));
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
        const index = parseInt($(elem.lastChild).attr("data-index"));
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
    // Check if the deck is empty
    const deck = $("#deck-stack")[0];
    const emptyDeck = $("#deck-empty-stack")[0];
    // Lock animations
    lockAnimations();
    if (deck.childElementCount === 0) { // Move all cards back from the empty deck
        [...emptyDeck.children].reverse().forEach(elem => {
            // Get card
            const index = parseInt($(elem).attr("data-index"));
            cards[index].cover();
            $(deck).append(elem);
        });
        // Animate top card, all others will just snap over
        $(deck.firstChild).css("animation", "moveCardBackToDeck 100ms linear");
        setTimeout(() => {
            $(deck.firstChild).css("animation", "");
            unlockAnimations(); // Unlock animations
        }, 100);
    }
    else {
        // Move the top card over
        const index = parseInt($(deck.lastChild).attr("data-index"));
        const elem = cards[index].getElement();
        $(emptyDeck).append(elem);
        // Start animation
        $(elem).css("animation", "cycleCardFromDeck 100ms linear");
        setTimeout(() => cards[index].uncover(), 50); // Uncover halfway through
        setTimeout(() => {
            $(elem).css("animation", "");
            unlockAnimations(); // Unlock animations
        }, 100);
    }
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
            const index = parseInt($(aceStacks[i].children[c]).attr("data-index"));
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
            const index = parseInt($(columns[i].children[c]).attr("data-index"));
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
        }, i * 100);
    }
    // Fade in win screen
    setTimeout(() => {
        $("#win-container").css("display", "flex");
        unlockAnimations(); // Unlock animations
    }, children.length * 100 + 500);
};
// Locks and unlocks the animation state to prevent events from firing
let _isAnimLocked = false;
export const lockAnimations = () => _isAnimLocked = true;
export const unlockAnimations = () => _isAnimLocked = false;
export const isAnimLocked = () => _isAnimLocked;
