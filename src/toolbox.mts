import { CardStack } from "./card-stack.mjs";
import { Card, SuitType, ValueType } from "./card.mjs";

// Used to generate a new array of cards
const SUITS: SuitType[] = ["hearts", "diamonds", "spades", "clubs"];
const VALUES: ValueType[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const generateCards = (cards: Card[]) => {
    for (let s = 0; s < 4; ++s)
        for (let v = 0; v < 13; ++v)
            cards.push(new Card(SUITS[s], VALUES[v]));

    // Shuffle the deck
    shuffleCards(cards);
    cards.forEach((card, i) => card.setIndex(i));
};

// Shuffles an array
const shuffleCards = (arr: Card[]) => {
    let currentPos = arr.length;
    while (currentPos != 0) {
        const newPos = ~~(Math.random() * currentPos--);
        [arr[currentPos], arr[newPos]] = [arr[newPos], arr[currentPos]];
    }
};

// Store a reference to all card stacks in the game
export const cardStacks = {
    "aces": [
        new CardStack( $(".ace-stack")[0], "ace" ),
        new CardStack( $(".ace-stack")[1], "ace" ),
        new CardStack( $(".ace-stack")[2], "ace" ),
        new CardStack( $(".ace-stack")[3], "ace" )
    ],
    "emptyDeck": new CardStack( $("#deck-empty-stack")[0], "empty" ),
    "deck": new CardStack( $("#deck-stack")[0], "deck" ),
    "board": [
        new CardStack( $(".column")[0], "board" ),
        new CardStack( $(".column")[1], "board" ),
        new CardStack( $(".column")[2], "board" ),
        new CardStack( $(".column")[3], "board" ),
        new CardStack( $(".column")[4], "board" ),
        new CardStack( $(".column")[5], "board" ),
        new CardStack( $(".column")[6], "board" )
    ]
};

// Generate and store the cards
export const cards: Card[] = [];

// Used to uncover the bottom card in a column, if it exists
export const uncoverTopOfColumn = (colNum: number) => {
    // Get the index of the top card
    const column = $(".column")[colNum-1];
    if (column.lastChild !== null) {
        const index = parseInt( $(column.lastChild).attr("data-index") );
        cards[index].uncover(true);
    }
};

// Returns either red or black based on the SuitType
const getColorFromSuit = (suit: SuitType): "red" | "black" => (suit === "hearts" || suit === "diamonds") ? "red" : "black";

// Returns true if the card can be stacked on the given element, false otherwise
export const canStackOnElem = (card: Card, elem: HTMLElement): boolean => {
    if ($(elem).hasClass("ace-stack")) { // Handle ace stack
        // Check if there aren't any cards
        if (elem.childElementCount === 0) return card.getValue() === "A";

        // Check top card
        const index = parseInt( $(elem.lastChild).attr("data-index") );
        
        // Force to be same suit
        if (cards[index].getSuit() !== card.getSuit()) return false;
        
        // Force top card value to be 1 less than this card
        const existingValue = cards[index].getValue();
        const newValue = card.getValue();

        return (VALUES.indexOf(existingValue) === (VALUES.indexOf(newValue) - 1));
    } else { // Handle column
        // Check if there aren't any cards
        if (elem.childElementCount === 0) return card.getValue() === "K";

        const index = parseInt( $(elem.lastChild).attr("data-index") );
        const existingColor = getColorFromSuit(cards[index].getSuit());
        const newColor = getColorFromSuit(card.getSuit());

        // Force to be different colors
        if (newColor === existingColor) return false;

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

    if (deck.childElementCount === 0) { // Move all cards back from the empty deck
        [...emptyDeck.children].reverse().forEach(elem => {
            // Get card
            const index = parseInt( $(elem).attr("data-index") );
            cards[index].cover();
            $(deck).append(elem);
        });

        // Animate top card, all others will just snap over
        $(deck.firstChild).css("animation", "moveCardBackToDeck 100ms linear");
        setTimeout(() => $(deck.firstChild).css("animation", ""), 100); // Remove animation after complete to prevent re-executing
    } else {
        // Move the top card over
        const index = parseInt( $(deck.lastChild).attr("data-index") );
        const elem = cards[index].getElement();
        $(emptyDeck).append(elem);

        // Start animation
        $(elem).css("animation", "cycleCardFromDeck 100ms linear");
        setTimeout(() => cards[index].uncover(), 50); // Uncover halfway through
        setTimeout(() => $(elem).css("animation", ""), 100); // Remove animation after complete to prevent re-executing
    }
};

// Returns true if user inputs are locked due to animation, false otherwise
let _isAnimLocked = false;
export const areInputsLockedByAnim = (): boolean => _isAnimLocked;
export const lockInputsForAnim = () => _isAnimLocked = true;
export const unlockInputsForAnim = () => _isAnimLocked = false;