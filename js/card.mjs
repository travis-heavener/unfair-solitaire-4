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
        // Bind events
        this.bindEvents();
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
    // Event bindings
    bindEvents() {
        // Click events
        let originalParent = null;
        let movingStackElem = null;
        $(this.element).on("mousedown", e => {
            if (this.isCovered)
                return; // Ignore clicks on covered elements
            // Determine where the card is
            const jParent = $(originalParent = this.element.parentElement);
            if (jParent.hasClass("column")) {
                // On board
                console.log("BOARD");
                // Create moveable stack
                movingStackElem = $($.parseHTML(`<div id="moving-stack"></div>`))[0];
                // Grab children
                movingStackElem.appendChild(this.element);
                let nextSibling = this.element.nextElementSibling;
                while (nextSibling !== null) {
                    movingStackElem.appendChild(nextSibling);
                    nextSibling = nextSibling.nextElementSibling;
                }
                // Append moving stack to body
                $("body").append(movingStackElem);
            }
            else if (jParent.hasClass("ace-stack")) {
                // On ace
                console.log("ACE");
            }
            else if (jParent.is("#deck-empty-stack")) {
                // On stack
                console.log("STACK");
            }
        });
    }
}
