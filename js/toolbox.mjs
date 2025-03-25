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
};
// Shuffles an array
const shuffleCards = (arr) => {
    let currentPos = arr.length;
    while (currentPos != 0) {
        const newPos = ~~(Math.random() * currentPos--);
        [arr[currentPos], arr[newPos]] = [arr[newPos], arr[currentPos]];
    }
};
