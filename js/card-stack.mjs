export class CardStack {
    container; // The container element that contains the card stack
    children;
    type;
    constructor(container, type) {
        this.container = container;
        this.children = [];
        this.type = type;
    }
    // Pushes a card onto the bottom of the stack
    push(card) {
        this.children.push(card);
        this.container.appendChild(card.getElement());
    }
    // Removes the last card from this stack
    pop() {
        if (this.children.length === 0)
            return null;
        // Find parent
        const card = this.children.pop();
        $(card.getElement()).remove();
        return card;
    }
    // Returns the very end of the stack
    end() {
        return this.children.length === 0 ? null : this.children[this.children.length - 1];
    }
}
