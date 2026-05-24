import React, { useEffect, useRef, useState, useMemo } from 'react';
import { BattleshipBoard, BattleshipShip } from '../types';
import { useI18n } from '../hooks/useI18n';
import { AVATAR_IMAGES } from '../constants';

export const BOARD_SIZE = 8;
export const SHIP_LENGTHS = [5, 4, 3, 3, 2];
export const TOTAL_SHIP_CELLS = SHIP_LENGTHS.reduce((a, b) => a + b, 0);

export type Orientation = 'h' | 'v';

export const emptyShips = (): BattleshipShip[] =>
    SHIP_LENGTHS.map((length, id) => ({ id, length, positions: [], hits: 0 }));

export const candidatePositions = (
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

export const positionsOverlap = (
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

export const randomPlaceShips = (): BattleshipShip[] => {
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
            ships.push({ id: i, length: len, positions: [], hits: 0 });
        }
    }
    return ships;
};

export const shipAtCell = (board: BattleshipBoard, x: number, y: number): BattleshipShip | null => {
    for (const ship of board.ships) {
        if (ship.positions.some(([sx, sy]) => sx === x && sy === y)) return ship;
    }
    return null;
};

export const shotAt = (board: BattleshipBoard, x: number, y: number) =>
    board.shotsReceived.find(s => s.x === x && s.y === y) ?? null;

const cellSizeClass = 'w-7 h-7 sm:w-9 sm:h-9';

