import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PlayerSetupModal } from './PlayerSetupModal';
import { GameOverModal, DisplayPlayer } from './GameOverModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GameRulesModal } from './GameRulesModal';
import {
    BattleshipBoard,
    BattleshipGameState,
    BattleshipPlayer,
    BattleshipShip,
    GameStatus,
} from '../types';
import { useI18n } from '../hooks/useI18n';
import { AVATAR_IMAGES } from '../constants';

const BOARD_SIZE = 8;
const SHIP_LENGTHS = [5, 4, 3, 3, 2];
const TOTAL_SHIP_CELLS = SHIP_LENGTHS.reduce((a, b) => a + b, 0);

type Orientation = 'h' | 'v';

const emptyShips = (): BattleshipShip[] =>
    SHIP_LENGTHS.map((length, id) => ({ id, length, positions: [], hits: 0 }));

const candidatePositions = (
    x: number,
    y: number,
    len: number,
    orientation: Orientation,
): [number, number][] | null => {
    const positions: [number, number][] = [];
    for (let i = 0; i < len; i++) {
        const cx = orientation === 'h' ? x + i : x;
        const cy = orientation === 'h' ? y : y + i;
        if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) return null;
        positions.push([cx, cy]);
    }
    return positions;
};

const positionsOverlap = (
    positions: [number, number][],
    ships: BattleshipShip[],
    excludeShipId: number,
): boolean => {
    const occupied = new Set<string>();
    ships.forEach(s => {
        if (s.id === excludeShipId) return;
        s.positions.forEach(([x, y]) => occupied.add(`${x},${y}`));
    });
    return positions.some(([x, y]) => occupied.has(`${x},${y}`));
};

const randomPlaceShips = (): BattleshipShip[] => {
    const occupied = new Set<string>();
    const ships: BattleshipShip[] = [];
    for (let i = 0; i < SHIP_LENGTHS.length; i++) {
        const len = SHIP_LENGTHS[i];
        let placed = false;
        let safety = 0;
        while (!placed && safety < 500) {
            safety++;
            const orientation: Orientation = Math.random() < 0.5 ? 'h' : 'v';
            const maxX = orientation === 'h' ? BOARD_SIZE - len : BOARD_SIZE - 1;
            const maxY = orientation === 'h' ? BOARD_SIZE - 1 : BOARD_SIZE - len;
            const x = Math.floor(Math.random() * (maxX + 1));
            const y = Math.floor(Math.random() * (maxY + 1));
            const positions = candidatePositions(x, y, len, orientation)!;
            const collision = positions.some(([px, py]) => occupied.has(`${px},${py}`));
            if (!collision) {
                positions.forEach(([px, py]) => occupied.add(`${px},${py}`));
                ships.push({ id: i, length: len, positions, hits: 0 });
                placed = true;
            }
        }
        if (!placed) {
            // Extremely unlikely fallback — leave unplaced.
            ships.push({ id: i, length: len, positions: [], hits: 0 });
        }
    }
    return ships;
};

const makePlayer = (id: 1 | 2, name: string, avatar: string): BattleshipPlayer => ({
    id,
    name,
    avatar,
    board: { ships: emptyShips(), shotsReceived: [] },
});

const shipAtCell = (board: BattleshipBoard, x: number, y: number): BattleshipShip | null => {
    for (const ship of board.ships) {
        if (ship.positions.some(([sx, sy]) => sx === x && sy === y)) return ship;
    }
    return null;
};

const shotAt = (board: BattleshipBoard, x: number, y: number) =>
    board.shotsReceived.find(s => s.x === x && s.y === y) ?? null;

const cellSizeClass = 'w-7 h-7 sm:w-9 sm:h-9';

type CellPreview = {
    positions: Set<string>;
    valid: boolean;
};

interface BoardGridProps {
    board: BattleshipBoard;
    revealShips: boolean;
    showShots: boolean;
    onCellClick?: (x: number, y: number, pointerType: string) => void;
    onCellHover?: (x: number, y: number) => void;
    onLeave?: () => void;
    isInteractive?: boolean;
    color: 'amber' | 'pink' | 'slate';
    lastShot?: { x: number; y: number } | null;
    preview?: CellPreview | null;
}

