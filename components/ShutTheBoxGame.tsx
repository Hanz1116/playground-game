import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PlayerSetupModal } from './PlayerSetupModal';
import { GameOverModal, DisplayPlayer } from './GameOverModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GameRulesModal } from './GameRulesModal';
import { OnlineWaiting, TurnBanner } from './OnlineStatus';
import { ShutTheBoxGameState, ShutTheBoxPlayer, Tile, GameStatus } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useNetworkedGame } from '../hooks/useNetworkedGame';
import { AVATAR_IMAGES } from '../constants';
import { Die } from './Die';

const createInitialTiles = (): Tile[] => Array.from({ length: 9 }, (_, i) => ({ number: i + 1, isOpen: true }));

const getInitialPlayer = (id: 1 | 2, name: string, avatar: string): ShutTheBoxPlayer => ({
    id,
    name,
    avatar,
    score: null,
    tiles: createInitialTiles(),
});

const checkPossibleMoves = (target: number, openTiles: Tile[]): boolean => {
    const openNumbers = openTiles.filter(t => t.isOpen).map(t => t.number);
    if (target === 0) return openNumbers.length > 0;
    const findSum = (currentSum: number, startIndex: number): boolean => {
        if (currentSum === target) return true;
        if (currentSum > target) return false;
        for (let i = startIndex; i < openNumbers.length; i++) {
            if (findSum(currentSum + openNumbers[i], i + 1)) return true;
        }
        return false;
    };
    return findSum(0, 0);
};

const PlayerInfoCard: React.FC<{ player: ShutTheBoxPlayer; color: 'amber' | 'pink'; isCurrentPlayer: boolean }> = ({ player, color, isCurrentPlayer }) => {
    const { t } = useI18n();
    
    const getStatusText = () => {
        if (player.score !== null) {
            return t('shutTheBoxGame.yourScore', { score: player.score });
        }
        if (isCurrentPlayer) {
            return t('shutTheBoxGame.yourTurn');
        }
        return t('shutTheBoxGame.waiting');
    };

    return (
        <div className="text-center w-52">
            <img src={AVATAR_IMAGES[player.avatar]} alt={player.name} className="w-28 h-28 mx-auto rounded-full" />
            <h2 className="text-2xl font-bold text-slate-800 mt-2">{player.name}</h2>
            <p className={`font-bold text-lg text-${color}-500 h-6 flex items-center justify-center`}>
                <span>{getStatusText()}</span>
            </p>
        </div>
    );
};

