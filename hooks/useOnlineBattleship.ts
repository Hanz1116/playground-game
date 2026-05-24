import { useEffect, useRef, useState } from 'react';
import { BattleshipBoard, BattleshipShip, BattleshipShot } from '../types';
import { useNetwork } from '../context/NetworkContext';
import { emptyShips, shipAtCell, shotAt, SHIP_LENGTHS } from '../components/battleshipShared';

/**
 * Online Battleship is deliberately NOT a full-state mirror — that would leak
 * ship positions onto the opponent's device. Instead each device keeps its own
 * board private and only individual shots / results cross the wire:
 *
 *   - Both players place their fleets simultaneously and privately, then each
 *     sends a `bs-ready` signal (no board data).
 *   - To fire, the active device sends `bs-fire {x,y}`. The opponent's device
 *     resolves it against ITS OWN board (the only place those ships exist),
 *     records the incoming shot, and replies `bs-result {hit, sunkShipId,
 *     gameOver}`. The firer plots the result on its tracking grid.
 *   - One shot per turn, then play passes. The host (seat 1) fires first.
 */

export type OnlinePhase = 'PLACING' | 'WAITING_OPPONENT' | 'FIRING' | 'WAITING_FIRE' | 'GAME_OVER';

export interface OnlineBattleship {
    active: boolean;
    phase: OnlinePhase;
    pending: boolean; // a shot of ours is awaiting its result
    myBoard: BattleshipBoard;
    setMyBoard: (board: BattleshipBoard) => void;
    trackingShots: BattleshipShot[]; // shots WE fired at the opponent
    enemyFleet: BattleshipShip[];    // synthetic: only sunk ships are known
    lastShot: { x: number; y: number; hit: boolean; sunkShipId: number | null } | null;
    result: 'hit' | 'miss' | 'sunk' | null;
    winner: 'me' | 'opponent' | null;
    mySeat: 1 | 2;
    myName: string;
    myAvatar: string;
    opponentName: string;
    confirmPlacement: () => void;
    fire: (x: number, y: number) => void;
    reset: () => void;
}

const freshBoard = (): BattleshipBoard => ({ ships: emptyShips(), shotsReceived: [] });

