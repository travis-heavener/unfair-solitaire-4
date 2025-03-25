import { CardStack } from "./card-stack.mjs";
import { generateCards } from "./toolbox.mjs";
// Store a reference to all card stacks in the game
const cardStacks = {
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
$(() => {
    // Load events
    startGame();
});
// Invoke to start the game
const startGame = () => {
    // Clear board
    // Generate cards
    const cards = [];
    generateCards(cards);
    // Fill columns
    for (let c = 0, i = 0; c < 7; ++c) {
        for (let r = 0; r < c + 1; ++r) {
            const card = cards[i++];
            cardStacks.board[c].push(card);
            // Uncover top card
            if (r === c)
                card.uncover();
        }
    }
    // Push remaining cards to the deck
    for (let i = 51; i >= 28; --i)
        cardStacks.deck.push(cards[i]);
};