export type CellPreview = {
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

export const BoardGrid: React.FC<BoardGridProps> = ({
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

export const FleetStatus: React.FC<{ ships: BattleshipShip[]; label: string }> = ({ ships, label }) => (
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

interface PlacementPanelProps {
    board: BattleshipBoard;
    onBoardChange: (board: BattleshipBoard) => void;
    color: 'amber' | 'pink';
    onConfirm: () => void;
    headerName: string;
    headerAvatar: string;
    hint?: string;
}

/**
 * Self-contained fleet-placement UI. Manages its own selection / orientation /
 * hover state and edits the board through `onBoardChange`. Used by both the
 * offline (pass-and-play) flow and the online flow, where each player places
 * privately on their own device. Give it a `key` per player so selection resets
 * cleanly when the offline flow hands off between players.
 */
export const PlacementPanel: React.FC<PlacementPanelProps> = ({
    board,
    onBoardChange,
    color,
    onConfirm,
    headerName,
    headerAvatar,
    hint,
}) => {
    const { t } = useI18n();
    const [selectedShipId, setSelectedShipId] = useState<number | null>(null);
    const [orientation, setOrientation] = useState<Orientation>('h');
    const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

    // Select the first unplaced ship on mount (i.e. per player).
    useEffect(() => {
        const firstUnplaced = board.ships.find(s => s.positions.length === 0);
        setSelectedShipId(firstUnplaced ? firstUnplaced.id : null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'r' || e.key === 'R') setOrientation(o => (o === 'h' ? 'v' : 'h'));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleShuffle = () => {
        onBoardChange({ ...board, ships: randomPlaceShips() });
        setSelectedShipId(null);
    };

    const handleClear = () => {
        onBoardChange({ ...board, ships: emptyShips() });
        setSelectedShipId(0);
    };

    const handleRosterSelect = (shipId: number) => {
        const ship = board.ships.find(s => s.id === shipId)!;
        if (ship.positions.length > 0) {
            onBoardChange({
                ...board,
                ships: board.ships.map(s => (s.id === shipId ? { ...s, positions: [] } : s)),
            });
        }
        setSelectedShipId(shipId);
    };

    const handlePlaceCellClick = (x: number, y: number, pointerType: string) => {
        // Clicking a placed ship picks it back up.
        const clickedShip = shipAtCell(board, x, y);
        if (clickedShip) {
            onBoardChange({
                ...board,
                ships: board.ships.map(s => (s.id === clickedShip.id ? { ...s, positions: [] } : s)),
            });
            setSelectedShipId(clickedShip.id);
            setHoverCell(null);
            return;
        }

        if (selectedShipId == null) return;
        const ship = board.ships.find(s => s.id === selectedShipId);
        if (!ship || ship.positions.length > 0) return;
        const positions = candidatePositions(x, y, ship.length, orientation);
        if (!positions) return;
        if (positionsOverlap(positions, board.ships, ship.id)) return;

        // Touch / pen: first tap previews, second tap on the same cell confirms.
        const isTouch = pointerType !== 'mouse';
        if (isTouch && (hoverCell?.x !== x || hoverCell?.y !== y)) {
            setHoverCell({ x, y });
            return;
        }

        const newShips = board.ships.map(s => (s.id === ship.id ? { ...s, positions } : s));
        onBoardChange({ ...board, ships: newShips });
        setHoverCell(null);

        const nextUnplaced = newShips.find(s => s.id !== ship.id && s.positions.length === 0);
        setSelectedShipId(nextUnplaced ? nextUnplaced.id : null);
    };

    const placementPreview: CellPreview | null = useMemo(() => {
        if (!hoverCell || selectedShipId == null) return null;
        const ship = board.ships.find(s => s.id === selectedShipId);
        if (!ship || ship.positions.length > 0) return null;
        const positions = candidatePositions(hoverCell.x, hoverCell.y, ship.length, orientation);
        if (!positions) {
            return { positions: new Set([`${hoverCell.x},${hoverCell.y}`]), valid: false };
        }
        const overlaps = positionsOverlap(positions, board.ships, ship.id);
        return { positions: new Set(positions.map(([x, y]) => `${x},${y}`)), valid: !overlaps };
    }, [board.ships, hoverCell, selectedShipId, orientation]);

    const allPlaced = board.ships.every(s => s.positions.length > 0);

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center gap-3">
                <img src={AVATAR_IMAGES[headerAvatar]} alt={headerName} className="w-16 h-16 rounded-full" />
                <div>
                    <div className="text-xl font-bold text-slate-800">{headerName}</div>
                    <div className="text-slate-600 text-sm">{hint ?? t('battleshipGame.placementHint')}</div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-4 w-full justify-center">
                <div className="flex flex-col items-center gap-3">
                    <BoardGrid
                        board={board}
                        revealShips={true}
                        showShots={false}
                        isInteractive={true}
                        onCellClick={handlePlaceCellClick}
                        onCellHover={(x, y) => setHoverCell({ x, y })}
                        onLeave={() => setHoverCell(null)}
                        color={color}
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
                        <button onClick={handleShuffle} className="px-4 py-2 bg-white/80 text-slate-700 font-semibold rounded-lg shadow hover:bg-white transition-colors">
                            {t('battleshipGame.shuffle')}
                        </button>
                        <button onClick={handleClear} className="px-4 py-2 bg-white/80 text-slate-700 font-semibold rounded-lg shadow hover:bg-white transition-colors">
                            {t('battleshipGame.clear')}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 items-start w-full md:w-auto">
                    <div className="text-sm font-semibold text-slate-700">{t('battleshipGame.shipsTitle')}</div>
                    <ShipRoster
                        ships={board.ships}
                        selectedShipId={selectedShipId}
                        onSelect={handleRosterSelect}
                        color={color}
                        placedLabel={t('battleshipGame.placed')}
                        pickLabel={t('battleshipGame.pick')}
                    />
                    <button
                        onClick={onConfirm}
                        disabled={!allPlaced}
                        className={`mt-2 w-full px-4 py-2 font-bold rounded-lg shadow transition-colors ${
                            allPlaced
                                ? `bg-${color}-500 text-slate-900 hover:bg-${color}-400`
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {t('battleshipGame.confirmPlacement')}
                    </button>
                </div>
            </div>
        </div>
    );
};
