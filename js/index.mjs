import { CardStack } from "./card-stack.mjs";
import { generateCards } from "./toolbox.mjs";
// Store a reference to all card stacks in the game
const cardStacks = {
    "aces": [
        new CardStack($(".ace-stack")[0]),
        new CardStack($(".ace-stack")[1]),
        new CardStack($(".ace-stack")[2]),
        new CardStack($(".ace-stack")[3])
    ],
    "emptyDeck": new CardStack($("#deck-empty-stack")[0]),
    "deck": new CardStack($("#deck-stack")[0]),
    "board": [
        new CardStack($(".column")[0]),
        new CardStack($(".column")[1]),
        new CardStack($(".column")[2]),
        new CardStack($(".column")[3]),
        new CardStack($(".column")[4]),
        new CardStack($(".column")[5]),
        new CardStack($(".column")[6])
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
