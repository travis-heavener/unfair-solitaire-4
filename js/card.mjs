export class Card {
    suit;
    value;
    // Visual fields
    element;
    isCovered = false;
    // Used for event handlers
    originalParent = null; // The previous parent from before the move occured
    movingStackElem = null;
    clickOffset = null; // The extra offset of a click's position relative to the top-left of the element itself
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
        $(this.element).on("mousedown", e => {
            if (this.isCovered)
                return; // Ignore clicks on covered elements
            // Determine where the card is
            const jParent = $(originalParent = this.element.parentElement);
            if (jParent.hasClass("column")) { // On board
                // Store click offset
                const elemPos = $(this.element).offset();
                this.clickOffset = { "x": elemPos.left - e.clientX, "y": elemPos.top - e.clientY };
                // Create moveable stack
                this.originalParent = this.element.parentElement;
                this.movingStackElem = $($.parseHTML(`<div id="moving-stack"></div>`))[0];
                // Grab children
                const children = [this.element];
                let nextSibling = this.element.nextElementSibling;
                while (nextSibling !== null) {
                    children.push(nextSibling);
                    nextSibling = nextSibling.nextElementSibling;
                }
                // Append to new moving stack
                children.forEach(child => $(this.movingStackElem).append(child));
                // Append moving stack to body
                $("body").append(this.movingStackElem);
                $(window).on("mousemove", e => this.handleMouseMove(e));
                $(window).on("mouseup", e => this.handleMouseUp(e));
                // Initially set the stack position
                this.handleMouseMove(e);
            }
            else if (jParent.hasClass("ace-stack")) {
                // On ace TODO
                console.log("ACE");
            }
            else if (jParent.is("#deck-empty-stack")) {
                // On stack TODO
                console.log("STACK");
            }
        });
    }
    // Handles mouse moves on card stacks
    handleMouseMove(e) {
        const x = e.pageX + this.clickOffset.x, y = e.pageY + this.clickOffset.y;
        $(this.movingStackElem).css({ "left": x, "top": y });
    }
    // Handles mouse up
    handleMouseUp(e) {
        // Check for drop location
        const collidedElements = document.elementsFromPoint(e.clientX, e.clientY)
            .filter(elem => $(elem).hasClass("column") || $(elem).hasClass("ace-stack"));
        if (collidedElements.length === 0) {
            // Return to starting position - TODO
            $(this.originalParent).append(...this.movingStackElem.children);
            console.log("DROPPED NOWHERE");
        }
        else if ($(collidedElements[0]).hasClass("column")) {
            // Dragging to new column
            $(collidedElements[0]).append(...this.movingStackElem.children);
        }
        else if ($(collidedElements[0]).hasClass("ace-stack")) {
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
