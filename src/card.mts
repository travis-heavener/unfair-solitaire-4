export type SuitType = "hearts" | "diamonds" | "spades" | "clubs";
export type ValueType = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "Joker";

type Point = { x: number, y: number };

export class Card {
    private suit: SuitType;
    private value: ValueType;

    // Visual fields
    private element: HTMLElement;
    private isCovered: Boolean = false;

    // Used for event handlers
    private originalParent: HTMLElement = null; // The previous parent from before the move occured
    private movingStackElem: HTMLElement = null;
    private clickOffset: Point = null; // The extra offset of a click's position relative to the top-left of the element itself

    constructor(suit: SuitType, value: ValueType) {
        this.suit = suit;
        this.value = value;

        // Create element
        this.element = $($.parseHTML(
            `<div class="card no-select ${this.suit}"><p>${this.value}</p><img src="/res/${this.suit}-icon.png"></div>`
        ))[0] as any;

        // Start covered
        this.cover();

        // Bind events
        this.bindEvents();
    }

    // Getters
    getElement(): HTMLElement { return this.element; }

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
    private bindEvents() {
        // Click events
        let originalParent: HTMLElement = null;
        $(this.element).on("mousedown", e => {
            if (this.isCovered) return; // Ignore clicks on covered elements

            // Determine where the card is
            const jParent = $(originalParent = this.element.parentElement);
            if (jParent.hasClass("column")) { // On board
                // Store click offset
                const elemPos = $(this.element).offset();
                this.clickOffset = {"x": elemPos.left - e.clientX, "y": elemPos.top - e.clientY};

                // Create moveable stack
                this.originalParent = this.element.parentElement;
                this.movingStackElem = $($.parseHTML( `<div id="moving-stack"></div>` ))[0] as any;

                // Grab children
                const children: HTMLElement[] = [this.element];
                let nextSibling = this.element.nextElementSibling as HTMLElement;
                while (nextSibling !== null) {
                    children.push(nextSibling);
                    nextSibling = nextSibling.nextElementSibling as HTMLElement;
                }

                // Append to new moving stack
                children.forEach(child => $(this.movingStackElem).append(child));

                // Append moving stack to body
                $("body").append(this.movingStackElem);
                $(window).on("mousemove", e => this.handleMouseMove(e));
                $(window).on("mouseup", e => this.handleMouseUp(e));

                // Initially set the stack position
                this.handleMouseMove(e);
            } else if (jParent.hasClass("ace-stack")) {
                // On ace TODO
                console.log("ACE");
            } else if (jParent.is("#deck-empty-stack")) {
                // On stack TODO
                console.log("STACK");
            }
        });
    }

    // Handles mouse moves on card stacks
    private handleMouseMove(e: JQuery.MouseMoveEvent | JQuery.MouseDownEvent) {
        const x = e.pageX + this.clickOffset.x, y = e.pageY + this.clickOffset.y;
        $(this.movingStackElem).css({ "left": x, "top": y })
    }

    // Handles mouse up
    private handleMouseUp(e: JQuery.MouseUpEvent) {
        // Check for drop location
        const collidedElements = document.elementsFromPoint(e.clientX, e.clientY)
            .filter(elem => $(elem).hasClass("column") || $(elem).hasClass("ace-stack"));

        if (collidedElements.length === 0) {
            // Return to starting position - TODO
            $(this.originalParent).append( ...this.movingStackElem.children );
            console.log("DROPPED NOWHERE");
        } else if ($(collidedElements[0]).hasClass("column")) {
            // Dragging to new column
            $(collidedElements[0]).append( ...this.movingStackElem.children );
        } else if ($(collidedElements[0]).hasClass("ace-stack")) {
            // Dragging to ace - TODO
            console.log("DROPPED ON ACE");
        }

        // Reset moving stack element
        $(this.movingStackElem).remove();
        this.originalParent = this.movingStackElem = this.clickOffset = null;

        // Disable events
        $(window).off("mousemove");
        $(window).off("mouseup");
    }
}