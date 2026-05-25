import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlayerSetupModal } from './PlayerSetupModal';
import { GameOverModal } from './GameOverModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GameRulesModal } from './GameRulesModal';
import { OnlineWaiting, TurnBanner } from './OnlineStatus';
import { Card } from './Card';
import { MatchingGameState, MatchingPlayer, CardData, GameStatus } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useNetworkedGame } from '../hooks/useNetworkedGame';
import { playSfx } from '../hooks/soundEffects';
import { AVATAR_IMAGES } from '../constants';

const ICONS = ['🐶', '🐰', '🥕', '🦴', '❤️', '🌟', '🎉', '🎁'];

const createShuffledGrid = (): CardData[] => {
    const pairs = [...ICONS, ...ICONS];
    const shuffled = pairs.sort(() => 0.5 - Math.random());
    return shuffled.map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
    }));
};

const getInitialPlayer = (id: 1 | 2, name: string, avatar: string): MatchingPlayer => ({
    id,
    name,
    avatar,
    score: 0,
});

interface MatchingGameProps {
    onGoHome: () => void;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({ onGoHome }) => {
    const { gameState, setGameState, isOnline, isMyTurn, players: onlinePlayers, mySeat } = useNetworkedGame<MatchingGameState>('matching');
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const { t } = useI18n();

    const initializeGame = useCallback((player1Name: string, player1Avatar: string, player2Name: string, player2Avatar: string) => {
        setGameState({
            players: [
                getInitialPlayer(1, player1Name, player1Avatar),
                getInitialPlayer(2, player2Name, player2Avatar),
            ],
            gameStatus: GameStatus.IN_PROGRESS,
            currentPlayerId: 1,
            grid: createShuffledGrid(),
            flippedIndices: [],
            isChecking: false,
        });
    }, []);

    // Online: the host shuffles the grid and broadcasts it so both devices see
    // the same layout (the shuffle is random, so it can't be derived locally).
    useEffect(() => {
        if (isOnline && !gameState && onlinePlayers && mySeat === 1) {
            initializeGame(onlinePlayers.p1.name, onlinePlayers.p1.avatar, onlinePlayers.p2.name, onlinePlayers.p2.avatar);
        }
    }, [isOnline, gameState, onlinePlayers, mySeat, initializeGame]);

    const handleCardClick = (id: number) => {
        if (isOnline && !isMyTurn) return;
        if (!gameState || gameState.isChecking || gameState.flippedIndices.length >= 2) return;

        const cardIndex = gameState.grid.findIndex(card => card.id === id);
        if (gameState.grid[cardIndex].isFlipped) return;

        const newGrid = [...gameState.grid];
        newGrid[cardIndex].isFlipped = true;
        playSfx('cardFlip');

        const newFlippedIndices = [...gameState.flippedIndices, cardIndex];

        setGameState(prev => prev ? {
            ...prev,
            grid: newGrid,
            flippedIndices: newFlippedIndices,
        } : null);
    };

    const handleNewGame = () => {
        setGameState(null);
    };

    // Effect to check for matches. Online, only the active player's device runs
    // the resolution timer; the result is broadcast to the other device.
    useEffect(() => {
        if (isOnline && !isMyTurn) return;
        if (!gameState || gameState.flippedIndices.length < 2) return;

        setGameState(prev => prev ? { ...prev, isChecking: true } : null);

        const [firstIndex, secondIndex] = gameState.flippedIndices;
        const firstCard = gameState.grid[firstIndex];
        const secondCard = gameState.grid[secondIndex];

        setTimeout(() => {
            if (firstCard.icon === secondCard.icon) {
                // It's a match
                playSfx('match');
                setGameState(prev => {
                    if (!prev) return null;
                    const newGrid = prev.grid.map(card =>
                        card.icon === firstCard.icon ? { ...card, isMatched: true } : card
                    );
                    const newPlayers = prev.players.map(p =>
                        p.id === prev.currentPlayerId ? { ...p, score: p.score + 1 } : p
                    ) as [MatchingPlayer, MatchingPlayer];
                    
                    const isGameOver = newGrid.every(c => c.isMatched);
                    
                    return {
                        ...prev,
                        grid: newGrid,
                        players: newPlayers,
                        flippedIndices: [],
                        isChecking: false,
                        gameStatus: isGameOver ? GameStatus.GAME_OVER : prev.gameStatus
                    };
                });
            } else {
                // Not a match
                playSfx('noMatch');
                setGameState(prev => {
                    if (!prev) return null;
                    const newGrid = [...prev.grid];
                    newGrid[firstIndex].isFlipped = false;
                    newGrid[secondIndex].isFlipped = false;
                    const nextPlayerId = prev.currentPlayerId === 1 ? 2 : 1;
                    return {
                        ...prev,
                        grid: newGrid,
                        flippedIndices: [],
                        currentPlayerId: nextPlayerId,
                        isChecking: false,
                    };
                });
            }
        }, 1000);
    }, [gameState?.flippedIndices]);
    
    const winner = useMemo(() => {
        if (!gameState || gameState.gameStatus !== GameStatus.GAME_OVER) return null;
        const [p1, p2] = gameState.players;
        if (p1.score === p2.score) return { ...p1, name: t('gameOver.tie') };
        return p1.score > p2.score ? p1 : p2;
    }, [gameState, t]);

    if (!gameState) {
        if (isOnline) return <OnlineWaiting onGoHome={onGoHome} />;
        return <PlayerSetupModal onStart={initializeGame} onGoHome={onGoHome} />;
    }

    if (gameState.gameStatus === GameStatus.GAME_OVER && winner) {
        return <GameOverModal winner={winner} players={gameState.players} onNewGame={handleNewGame} onGoHome={onGoHome} />;
    }
    
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId)!;
    const p1Color = 'amber';
    const p2Color = 'pink';
    const player1 = gameState.players[0];
    const player2 = gameState.players[1];

