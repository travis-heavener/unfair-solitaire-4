export class Card {
    suit;
    value;
    // Visual fields
    element;
    isCovered = false;
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        // Create element
        this.element = $($.parseHTML(`<div class="card no-select ${this.suit}"><p>${this.value}</p><img src="/res/${this.suit}-icon.png"></div>`))[0];
        // Start covered
        this.cover();
    }
    // Getters
    getElement() { return this.element; }
    // Visual modifiers
    uncover() {
        this.isCovered = false;
        $(this.element).removeClass("covered");
    }
    cover() {
        this.isCovered = true;
        $(this.element).addClass("covered");
    }
}
