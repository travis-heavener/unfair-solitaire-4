export type SuitType = "hearts" | "diamonds" | "spades" | "clubs";
export type ValueType = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "Joker";

export class Card {
    private suit: SuitType;
    private value: ValueType;

    // Visual fields
    private element: HTMLElement;
    private isCovered: Boolean = false;

    constructor(suit: SuitType, value: ValueType) {
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
};