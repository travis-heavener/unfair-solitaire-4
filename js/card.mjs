import { addScore, canStackOnElem, checkForAutocomplete, checkForWinCondition, getCardIndexFromElem, getOverlappingElements, isAnimLocked, lockAnimations, playSound, saveHistoryState, uncoverTopOfColumn, unlockAnimations, updateHistoryState } from "./toolbox.mjs";
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
    movingCardOriginalPositions = null; // The previous absolute page positions of each card (for history state)
    clickOffset = null; // The extra offset of a click's position relative to the top-left of the element itself
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        // Create element
        this.element = $($.parseHTML(`<div class="card no-select ${this.suit}"><p>${this.value}</p><img src="/res/images/${this.suit}-icon.png"></div>`))[0];
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
    getIsCovered() { return this.isCovered; }
    getMovingStackChlidCount() { return this.movingStackElem?.childElementCount ?? 0; }
    // Visual modifiers
    uncover(doAnimation = false) {
        return new Promise(res => {
            if (!this.isCovered)
                return res();
            playSound("flip"); // Play sound
            this.isCovered = false;
            // Play uncover animation
            if (doAnimation) {
                lockAnimations(); // Lock out animations
                $(this.element).css("animation", "uncoverCard 220ms linear"); // Queue animation
                setTimeout(() => $(this.element).removeClass("covered"), 110); // Uncover halfway through
                setTimeout(() => {
                    $(this.element).css("animation", "");
                    unlockAnimations(); // Unlock animations
                    res();
                }, 220);
            }
            else {
                $(this.element).removeClass("covered");
                res();
            }
        });
    }
    cover() {
        this.isCovered = true;
        $(this.element).addClass("covered");
    }
    // Used to remove this element from the DOM and prepare for destruction
    remove() {
        this.removeEventListeners();
        $(this.element).remove();
    }
    // Removes event listeners (for win sequence)
    removeEventListeners() {
        $(this.element).off("mousedown");
    }
    // Event bindings
    bindEvents() {
        $(this.element).on("mousedown", e => this.handleMouseDown(e));
    }
    // Handles mouse down events on the card
    handleMouseDown(e) {
        if (e.button !== 0 || this.isCovered || isAnimLocked())
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
        // Store original position
        this.movingCardOriginalPositions = children.map((child) => {
            const { top, left } = $(child).offset();
            return { "x": left, "y": top };
        });
        // Append to new moving stack
        children.forEach(child => $(this.movingStackElem).append(child));
        // Append moving stack to body
        $("body").append(this.movingStackElem);
        $(window).on("mousemove", e => this.handleMouseMove(e));
        $(window).on("mouseup", () => this.handleMouseUp());
        // Initially set the stack position
        this.handleMouseMove(e);
        // Lock animations
        lockAnimations();
    }
    // Handles mouse moves on card stacks
    handleMouseMove(e) {
        const x = e.pageX + this.clickOffset.x, y = e.pageY + this.clickOffset.y;
        $(this.movingStackElem).css({ "left": x, "top": y });
    }
    // Handles mouse up
    async handleMouseUp() {
        // Check for drop location
        const targetElement = getOverlappingElements(this);
        if (targetElement === null || targetElement === this.originalParent || !canStackOnElem(this, targetElement)) {
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
                $(child).css({ "--start-top": top + "px", "--start-left": left + "px", "animation": "cardMoveBackToStart 150ms ease" });
                // Remove the animation after duration
                setTimeout(() => {
                    $(child).css({ "--start-top": "", "--start-left": "", "animation": "" });
                    unlockAnimations(); // Unlock animations
                }, 150);
            });
        }
        else { // Can place
            // Determine starting pos
            const children = [...this.movingStackElem.children];
            const startingPos = children.map(child => $(child).offset());
            // Add to new parent
            $(targetElement).append(...children);
            // Update current history state & animate
            children.forEach((child, i) => {
                const cardIndex = getCardIndexFromElem(child);
                // Animate from old to new
                const bounds = child.getBoundingClientRect();
                const top = startingPos[i].top - bounds.top;
                const left = startingPos[i].left - bounds.left;
                $(child).css({ "--start-top": top + "px", "--start-left": left + "px", "animation": "cardMoveBackToStart 250ms ease" });
                // Remove the animation after duration
                setTimeout(() => {
                    $(child).css({ "--start-top": "", "--start-left": "", "animation": "" });
                    unlockAnimations(); // Unlock animations
                }, 250);
                // Add state
                const lastPosition = this.movingCardOriginalPositions[i];
                updateHistoryState({ "originalParent": this.originalParent, "hasBeenCovered": false, "hasBeenUncovered": false, "cardIndex": cardIndex, "lastPosition": lastPosition });
                // Add score
                if (this.originalParent.id === "waste" && $(targetElement).hasClass("tableau")) {
                    addScore(5); // Moving from deck/waste to tableau
                }
                else if (!$(this.originalParent).hasClass("foundation") && $(targetElement).hasClass("foundation")) {
                    addScore(10); // Moving from stock/waste or tableau to foundation
                }
                else if ($(this.originalParent).hasClass("tableau") && $(targetElement).hasClass("tableau") &&
                    !(this.originalParent.childElementCount === 0 && this.value === "K")) { // Prevent adding score for moving kings stacks around
                    addScore(3); // Moving between columns in the tableau
                }
                else if ($(this.originalParent).hasClass("foundation") && !$(targetElement).hasClass("foundation")) {
                    addScore(-15); // Moving off of foundation (to tableau)
                }
            });
        }
        // Remove children from moving stack
        this.movingStackElem.innerHTML = "";
        // Uncover previous card
        if ($(this.originalParent).hasClass("tableau"))
            await uncoverTopOfColumn(parseInt(this.originalParent.id.replace("tableau-", "")));
        else // Play sound regardless
            playSound("flip");
        // Reset moving stack element
        $(this.movingStackElem).remove();
        this.originalParent = this.movingStackElem = this.movingCardOriginalPositions = this.clickOffset = null;
        // Disable events
        $(window).off("mousemove mouseup");
        saveHistoryState(); // Save the current history state
        checkForAutocomplete(); // Check for autocomplete
        checkForWinCondition(); // Check for win condition
    }
}
