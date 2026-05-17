export const zh = {
    appName: "HAN&ivy的游乐园",
    home: {
        welcome: "欢迎来到",
        selectGame: "选择一个游戏"
    },
    game: {
        round: "第 {current} / {total} 轮",
        playersTurn: "轮到 {name}",
        rollsLeft: "剩余次数"
    },
    button: {
        rollDice: "掷骰子",
        rolling: "摇一摇...",
        save: "保存",
        newGame: "新游戏",
        playAgain: "再玩一次",
        startGame: "开始游戏",
        backToHome: "返回游乐园",
        gameRules: "游戏规则"
    },
    games: {
        yahtzee: {
            title: "快艇骰子",
            description: "一款经典的运气和策略的骰子游戏。"
        },
        matchingPair: {
            title: "记忆配对",
            description: "翻开卡片，寻找相同的配对！"
        },
        dotsAndBoxes: {
            title: "点格棋",
            description: "连接点点，抢占属于你的格子！"
        },
        shutTheBox: {
            title: "关门大吉",
            description: "掷骰子，翻数字牌。你能成功关上盒子吗？"
        },
        wordLadder: {
            title: "单词阶梯",
            description: "每次改一个字母，把两个词连起来！"
        },
        comingSoon: {
            title: "敬请期待...",
            description: "更多好玩的游戏正在开发中！"
        }
    },
    matchingGame: {
        turn: "的回合",
        pairsFound: "已找到配对"
    },
    shutTheBoxGame: {
        diceTotal: "骰子总点数",
        selectedTotal: "已选点数",
        confirmMove: "确认选择",
        noMoves: "没有可行的步数！",
        endTurn: "结束回合",
        switchToOneDie: "使用单个骰子",
        switchToTwoDice: "使用两个骰子",
        yourScore: "你的得分: {score}",
        waiting: "等待对手",
        yourTurn: "你的回合"
    },
    wordLadderGame: {
        startWord: "起始词",
        endWord: "目标词",
        enterWord: "输入一个4字母单词...",
        submit: "提交",
        suggestWord: "建议添加此词？",
        error: {
            length: "单词必须是4个字母。",
            oneLetter: "必须与上一个词相差一个字母。",
            notInDict: "不是一个有效的英文单词。",
            notInDictSuggest: "词典里没有 “{word}”。",
            sameAsLast: "不能和上一个词相同。"
        },
        congratulations: "恭喜！",
        youWon: "你已成功到达目标词！"
    },
    rules: {
        common: {
            objectiveTitle: "目标",
            gameplayTitle: "玩法",
            scoringTitle: "计分",
            winningTitle: "如何获胜"
        },
        yahtzee: {
            title: "快艇骰子规则",
            objective: "通过掷五个骰子来组成特定组合，获得最高的总分。",
            gameplay_1: "玩家轮流掷骰子。在你的回合，你最多可以掷三次。",
            gameplay_2: "第一次掷出所有五个骰子。在第二和第三次掷骰时，你可以选择“锁定”任意数量的骰子，然后重掷其余的骰子。",
            gameplay_3: "完成掷骰后，你必须选择一个计分项目来记录分数。每个项目在一局游戏中只能使用一次。",
            scoring_1: "上区：分数为与项目匹配的骰子点数总和（例如，在“三点”项目中，三个3点得9分）。如果上区总分达到或超过63分，你将获得35分的奖励。",
            scoring_2: "下区：根据扑克牌的组合计分（例如，葫芦、快艇）。",
            scoring_3: "快艇（五个相同点数）：第一次获得可得50分。后续的快艇可获得100分的奖励，并可作为“百搭”用于下区的计分。",
            winning: "游戏在13轮后结束。总分最高的玩家获胜！"
        },
        matching: {
            title: "记忆配对规则",
            objective: "找到比对手更多的匹配卡片对。",
            gameplay_1: "玩家轮流一次翻开两张卡片。",
            gameplay_2: "如果两张卡片匹配，玩家得一分，并可以再进行一次回合。",
            gameplay_3: "如果卡片不匹配，它们将被翻回背面，轮到下一位玩家。",
            gameplay_4: "注意观察翻开的卡片，记住它们的位置。",
            winning: "当所有卡片对都找到后，游戏结束。拥有最多卡片对的玩家获胜！"
        },
        dotsAndBoxes: {
            title: "点格棋规则",
            objective: "占领比对手更多的格子。",
            gameplay_1: "玩家轮流在两个相邻的点之间画一条水平或垂直的线。",
            gameplay_2: "如果你画的线完成了一个1x1格子的第四条边，你将占领该格子并得一分。",
            gameplay_3: "当你完成一个格子时，你必须再进行一个回合。",
            winning: "当所有线都画完，所有格子都被占领后，游戏结束。拥有最多格子的玩家获胜！"
        },
        shutTheBox: {
            title: "关门大吉规则",
            objective: "通过关闭尽可能多的数字牌来以最低分结束游戏。分数越低越好。",
            gameplay_1: "每个玩家轮流尝试关闭自己所有的九个数字牌。",
            gameplay_2: "在你的回合，掷骰子。然后你必须选择一个或多个未关闭的数字牌，使其总和等于骰子的总点数。",
            gameplay_3: "选择正确的数字牌后，点击“确认选择”。这些牌将被关闭。然后你再次掷骰子。",
            gameplay_4: "如果你7到9的数字牌都已关闭，你可以选择只掷一个骰子。",
            winning: "当你的掷骰结果无法匹配任何未关闭的数字牌组合时，你的回合结束。你的分数是剩下未关闭数字牌的总和。分数较低的玩家获胜。得0分（所有牌都关闭）称为“关门大吉”！"
        },
        wordLadder: {
            title: "单词阶梯规则",
            objective: "成为从“起始词”通过每次改变一个字母到达“目标词”的玩家。",
            gameplay_1: "玩家轮流输入一个与前一个词只有一个字母不同的新词。",
            gameplay_2: "新词必须是游戏词典中的有效英文单词。",
            gameplay_3: "如果你输入的词有效但不在我们的词典中，你可以选择“建议添加此词？”将其添加到当前游戏中。",
            winning: "第一个成功输入“目标词”的玩家获胜！"
        }
    },
    setup: {
        title: "开始新游戏",
        player1: "玩家 1",
        player2: "玩家 2",
        name: "昵称",
        avatar: "形象"
    },
    scorecard: {
        upperSection: "上区",
        lowerSection: "下区",
        score: "得分",
        subtotal: "小计",
        bonus: "奖励分",
        yahtzeeBonus: "Yathzee 奖励",
        totalScore: "总分"
    },
    gameOver: {
        title: "游戏结束!",
        wins: "获胜!",
        tie: "是平局呀!"
    },
    alert: {
        gameSaved: "游戏已保存!",
        mustScoreUpper: "掷出了 {n} 的 Yahtzee，必须先为“{category}”计分。"
    },
    achievements: {
        perfectPair: {
            name: "完美一对",
            description: "获得了第一个葫芦!"
        },
        firstYahtzee: {
            name: "我们的第一个 Yahtzee!",
            description: "获得了第一个 Yahtzee!"
        },
        dynamicDuo: {
            name: "活力二人组",
            description: "你们的总分超过400分啦!"
        }
    },
    categories: {
        aces: "一点",
        twos: "二点",
        threes: "三点",
        fours: "四点",
        fives: "五点",
        sixes: "六点",
        threeOfAKind: "三条",
        fourOfAKind: "四条",
        fullHouse: "葫芦",
        smallStraight: "小顺",
        largeStraight: "大顺",
        yahtzee: "YAHTZEE",
        chance: "全选"
    },
    emotes: {
        great: "你太棒啦！",
        lucky: "运气真好呀！",
        love: "和你一起玩真开心！",
        close: "哎呀，就差一点！",
        nice: "真不错！",
        myTurn: "该我好运啦！"
    },
    die: {
        ariaLabel: "骰子点数 {value}, 状态: {status}",
        held: "已锁定",
        notHeld: "未锁定"
    }
};