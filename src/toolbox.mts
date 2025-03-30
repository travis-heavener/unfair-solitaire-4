import { Card, SuitType, ValueType } from "./card.mjs";
import { addScore, DifficultyType, getHandicapID, getHighScore, getScore, incrementMoves, resetMoves, resetScore, setDifficulty, setHighScore, setRandomHandicapID } from "./player-data.mjs";

const MAX_HISTORY_LENGTH = 50; // The maximum number of history elements

// Locks and unlocks the animation state to prevent events from firing
let animLocks = 0;
export const lockAnimations = () => void(++animLocks);
export const unlockAnimations = () => void(animLocks = Math.max(0, animLocks-1));
export const isAnimLocked = () => animLocks > 0;
const wait = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

/**************************** START PROTOTYPES ****************************/

Array.prototype.random = function<T>(): T {
    return this[ Math.floor(Math.random() * this.length) ];
};

Array.prototype.shuffle = function<T>(): T[] {
    let currentPos = this.length;
    while (currentPos != 0) {
        const newPos = Math.floor(Math.random() * currentPos--);
        [this[currentPos], this[newPos]] = [this[newPos], this[currentPos]];
    }
    return this;
};

/**************************** END PROTOTYPES ****************************/
/**************************** START TYPES ****************************/

type HistoryData = {
    cardIndex: number,
    lastPosition: Point, // The previous absolute page position of the element, only for those that have moved
    hasBeenUncovered: boolean, // Whether or not the card was uncovered in this move
    hasBeenCovered: boolean, // Whether or not the card was covered in this move
    originalParent: HTMLElement | null // The previous parent element for a move
};

type HistoryStateType = HistoryData[];

export type Point = { x: number, y: number };

/**************************** END TYPES ****************************/
/**************************** START CARD GENERATION ****************************/

