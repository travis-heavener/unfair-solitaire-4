import { Card } from "./card.mjs";

type StackType = "ace" | "deck" | "empty" | "board";

export class CardStack {
    private container: HTMLElement; // The container element that contains the card stack
    private children: Card[];
    private type: StackType;

    constructor(container: HTMLElement, type: StackType) {
        this.container = container;
        this.children = [];
        this.type = type;
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

    // Returns the very end of the stack
    end(): Card | null {
        return this.children.length === 0 ? null : this.children[this.children.length-1];
    }
}