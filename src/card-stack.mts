import { Card } from "./card.mjs";

export class CardStack {
    private container: HTMLElement; // The container element that contains the card stack
    private children: Card[];

    constructor(container: HTMLElement) {
        this.container = container;
        this.children = [];
    }

    // Pushes a card onto the bottom of the stack
    push(card: Card) {
        this.children.push(card);
        this.container.appendChild(card.getElement());
    }

    // Removes the last card from this stack
    pop(): Card | null {
        if (this.children.length === 0) return null;

        // Find parent
        const card = this.children.pop();
        $(card.getElement()).remove();
        return card;
    }
}