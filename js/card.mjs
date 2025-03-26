import { canStackOnElem, checkForWinCondition, uncoverTopOfColumn } from "./toolbox.mjs";
export class Card {
    suit;
    value;
    _index; // The corresponding index of this card in the global cards array
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
    // Call immediately after shuffling to update index
    setIndex(index) {
        this._index = index;
        $(this.element).attr("data-index", "" + this._index);
    }
    // Getters
    getElement() { return this.element; }
    getValue() { return this.value; }
    getSuit() { return this.suit; }
    // Visual modifiers
    uncover(doAnimation = false) {
        if (!this.isCovered)
            return;
        this.isCovered = false;
        // Play uncover animation
        if (doAnimation) {
            $(this.element).css("animation", "uncoverCard 220ms linear"); // Queue animation
            setTimeout(() => $(this.element).removeClass("covered"), 110); // Uncover halfway through
            setTimeout(() => $(this.element).css("animation", ""), 220); // Remove animation after complete to prevent re-executing
        }
        else {
            $(this.element).removeClass("covered");
        }
    }
    cover() {
        this.isCovered = true;
        $(this.element).addClass("covered");
    }
    // Used to remove this element from the DOM and prepare for destruction
    remove() {
        $(this.element).off("mousedown");
        $(this.element).remove();
    }
    // Event bindings
    bindEvents() {
        $(this.element).on("mousedown", e => this.handleMouseDown(e));
    }
    // Handles mouse down events on the card
    handleMouseDown(e) {
        if (this.isCovered)
            return; // Ignore clicks on covered elements
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
        if (collidedElements.length === 0 || !canStackOnElem(this, collidedElements[0])) {
            // Return to starting position
            const children = [...this.movingStackElem.children];
            const startingPos = children.map(child => $(child).offset());
            // Add to new parent
            $(this.originalParent).append(...children);
            // Animate from old to new
            children.forEach((child, i) => {
                const bounds = child.getBoundingClientRect();
                const top = startingPos[i].top - bounds.top;
                const left = startingPos[i].left - bounds.left;
                $(child).css({ "--start-top": top + "px", "--start-left": left + "px", "animation": "cardMoveBackToStart 250ms ease" });
                setTimeout(() => $(child).css({ "--start-top": "", "--start-left": "", "animation": "" }), 250);
            });
        }
        else { // Can place
            $(collidedElements[0]).append(...this.movingStackElem.children);
        }
        // Remove children from moving stack
        this.movingStackElem.innerHTML = "";
        // Uncover previous card
        if ($(this.originalParent).hasClass("column"))
            uncoverTopOfColumn(parseInt(this.originalParent.id.replace("column-", "")));
        // Reset moving stack element
        $(this.movingStackElem).remove();
        this.originalParent = this.movingStackElem = this.clickOffset = null;
        // Disable events
        $(window).off("mousemove");
        $(window).off("mouseup");
        // Check for win condition
        checkForWinCondition();
    }
}
