import React, { useState, useCallback, useMemo } from 'react';
import { PlayerSetupModal } from './PlayerSetupModal';
import { GameOverModal } from './GameOverModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GameRulesModal } from './GameRulesModal';
import { DotsAndBoxesGameState, DotsAndBoxesPlayer, GameStatus } from '../types';
import { useI18n } from '../hooks/useI18n';
import { AVATAR_IMAGES } from '../constants';

const GRID_SIZE = 5; // 5 dots, so 4x4 boxes

const createEmptyArrays = (size: number) => {
    const boxGridSize = size - 1;
    return {
        horizontalLines: Array(size).fill(0).map(() => Array(boxGridSize).fill(null)),
        verticalLines: Array(boxGridSize).fill(0).map(() => Array(size).fill(null)),
        boxes: Array(boxGridSize).fill(0).map(() => Array(boxGridSize).fill(null)),
    };
};

const getInitialPlayer = (id: 1 | 2, name: string, avatar: string): DotsAndBoxesPlayer => ({
    id,
    name,
    avatar,
    score: 0,
});

interface DotsAndBoxesGameProps {
    onGoHome: () => void;
}

export const DotsAndBoxesGame: React.FC<DotsAndBoxesGameProps> = ({ onGoHome }) => {
    const [gameState, setGameState] = useState<DotsAndBoxesGameState | null>(null);
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
            gridSize: GRID_SIZE,
            ...createEmptyArrays(GRID_SIZE),
        });
    }, []);

    const handleNewGame = () => {
        setGameState(null);
    };
    
    const handleLineClick = (row: number, col: number, type: 'horizontal' | 'vertical') => {
        if (!gameState || gameState.gameStatus !== GameStatus.IN_PROGRESS) return;

        const { horizontalLines, verticalLines } = gameState;
        
        if ((type === 'horizontal' && horizontalLines[row][col] !== null) || (type === 'vertical' && verticalLines[row][col] !== null)) {
            return;
        }

        const newHorizontalLines = horizontalLines.map(r => [...r]);
        const newVerticalLines = verticalLines.map(r => [...r]);
        
        if (type === 'horizontal') {
            newHorizontalLines[row][col] = gameState.currentPlayerId;
        } else {
            newVerticalLines[row][col] = gameState.currentPlayerId;
        }

        let boxesCompletedThisTurn = 0;
        const newBoxes = gameState.boxes.map(r => [...r]);
        const boxGridSize = GRID_SIZE - 1;

        for (let r = 0; r < boxGridSize; r++) {
            for (let c = 0; c < boxGridSize; c++) {
                if (newBoxes[r][c] === null && newHorizontalLines[r][c] !== null && newHorizontalLines[r + 1][c] !== null && newVerticalLines[r][c] !== null && newVerticalLines[r][c + 1] !== null) {
                    newBoxes[r][c] = gameState.currentPlayerId;
                    boxesCompletedThisTurn++;
                }
            }
        }
        
        setGameState(prev => {
            if (!prev) return null;
            
            const newPlayers = [...prev.players] as [DotsAndBoxesPlayer, DotsAndBoxesPlayer];
            if (boxesCompletedThisTurn > 0) {
                 const currentPlayerIndex = prev.players.findIndex(p => p.id === prev.currentPlayerId);
                 const currentScore = newPlayers[currentPlayerIndex].score;
                 newPlayers[currentPlayerIndex] = { ...newPlayers[currentPlayerIndex], score: currentScore + boxesCompletedThisTurn };
            }

            const totalBoxes = boxGridSize * boxGridSize;
            const claimedBoxes = newBoxes.flat().filter(b => b !== null).length;
            const isGameOver = claimedBoxes === totalBoxes;

            return {
                ...prev,
                horizontalLines: newHorizontalLines,
                verticalLines: newVerticalLines,
                boxes: newBoxes,
                players: newPlayers,
                currentPlayerId: boxesCompletedThisTurn === 0 ? (prev.currentPlayerId === 1 ? 2 : 1) : prev.currentPlayerId,
                gameStatus: isGameOver ? GameStatus.GAME_OVER : prev.gameStatus,
            };
        });
    };

    const winner = useMemo(() => {
        if (!gameState || gameState.gameStatus !== GameStatus.GAME_OVER) return null;
        const [p1, p2] = gameState.players;
        if (p1.score === p2.score) return { ...p1, name: t('gameOver.tie') };
        return p1.score > p2.score ? p1 : p2;
    }, [gameState, t]);
    
    if (!gameState) {
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
    
    const boxGridSize = GRID_SIZE - 1;
    const CELL_SIZE = 64;
    const DOT_SIZE = 12;
    const LINE_THICKNESS = 6;
    const boardWidth = boxGridSize * CELL_SIZE + DOT_SIZE;
    const boardHeight = boxGridSize * CELL_SIZE + DOT_SIZE;
    
    return (
        <div className="flex flex-col items-center p-2 sm:p-4 min-h-screen">
             {isRulesModalOpen && (
                <GameRulesModal
                    title={t('rules.dotsAndBoxes.title')}
                    onClose={() => setIsRulesModalOpen(false)}
                >
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.objectiveTitle')}</h4>
                            <p>{t('rules.dotsAndBoxes.objective')}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.gameplayTitle')}</h4>
                            <ul className="list-disc list-inside space-y-1">
                                <li>{t('rules.dotsAndBoxes.gameplay_1')}</li>
                                <li>{t('rules.dotsAndBoxes.gameplay_2')}</li>
                                <li>{t('rules.dotsAndBoxes.gameplay_3')}</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.winningTitle')}</h4>
                            <p>{t('rules.dotsAndBoxes.winning')}</p>
                        </div>
                    </div>
                </GameRulesModal>
            )}
            <header className="w-full max-w-7xl mb-4 text-center relative">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-wider">{t('games.dotsAndBoxes.title')}</h1>
                <div className="text-lg text-slate-500 mt-1">{t('game.playersTurn', { name: currentPlayer.name })}</div>
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
                <div className={`p-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-lg text-center transition-all duration-300 w-48 ${gameState.currentPlayerId === 1 ? `border-2 border-${p1Color}-400` : 'border-2 border-transparent'}`}>
                    <img src={AVATAR_IMAGES[player1.avatar]} alt={player1.name} className="w-28 h-28 mx-auto rounded-full" />
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">{player1.name}</h2>
                    <p className="text-lg text-slate-600">{t('scorecard.score')}: <span className={`font-bold text-${p1Color}-500 text-2xl`}>{player1.score}</span></p>
                </div>

                <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg">
                    <div className="relative" style={{ width: boardWidth, height: boardHeight }}>
                        {gameState.boxes.map((row, r) => row.map((owner, c) => (
                            owner && <div key={`box-${r}-${c}`} className={`absolute transition-colors duration-500 ${owner === 1 ? `bg-${p1Color}-300` : `bg-${p2Color}-300`}`} style={{
                                left: c * CELL_SIZE + DOT_SIZE / 2,
                                top: r * CELL_SIZE + DOT_SIZE / 2,
                                width: CELL_SIZE,
                                height: CELL_SIZE,
                            }}>
                                <img src={AVATAR_IMAGES[gameState.players[owner-1].avatar]} className="w-full h-full object-contain p-2 opacity-50"/>
                            </div>
                        )))}

                        {gameState.horizontalLines.map((row, r) => row.map((owner, c) => {
                            let colorClass = 'bg-transparent hover:bg-gray-300/50';
                            if (owner === 1) {
                                colorClass = `bg-${p1Color}-400`;
                            } else if (owner === 2) {
                                colorClass = `bg-${p2Color}-400`;
                            }
                            const isDrawn = owner !== null;
                            return (<div key={`h-line-${r}-${c}`} 
                                className={`absolute rounded-full transition-colors duration-300 ${colorClass} ${isDrawn ? '' : 'cursor-pointer'}`}
                                style={{
                                    left: c * CELL_SIZE + DOT_SIZE / 2,
                                    top: r * CELL_SIZE + (DOT_SIZE - LINE_THICKNESS) / 2,
                                    width: CELL_SIZE,
                                    height: LINE_THICKNESS
                                }}
                                onClick={() => handleLineClick(r, c, 'horizontal')}
                            />)
                        }))}
                        
                         {gameState.verticalLines.map((row, r) => row.map((owner, c) => {
                             let colorClass = 'bg-transparent hover:bg-gray-300/50';
                            if (owner === 1) {
                                colorClass = `bg-${p1Color}-400`;
                            } else if (owner === 2) {
                                colorClass = `bg-${p2Color}-400`;
                            }
                             const isDrawn = owner !== null;
                             return (<div key={`v-line-${r}-${c}`} 
                                 className={`absolute rounded-full transition-colors duration-300 ${colorClass} ${isDrawn ? '' : 'cursor-pointer'}`}
                                style={{
                                    left: c * CELL_SIZE + (DOT_SIZE - LINE_THICKNESS) / 2,
                                    top: r * CELL_SIZE + DOT_SIZE / 2,
                                    width: LINE_THICKNESS,
                                    height: CELL_SIZE
                                }}
                                onClick={() => handleLineClick(r, c, 'vertical')}
                             />)
                         }))}

                        {Array(GRID_SIZE).fill(0).map((_, r) => (
                            Array(GRID_SIZE).fill(0).map((_, c) => (
                                <div key={`dot-${r}-${c}`} className="absolute bg-slate-600 rounded-full" style={{
                                    left: c * CELL_SIZE,
                                    top: r * CELL_SIZE,
                                    width: DOT_SIZE,
                                    height: DOT_SIZE,
                                }}/>
                            ))
                        ))}
                    </div>
                </div>

                 <div className={`p-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-lg text-center transition-all duration-300 w-48 ${gameState.currentPlayerId === 2 ? `border-2 border-${p2Color}-400` : 'border-2 border-transparent'}`}>
                    <img src={AVATAR_IMAGES[player2.avatar]} alt={player2.name} className="w-28 h-28 mx-auto rounded-full" />
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">{player2.name}</h2>
                    <p className="text-lg text-slate-600">{t('scorecard.score')}: <span className={`font-bold text-${p2Color}-500 text-2xl`}>{player2.score}</span></p>
                </div>
            </main>
        </div>
    );
};