    return (
        <div className="flex flex-col items-center p-2 sm:p-4 min-h-screen">
             {isRulesModalOpen && (
                <GameRulesModal
                    title={t('rules.matching.title')}
                    onClose={() => setIsRulesModalOpen(false)}
                >
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.objectiveTitle')}</h4>
                            <p>{t('rules.matching.objective')}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.gameplayTitle')}</h4>
                            <ul className="list-disc list-inside space-y-1">
                                <li>{t('rules.matching.gameplay_1')}</li>
                                <li>{t('rules.matching.gameplay_2')}</li>
                                <li>{t('rules.matching.gameplay_3')}</li>
                                <li>{t('rules.matching.gameplay_4')}</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.winningTitle')}</h4>
                            <p>{t('rules.matching.winning')}</p>
                        </div>
                    </div>
                </GameRulesModal>
            )}
            <header className="w-full max-w-7xl mb-4 text-center relative">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-wider">{t('games.matchingPair.title')}</h1>
                 <div className="text-lg text-slate-500 mt-1">{currentPlayer.name + t('matchingGame.turn')}</div>
                 {isOnline && <TurnBanner isMyTurn={isMyTurn} currentName={currentPlayer.name} />}
                <div className="absolute top-0 left-2 flex items-center gap-2">
                    <button onClick={onGoHome} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors">
                        &larr; {t('button.backToHome')}
                    </button>
                    <button onClick={handleNewGame} className="px-3 py-2 bg-slate-500/80 text-white rounded-lg hover:bg-slate-500 transition-colors">
                        {t('button.newGame')}
                    </button>
                    <button onClick={() => setIsRulesModalOpen(true)} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors" title={t('button.gameRules')}>
                        <i className="fas fa-question-circle"></i>
                    </button>
                </div>
                <div className="absolute top-0 right-2">
                    <LanguageSwitcher />
                </div>
            </header>

            <main className="flex-grow w-full max-w-7xl flex flex-col md:flex-row items-center justify-around gap-4">
                {/* Player 1 Info */}
                <div className={`p-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-lg text-center transition-all duration-300 ${gameState.currentPlayerId === 1 ? `border-2 border-${p1Color}-400` : 'border-2 border-transparent'}`}>
                    <img src={AVATAR_IMAGES[player1.avatar]} alt={player1.name} className="w-28 h-28 mx-auto rounded-full" />
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">{player1.name}</h2>
                    <p className="text-lg text-slate-600">{t('matchingGame.pairsFound')}: <span className={`font-bold text-${p1Color}-500`}>{player1.score}</span></p>
                </div>

                {/* Game Grid */}
                <div className="grid grid-cols-4 gap-2 sm:gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-lg">
                    {gameState.grid.map(card => (
                        <Card key={card.id} card={card} onClick={() => handleCardClick(card.id)} isDisabled={gameState.isChecking}/>
                    ))}
                </div>

                {/* Player 2 Info */}
                 <div className={`p-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-lg text-center transition-all duration-300 ${gameState.currentPlayerId === 2 ? `border-2 border-${p2Color}-400` : 'border-2 border-transparent'}`}>
                    <img src={AVATAR_IMAGES[player2.avatar]} alt={player2.name} className="w-28 h-28 mx-auto rounded-full" />
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">{player2.name}</h2>
                    <p className="text-lg text-slate-600">{t('matchingGame.pairsFound')}: <span className={`font-bold text-${p2Color}-500`}>{player2.score}</span></p>
                </div>
            </main>
        </div>
    );
};