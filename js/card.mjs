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
        this.element = document.createElement("DIV");
        $(this).addClass("card");
        // Start covered
        this.cover();
    }
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
;
