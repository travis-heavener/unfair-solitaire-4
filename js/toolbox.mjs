import { CardStack } from "./card-stack.mjs";
import { Card } from "./card.mjs";
// Used to generate a new array of cards
const SUITS = ["hearts", "diamonds", "spades", "clubs"];
const VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
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
        cards[index].uncover();
    }
};
