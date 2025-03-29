# Unfair Solitaire v4
### Travis Heavener

## About
Unfair Solitaire was a project I pitched at a dinner table while sailing down the Rhine back in 2022. The concept is simple: solitaire is out to get you.

A series of handicaps or punishments (whatever you want to call them) are put in place to make the game harder. There are two categories--normal, and impossible. Normal handicaps will merely slow you down (ie. undoing your last move, freezing the game, etc.); impossible handicaps will very likely ruin the game (ie. remove a card from the deck, swap two cards, even if it doesn't make sense).

## Controls
| Key | Function |
|-----|-------------------|
| M   | Mute sounds       |
| P   | Toggle pause/play |
| U   | Undo last move    |

## Scoring
Scoring is based on standard solitaire score systems as such:

| Amount   | Condition |
|----------|----------------------------------------------------------|
| +10      | For moving a card to the foundation
| +5       | For uncovering a card in the tableau
| +5       | For moving a card from the stock/waste to the tableau
| +3       | For moving a card between columns on the tableau
| -2       | Every ten seconds
| -15      | For moving a card from the foundation down to the tableau
| -50      | Everytime the waste pile is moved back to the deck

The player's high score is saved in the browser's Local Storage.

## Build
Install all required packages via `npm i`.

To compile the TypeScript files, use `npx tsc -w` to compile in "watched mode".