const BoardGrid: React.FC<BoardGridProps> = ({
    board,
    revealShips,
    showShots,
    onCellClick,
    onCellHover,
    onLeave,
    isInteractive,
    color,
    lastShot,
    preview,
}) => {
    const shipBg = color === 'amber' ? 'bg-amber-400' : color === 'pink' ? 'bg-pink-400' : 'bg-slate-400';
    const lastPointerType = useRef<string>('mouse');
    return (
        <div
            className="inline-grid gap-0.5 p-2 bg-sky-700/80 rounded-lg shadow-inner"
            style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
            onMouseLeave={onLeave}
        >
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
                const x = idx % BOARD_SIZE;
                const y = Math.floor(idx / BOARD_SIZE);
                const ship = shipAtCell(board, x, y);
                const shot = showShots ? shotAt(board, x, y) : null;
                const isLast = lastShot && lastShot.x === x && lastShot.y === y;
                const inPreview = preview?.positions.has(`${x},${y}`);

                let base = 'bg-sky-200';
                if (revealShips && ship) base = shipBg;
                if (shot && shot.hit) base = 'bg-red-500';
                else if (shot) base = 'bg-slate-300';
                if (inPreview) {
                    base = preview!.valid ? 'bg-green-400/80' : 'bg-red-400/80';
                }

                return (
                    <button
                        key={idx}
                        type="button"
                        disabled={!isInteractive}
                        onPointerDown={isInteractive ? (e) => { lastPointerType.current = e.pointerType || 'mouse'; } : undefined}
                        onClick={isInteractive ? () => onCellClick?.(x, y, lastPointerType.current) : undefined}
                        onPointerEnter={isInteractive ? (e) => { if (e.pointerType === 'mouse') onCellHover?.(x, y); } : undefined}
                        className={`${cellSizeClass} ${base} rounded-sm flex items-center justify-center text-xs font-bold transition-colors ${
                            isInteractive ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
                        } ${isLast ? 'ring-2 ring-yellow-300' : ''}`}
                    >
                        {shot && shot.hit && <span className="text-white">✕</span>}
                        {shot && !shot.hit && <span className="text-slate-600">·</span>}
                    </button>
                );
            })}
        </div>
    );
};