export function useOnlineBattleship(): OnlineBattleship {
    const net = useNetwork();
    const { isOnline, send, subscribe, mySeat, players } = net;

    const [phase, setPhase] = useState<OnlinePhase>('PLACING');
    const [myBoard, setMyBoardState] = useState<BattleshipBoard>(freshBoard);
    const [trackingShots, setTrackingShots] = useState<BattleshipShot[]>([]);
    const [enemySunkShipIds, setEnemySunkShipIds] = useState<number[]>([]);
    const [lastShot, setLastShot] = useState<OnlineBattleship['lastShot']>(null);
    const [result, setResult] = useState<'hit' | 'miss' | 'sunk' | null>(null);
    const [winner, setWinner] = useState<'me' | 'opponent' | null>(null);
    const [pending, setPending] = useState(false);

    const myBoardRef = useRef<BattleshipBoard>(myBoard);
    myBoardRef.current = myBoard;
    const iAmReadyRef = useRef(false);
    const opponentReadyRef = useRef(false);
    const trackingRef = useRef<BattleshipShot[]>(trackingShots);
    trackingRef.current = trackingShots;
    const phaseRef = useRef<OnlinePhase>(phase);
    phaseRef.current = phase;
    const pendingRef = useRef(false);
    pendingRef.current = pending;

    const seat = (mySeat ?? 1) as 1 | 2;

    const setMyBoard = (board: BattleshipBoard) => {
        myBoardRef.current = board;
        setMyBoardState(board);
    };

    const resetLocal = () => {
        iAmReadyRef.current = false;
        opponentReadyRef.current = false;
        setMyBoard(freshBoard());
        setTrackingShots([]);
        setEnemySunkShipIds([]);
        setLastShot(null);
        setResult(null);
        setWinner(null);
        setPending(false);
        setPhase('PLACING');
    };

    const startFiring = () => setPhase(seat === 1 ? 'FIRING' : 'WAITING_FIRE');

    useEffect(() => {
        if (!isOnline) return;
        const unsubs = [
            subscribe('bs-ready', () => {
                opponentReadyRef.current = true;
                if (iAmReadyRef.current) startFiring();
            }),
            subscribe('bs-fire', (msg) => {
                const { x, y } = msg as { x: number; y: number };
                const board = myBoardRef.current;
                if (shotAt(board, x, y)) return; // ignore duplicates
                const hitShip = shipAtCell(board, x, y);
                const newShips = board.ships.map(s =>
                    hitShip && s.id === hitShip.id ? { ...s, hits: s.hits + 1 } : s,
                );
                const sunkShipId =
                    hitShip && newShips.find(s => s.id === hitShip.id)!.hits >= hitShip.length
                        ? hitShip.id
                        : null;
                const newBoard: BattleshipBoard = {
                    ships: newShips,
                    shotsReceived: [...board.shotsReceived, { x, y, hit: !!hitShip }],
                };
                setMyBoard(newBoard);
                const allSunk = newShips.every(s => s.hits >= s.length);
                send({ kind: 'bs-result', x, y, hit: !!hitShip, sunkShipId, gameOver: allSunk });
                if (allSunk) {
                    setWinner('opponent');
                    setPhase('GAME_OVER');
                } else {
                    setPhase('FIRING'); // our turn now
                }
            }),
            subscribe('bs-result', (msg) => {
                const { x, y, hit, sunkShipId, gameOver } = msg as {
                    x: number; y: number; hit: boolean; sunkShipId: number | null; gameOver: boolean;
                };
                setTrackingShots(prev => [...prev, { x, y, hit }]);
                setLastShot({ x, y, hit, sunkShipId });
                setResult(sunkShipId != null ? 'sunk' : hit ? 'hit' : 'miss');
                if (sunkShipId != null) {
                    setEnemySunkShipIds(prev => (prev.includes(sunkShipId) ? prev : [...prev, sunkShipId]));
                }
                setPending(false);
                if (gameOver) {
                    setWinner('me');
                    setPhase('GAME_OVER');
                } else {
                    setPhase('WAITING_FIRE');
                }
            }),
            subscribe('bs-reset', () => resetLocal()),
        ];
        return () => unsubs.forEach(u => u());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, subscribe, send, seat]);

    const confirmPlacement = () => {
        iAmReadyRef.current = true;
        send({ kind: 'bs-ready' });
        if (opponentReadyRef.current) startFiring();
        else setPhase('WAITING_OPPONENT');
    };

    const fire = (x: number, y: number) => {
        if (phaseRef.current !== 'FIRING' || pendingRef.current) return;
        if (trackingRef.current.some(s => s.x === x && s.y === y)) return;
        setPending(true);
        send({ kind: 'bs-fire', x, y });
    };

    const reset = () => {
        send({ kind: 'bs-reset' });
        resetLocal();
    };

    const enemyFleet: BattleshipShip[] = SHIP_LENGTHS.map((length, id) => ({
        id,
        length,
        positions: [],
        hits: enemySunkShipIds.includes(id) ? length : 0,
    }));

    return {
        active: isOnline,
        phase,
        pending,
        myBoard,
        setMyBoard,
        trackingShots,
        enemyFleet,
        lastShot,
        result,
        winner,
        mySeat: seat,
        myName: players ? players[seat === 1 ? 'p1' : 'p2'].name : '',
        myAvatar: seat === 1 ? 'dog' : 'rabbit',
        opponentName: players ? players[seat === 1 ? 'p2' : 'p1'].name : '',
        confirmPlacement,
        fire,
        reset,
    };
}