const TileSet: React.FC<{
    tiles: Tile[];
    onTileClick: (tileNumber: number) => void;
    selectedTileNumbers: number[];
    isInteractive: boolean;
    playerColor: 'amber' | 'pink';
}> = ({ tiles, onTileClick, selectedTileNumbers, isInteractive, playerColor }) => {
    const backColor = playerColor === 'amber' ? 'bg-amber-900' : 'bg-pink-900';
    return (
        <div className="p-4 bg-yellow-700/80 rounded-lg shadow-inner" style={{ boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.4)' }}>
            <div className="grid grid-cols-9 gap-2">
                {tiles.map(({ number, isOpen }) => {
                    const isSelected = selectedTileNumbers.includes(number);
                    const frontBgColor = isSelected ? 'bg-cyan-300' : 'bg-yellow-100';

                    return (
                        <div key={number} className={`w-10 h-16 sm:w-12 sm:h-20 card-container ${!isOpen ? 'flipped' : ''}`} onClick={() => isOpen && isInteractive && onTileClick(number)}>
                            <div className="card-inner">
                                <div className={`card-face ${frontBgColor} text-yellow-900 font-bold text-2xl sm:text-3xl ${isInteractive && isOpen ? 'cursor-pointer hover:bg-yellow-200' : ''}`}>
                                    {number}
                                </div>
                                <div className={`card-face card-back ${backColor}`}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface ShutTheBoxGameProps {
    onGoHome: () => void;
}

export const ShutTheBoxGame: React.FC<ShutTheBoxGameProps> = ({ onGoHome }) => {
    const { gameState, setGameState, isOnline, isMyTurn, players: onlinePlayers, mySeat } = useNetworkedGame<ShutTheBoxGameState>('shutTheBox');
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const { t } = useI18n();

    const initializeGame = useCallback((p1Name: string, p1Avatar: string, p2Name: string, p2Avatar: string) => {
        setGameState({
            players: [getInitialPlayer(1, p1Name, p1Avatar), getInitialPlayer(2, p2Name, p2Avatar)],
            gameStatus: GameStatus.IN_PROGRESS,
            currentPlayerId: 1,
            dice: [1, 1],
            selectedTileNumbers: [],
            turnPhase: 'ROLL',
            useOneDie: false,
            isRolling: false,
        });
    }, []);

    useEffect(() => {
        if (isOnline && !gameState && onlinePlayers && mySeat === 1) {
            initializeGame(onlinePlayers.p1.name, onlinePlayers.p1.avatar, onlinePlayers.p2.name, onlinePlayers.p2.avatar);
        }
    }, [isOnline, gameState, onlinePlayers, mySeat, initializeGame]);

    const handleNewGame = () => setGameState(null);

    const handleRoll = () => {
        if (isOnline && !isMyTurn) return;
        if (!gameState || gameState.turnPhase !== 'ROLL' || gameState.isRolling) return;
        setGameState(prev => prev ? { ...prev, isRolling: true } : null);
        
        setTimeout(() => {
            setGameState(prev => {
                if (!prev) return null;
                const die1 = Math.ceil(Math.random() * 6);
                const die2 = prev.useOneDie ? 0 : Math.ceil(Math.random() * 6);
                const sum = die1 + die2;
                
                const currentPlayer = prev.players.find(p => p.id === prev.currentPlayerId)!;

                if (checkPossibleMoves(sum, currentPlayer.tiles)) {
                    return { ...prev, dice: [die1, die2], turnPhase: 'SELECT', isRolling: false };
                } else {
                    return { ...prev, dice: [die1, die2], turnPhase: 'NO_MOVES', isRolling: false };
                }
            });
        }, 1000);
    };

    const handleTileClick = (tileNumber: number) => {
        if (isOnline && !isMyTurn) return;
        if (!gameState || gameState.turnPhase !== 'SELECT') return;
        const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId)!;
        if (!currentPlayer.tiles.find(t => t.number === tileNumber)?.isOpen) return;

        setGameState(prev => {
            if (!prev) return null;
            const newSelection = prev.selectedTileNumbers.includes(tileNumber)
                ? prev.selectedTileNumbers.filter(n => n !== tileNumber)
                : [...prev.selectedTileNumbers, tileNumber];
            return { ...prev, selectedTileNumbers: newSelection };
        });
    };
    
    const handleConfirmMove = () => {
        if (isOnline && !isMyTurn) return;
        if (!gameState) return;
        setGameState(prev => {
            if (!prev) return null;
            
            const newPlayers = prev.players.map(p => {
                if (p.id === prev.currentPlayerId) {
                    const newTiles = p.tiles.map(t => 
                        prev.selectedTileNumbers.includes(t.number) ? { ...t, isOpen: false } : t
                    );
                    return { ...p, tiles: newTiles };
                }
                return p;
            }) as [ShutTheBoxPlayer, ShutTheBoxPlayer];

            const updatedCurrentPlayer = newPlayers.find(p => p.id === prev.currentPlayerId)!;
            const openTiles = updatedCurrentPlayer.tiles.filter(t => t.isOpen);
            const openTilesSum = openTiles.reduce((sum, t) => sum + t.number, 0);

            if (openTilesSum === 0) { // Shut the box!
                 return { ...prev, players: newPlayers, turnPhase: 'TURN_OVER', selectedTileNumbers: [] };
            }
            const useOneDie = openTiles.every(t => t.number > 6) && openTilesSum <= 6;
            return { ...prev, players: newPlayers, useOneDie, turnPhase: 'ROLL', selectedTileNumbers: [] };
        });
    };
    
    const handleEndTurn = () => {
        if (isOnline && !isMyTurn) return;
        if (!gameState) return;

        setGameState(prev => {
            if (!prev) return null;
            const currentPlayer = prev.players.find(p => p.id === prev.currentPlayerId)!;
            const currentScore = currentPlayer.tiles.filter(t => t.isOpen).reduce((sum, t) => sum + t.number, 0);

            const newPlayers = prev.players.map(p => p.id === prev.currentPlayerId ? { ...p, score: currentScore } : p) as [ShutTheBoxPlayer, ShutTheBoxPlayer];

            if (prev.currentPlayerId === 2) {
                return { ...prev, players: newPlayers, gameStatus: GameStatus.GAME_OVER };
            } else {
                return {
                    ...prev,
                    players: newPlayers,
                    currentPlayerId: 2,
                    dice: [1,1],
                    turnPhase: 'ROLL',
                    useOneDie: false,
                    selectedTileNumbers: [],
                };
            }
        });
    };

    const winner = useMemo(() => {
        if (!gameState || gameState.gameStatus !== GameStatus.GAME_OVER) return null;
        const [p1, p2] = gameState.players;
        if ((p1.score ?? 99) === (p2.score ?? 99)) return { ...p1, name: t('gameOver.tie'), score: p1.score ?? 0 };
        // Lower score wins in Shut the Box
        return (p1.score ?? 99) < (p2.score ?? 99) 
            ? { ...p1, score: p1.score ?? 0 } 
            : { ...p2, score: p2.score ?? 0 };
    }, [gameState, t]);
    
    const p1Color = 'amber';
    const p2Color = 'pink';
    
    if (!gameState) {
        if (isOnline) return <OnlineWaiting onGoHome={onGoHome} />;
        return <PlayerSetupModal onStart={initializeGame} onGoHome={onGoHome} />;
    }

    if (gameState.gameStatus === GameStatus.GAME_OVER && winner) {
        const displayPlayers: [DisplayPlayer, DisplayPlayer] = [
            { ...gameState.players[0], score: gameState.players[0].score ?? 0 },
            { ...gameState.players[1], score: gameState.players[1].score ?? 0 }
        ];
        return <GameOverModal winner={winner} players={displayPlayers} onNewGame={handleNewGame} onGoHome={onGoHome} />;
    }
    
    const { players, currentPlayerId, dice, selectedTileNumbers, turnPhase, useOneDie, isRolling } = gameState;
    const currentPlayer = players.find(p => p.id === currentPlayerId)!;
    const [p1, p2] = players;
    const diceSum = dice[0] + dice[1];
    const selectedSum = selectedTileNumbers.reduce((sum, n) => sum + n, 0);

    return (
        <div className="flex flex-col items-center p-2 sm:p-4 min-h-screen">
            {isRulesModalOpen && (
                <GameRulesModal
                    title={t('rules.shutTheBox.title')}
                    onClose={() => setIsRulesModalOpen(false)}
                >
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.objectiveTitle')}</h4>
                            <p>{t('rules.shutTheBox.objective')}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.gameplayTitle')}</h4>
                            <ul className="list-disc list-inside space-y-1">
                                <li>{t('rules.shutTheBox.gameplay_1')}</li>
                                <li>{t('rules.shutTheBox.gameplay_2')}</li>
                                <li>{t('rules.shutTheBox.gameplay_3')}</li>
                                <li>{t('rules.shutTheBox.gameplay_4')}</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.winningTitle')}</h4>
                            <p>{t('rules.shutTheBox.winning')}</p>
                        </div>
                    </div>
                </GameRulesModal>
            )}
            <header className="w-full max-w-7xl mb-4 text-center relative">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-wider">{t('games.shutTheBox.title')}</h1>
                <div className="text-lg text-slate-500 mt-1">{t('game.playersTurn', { name: currentPlayer.name })}</div>
                {isOnline && <TurnBanner isMyTurn={isMyTurn} currentName={currentPlayer.name} />}
                <div className="absolute top-0 left-2 flex items-center gap-2">
                    <button onClick={onGoHome} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors">&larr; {t('button.backToHome')}</button>
                    <button onClick={handleNewGame} className="px-3 py-2 bg-slate-500/80 text-white rounded-lg hover:bg-slate-500 transition-colors">{t('button.newGame')}</button>
                    <button onClick={() => setIsRulesModalOpen(true)} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors" title={t('button.gameRules')}>
                        <i className="fas fa-question-circle"></i>
                    </button>
                </div>
                <div className="absolute top-0 right-2"><LanguageSwitcher /></div>
            </header>
            <main className="flex-grow w-full max-w-5xl flex flex-col items-center justify-between gap-4">
                
                {/* Player 2's Area (Top) */}
                <div className={`flex flex-row items-center gap-4 p-4 rounded-lg transition-all duration-300 ${currentPlayerId === 2 ? `bg-white/70 border-2 border-${p2Color}-400` : 'bg-white/50'}`}>
                    <PlayerInfoCard player={p2} color={p2Color} isCurrentPlayer={currentPlayerId === 2} />
                    <TileSet
                        tiles={p2.tiles}
                        onTileClick={handleTileClick}
                        selectedTileNumbers={currentPlayerId === 2 ? selectedTileNumbers : []}
                        isInteractive={currentPlayerId === 2 && turnPhase === 'SELECT'}
                        playerColor={p2Color}
                    />
                </div>

                {/* Controls (Middle) */}
                <div className="p-4 my-2 bg-white/50 backdrop-blur-sm rounded-lg flex flex-col items-center gap-3 self-center w-full max-w-md">
                    <div className="flex gap-4 items-center">
                        <Die value={dice[0]} isHeld={false} onToggleHold={()=>{}} isRolling={isRolling} canHold={false}/>
                        {!useOneDie && <Die value={dice[1]} isHeld={false} onToggleHold={()=>{}} isRolling={isRolling} canHold={false}/>}
                    </div>

                    {turnPhase !== 'ROLL' && <div className="text-xl font-bold">{t('shutTheBoxGame.diceTotal')}: <span className="text-cyan-600">{diceSum}</span></div>}
                    
                    {turnPhase === 'SELECT' && (
                        <>
                            <div className="text-lg font-semibold">{t('shutTheBoxGame.selectedTotal')}: <span className={selectedSum === diceSum ? 'text-green-600' : 'text-red-600'}>{selectedSum}</span></div>
                            <button onClick={handleConfirmMove} disabled={selectedSum !== diceSum} className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-lg shadow-md hover:bg-cyan-400 disabled:bg-gray-300 disabled:cursor-not-allowed">{t('shutTheBoxGame.confirmMove')}</button>
                        </>
                    )}
                    
                    {turnPhase === 'ROLL' && <button onClick={handleRoll} disabled={isRolling} className={`w-48 px-6 py-3 bg-${currentPlayerId === 1 ? p1Color : p2Color}-500 text-slate-900 font-bold text-lg rounded-lg shadow-md hover:bg-${currentPlayerId === 1 ? p1Color : p2Color}-400 disabled:bg-gray-300`}>{isRolling ? t('button.rolling') : t('button.rollDice')}</button>}

                    {(turnPhase === 'NO_MOVES' || turnPhase === 'TURN_OVER') && (
                        <div className="text-center">
                            {turnPhase === 'NO_MOVES' && <p className="text-slate-700 font-bold text-lg mb-2">{t('shutTheBoxGame.noMoves')}</p>}
                            <button onClick={handleEndTurn} className="px-6 py-2 bg-slate-500 text-white font-bold rounded-lg shadow-md hover:bg-slate-400">{t('shutTheBoxGame.endTurn')}</button>
                        </div>
                    )}
                </div>

                {/* Player 1's Area (Bottom) */}
                <div className={`flex flex-row items-center gap-4 p-4 rounded-lg transition-all duration-300 ${currentPlayerId === 1 ? `bg-white/70 border-2 border-${p1Color}-400` : 'bg-white/50'}`}>
                    <PlayerInfoCard player={p1} color={p1Color} isCurrentPlayer={currentPlayerId === 1} />
                    <TileSet
                        tiles={p1.tiles}
                        onTileClick={handleTileClick}
                        selectedTileNumbers={currentPlayerId === 1 ? selectedTileNumbers : []}
                        isInteractive={currentPlayerId === 1 && turnPhase === 'SELECT'}
                        playerColor={p1Color}
                    />
                </div>
            </main>
        </div>
    );
};