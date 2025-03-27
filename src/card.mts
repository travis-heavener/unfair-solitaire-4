import { canStackOnElem, checkForWinCondition, getCardIndexFromElem, isAnimLocked, lockAnimations, saveHistoryState, uncoverTopOfColumn, unlockAnimations, updateHistoryState } from "./toolbox.mjs";

export type SuitType = "hearts" | "diamonds" | "spades" | "clubs";
export type ValueType = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | "Joker";

type Point = { x: number, y: number };

export class Card {
    private suit: SuitType;
    private value: ValueType;

    private _index: number; // The corresponding index of this card in the global cards array

    // Visual fields
    private element: HTMLElement;
    private isCovered: boolean = false;

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

    // Call immediately after shuffling to update index
    setIndex(index: number) {
        this._index = index;
        $(this.element).attr("data-index", "" + this._index);
    }

    // Getters
    getElement(): HTMLElement { return this.element; }
    getValue(): ValueType { return this.value; }
    getSuit(): SuitType { return this.suit; }
    getIsCovered(): boolean { return this.isCovered; }

    // Visual modifiers
    uncover(doAnimation: boolean=false) {
        if (!this.isCovered) return;

        this.isCovered = false;

        // Play uncover animation
        if (doAnimation) {
            lockAnimations(); // Lock out animations

            $(this.element).css("animation", "uncoverCard 220ms linear"); // Queue animation
            setTimeout(() => $(this.element).removeClass("covered"), 110); // Uncover halfway through
            setTimeout(() => { // Remove animation after complete to prevent re-executing
                $(this.element).css("animation", "");
                unlockAnimations(); // Unlock animations
            }, 220);
        } else {
            $(this.element).removeClass("covered");
        }
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
    private bindEvents() {
        $(this.element).on("mousedown", e => this.handleMouseDown(e));
    }

    // Handles mouse down events on the card
    private handleMouseDown(e: JQuery.MouseDownEvent) {
        if (this.isCovered || isAnimLocked()) return; // Ignore clicks on covered elements

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

        // Lock animations
        lockAnimations();
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

        if (collidedElements.length === 0 || !canStackOnElem(this, collidedElements[0] as HTMLElement)) {
            // Return to starting position
            const children = [...this.movingStackElem.children];
            const startingPos = children.map(child => $(child).offset());

            // Add to new parent
            $(this.originalParent).append( ...children );

            // Animate from old to new
            children.forEach((child, i) => {
                const bounds = child.getBoundingClientRect();
                const top = startingPos[i].top - bounds.top;
                const left = startingPos[i].left - bounds.left;
                $(child).css({"--start-top": top + "px", "--start-left": left + "px", "animation": "cardMoveBackToStart 250ms ease"});

                // Remove the animation after duration
                setTimeout(() => {
                    $(child).css({"--start-top": "", "--start-left": "", "animation": ""});
                    unlockAnimations(); // Unlock animations
                }, 250);
            });
        } else { // Can place
            // Update current history state
            for (let i = 0; i < this.movingStackElem.childElementCount; ++i) {
                const cardIndex = getCardIndexFromElem(this.movingStackElem.children[i]);
                updateHistoryState({ "lastParent": this.originalParent, "hasBeenCovered": false, "hasBeenUncovered": false, "cardIndex": cardIndex });
            }

            // Move elements
            $(collidedElements[0]).append( ...this.movingStackElem.children );

            // Unlock animations
            unlockAnimations();
        }

        // Remove children from moving stack
        this.movingStackElem.innerHTML = "";

        // Uncover previous card
        if ($(this.originalParent).hasClass("column"))
            uncoverTopOfColumn( parseInt( this.originalParent.id.replace("column-", "") ) );

        // Reset moving stack element
        $(this.movingStackElem).remove();
        this.originalParent = this.movingStackElem = this.clickOffset = null;

        // Disable events
        $(window).off("mousemove");
        $(window).off("mouseup");

        // Save the current history state
        saveHistoryState();

        // Check for win condition
        checkForWinCondition();
    }
}