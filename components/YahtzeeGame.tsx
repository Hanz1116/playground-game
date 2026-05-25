import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Scorecard } from './Scorecard';
import { Die } from './Die';
import { GameOverModal, DisplayPlayer } from './GameOverModal';
import { PlayerSetupModal } from './PlayerSetupModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GameRulesModal } from './GameRulesModal';
import { OnlineWaiting, TurnBanner } from './OnlineStatus';
import { GameState, Player, Category, Scores, GameStatus, AvatarState, AchievementId } from '../types';
import { CATEGORIES, EMOTE_MESSAGE_KEYS, ACHIEVEMENTS } from '../constants';
import { calculatePotentialScores } from '../utils/scoreCalculator';
import { useI18n } from '../hooks/useI18n';
import { useNetworkedGame } from '../hooks/useNetworkedGame';
import { playSfx } from '../hooks/soundEffects';

const getInitialScores = (): Scores => {
    const scores: Partial<Scores> = {};
    CATEGORIES.forEach(cat => {
        scores[cat.id] = null;
    });
    scores.yahtzeeBonus = 0;
    return scores as Scores;
};

const getInitialPlayer = (id: 1 | 2, name: string, avatar: string): Player => ({
    id,
    name,
    avatar,
    scores: getInitialScores(),
});

interface YahtzeeGameProps {
    onGoHome: () => void;
}

