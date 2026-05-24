export const en = {
    appName: "HAN & ivy's Playground",
    home: {
        welcome: "Welcome to",
        selectGame: "Choose a Game"
    },
    game: {
        round: "Round {current} of {total}",
        playersTurn: "{name}'s Turn",
        rollsLeft: "Rolls left"
    },
    button: {
        rollDice: "Roll Dice",
        rolling: "Rolling...",
        save: "Save",
        newGame: "New Game",
        playAgain: "Play Again",
        startGame: "Start Game",
        backToHome: "Back to Playground",
        gameRules: "Game Rules"
    },
    games: {
        yahtzee: {
            title: "Yahtzee",
            description: "A classic dice game of luck and strategy."
        },
        matchingPair: {
            title: "Matching Pair",
            description: "Flip cards to find the matching pairs!"
        },
        dotsAndBoxes: {
            title: "Dots & Boxes",
            description: "Connect the dots to claim your boxes!"
        },
        shutTheBox: {
            title: "Shut the Box",
            description: "Roll the dice and flip the tiles. Can you shut the box?"
        },
        wordLadder: {
            title: "Word Ladder",
            description: "Change one letter at a time to connect the words!"
        },
        battleship: {
            title: "Battleship",
            description: "Hide your fleet, then sink your opponent's ships!"
        },
        comingSoon: {
            title: "Coming Soon...",
            description: "More fun games are on the way!"
        }
    },
    matchingGame: {
        turn: "'s Turn",
        pairsFound: "Pairs Found"
    },
    shutTheBoxGame: {
        diceTotal: "Dice Total",
        selectedTotal: "Selected",
        confirmMove: "Confirm Move",
        noMoves: "No possible moves!",
        endTurn: "End Turn",
        switchToOneDie: "Use One Die",
        switchToTwoDice: "Use Two Dice",
        yourScore: "Your Score: {score}",
        waiting: "Waiting for Opponent",
        yourTurn: "Your Turn"
    },
    battleshipGame: {
        passDevice: "Pass the device",
        handoffTo: "Pass to {name}",
        handoffPlaceMsg: "It's your turn to place your fleet. Tap Ready when you're alone with the device.",
        handoffFireMsg: "It's your turn to fire. Tap Ready when you're alone with the device.",
        readyButton: "I'm Ready",
        placementHint: "Pick a ship, then click the board to drop it. Click a placed ship to pick it back up.",
        shipsTitle: "Your Ships",
        placed: "placed — click to move",
        pick: "click to place",
        orientationHorizontal: "Horizontal ↔ (press R)",
        orientationVertical: "Vertical ↕ (press R)",
        rotateHint: "Rotate (R)",
        yourFleet: "Your fleet",
        enemyFleet: "Enemy fleet",
        shuffle: "Shuffle",
        clear: "Clear All",
        confirmPlacement: "Confirm Fleet",
        enemyWaters: "Enemy Waters — pick a target",
        yourWaters: "{name}'s Waters",
        hit: "Hit!",
        miss: "Miss.",
        sunk: "Ship Sunk!",
        endTurn: "End Turn",
        hitsTaken: "Hits taken: {n} / {total}",
        online: {
            placeYourFleet: "Place your fleet — your opponent can't see it",
            waitingOpponent: "Fleet ready! Waiting for {name} to place their ships…",
            yourTurnFire: "Your turn — fire at the enemy!",
            opponentTurnFire: "{name} is taking aim…",
            firing: "Firing…",
            youWin: "You sank the whole enemy fleet!",
            youLose: "Your fleet was sunk."
        }
    },
    wordLadderGame: {
        startWord: "Start Word",
        endWord: "End Word",
        enterWord: "Enter a 4-letter word...",
        submit: "Submit Word",
        suggestWord: "Suggest this word?",
        error: {
            length: "Word must be 4 letters.",
            oneLetter: "Must be one letter different from the last word.",
            notInDict: "Not a valid English word.",
            notInDictSuggest: "\"{word}\" is not in our dictionary.",
            sameAsLast: "Cannot be the same as the last word."
        },
        congratulations: "Congratulations!",
        youWon: "You've reached the target word!"
    },
    rules: {
        common: {
            objectiveTitle: "Objective",
            gameplayTitle: "Gameplay",
            scoringTitle: "Scoring",
            winningTitle: "How to Win"
        },
        yahtzee: {
            title: "Yahtzee Rules",
            objective: "Get the highest total score by rolling five dice to make certain combinations.",
            gameplay_1: "Each player takes turns rolling the dice. On your turn, you can roll up to three times.",
            gameplay_2: "On your first roll, roll all five dice. For your second and third rolls, you can 'hold' any dice and re-roll the rest.",
            gameplay_3: "After your rolls, you must choose a category to score in. Each category can only be used once per game.",
            scoring_1: "Upper Section: Score the sum of the dice matching the category (e.g., in 'Threes', three 3s scores 9). A 35-point bonus is awarded if the Upper Section total is 63 or more.",
            scoring_2: "Lower Section: Score for poker-like combinations (e.g., Full House, Yahtzee).",
            scoring_3: "Yahtzee (Five of a kind): The first is worth 50 points. Subsequent Yahtzees earn a 100-point bonus and can act as a 'Joker'.",
            winning: "The game ends after 13 rounds. The player with the highest total score wins!"
        },
        matching: {
            title: "Matching Pair Rules",
            objective: "Find more matching pairs of cards than your opponent.",
            gameplay_1: "Players take turns flipping over two cards at a time.",
            gameplay_2: "If the two cards match, the player scores a point and gets to take another turn.",
            gameplay_3: "If the cards do not match, they are flipped back over, and it becomes the next player's turn.",
            gameplay_4: "Pay attention to the cards that are flipped over to remember their locations.",
            winning: "The game ends when all pairs have been found. The player with the most pairs wins!"
        },
        dotsAndBoxes: {
            title: "Dots & Boxes Rules",
            objective: "Capture more boxes than your opponent.",
            gameplay_1: "Players take turns drawing a single horizontal or vertical line between two adjacent dots.",
            gameplay_2: "If you draw a line that completes the fourth side of a 1x1 box, you capture that box and get one point.",
            gameplay_3: "When you complete a box, you MUST take another turn.",
            winning: "The game ends when all lines have been drawn and all boxes are captured. The player with the most boxes wins!"
        },
        shutTheBox: {
            title: "Shut the Box Rules",
            objective: "End the game with the lowest score by closing as many numbered tiles as possible. The lower score wins.",
            gameplay_1: "Each player takes a turn trying to close all nine of their tiles.",
            gameplay_2: "On your turn, roll the dice. You must then choose one or more open tiles that sum up to the total of the dice roll.",
            gameplay_3: "After selecting the correct tiles, click 'Confirm Move'. These tiles are now closed. You then roll again.",
            gameplay_4: "If all your tiles from 7 to 9 are closed, you may choose to roll only one die.",
            winning: "Your turn ends when you cannot make a valid move. Your score is the sum of your remaining open tiles. The player with the lower score wins. A score of 0 is a 'Shut the Box'!"
        },
        battleship: {
            title: "Battleship Rules",
            objective: "Be the first to sink all of your opponent's ships.",
            gameplay_1: "Each player places a fleet of 5 ships (lengths 5, 4, 3, 3, 2) on an 8×8 grid. Tap Shuffle until you like your layout.",
            gameplay_2: "After placing, pass the device to your opponent so they can place their fleet in private.",
            gameplay_3: "On your turn, fire at a cell on the enemy waters. The board shows ✕ for hits and · for misses.",
            gameplay_4: "After each shot, pass the device back to your opponent.",
            winning: "Sink every one of your opponent's ships to win the battle!"
        },
        wordLadder: {
            title: "Word Ladder Rules",
            objective: "Be the player to reach the 'End Word' by changing one letter at a time from the 'Start Word'.",
            gameplay_1: "Players take turns entering a new word that is only one letter different from the previous word.",
            gameplay_2: "The new word must be a valid English word found in the game's dictionary.",
            gameplay_3: "If you enter a valid word that isn't in our dictionary, you can choose to 'Suggest this word?' to add it for the current game session.",
            winning: "The first player to successfully enter the 'End Word' wins the game!"
        }
    },
    setup: {
        title: "New Game Setup",
        player1: "Player 1",
        player2: "Player 2",
        name: "Name",
        avatar: "Avatar"
    },
    scorecard: {
        upperSection: "Upper Section",
        lowerSection: "Lower Section",
        score: "Score",
        subtotal: "Subtotal",
        bonus: "Bonus",
        yahtzeeBonus: "Yahtzee Bonus",
        totalScore: "Total Score"
    },
    gameOver: {
        title: "Game Over!",
        wins: "wins!",
        tie: "It's a Tie!"
    },
    alert: {
        gameSaved: "Game Saved!",
        mustScoreUpper: "With a Yahtzee of {n}s, you must score the '{category}' category first."
    },
    achievements: {
        perfectPair: {
            name: "The Perfect Pair",
            description: "Scored the first Full House!"
        },
        firstYahtzee: {
            name: "Our First Yahtzee!",
            description: "Scored the first Yahtzee!"
        },
        dynamicDuo: {
            name: "Dynamic Duo",
            description: "Your combined score is over 400!"
        }
    },
    categories: {
        aces: "Aces",
        twos: "Twos",
        threes: "Threes",
        fours: "Fours",
        fives: "Fives",
        sixes: "Sixes",
        threeOfAKind: "3 of a Kind",
        fourOfAKind: "4 of a Kind",
        fullHouse: "Full House",
        smallStraight: "Small Straight",
        largeStraight: "Large Straight",
        yahtzee: "YAHTZEE",
        chance: "Chance"
    },
    emotes: {
        great: "You're doing great!",
        lucky: "Such a lucky roll!",
        love: "I love playing with you!",
        close: "Aww, so close!",
        nice: "Nice one!",
        myTurn: "My turn to be lucky!"
    },
    die: {
        ariaLabel: "Die with value {value}, status: {status}",
        held: "held",
        notHeld: "not held"
    },
    online: {
        playOnline: "Play Online (2 devices)",
        title: "Play on Two Devices",
        subtitle: "Same Wi-Fi or anywhere — share a room code to play together.",
        yourName: "Your name",
        create: "Create a room",
        join: "Join a room",
        creating: "Creating room…",
        waitingForPlayer: "Waiting for the other player to join…",
        roomCode: "Room code",
        shareCode: "Share this code with the other player:",
        enterCode: "Enter room code",
        connect: "Connect",
        connecting: "Connecting…",
        back: "Back",
        cancel: "Cancel",
        connected: "Connected",
        leave: "Leave",
        online: "Online",
        waitingForHost: "Connected! Waiting for {name} to pick a game…",
        waitingForGame: "Waiting for the game to start…",
        yourTurn: "Your turn",
        theirTurn: "{name}'s turn — waiting…",
        you: "you",
        errors: {
            roomNotFound: "Room not found. Double-check the code.",
            connectionLost: "Connection lost. Try reconnecting.",
            peerError: "Something went wrong. Please try again."
        }
    }
};