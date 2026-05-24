import React, { useState, useCallback, useMemo } from 'react';
import { PlayerSetupModal } from './PlayerSetupModal';
import { GameOverModal, DisplayPlayer } from './GameOverModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GameRulesModal } from './GameRulesModal';
import {
    BattleshipBoard,
    BattleshipGameState,
    BattleshipPlayer,
    GameStatus,
} from '../types';
import { useI18n } from '../hooks/useI18n';
import { AVATAR_IMAGES } from '../constants';
import {
    BoardGrid,
    FleetStatus,
    PlacementPanel,
    TOTAL_SHIP_CELLS,
    emptyShips,
    shipAtCell,
    shotAt,
} from './battleshipShared';
import { useOnlineBattleship, OnlineBattleship } from '../hooks/useOnlineBattleship';

const makePlayer = (id: 1 | 2, name: string, avatar: string): BattleshipPlayer => ({
    id,
    name,
    avatar,
    board: { ships: emptyShips(), shotsReceived: [] },
});

interface GameHeaderProps {
    statusLine: string;
    onGoHome: () => void;
    onNewGame: () => void;
    onOpenRules: () => void;
    children?: React.ReactNode;
}

const GameHeader: React.FC<GameHeaderProps> = ({ statusLine, onGoHome, onNewGame, onOpenRules, children }) => {
    const { t } = useI18n();
    return (
        <header className="w-full max-w-7xl mb-4 text-center relative">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-wider">{t('games.battleship.title')}</h1>
            <div className="text-lg text-slate-500 mt-1">{statusLine}</div>
            {children}
            <div className="absolute top-0 left-2 flex items-center gap-2">
                <button onClick={onGoHome} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors">&larr; {t('button.backToHome')}</button>
                <button onClick={onNewGame} className="px-3 py-2 bg-slate-500/80 text-white rounded-lg hover:bg-slate-500 transition-colors">{t('button.newGame')}</button>
                <button onClick={onOpenRules} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors" title={t('button.gameRules')}>
                    <i className="fas fa-question-circle"></i>
                </button>
            </div>
            <div className="absolute top-0 right-2"><LanguageSwitcher /></div>
        </header>
    );
};

const RulesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useI18n();
    return (
        <GameRulesModal title={t('rules.battleship.title')} onClose={onClose}>
            <div className="space-y-3">
                <div>
                    <h4 className="font-bold text-lg text-slate-800">{t('rules.common.objectiveTitle')}</h4>
                    <p>{t('rules.battleship.objective')}</p>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-slate-800">{t('rules.common.gameplayTitle')}</h4>
                    <ul className="list-disc list-inside space-y-1">
                        <li>{t('rules.battleship.gameplay_1')}</li>
                        <li>{t('rules.battleship.gameplay_2')}</li>
                        <li>{t('rules.battleship.gameplay_3')}</li>
                        <li>{t('rules.battleship.gameplay_4')}</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-slate-800">{t('rules.common.winningTitle')}</h4>
                    <p>{t('rules.battleship.winning')}</p>
                </div>
            </div>
        </GameRulesModal>
    );
};