export const YahtzeeGame: React.FC<YahtzeeGameProps> = ({ onGoHome }) => {
    const { gameState, setGameState, isOnline, isMyTurn, players: onlinePlayers, mySeat } = useNetworkedGame<GameState>('yahtzee');
    const [isRolling, setIsRolling] = useState(false);
    const [lastAchievement, setLastAchievement] = useState<AchievementId | null>(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const { t } = useI18n();

    const calculateTotalScore = (scores: Scores): number => {
        const upperSectionIds: Category[] = ['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'];
        const upperSubtotal = upperSectionIds.reduce((sum, id) => sum + (scores[id] || 0), 0);
        const upperBonus = upperSubtotal >= 63 ? 35 : 0;
        const upperTotal = upperSubtotal + upperBonus;

        const lowerSectionIds: Category[] = ['threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'];
        const lowerTotal = lowerSectionIds.reduce((sum, id) => sum + (scores[id] || 0), 0);

        return upperTotal + lowerTotal + (scores.yahtzeeBonus || 0);
    };

    const initializeGame = useCallback((player1Name: string, player1Avatar: string, player2Name: string, player2Avatar: string) => {
        setGameState({
            players: [
                getInitialPlayer(1, player1Name, player1Avatar),
                getInitialPlayer(2, player2Name, player2Avatar),
            ],
            gameStatus: GameStatus.IN_PROGRESS,
            currentPlayerId: 1,
            currentRound: 1,
            rollsLeft: 3,
            dice: Array(5).fill(1).map(() => Math.ceil(Math.random() * 6)),
            heldDice: Array(5).fill(false),
            potentialScores: {},
            avatarStates: { 1: 'idle', 2: 'idle' },
            emote: null,
            unlockedAchievements: [],
        });
    }, []);

    useEffect(() => {
        if (isOnline) return; // online state comes from the peer, not local storage
        const savedGame = localStorage.getItem('yahtzeeGameState');
        if (savedGame) {
            setGameState(JSON.parse(savedGame));
        }
    }, [isOnline]);

    // Online: host creates the opening hand and broadcasts it.
    useEffect(() => {
        if (isOnline && !gameState && onlinePlayers && mySeat === 1) {
            initializeGame(onlinePlayers.p1.name, onlinePlayers.p1.avatar, onlinePlayers.p2.name, onlinePlayers.p2.avatar);
        }
    }, [isOnline, gameState, onlinePlayers, mySeat, initializeGame]);
    
    const currentPlayer = useMemo(() => {
        if (!gameState) return null;
        return gameState.players.find(p => p.id === gameState.currentPlayerId);
    }, [gameState]);

    const setAvatarState = useCallback((playerId: 1 | 2, state: AvatarState) => {
        setGameState(prev => {
            if (!prev) return null;
            const newAvatarStates = { ...prev.avatarStates, [playerId]: state };
            return { ...prev, avatarStates: newAvatarStates };
        });
        if (state !== 'idle' && state !== 'thinking') {
            setTimeout(() => setAvatarState(playerId, 'idle'), 2000);
        }
    }, []);

    const handleRollDice = () => {
        if (isOnline && !isMyTurn) return;
        if (!gameState || gameState.rollsLeft === 0 || isRolling || !currentPlayer) return;

        setIsRolling(true);
        playSfx('diceRoll');
        setAvatarState(currentPlayer.id, 'thinking');

        setTimeout(() => {
            const newDice = gameState.dice.map((die, index) =>
                gameState.heldDice[index] ? die : Math.ceil(Math.random() * 6)
            );
            
            const newPotentialScores = calculatePotentialScores(newDice);
            
            const highValueScore = newPotentialScores.fullHouse || newPotentialScores.smallStraight || newPotentialScores.largeStraight;
            if (newPotentialScores.yahtzee) {
                 setAvatarState(currentPlayer.id, 'celebrate');
            } else if (highValueScore) {
                setAvatarState(currentPlayer.id, 'happy');
            } else {
                 setAvatarState(currentPlayer.id, 'idle');
            }


            setGameState(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    dice: newDice,
                    rollsLeft: prev.rollsLeft - 1,
                    potentialScores: newPotentialScores,
                };
            });
            setIsRolling(false);
        }, 1000);
    };

    const handleToggleHold = (index: number) => {
        if (isOnline && !isMyTurn) return;
        if (!gameState || gameState.rollsLeft === 3) return;
        setGameState(prev => {
            if (!prev) return null;
            const newHeldDice = [...prev.heldDice];
            newHeldDice[index] = !newHeldDice[index];
            return { ...prev, heldDice: newHeldDice };
        });
    };
    
    const triggerAchievement = (id: AchievementId) => {
        setLastAchievement(id);
        setTimeout(() => setLastAchievement(null), 4000);
    };

    const handleScoreCategory = (category: Category) => {
        if (isOnline && !isMyTurn) return;
        if (!gameState || !currentPlayer || currentPlayer.scores[category] !== null || gameState.rollsLeft === 3) return;
        
        const isYahtzeeRoll = (gameState.potentialScores.yahtzee || 0) > 0;
        const hasScoredYahtzee = currentPlayer.scores.yahtzee === 50;
        let score = gameState.potentialScores[category] ?? 0;
        let yahtzeeBonusAwarded = 0;

        if (isYahtzeeRoll && hasScoredYahtzee) {
            yahtzeeBonusAwarded = 100;
            const yahtzeeValue = gameState.dice[0];
            const upperCategoryForYahtzee: Category = (['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'] as const)[yahtzeeValue - 1];

            if (currentPlayer.scores[upperCategoryForYahtzee] === null && category !== upperCategoryForYahtzee) {
                const categoryName = t(CATEGORIES.find(c => c.id === upperCategoryForYahtzee)?.nameKey || '');
                alert(t('alert.mustScoreUpper', { n: yahtzeeValue, category: categoryName }));
                return;
            }

            if(score === 0) { // Joker rules for lower section
               if (category === 'fullHouse') score = 25;
               if (category === 'smallStraight') score = 30;
               if (category === 'largeStraight') score = 40;
            }
        }
        
        playSfx('score');
        setGameState(prev => {
            if (!prev) return null;

            let newUnlockedAchievements = [...prev.unlockedAchievements];

            const newPlayers = prev.players.map(p => {
                if (p.id === prev.currentPlayerId) {
                    const newScores: Scores = { 
                        ...p.scores, 
                        [category]: score,
                        yahtzeeBonus: (p.scores.yahtzeeBonus || 0) + yahtzeeBonusAwarded,
                    };
                    return { ...p, scores: newScores };
                }
                return p;
            }) as [Player, Player];

            // Achievement Checks
            if (category === 'fullHouse' && score > 0 && !newUnlockedAchievements.includes('perfectPair')) {
                newUnlockedAchievements.push('perfectPair');
                triggerAchievement('perfectPair');
            }
            if (category === 'yahtzee' && score > 0 && !newUnlockedAchievements.includes('firstYahtzee')) {
                newUnlockedAchievements.push('firstYahtzee');
                triggerAchievement('firstYahtzee');
            }
            const totalScore = calculateTotalScore(newPlayers[0].scores) + calculateTotalScore(newPlayers[1].scores);
            if (totalScore > 400 && !newUnlockedAchievements.includes('dynamicDuo')) {
                 newUnlockedAchievements.push('dynamicDuo');
                 triggerAchievement('dynamicDuo');
            }
            
            const isGameOver = newPlayers.every(p => CATEGORIES.every(cat => p.scores[cat.id] !== null));
            const nextPlayerId = prev.currentPlayerId === 1 ? 2 : 1;
            const nextRound = prev.currentPlayerId === 2 ? prev.currentRound + 1 : prev.currentRound;

            if (isGameOver) {
                return { ...prev, players: newPlayers, gameStatus: GameStatus.GAME_OVER, unlockedAchievements: newUnlockedAchievements };
            }

            return {
                ...prev,
                players: newPlayers,
                currentPlayerId: nextPlayerId,
                currentRound: nextRound,
                rollsLeft: 3,
                heldDice: Array(5).fill(false),
                dice: Array(5).fill(1),
                potentialScores: {},
                avatarStates: { 1: 'idle', 2: 'idle' },
                unlockedAchievements: newUnlockedAchievements,
            };
        });
    };
    
    const handleNewGame = () => {
        localStorage.removeItem('yahtzeeGameState');
        setGameState(null);
    };

    const handleSaveGame = () => {
        if (gameState) {
            localStorage.setItem('yahtzeeGameState', JSON.stringify(gameState));
            alert(t('alert.gameSaved'));
        }
    };

    const handleEmote = () => {
        if (isOnline && !isMyTurn) return;
        if (!gameState || !currentPlayer) return;
        const targetPlayerId = currentPlayer.id === 1 ? 2 : 1;
        const messageKey = EMOTE_MESSAGE_KEYS[Math.floor(Math.random() * EMOTE_MESSAGE_KEYS.length)];
        const message = t(messageKey);
        setGameState(prev => prev ? ({ ...prev, emote: { targetPlayerId, message, id: Date.now() } }) : null);
        setTimeout(() => {
            setGameState(prev => prev ? ({ ...prev, emote: null }) : null);
        }, 3000);
    };
    
    const winner = useMemo(() => {
        if (!gameState || gameState.gameStatus !== GameStatus.GAME_OVER) return null;
        const player1Total = calculateTotalScore(gameState.players[0].scores);
        const player2Total = calculateTotalScore(gameState.players[1].scores);
        if (player1Total === player2Total) return { ...gameState.players[0], name: t('gameOver.tie'), score: player1Total };
        return player1Total > player2Total ? { ...gameState.players[0], score: player1Total } : { ...gameState.players[1], score: player2Total };
    }, [gameState, t]);

    if (!gameState) {
        if (isOnline) return <OnlineWaiting onGoHome={onGoHome} />;
        return <PlayerSetupModal onStart={initializeGame} onGoHome={onGoHome} />;
    }

    if (gameState.gameStatus === GameStatus.GAME_OVER && winner) {
        const displayPlayers: [DisplayPlayer, DisplayPlayer] = [
            { ...gameState.players[0], score: calculateTotalScore(gameState.players[0].scores) },
            { ...gameState.players[1], score: calculateTotalScore(gameState.players[1].scores) }
        ];
        return <GameOverModal winner={winner} players={displayPlayers} onNewGame={handleNewGame} onGoHome={onGoHome} />;
    }
    
    const player1 = gameState.players[0];
    const player2 = gameState.players[1];
    
    const p1Color = 'amber';
    const p2Color = 'pink';

    return (
        <div 
            className="flex flex-col items-center p-2 sm:p-4 relative"
        >
             {lastAchievement && (
                <div className="achievement-popup fixed top-5 left-1/2 -translate-x-1/2 bg-cyan-400 text-slate-900 px-6 py-3 rounded-lg shadow-lg z-50 text-center">
                    <p className="font-bold text-lg">{t(ACHIEVEMENTS[lastAchievement].nameKey)}</p>
                    <p>{t(ACHIEVEMENTS[lastAchievement].descriptionKey)}</p>
                </div>
            )}
             {isRulesModalOpen && (
                <GameRulesModal
                    title={t('rules.yahtzee.title')}
                    onClose={() => setIsRulesModalOpen(false)}
                >
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.objectiveTitle')}</h4>
                            <p>{t('rules.yahtzee.objective')}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.gameplayTitle')}</h4>
                            <ul className="list-disc list-inside space-y-1">
                                <li>{t('rules.yahtzee.gameplay_1')}</li>
                                <li>{t('rules.yahtzee.gameplay_2')}</li>
                                <li>{t('rules.yahtzee.gameplay_3')}</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.scoringTitle')}</h4>
                             <ul className="list-disc list-inside space-y-1">
                                <li>{t('rules.yahtzee.scoring_1')}</li>
                                <li>{t('rules.yahtzee.scoring_2')}</li>
                                <li>{t('rules.yahtzee.scoring_3')}</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.winningTitle')}</h4>
                            <p>{t('rules.yahtzee.winning')}</p>
                        </div>
                    </div>
                </GameRulesModal>
            )}
            <header className="w-full max-w-7xl mb-4 text-center relative">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-wider">{t('games.yahtzee.title')}</h1>
                <div className="text-lg text-slate-500 mt-1">{t('game.round', { current: gameState.currentRound > 13 ? 13 : gameState.currentRound, total: 13 })}</div>
                {isOnline && currentPlayer && <TurnBanner isMyTurn={isMyTurn} currentName={currentPlayer.name} />}
                <div className="absolute top-0 left-2 flex items-center gap-2">
                    <button onClick={onGoHome} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors">
                        &larr; {t('button.backToHome')}
                    </button>
                    <button onClick={() => setIsRulesModalOpen(true)} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors" title={t('button.gameRules')}>
                        <i className="fas fa-question-circle"></i>
                    </button>
                </div>
                <div className="absolute top-0 right-2">
                    <LanguageSwitcher />
                </div>
            </header>

            <main className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-start">
                <div className={`p-3 bg-white/70 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-500 ${gameState.currentPlayerId === 1 ? `border-2 border-${p1Color}-400` : 'border-2 border-transparent'}`}>
                    <Scorecard 
                        player={player1} 
                        potentialScores={gameState.currentPlayerId === 1 ? gameState.potentialScores : {}} 
                        onScore={handleScoreCategory} 
                        isMyTurn={gameState.currentPlayerId === 1 && gameState.rollsLeft < 3}
                        calculateTotalScore={calculateTotalScore}
                        avatarState={gameState.avatarStates[1]}
                        emote={gameState.emote?.targetPlayerId === 1 ? gameState.emote : null}
                        themeColor={p1Color}
                    />
                </div>

                <div className="flex flex-col items-center gap-6 p-4 bg-white/50 backdrop-blur-sm rounded-lg order-first md:order-none">
                    <div className="text-center">
                         <h2 className="text-2xl font-bold text-slate-800">
                            {t('game.playersTurn', { name: currentPlayer?.name })}
                        </h2>
                        <div className={`w-20 h-20 rounded-full mx-auto mt-2 border-4 ${gameState.currentPlayerId === 1 ? `border-${p1Color}-400` : `border-${p2Color}-400`}`}/>
                        <p className="text-slate-600 text-lg mt-2">
                            {t('game.rollsLeft')}: <span className={`font-bold text-${gameState.currentPlayerId === 1 ? p1Color : p2Color}-500`}>{gameState.rollsLeft}</span>
                        </p>
                    </div>
                    
                    <div className="flex gap-2 sm:gap-4 justify-center">
                        {gameState.dice.map((value, index) => (
                            <Die
                                key={index}
                                value={value}
                                isHeld={gameState.heldDice[index]}
                                onToggleHold={() => handleToggleHold(index)}
                                isRolling={isRolling}
                                canHold={gameState.rollsLeft < 3}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col items-center gap-3 w-full">
                        <button
                            onClick={handleRollDice}
                            disabled={gameState.rollsLeft === 0 || isRolling}
                            className={`w-48 px-6 py-3 bg-${gameState.currentPlayerId === 1 ? p1Color : p2Color}-500 text-slate-900 font-bold text-lg rounded-lg shadow-md hover:bg-${gameState.currentPlayerId === 1 ? p1Color : p2Color}-400 transition-colors duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
                        >
                            {isRolling ? t('button.rolling') : t('button.rollDice')}
                        </button>
                         <button onClick={handleEmote} className="text-3xl text-pink-400 hover:text-pink-300 transition-transform hover:scale-110 active:scale-95">
                            <i className="fas fa-heart"></i>
                        </button>
                        <div className="flex gap-2">
                             {!isOnline && (
                                <button onClick={handleSaveGame} className="w-24 px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:bg-slate-400 transition-colors duration-300">
                                    {t('button.save')}
                                </button>
                             )}
                            <button onClick={handleNewGame} className="w-24 px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:bg-slate-400 transition-colors duration-300">
                                {t('button.newGame')}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className={`p-3 bg-white/70 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-500 ${gameState.currentPlayerId === 2 ? `border-2 border-${p2Color}-400` : 'border-2 border-transparent'}`}>
                    <Scorecard 
                        player={player2} 
                        potentialScores={gameState.currentPlayerId === 2 ? gameState.potentialScores : {}} 
                        onScore={handleScoreCategory}
                        isMyTurn={gameState.currentPlayerId === 2 && gameState.rollsLeft < 3}
                        calculateTotalScore={calculateTotalScore}
                        avatarState={gameState.avatarStates[2]}
                        emote={gameState.emote?.targetPlayerId === 2 ? gameState.emote : null}
                        themeColor={p2Color}
                    />
                </div>
            </main>
        </div>
    );
};