const FleetStatus: React.FC<{ ships: BattleshipShip[]; label: string }> = ({ ships, label }) => (
    <div className="flex flex-col items-start gap-1">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <div className="flex flex-wrap gap-1">
            {ships.map(ship => {
                const sunk = ship.hits >= ship.length;
                return (
                    <div
                        key={ship.id}
                        className={`flex gap-0.5 px-1 py-0.5 rounded ${sunk ? 'bg-red-200' : 'bg-slate-200'}`}
                    >
                        {Array.from({ length: ship.length }).map((_, i) => (
                            <span
                                key={i}
                                className={`w-2 h-2 rounded-sm ${sunk ? 'bg-red-600' : i < ship.hits ? 'bg-red-500' : 'bg-slate-500'}`}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    </div>
);

interface ShipRosterProps {
    ships: BattleshipShip[];
    selectedShipId: number | null;
    onSelect: (id: number) => void;
    color: 'amber' | 'pink';
    placedLabel: string;
    pickLabel: string;
}

const ShipRoster: React.FC<ShipRosterProps> = ({
    ships,
    selectedShipId,
    onSelect,
    color,
    placedLabel,
    pickLabel,
}) => {
    const dotColor = color === 'amber' ? 'bg-amber-500' : 'bg-pink-500';
    return (
        <div className="flex flex-col gap-1.5 w-full max-w-xs">
            {ships.map(ship => {
                const placed = ship.positions.length > 0;
                const selected = ship.id === selectedShipId;
                return (
                    <button
                        key={ship.id}
                        type="button"
                        onClick={() => onSelect(ship.id)}
                        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border-2 transition-colors ${
                            selected
                                ? `border-${color}-500 bg-${color}-100`
                                : placed
                                    ? 'border-slate-300 bg-slate-100 hover:bg-slate-200'
                                    : 'border-slate-300 bg-white/80 hover:bg-white'
                        }`}
                    >
                        <div className="flex gap-0.5">
                            {Array.from({ length: ship.length }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-3 h-3 rounded-sm ${placed && !selected ? 'bg-slate-400' : dotColor}`}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                            {placed ? placedLabel : pickLabel}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

interface BattleshipGameProps {
    onGoHome: () => void;
}

export const BattleshipGame: React.FC<BattleshipGameProps> = ({ onGoHome }) => {
    const [gameState, setGameState] = useState<BattleshipGameState | null>(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

    // Placement-only local state
    const [selectedShipId, setSelectedShipId] = useState<number | null>(null);
    const [orientation, setOrientation] = useState<Orientation>('h');
    const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

    const { t } = useI18n();

    const initializeGame = useCallback((p1Name: string, p1Avatar: string, p2Name: string, p2Avatar: string) => {
        setGameState({
            players: [makePlayer(1, p1Name, p1Avatar), makePlayer(2, p2Name, p2Avatar)],
            gameStatus: GameStatus.IN_PROGRESS,
            currentPlayerId: 1,
            phase: 'PLACING',
            lastShot: null,
        });
        setSelectedShipId(null);
        setOrientation('h');
        setHoverCell(null);
    }, []);

    const handleNewGame = () => setGameState(null);

    // Auto-select the first unplaced ship when entering placement.
    useEffect(() => {
        if (!gameState || gameState.phase !== 'PLACING') return;
        const player = gameState.players.find(p => p.id === gameState.currentPlayerId)!;
        const firstUnplaced = player.board.ships.find(s => s.positions.length === 0);
        setSelectedShipId(firstUnplaced ? firstUnplaced.id : null);
    }, [gameState?.phase, gameState?.currentPlayerId]);

    // Rotate via 'R' key during placement for keyboard users.
    useEffect(() => {
        if (gameState?.phase !== 'PLACING') return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'r' || e.key === 'R') {
                setOrientation(o => (o === 'h' ? 'v' : 'h'));
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [gameState?.phase]);

    const updateCurrentBoard = (updater: (board: BattleshipBoard) => BattleshipBoard) => {
        setGameState(prev => {
            if (!prev) return prev;
            const newPlayers = prev.players.map(p =>
                p.id === prev.currentPlayerId ? { ...p, board: updater(p.board) } : p,
            ) as [BattleshipPlayer, BattleshipPlayer];
            return { ...prev, players: newPlayers };
        });
    };

    const handleShuffle = () => {
        updateCurrentBoard(board => ({ ...board, ships: randomPlaceShips() }));
        setSelectedShipId(null);
    };

    const handleClear = () => {
        updateCurrentBoard(board => ({ ...board, ships: emptyShips() }));
    };

    const handleRosterSelect = (shipId: number) => {
        // If the ship is placed, clicking it picks it back up (removes from board).
        if (!gameState) return;
        const player = gameState.players.find(p => p.id === gameState.currentPlayerId)!;
        const ship = player.board.ships.find(s => s.id === shipId)!;
        if (ship.positions.length > 0) {
            updateCurrentBoard(board => ({
                ...board,
                ships: board.ships.map(s => (s.id === shipId ? { ...s, positions: [] } : s)),
            }));
        }
        setSelectedShipId(shipId);
    };

    const handlePlaceCellClick = (x: number, y: number, pointerType: string) => {
        if (!gameState) return;
        const player = gameState.players.find(p => p.id === gameState.currentPlayerId)!;

        // If clicking a placed ship cell, pick that ship up (one tap always).
        const clickedShip = shipAtCell(player.board, x, y);
        if (clickedShip) {
            updateCurrentBoard(board => ({
                ...board,
                ships: board.ships.map(s => (s.id === clickedShip.id ? { ...s, positions: [] } : s)),
            }));
            setSelectedShipId(clickedShip.id);
            setHoverCell(null);
            return;
        }

        // Otherwise try to place the selected ship.
        if (selectedShipId == null) return;
        const ship = player.board.ships.find(s => s.id === selectedShipId);
        if (!ship || ship.positions.length > 0) return;
        const positions = candidatePositions(x, y, ship.length, orientation);
        if (!positions) return;
        if (positionsOverlap(positions, player.board.ships, ship.id)) return;

        // Touch / pen: first tap previews, second tap on the same cell confirms.
        const isTouch = pointerType !== 'mouse';
        if (isTouch && (hoverCell?.x !== x || hoverCell?.y !== y)) {
            setHoverCell({ x, y });
            return;
        }

        updateCurrentBoard(board => ({
            ...board,
            ships: board.ships.map(s => (s.id === ship.id ? { ...s, positions } : s)),
        }));
        setHoverCell(null);

        // Auto-advance to the next unplaced ship.
        const nextUnplaced = player.board.ships.find(s => s.id !== ship.id && s.positions.length === 0);
        setSelectedShipId(nextUnplaced ? nextUnplaced.id : null);
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

    const handleFire = (x: number, y: number, _pointerType?: string) => {
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

    // Compute placement preview from hover + selected ship + orientation.
    const placementPreview: CellPreview | null = useMemo(() => {
        if (!gameState || gameState.phase !== 'PLACING' || !hoverCell || selectedShipId == null) return null;
        const player = gameState.players.find(p => p.id === gameState.currentPlayerId)!;
        const ship = player.board.ships.find(s => s.id === selectedShipId);
        if (!ship || ship.positions.length > 0) return null;
        const positions = candidatePositions(hoverCell.x, hoverCell.y, ship.length, orientation);
        if (!positions) {
            // Out of bounds — show a single-cell red marker at the hover point.
            return {
                positions: new Set([`${hoverCell.x},${hoverCell.y}`]),
                valid: false,
            };
        }
        const overlaps = positionsOverlap(positions, player.board.ships, ship.id);
        return {
            positions: new Set(positions.map(([x, y]) => `${x},${y}`)),
            valid: !overlaps,
        };
    }, [gameState, hoverCell, selectedShipId, orientation]);

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
    const allPlaced = currentPlayer.board.ships.every(s => s.positions.length > 0);

    return (
        <div className="flex flex-col items-center p-2 sm:p-4 min-h-screen">
            {isRulesModalOpen && (
                <GameRulesModal title={t('rules.battleship.title')} onClose={() => setIsRulesModalOpen(false)}>
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
            )}

            <header className="w-full max-w-7xl mb-4 text-center relative">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-wider">{t('games.battleship.title')}</h1>
                <div className="text-lg text-slate-500 mt-1">
                    {isHandoff ? t('battleshipGame.passDevice') : t('game.playersTurn', { name: currentPlayer.name })}
                </div>
                <div className="absolute top-0 left-2 flex items-center gap-2">
                    <button onClick={onGoHome} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors">&larr; {t('button.backToHome')}</button>
                    <button onClick={handleNewGame} className="px-3 py-2 bg-slate-500/80 text-white rounded-lg hover:bg-slate-500 transition-colors">{t('button.newGame')}</button>
                    <button onClick={() => setIsRulesModalOpen(true)} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors" title={t('button.gameRules')}>
                        <i className="fas fa-question-circle"></i>
                    </button>
                </div>
                <div className="absolute top-0 right-2"><LanguageSwitcher /></div>
            </header>

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
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="flex items-center gap-3">
                            <img src={AVATAR_IMAGES[currentPlayer.avatar]} alt={currentPlayer.name} className="w-16 h-16 rounded-full" />
                            <div>
                                <div className="text-xl font-bold text-slate-800">{currentPlayer.name}</div>
                                <div className="text-slate-600 text-sm">{t('battleshipGame.placementHint')}</div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start gap-4 w-full justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <BoardGrid
                                    board={currentPlayer.board}
                                    revealShips={true}
                                    showShots={false}
                                    isInteractive={true}
                                    onCellClick={handlePlaceCellClick}
                                    onCellHover={(x, y) => setHoverCell({ x, y })}
                                    onLeave={() => setHoverCell(null)}
                                    color={playerColor}
                                    preview={placementPreview}
                                />
                                <div className="flex flex-wrap justify-center gap-2">
                                    <button
                                        onClick={() => setOrientation(o => (o === 'h' ? 'v' : 'h'))}
                                        className="px-4 py-2 bg-white/80 text-slate-700 font-semibold rounded-lg shadow hover:bg-white transition-colors"
                                        title={t('battleshipGame.rotateHint')}
                                    >
                                        {orientation === 'h'
                                            ? t('battleshipGame.orientationHorizontal')
                                            : t('battleshipGame.orientationVertical')}
                                    </button>
                                    <button
                                        onClick={handleShuffle}
                                        className="px-4 py-2 bg-white/80 text-slate-700 font-semibold rounded-lg shadow hover:bg-white transition-colors"
                                    >
                                        {t('battleshipGame.shuffle')}
                                    </button>
                                    <button
                                        onClick={handleClear}
                                        className="px-4 py-2 bg-white/80 text-slate-700 font-semibold rounded-lg shadow hover:bg-white transition-colors"
                                    >
                                        {t('battleshipGame.clear')}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 items-start w-full md:w-auto">
                                <div className="text-sm font-semibold text-slate-700">{t('battleshipGame.shipsTitle')}</div>
                                <ShipRoster
                                    ships={currentPlayer.board.ships}
                                    selectedShipId={selectedShipId}
                                    onSelect={handleRosterSelect}
                                    color={playerColor}
                                    placedLabel={t('battleshipGame.placed')}
                                    pickLabel={t('battleshipGame.pick')}
                                />
                                <button
                                    onClick={handleConfirmPlacement}
                                    disabled={!allPlaced}
                                    className={`mt-2 w-full px-4 py-2 font-bold rounded-lg shadow transition-colors ${
                                        allPlaced
                                            ? `bg-${playerColor}-500 text-slate-900 hover:bg-${playerColor}-400`
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {t('battleshipGame.confirmPlacement')}
                                </button>
                            </div>
                        </div>
                    </div>
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
                            <FleetStatus
                                ships={opponent.board.ships}
                                label={t('battleshipGame.enemyFleet')}
                            />
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