// ---------------------------------------------------------------------------
// Online view: each device shows only its own fleet; shots/results cross the
// wire via useOnlineBattleship. See that hook for the protocol.
// ---------------------------------------------------------------------------
const OnlineBattleshipView: React.FC<{ online: OnlineBattleship; onGoHome: () => void }> = ({ online, onGoHome }) => {
    const { t } = useI18n();
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const myColor: 'amber' | 'pink' = online.mySeat === 1 ? 'amber' : 'pink';

    const statusLine = (() => {
        switch (online.phase) {
            case 'PLACING': return t('battleshipGame.online.placeYourFleet');
            case 'WAITING_OPPONENT': return t('battleshipGame.online.waitingOpponent', { name: online.opponentName });
            case 'FIRING': return online.pending ? t('battleshipGame.online.firing') : t('battleshipGame.online.yourTurnFire');
            case 'WAITING_FIRE': return t('battleshipGame.online.opponentTurnFire', { name: online.opponentName });
            default: return '';
        }
    })();

    if (online.phase === 'GAME_OVER' && online.winner) {
        const myRemaining = online.myBoard.ships.filter(s => s.hits < s.length).length;
        const enemyRemaining = online.enemyFleet.filter(s => s.hits < s.length).length;
        const meDisplay: DisplayPlayer = { id: online.mySeat, name: online.myName, avatar: online.myAvatar, score: myRemaining };
        const enemyDisplay: DisplayPlayer = {
            id: (online.mySeat === 1 ? 2 : 1),
            name: online.opponentName,
            avatar: online.mySeat === 1 ? 'rabbit' : 'dog',
            score: enemyRemaining,
        };
        const displayPlayers: [DisplayPlayer, DisplayPlayer] =
            online.mySeat === 1 ? [meDisplay, enemyDisplay] : [enemyDisplay, meDisplay];
        const winnerDisplay = online.winner === 'me' ? meDisplay : enemyDisplay;
        return <GameOverModal winner={winnerDisplay} players={displayPlayers} onNewGame={online.reset} onGoHome={onGoHome} />;
    }

    return (
        <div className="flex flex-col items-center p-2 sm:p-4 min-h-screen">
            {isRulesModalOpen && <RulesModal onClose={() => setIsRulesModalOpen(false)} />}
            <GameHeader
                statusLine={statusLine}
                onGoHome={onGoHome}
                onNewGame={online.reset}
                onOpenRules={() => setIsRulesModalOpen(true)}
            >
                <div className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                    online.phase === 'FIRING' && !online.pending ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${
                        online.phase === 'FIRING' && !online.pending ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
                    }`} />
                    {statusLine}
                </div>
            </GameHeader>

            <main className="flex-grow w-full max-w-5xl flex flex-col items-center justify-center gap-4">
                {online.phase === 'PLACING' && (
                    <PlacementPanel
                        board={online.myBoard}
                        onBoardChange={online.setMyBoard}
                        color={myColor}
                        onConfirm={online.confirmPlacement}
                        headerName={online.myName}
                        headerAvatar={online.myAvatar}
                        hint={t('battleshipGame.online.placeYourFleet')}
                    />
                )}

                {online.phase === 'WAITING_OPPONENT' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-white/90 rounded-xl shadow-lg p-6 max-w-md w-full text-center">
                            <span className="inline-block w-3 h-3 rounded-full bg-cyan-400 animate-ping mb-3" />
                            <p className="text-lg text-slate-700">{t('battleshipGame.online.waitingOpponent', { name: online.opponentName })}</p>
                        </div>
                        <div className="bg-white/70 rounded-xl shadow p-4 flex flex-col items-center gap-2">
                            <div className="text-slate-700 font-semibold">{t('battleshipGame.yourFleet')}</div>
                            <BoardGrid board={online.myBoard} revealShips={true} showShots={false} isInteractive={false} color={myColor} />
                        </div>
                    </div>
                )}

                {(online.phase === 'FIRING' || online.phase === 'WAITING_FIRE') && (
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="bg-white/70 rounded-xl shadow p-4 w-full max-w-lg flex flex-col items-center gap-2">
                            <div className="text-slate-700 font-semibold">{t('battleshipGame.enemyWaters')}</div>
                            <BoardGrid
                                board={{ ships: [], shotsReceived: online.trackingShots }}
                                revealShips={false}
                                showShots={true}
                                isInteractive={online.phase === 'FIRING' && !online.pending}
                                onCellClick={(x, y) => online.fire(x, y)}
                                color={'slate'}
                                lastShot={online.lastShot}
                            />
                            <FleetStatus ships={online.enemyFleet} label={t('battleshipGame.enemyFleet')} />
                        </div>

                        {online.result && online.lastShot && (
                            <div className="bg-white/90 rounded-lg shadow px-6 py-3 text-center">
                                <div className="text-2xl font-bold">
                                    {online.result === 'sunk'
                                        ? t('battleshipGame.sunk')
                                        : online.result === 'hit'
                                            ? t('battleshipGame.hit')
                                            : t('battleshipGame.miss')}
                                </div>
                            </div>
                        )}

                        <div className="bg-white/70 rounded-xl shadow p-4 w-full max-w-lg flex flex-col items-center gap-2">
                            <div className="text-slate-700 font-semibold">{t('battleshipGame.yourWaters', { name: online.myName })}</div>
                            <BoardGrid board={online.myBoard} revealShips={true} showShots={true} isInteractive={false} color={myColor} />
                            <div className="text-sm text-slate-600">
                                {t('battleshipGame.hitsTaken', {
                                    n: online.myBoard.shotsReceived.filter(s => s.hit).length,
                                    total: TOTAL_SHIP_CELLS,
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// ---------------------------------------------------------------------------

interface BattleshipGameProps {
    onGoHome: () => void;
}

export const BattleshipGame: React.FC<BattleshipGameProps> = ({ onGoHome }) => {
    const { t } = useI18n();
    const online = useOnlineBattleship();

    const [gameState, setGameState] = useState<BattleshipGameState | null>(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

    const initializeGame = useCallback((p1Name: string, p1Avatar: string, p2Name: string, p2Avatar: string) => {
        setGameState({
            players: [makePlayer(1, p1Name, p1Avatar), makePlayer(2, p2Name, p2Avatar)],
            gameStatus: GameStatus.IN_PROGRESS,
            currentPlayerId: 1,
            phase: 'PLACING',
            lastShot: null,
        });
    }, []);

    const handleNewGame = () => setGameState(null);

    const updateCurrentBoard = (updater: (board: BattleshipBoard) => BattleshipBoard) => {
        setGameState(prev => {
            if (!prev) return prev;
            const newPlayers = prev.players.map(p =>
                p.id === prev.currentPlayerId ? { ...p, board: updater(p.board) } : p,
            ) as [BattleshipPlayer, BattleshipPlayer];
            return { ...prev, players: newPlayers };
        });
    };

    const handleConfirmPlacement = () => {
        setGameState(prev => {
            if (!prev) return prev;
            if (prev.currentPlayerId === 1) {
                return { ...prev, phase: 'HANDOFF_PLACE', currentPlayerId: 2 };
            }
            return { ...prev, phase: 'HANDOFF_FIRE', currentPlayerId: 1 };
        });
    };

    const handleHandoffReady = () => {
        setGameState(prev => {
            if (!prev) return prev;
            if (prev.phase === 'HANDOFF_PLACE') return { ...prev, phase: 'PLACING' };
            if (prev.phase === 'HANDOFF_FIRE') return { ...prev, phase: 'FIRING', lastShot: null };
            return prev;
        });
    };

    const handleFire = (x: number, y: number) => {
        setGameState(prev => {
            if (!prev || prev.phase !== 'FIRING') return prev;
            const opponentId = prev.currentPlayerId === 1 ? 2 : 1;
            const opponent = prev.players.find(p => p.id === opponentId)!;
            if (shotAt(opponent.board, x, y)) return prev;

            const hitShip = shipAtCell(opponent.board, x, y);
            const newShips = opponent.board.ships.map(s =>
                hitShip && s.id === hitShip.id ? { ...s, hits: s.hits + 1 } : s,
            );
            const sunkShipId =
                hitShip && newShips.find(s => s.id === hitShip.id)!.hits >= hitShip.length
                    ? hitShip.id
                    : null;
            const newBoard: BattleshipBoard = {
                ships: newShips,
                shotsReceived: [...opponent.board.shotsReceived, { x, y, hit: !!hitShip }],
            };
            const newPlayers = prev.players.map(p =>
                p.id === opponentId ? { ...p, board: newBoard } : p,
            ) as [BattleshipPlayer, BattleshipPlayer];

            const allSunk = newShips.every(s => s.hits >= s.length);
            return {
                ...prev,
                players: newPlayers,
                phase: 'SHOT_RESULT',
                lastShot: { x, y, hit: !!hitShip, sunkShipId },
                gameStatus: allSunk ? GameStatus.GAME_OVER : prev.gameStatus,
            };
        });
    };

    const handleEndTurn = () => {
        setGameState(prev => {
            if (!prev) return prev;
            const nextId = prev.currentPlayerId === 1 ? 2 : 1;
            return { ...prev, currentPlayerId: nextId, phase: 'HANDOFF_FIRE' };
        });
    };

    const winner = useMemo(() => {
        if (!gameState || gameState.gameStatus !== GameStatus.GAME_OVER) return null;
        return gameState.players.find(p => p.id === gameState.currentPlayerId) ?? null;
    }, [gameState]);

    // Online play uses an entirely separate, privacy-preserving flow.
    if (online.active) {
        return <OnlineBattleshipView online={online} onGoHome={onGoHome} />;
    }

    if (!gameState) return <PlayerSetupModal onStart={initializeGame} onGoHome={onGoHome} />;

    if (gameState.gameStatus === GameStatus.GAME_OVER && winner) {
        const shipsRemaining = (p: BattleshipPlayer) =>
            p.board.ships.filter(s => s.hits < s.length).length;
        const displayPlayers: [DisplayPlayer, DisplayPlayer] = [
            { ...gameState.players[0], score: shipsRemaining(gameState.players[0]) },
            { ...gameState.players[1], score: shipsRemaining(gameState.players[1]) },
        ];
        const winnerDisplay: DisplayPlayer = { ...winner, score: shipsRemaining(winner) };
        return <GameOverModal winner={winnerDisplay} players={displayPlayers} onNewGame={handleNewGame} onGoHome={onGoHome} />;
    }

    const { players, currentPlayerId, phase, lastShot } = gameState;
    const currentPlayer = players.find(p => p.id === currentPlayerId)!;
    const opponent = players.find(p => p.id !== currentPlayerId)!;
    const playerColor: 'amber' | 'pink' = currentPlayerId === 1 ? 'amber' : 'pink';
    const isHandoff = phase === 'HANDOFF_PLACE' || phase === 'HANDOFF_FIRE';

    return (
        <div className="flex flex-col items-center p-2 sm:p-4 min-h-screen">
            {isRulesModalOpen && <RulesModal onClose={() => setIsRulesModalOpen(false)} />}

            <GameHeader
                statusLine={isHandoff ? t('battleshipGame.passDevice') : t('game.playersTurn', { name: currentPlayer.name })}
                onGoHome={onGoHome}
                onNewGame={handleNewGame}
                onOpenRules={() => setIsRulesModalOpen(true)}
            />

            <main className="flex-grow w-full max-w-5xl flex flex-col items-center justify-center gap-4">
                {isHandoff && (
                    <div className="bg-white/90 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                        <img src={AVATAR_IMAGES[currentPlayer.avatar]} alt={currentPlayer.name} className="w-28 h-28 mx-auto rounded-full mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            {t('battleshipGame.handoffTo', { name: currentPlayer.name })}
                        </h2>
                        <p className="text-slate-600 mb-6">
                            {phase === 'HANDOFF_PLACE'
                                ? t('battleshipGame.handoffPlaceMsg')
                                : t('battleshipGame.handoffFireMsg')}
                        </p>
                        <button
                            onClick={handleHandoffReady}
                            className={`w-full px-6 py-3 bg-${playerColor}-500 text-slate-900 font-bold text-lg rounded-lg shadow-md hover:bg-${playerColor}-400 transition-colors`}
                        >
                            {t('battleshipGame.readyButton')}
                        </button>
                    </div>
                )}

                {phase === 'PLACING' && (
                    <PlacementPanel
                        key={currentPlayerId}
                        board={currentPlayer.board}
                        onBoardChange={(b) => updateCurrentBoard(() => b)}
                        color={playerColor}
                        onConfirm={handleConfirmPlacement}
                        headerName={currentPlayer.name}
                        headerAvatar={currentPlayer.avatar}
                    />
                )}

                {(phase === 'FIRING' || phase === 'SHOT_RESULT') && (
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="bg-white/70 rounded-xl shadow p-4 w-full max-w-lg flex flex-col items-center gap-2">
                            <div className="text-slate-700 font-semibold">{t('battleshipGame.enemyWaters')}</div>
                            <BoardGrid
                                board={opponent.board}
                                revealShips={false}
                                showShots={true}
                                isInteractive={phase === 'FIRING'}
                                onCellClick={handleFire}
                                color={'slate'}
                                lastShot={lastShot}
                            />
                            <FleetStatus ships={opponent.board.ships} label={t('battleshipGame.enemyFleet')} />
                        </div>

                        {phase === 'SHOT_RESULT' && lastShot && (
                            <div className="bg-white/90 rounded-lg shadow p-4 text-center">
                                <div className="text-2xl font-bold mb-2">
                                    {lastShot.sunkShipId !== null
                                        ? t('battleshipGame.sunk')
                                        : lastShot.hit
                                            ? t('battleshipGame.hit')
                                            : t('battleshipGame.miss')}
                                </div>
                                <button
                                    onClick={handleEndTurn}
                                    className="px-6 py-2 bg-slate-600 text-white font-bold rounded-lg shadow hover:bg-slate-500 transition-colors"
                                >
                                    {t('battleshipGame.endTurn')}
                                </button>
                            </div>
                        )}

                        <div className="bg-white/70 rounded-xl shadow p-4 w-full max-w-lg flex flex-col items-center gap-2">
                            <div className="text-slate-700 font-semibold">
                                {t('battleshipGame.yourWaters', { name: currentPlayer.name })}
                            </div>
                            <BoardGrid
                                board={currentPlayer.board}
                                revealShips={true}
                                showShots={true}
                                isInteractive={false}
                                color={playerColor}
                            />
                            <div className="text-sm text-slate-600">
                                {t('battleshipGame.hitsTaken', {
                                    n: currentPlayer.board.shotsReceived.filter(s => s.hit).length,
                                    total: TOTAL_SHIP_CELLS,
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