const cards: Card[] = [];
const SUITS: SuitType[] = ["hearts", "diamonds", "spades", "clubs"];
const VALUES: ValueType[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// Used to generate a new array of cards
const generateCards = (cards: Card[]) => {
    for (let s = 0; s < 4; ++s)
        for (let v = 0; v < 13; ++v)
            cards.push(new Card(SUITS[s], VALUES[v]));

    // Shuffle the deck
    cards.shuffle().forEach((card, i) => card.setIndex(i));
};

// Invoke to start the game
export const startGame = (difficulty: DifficultyType) => {
    setDifficulty(difficulty); // Set difficulty
    restartGame(); // Pass through to restart game
};

// Invoke to reset the game
export const restartGame = () => {
    unbindEvents();
    bindEvents();

    setRandomHandicapID(); // Select handicap

    // Hide win screen & autocomplete button
    $("#win-container, #autocomplete-btn").css("display", "");

    // Disable autocomplete button
    $("#autocomplete-btn").off("click");

    // Reset control elements
    $("#score-display, #moves-display").text(0);
    $("#time-display").text("0:00");

    // Reset state & stats
    restartGameClock();
    clearMoveHistory();
    resetScore();
    resetMoves();

    // Clear board
    while (cards.length) cards.pop().remove();

    // Generate cards
    generateCards(cards);

    // Fill tableau
    const jTableaus = [...$(".tableau")];
    const jStock = $("#stock");
    for (let c = 0, i = 0; c < 7; ++c) {
        for (let r = 0; r < c+1; ++r) {
            const card = cards[i++];
            jTableaus[c].append( card.getElement() );
            if (r === c) card.uncover(); // Uncover top card
        }
    }

    // Push remaining cards to the deck
    for (let i = 51; i >= 28; --i)
        jStock.append(cards[i].getElement());

    // Start clock
    startGameClock();
};

let isPaused = false;
const isGamePaused = () => isPaused; // True if the game is paused, false otherwise

// Pauses and resumes the game
const togglePauseGame = () => {
    if (!isPaused) {
        pauseGameClock(); // Stop clock
        unbindEvents(); // Unbind events
        cards.forEach(card => card.removeEventListeners()); // Remove card events
    } else {
        startGameClock(); // Start clock
        bindEvents(); // Unbind events
        cards.forEach(card => card.bindEvents()); // Remove card events
    }
    isPaused = !isPaused;
};

/**************************** END CARD GENERATION ****************************/
/**************************** START CARD HELPERS ****************************/

// Returns the numeric card index from an element's data-index attribute
export const getCardIndexFromElem = (elem: any) => parseInt( elem.getAttribute("data-index") );

// Used to uncover the bottom card in the tableau, if it exists
export const uncoverTopOfColumn = (colNum: number): Promise<void> => {
    return new Promise(async res => {
        // Get the index of the top card
        const column = $(".tableau")[colNum-1];
        if (column.lastChild !== null) {
            const index = getCardIndexFromElem(column.lastChild);
            const wasCovered = cards[index].getIsCovered();
            playSound("flip"); // Play sound regardless

            // Update state & points
            if (wasCovered) {
                updateHistoryState({ "cardIndex": index, "hasBeenCovered": false, "hasBeenUncovered": true, "originalParent": null, "lastPosition": null });
                addScore(5); // Uncovered card in tableau
            }

            await cards[index].uncover(true); // Handles locking the animation on its own
        } else {
            playSound("flip"); // Play sound regardless
        }
        res();
    });
    
};

// Returns either red or black based on the SuitType
const getColorFromSuit = (suit: SuitType): "red" | "black" => (suit === "hearts" || suit === "diamonds") ? "red" : "black";

/**************************** END CARD HELPERS ****************************/
/**************************** START CARD ELEMENT METHODS ****************************/

// Returns true if the card can be stacked on the given element, false otherwise
export const canStackOnElem = (card: Card, elem: HTMLElement): boolean => {
    if ($(elem).hasClass("foundation")) { // Handle ace stack
        // Verify the card doesn't have children
        if (card.getMovingStackChlidCount() > 1) return false;

        // Check if there aren't any cards
        if (elem.childElementCount === 0) return card.getValue() === "A";

        // Check top card
        const index = getCardIndexFromElem(elem.lastChild);
        
        // Force to be same suit
        if (cards[index].getSuit() !== card.getSuit()) return false;
        
        // Force top card value to be 1 less than this card
        const existingValue = cards[index].getValue();
        const newValue = card.getValue();

        return (VALUES.indexOf(existingValue) === (VALUES.indexOf(newValue) - 1));
    } else { // Handle column
        // Check if there aren't any cards
        if (elem.childElementCount === 0) return card.getValue() === "K";

        const index = getCardIndexFromElem(elem.lastChild);
        const existingColor = getColorFromSuit(cards[index].getSuit());
        const newColor = getColorFromSuit(card.getSuit());

        // Force to be different colors
        if (newColor === existingColor) return false;

        // Force top card value to be 1 more than this card
        const existingValue = cards[index].getValue();
        const newValue = card.getValue();

        return ((VALUES.indexOf(existingValue) - 1) === VALUES.indexOf(newValue)) || (existingValue === "2" && newValue === "A");
    }
};

// Cycles to the next card in the deck
export const cycleDeckToNext = () => {
    // Abort if animating
    if (isAnimLocked()) return;

    // Check if the deck is empty
    const stock = $("#stock")[0], waste = $("#waste")[0];

    // Abort if the deck is empty
    if (waste.childElementCount === 0 && stock.childElementCount === 0) return;

    // Lock animations
    lockAnimations();

    if (stock.childElementCount === 0) // Move all cards back from the empty deck
        moveWasteToStock();
    else
        uncoverCardFromStock();

    saveHistoryState(); // Save the history state
    checkForAutocomplete(); // Check for autocomplete
};

// Used to reset the stock from the waste pile
const moveWasteToStock = (): Promise<void> => {
    const stock = $("#stock")[0], waste = $("#waste")[0];
    return new Promise(async res => {
        // Handle handicap #4
        if (getHandicapID() === 4) {
            // Wait for user confirmation
            await new Promise<void>(captchaResolve => {
                $("#captcha-content").css("display", "flex"); // Show confirmation
                $("#captcha-submit-btn").one("click", () => {
                    $("#captcha-content").css("display", ""); // Hide confirmation
                    captchaResolve();
                });
            });
        }

        addScore(-50); // Update score for cycling deck

        [...waste.children].forEach(elem => {
            // Get card
            const index = getCardIndexFromElem(elem);
            cards[index].cover();

            // Get current screen position
            const offset = $(elem).offset();
            const lastPosition: Point = { "x": offset.left, "y": offset.top };

            // Update history state
            $(stock).prepend(elem);
            updateHistoryState({ "cardIndex": index, "hasBeenCovered": true, "hasBeenUncovered": false, "originalParent": waste, "lastPosition": lastPosition });
        });

        // Animate top card, all others will just snap over
        const durationMS = getHandicapID() === 3 ? 10_000 : 100; // Wait 10s for handicap #3
        $(stock.firstChild).css("animation", `moveCardBackToDeck ${durationMS}ms linear`);

        // Fix visuals for handicap #3
        if (getHandicapID() === 3) {
            playSound("shuffle", 10_000); // Play sound with fixed duration
            [...stock.children].slice(1).forEach(elem => $(elem).css("opacity", 0));
        } else {
            playSound("shuffle"); // Play sound normally
        }

        setTimeout(() => { // Remove animation after complete to prevent re-executing
            // Fix visuals for handicap #3
            if (getHandicapID() === 3)
                [...stock.children].forEach(elem => $(elem).css("opacity", ""));

            $(stock.firstChild).css("animation", "");
            unlockAnimations(); // Unlock animations
            res(); // Resolve promise
        }, durationMS);
    });
};

// Used to uncover a card from the stock
const uncoverCardFromStock = (): Promise<void> => {
    const stock = $("#stock")[0], waste = $("#waste")[0];
    return new Promise(res => {
        // Play sound
        playSound("flip");

        // Move the top card over
        const index = getCardIndexFromElem(stock.lastChild);
        const elem = cards[index].getElement();

        // Get current screen position
        const offset = $(elem).offset();
        const lastPosition: Point = { "x": offset.left, "y": offset.top };

        // Update history state
        $(waste).append(elem);

        // Start animation
        $(elem).css("animation", "cycleCardFromDeck 100ms linear");
        setTimeout(() => cards[index].uncover(), 50); // Uncover halfway through
        setTimeout(() => { // Remove animation after complete to prevent re-executing
            $(elem).css("animation", "");
            unlockAnimations(); // Unlock animations
            res(); // Resolve promise
        }, 100);

        // Update state
        updateHistoryState({ "cardIndex": index, "hasBeenUncovered": true, "hasBeenCovered": false, "originalParent": stock, "lastPosition": lastPosition });
    });
};

// Used to get the element that best overlaps the current card element
export const getOverlappingElements = (card: Card): HTMLElement | null => {
    // Get the card's bounding box
    const cardElem = card.getElement();
    const bounds = cardElem.getBoundingClientRect();

    // Iterate over potential matches
    const dropLocations = $(".foundation, .tableau");

    let overlapArea = 0; // The overlap of the best match
    let bestDropLocation: HTMLElement = null;
    for (let i = 0; i < dropLocations.length; ++i) {
        const elem = dropLocations[i];
        const targetBounds = elem.getBoundingClientRect();
        if (bounds.right > targetBounds.left && bounds.left < targetBounds.right &&
            bounds.bottom > targetBounds.top && bounds.top < targetBounds.bottom) {

            // Calculate overlap
            const width = Math.min(bounds.right, targetBounds.right) - Math.max(bounds.left, targetBounds.left);
            const height = Math.min(bounds.bottom, targetBounds.bottom) - Math.max(bounds.top, targetBounds.top);
            const area = width * height;

            if (area > overlapArea) {
                overlapArea = area;
                bestDropLocation = elem;
            }
        }
    }
    
    // Return the matching elements
    return bestDropLocation;
};

// Used to animate the moving of a card element to a new parent
export const animateCardElemMove = (elem: HTMLElement, newParent: HTMLElement, originalParent:HTMLElement=null, countScore:boolean=true): Promise<void> => {
    return new Promise(res => {
        if (!originalParent)
            originalParent = elem.parentElement;

        const startOffset = $(elem).offset(); // Get offset before appending to new parent
        $(newParent).append(elem); // Move to parent
        lockAnimations(); // Lock animations
        playSound("flip"); // Play flip sound

        // Handle animation to previous position
        const endOffset = $(elem).offset();
        $(elem).css({
            "--start-top": (startOffset.top - endOffset.top) + "px",
            "--start-left": (startOffset.left - endOffset.left) + "px",
            "animation": "cardMoveBackToStart 200ms ease"
        });

        // Remove animation once done
        setTimeout(() => {
            $(elem).css({"--start-top": "", "--start-left": "", "animation": ""});
            unlockAnimations(); // Unlock animations
            res();
        }, 200);

        // Add score
        incrementMoves();
        if (!countScore) return;

        const card = cards[ getCardIndexFromElem(elem) ];
        if (originalParent.id === "waste" && $(newParent).hasClass("tableau")) {
            // Moving from deck/waste to tableau
            addScore(5);
        } else if (!$(originalParent).hasClass("foundation") && $(newParent).hasClass("foundation")) {
            // Moving from stock/waste or tableau to foundation
            addScore(10);
        } else if ($(originalParent).hasClass("tableau") && $(newParent).hasClass("tableau") &&
            !(originalParent.childElementCount === 0 && card.getValue() === "K")) {
            // Prevent adding score for moving kings stacks around
            addScore(3); // Moving between columns in the tableau
        } else if ($(originalParent).hasClass("foundation") && !$(newParent).hasClass("foundation")) {
            // Moving off of foundation (to tableau)
            addScore(-15);
        }
    });
};

/**************************** END CARD ELEMENT METHODS ****************************/
/**************************** START CONDITION CHECKERS ****************************/

// Returns true if a win condition is met, false otherwise
export const checkForWinCondition = (): boolean => {
    // Check for all cards stacked on aces
    const aceStacks = [...$(".foundation")];
    for (let i = 0; i < aceStacks.length; ++i) {
        // Verify there are 13 cards on this stack
        if (aceStacks[i].childElementCount !== 13) return false;

        // Check each child
        let suit: SuitType; // Grab the suit from the ace
        for (let c = 0; c < aceStacks[i].childElementCount; ++c) {
            const index = getCardIndexFromElem(aceStacks[i].children[c]);

            // Verify value is correct
            if (c !== VALUES.indexOf( cards[index].getValue() )) return false;

            // Verify the suit is correct
            if (c === 0)
                suit = cards[index].getSuit();
            else if (cards[index].getSuit() !== suit)
                return false;
        }
    }

    // Base case, trigger win sequence
    triggerWinSequence();
    return true;
};

// Used to trigger a win sequence
const triggerWinSequence = () => {
    lockAnimations(); // Lock animations
    restartGameClock(); // Stop clock
    unbindEvents(); // Unbind events

    // Update high score
    const highScore = Math.max(getHighScore(), getScore());
    setHighScore(highScore);

    // Unbind card events to lock gameplay
    for (let i = 0; i < cards.length; ++i)
        cards[i].removeEventListeners();

    // Animate each card
    const cardLocations: HTMLElement[] = [...$(".foundation")];

    // Get children in order going across
    const children: HTMLElement[] = [];
    let cardChildrenBuf = cardLocations.map(c => [...c.children]); // Array of all children to remove
    while (cardChildrenBuf.length) {
        for (let i = 0; i < cardChildrenBuf.length; ++i)
            children.push(cardChildrenBuf[i].pop() as HTMLElement)

        // Remove empty card locations
        cardChildrenBuf = cardChildrenBuf.filter(arr => arr.length);
    }

    // Animate each layer of cards
    for (let i = 0; i < children.length; ++i) {
        // Queue child
        setTimeout(() => {
            const elem = children[i] as HTMLElement;
            const { top, left } = $(elem).offset(); // Grab offset before removing from old parent

            // Pop bottom element
            $(elem).remove();
            $("body").append(elem);

            // Determine horizontal end position on bottom
            const endLeftPerc = 25 + ~~(Math.random() * 50);

            // Set animation
            $(elem).css({
                "opacity": "0",
                "position": "absolute",
                "zIndex": (children.length - i) + 999999,
                "--start-top": top + "px",
                "--start-left": left + "px",
                "--end-left": `calc(${endLeftPerc}% - var(--card-width) / 2)`,
                "animation": "cardEndAnimation 1s cubic-bezier(.81,0,1,1) 1"
            });

            // Play sound
            playSound("flip");
        }, i * 100);
    }

    // Fade in win screen
    setTimeout(() => {
        $("#win-container").css("display", "flex");
        unlockAnimations(); // Unlock animations
        $("#high-score-display").text( getHighScore() ); // Update high score elem
    }, children.length * 100 + 500);
};

// Used to check if autocomplete is available
export const checkForAutocomplete = () => {
    // Check if each card is uncovered
    const columns = $(".tableau");
    for (let i = 0; i < columns.length; ++i) {
        for (let j = 0; j < columns[i].childElementCount; ++j) {
            if ( $(columns[i].children[j]).hasClass("covered") ) {
                $("#autocomplete-btn").css("display", "");
                $("#autocomplete-btn").off("click");
                return;
            }
        }
    }

    // Base case, is able to autocomplete
    $("#autocomplete-btn").css("display", "block");
    $("#autocomplete-btn").off("click"); // Prevent adding multiple event listeners
    $("#autocomplete-btn").one("click", function() {
        $(this).remove();
        unbindEvents(); // Unbind events
        beginAutocomplete();
    });
};

// Used to start autocompleting the game
const beginAutocomplete = async () => {
    // Lock user inputs
    for (let i = 0; i < cards.length; ++i)
        cards[i].removeEventListeners();

    // Continue until win condition is met
    const columns = $(".tableau");
    const foundation = $(".foundation");
    const stock = $("#stock")[0];
    const waste = $("#waste")[0];

    outerLoop:
    do {
        // Check each column
        for (let i = 0; i < columns.length; ++i) {
            if (columns[i].childElementCount === 0) continue;

            // Check top card
            const index = getCardIndexFromElem(columns[i].lastChild);
            const card = cards[index];

            // Check if it can be stacked on the foundation
            for (let j = 0; j < foundation.length; ++j) {
                if (canStackOnElem(card, foundation[j])) {
                    // Move to foundation
                    await animateCardElemMove(card.getElement(), foundation[j]);
                    await wait(100);
                    continue outerLoop;
                }
            }
        }

        // Skip checking waste if there aren't any cards up there
        if (waste.childElementCount === 0 && stock.childElementCount === 0) continue;

        // Check the top of the waste
        if (waste.childElementCount === 0 && stock.childElementCount > 0) {
            await uncoverCardFromStock(); // Draw first card from stock
            await wait(100);
        }

        const topWasteIndex = getCardIndexFromElem(waste.lastChild);
        const topWasteCard = cards[topWasteIndex];
        for (let i = 0; i < foundation.length; ++i) {
            if (canStackOnElem(topWasteCard, foundation[i])) {
                // Move to foundation
                await animateCardElemMove(topWasteCard.getElement(), foundation[i]);
                await wait(100);
                continue outerLoop;
            }
        }

        // Otherwise, can't stack on the foundation yet so cycle the stock to next card
        if (stock.childElementCount === 0) {
            await moveWasteToStock(); // Reset deck
            await wait(100);
        }
        await uncoverCardFromStock(); // Cycle stock to next card
        await wait(100);
    } while (!checkForWinCondition());
};

/**************************** END CONDITION CHECKERS ****************************/
/**************************** START MOVE HISTORY ****************************/

const moveHistory: HistoryStateType[] = []; // The last few moves' data
let currentHistoryState: HistoryStateType = []; // The current history data

// Adds an update to the current state
export const updateHistoryState = (data: HistoryData) => currentHistoryState.push(data);

// Adds the current state to the user's move history
export const saveHistoryState = () => {
    if (currentHistoryState.length) {
        moveHistory.push(currentHistoryState);
        incrementMoves(); // Count move
    }

    currentHistoryState = []; // Reset history state

    // Shift the oldest element
    if (moveHistory.length > MAX_HISTORY_LENGTH) moveHistory.shift();
};

// Clears the move history
const clearMoveHistory = () => { while (moveHistory.length) moveHistory.pop(); };

// Undoes the last move up to 20 times
const undoLastMove = (): Promise<void> => {
    // Handle each state change
    return new Promise((resolve) => {
        // Abort if anim locked
        if (isAnimLocked() || moveHistory.length === 0 || isGamePaused()) return resolve();

        const lastState = moveHistory.pop();

        // Count # of animations needed
        let maxAnims = 0;
        lastState.forEach(stateData => stateData.originalParent !== null ? ++maxAnims : null);

        let animsComplete = 0;
        for (const stateData of lastState) {
            const card = cards[stateData.cardIndex];

            // Handle covering/uncovering
            if (stateData.hasBeenCovered)
                card.uncover();
            else if (stateData.hasBeenUncovered)
                card.cover();

            // Undo move
            if (stateData.originalParent !== null)
                animateCardElemMove(card.getElement(), stateData.originalParent, null, false)
                    .then(() => (++animsComplete === maxAnims) ? resolve() : null);
        }

        playSound("flip"); // Play sound
        incrementMoves(); // Count move
        addScore(-15); // -15 penalty for undoing
        checkForAutocomplete(); // Remove autocomplete icon if needed
    });
};

/**************************** END MOVE HISTORY ****************************/
/**************************** START VISUAL/AURAL STATS ****************************/

// Starts the game clock
let _clockInterval: number = null;
let lastClockUpdateTS: number = null, lastClockPauseTS: number = null;
let elapsedSec = 0;
let lastHandicap2TS: number = null; // The timestamp of the last update for handicap #2
const startGameClock = () => {
    // Stop any running intervals
    if (_clockInterval !== null) clearInterval(_clockInterval);

    const jTimeDisplay = $("#time-display");
    const update = () => {
        if (elapsedSec === 0) lastHandicap2TS = Date.now() - 1e3; // Set initial handicap ts

        ++elapsedSec;
        jTimeDisplay.text(`${Math.floor(elapsedSec / 60)}:${(elapsedSec % 60 + "").padStart(2, "0")}`);
        lastClockUpdateTS = Date.now(); // Update last updated ts

        // Subtract 2 from score for every 10 seconds that elapse
        if (elapsedSec % 10 === 0) addScore(-2);

        // Handle handicaps
        switch (getHandicapID()) {
            case 2: // Undo last two moves every 20 seconds
                if (Date.now() - lastHandicap2TS > 20_000 && !isAnimLocked()) {
                    lastHandicap2TS = Date.now();
                    undoLastMove().then(() => {
                        lockAnimations(); // Add lock to prevent moving while waiting between undos
                        wait(150).then(() => {
                            unlockAnimations(); // Finally, unlock
                            undoLastMove();
                        })
                    });
                }
                break;
        }
    };

    // Queue next update if paused
    if (lastClockPauseTS !== null) {
        // Fix last handicap #2 timestamp due to pause
        lastHandicap2TS += Date.now() - lastClockPauseTS;

        // Properly delay the clock interval restart
        const delay = 1e3 - (lastClockPauseTS - lastClockUpdateTS);
        lastClockPauseTS = null;
        _clockInterval = setTimeout(() => {
            update();
            _clockInterval = setInterval(update, 1e3);
        }, delay);
    } else {
        _clockInterval = setInterval(update, 1e3);
    }
};

// Used to stop the game clock
const restartGameClock = () => {
    clearInterval(_clockInterval);
    elapsedSec = 0;
    _clockInterval = null;
};

// Used to pause the clock
const pauseGameClock = () => {
    clearInterval(_clockInterval);
    lastClockPauseTS = Date.now();
    _clockInterval = null;
};

// Sound functionality below
const createAudioElem = (src: string): HTMLAudioElement => {
    const elem = document.createElement("AUDIO") as HTMLAudioElement;
    elem.src = `/res/audio/${src}.mp3`;
    return elem;
};
const sounds = {
    "shuffle": [ createAudioElem("shuffle1"), createAudioElem("shuffle2") ],
    "flip": [ createAudioElem("flip1"), createAudioElem("flip2"), createAudioElem("flip3"), createAudioElem("flip4") ]
};

// Plays a random sound from the category provided
let areSoundsMuted = false;
export const playSound = (name: "shuffle" | "flip", durationMS: number=null) => {
    if (areSoundsMuted) return;

    // Control speed
    const sound = sounds[name].random();
    if (durationMS !== null)
        sound.playbackRate = sound.duration / (durationMS / 1e3);
    else
        sound.playbackRate = 1;

    sounds[name].random().play()
        .catch(() => {/* Ignore, cannot autoplay */});
};
const toggleSounds = () => areSoundsMuted = !areSoundsMuted;

/**************************** END VISUAL STATS ****************************/
/**************************** START EVENT LISTENERS ****************************/

// Handles resetting the game
let lastResetMouseDown: number = null;
let resetTooltipTimeout: number = null;
const handleResetMouseDown = () => {
    // Clear reset tooltip timeout
    if (resetTooltipTimeout !== null) {
        clearTimeout(resetTooltipTimeout);
        $("#reset-btn").removeClass("scanning"); // Fix animation
    }

    // Update last mouse down timestamp
    lastResetMouseDown = Date.now();

    // Add visual indicator
    $("#reset-btn").addClass("scanning");
    $("#reset-tooltip").css("display", "");

    // Bind mouse up
    $(window).one("mouseup", () => handleResetMouseUp());
};

const handleResetMouseUp = () => {
    // Measure duration
    $("#reset-btn").removeClass("scanning");
    if (Date.now() - lastResetMouseDown > 500) {
        restartGame(); // Reset
        lastResetMouseDown = null;
    } else {
        // Show notification
        $("#reset-tooltip").css("display", "block");

        // Queue hide again
        resetTooltipTimeout = setTimeout(() => {
            $("#reset-tooltip").css("display", "");
            resetTooltipTimeout = null; // Reset timeout ID
        }, 2200);
    }
};

const bindEvents = () => {
    $("#stock").on("click", () => cycleDeckToNext()); // Bind cycle deck to stock
    $("#play-again-btn").on("click", () => restartGame()); // Bind play again button
    $("#undo-btn").on("click", () => undoLastMove()); // Bind undo button
    $("#reset-btn").on("mousedown", () => handleResetMouseDown()); // Bind reset button
    $(window).on("blur", () => pauseGameClock()); // Pause on lost focus
    $(window).on("focus", () => startGameClock()); // Resume clock on gained focus

    // Keyboard events
    $(window).off("keyup"); // Remove existing listeners
    $(window).on("keyup", e => {
        switch (e.code) {
            case "KeyP": togglePauseGame(); break;
            case "KeyU": undoLastMove(); break;
            case "KeyM": toggleSounds(); break;
        }
    });
};

const unbindEvents = () => {
    $("#stock").off("click"); // Bind cycle deck to stock
    $("#undo-btn").off("click"); // Bind undo button
    $("#reset-btn").off("mousedown"); // Bind reset button
    $(window).off("blur focus"); // Pause on lost focus
};

/**************************** END EVENT LISTENERS ****************************/