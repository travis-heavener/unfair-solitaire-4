# Unfair Solitaire v4
### Travis Heavener

## About
Unfair Solitaire was a project I pitched at a dinner table while sailing down the Rhine back in 2022. The concept is simple: solitaire is out to get you.

A series of handicaps or punishments (whatever you want to call them) are put in place to make the game harder. There are three categories--easy, normal, and impossible. Easy and normal handicaps will merely slow you down (ie. undoing your last move, freezing the game, etc.); impossible handicaps will very likely ruin the game (ie. remove a card from the deck, swap two cards, even if it doesn't make sense).

### Come try it for yourself!

[wowtravis.com/unfair-solitaire-4](https://wowtravis.com/unfair-solitaire-4/)

## Content Warning
This game may employ flashing colors and/or sounds, users are encouraged to play at their own discretion.

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

## Handicaps Guide
If opted in, there are three different types of handicaps:
* **Easy** handicaps make the game a bit more difficult than normal, but the game is still playable (and winnable).
* **Normal** handicaps make the game difficult, but the game itself is still solveable.
* **Insane** (or better, **impossible**) is made to outright torture the player and make the game unplayable AND unsolvable.

| Handicap #    | Rating    | Description   |
|---------------|-----------|---------------|
| 1             | Easy      | All face cards are replaced by M, L, and C (a la the Three Stooges, corresponding values ordered by seniority in descending order)
| 2             | Easy      | Every 20 seconds, undoes the last two moves (will wait if a user is mid-move)
| 3             | Easy      | Adds a cooldown to recycling the waste pile (10 seconds)
| 4             | Easy      | Users must verify they are human before recycling the waste pile
| 5             | Easy      | Everytime an ace is uncovered, the user is flashbanged
| 6             | Easy      | Cards are replaced with Roman numerals; additionally, the King becomes the Rex (Rx), Queen becomes Regina (Rg), and Jack becomes Princeps (Pc)
| 7             | Easy      | An extra card is added to the deck with a fish on it; it doesn't do anything, but I like to think he's judging you
| 8             | Easy      | King, Queen, and Jack took off abruptly and left 11, 12, and 13 in their places
| 9             | Normal    | Can only stack up to 8 cards on the tableau at a time (including face-down cards)
| 10            | Normal    | Every card drawn from the waste pile decreases the amount of playable space on screen
| 11            | Normal    | No suits...
| 12            | Normal    | The cards are heavy and cannot be moved in stacks greater than 4 at a time
| 13            | Normal    | Each card's value is missing (probably fell off)
| 14            | Normal    | The cards got left in the rain and are slippery, so you can't hold them for too long
| 15            | Insane    | If the 7 of spades is uncovered, the entire game resets
| 16            | Insane    | Random cards are removed from the deck and will not be usable
| 17            | Insane    | A random card is copied its value's number of times into the deck, replacing cards (ex. a 4 will replace 3 other cards with itself)
| 18            | Insane    | Every 20 seconds, two cards switch places
| 19            | Insane    | Random cards are replaced with a Joker that can only be stacked on 6s and 9s
| 20            | Insane    | Mixes up all the uncovered cards randomly at random times
| 21            | Normal    | The actual value and suit of each card is randomized from what they appear to be
| 22            | Normal    | Each card appears to be an 8... these crazy 8s, huh

## Build
Install all required packages via `npm i`.

To compile the TypeScript files, use `npx tsc -w` to compile in "watched mode".