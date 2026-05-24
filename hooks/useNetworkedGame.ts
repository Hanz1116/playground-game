import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { useNetwork, LobbyPlayer } from '../context/NetworkContext';

/**
 * Wraps a game's single state object with active-player-authoritative sync.
 *
 * Offline it behaves exactly like `useState`: `isOnline` is false, `mySeat` is
 * null and `isMyTurn` is always true, so existing pass-and-play logic is
 * untouched.
 *
 * Online, whichever device's turn it is computes the next state locally (the
 * normal game handlers) and the whole state object is broadcast to the peer,
 * which simply applies it. Input handlers gate on `isMyTurn`, so only one side
 * mutates at a time and the two devices stay in lockstep.
 */
export interface NetworkedGame<T> {
    gameState: T | null;
    setGameState: Dispatch<SetStateAction<T | null>>;
    isOnline: boolean;
    mySeat: 1 | 2 | null;
    isMyTurn: boolean;
    players: { p1: LobbyPlayer; p2: LobbyPlayer } | null;
}

export function useNetworkedGame<T extends { currentPlayerId: 1 | 2 }>(gameId: string): NetworkedGame<T> {
    const net = useNetwork();
    const [gameState, setGameState] = useState<T | null>(null);

    // JSON of the last state we've synced (sent or received). Lets the broadcast
    // effect tell "I changed this" from "the peer changed this" and avoid echoes.
    // Seeded with "null" so simply mounting (state === null) never broadcasts.
    const remoteRef = useRef<string>('null');
    // Always-current snapshot, so the request responder can read it without
    // being in the effect's dependency list.
    const stateRef = useRef<T | null>(null);
    stateRef.current = gameState;

    const { isOnline, send, subscribe, mySeat } = net;

    // Apply state pushed by the peer.
    useEffect(() => {
        if (!isOnline) return;
        const unsub = subscribe('state', (msg) => {
            if (msg.gameId !== gameId) return;
            const incoming = (msg.state ?? null) as T | null;
            remoteRef.current = JSON.stringify(incoming);
            setGameState(incoming);
        });
        return unsub;
    }, [isOnline, gameId, subscribe]);

    // Answer a peer that just navigated into the game and needs the current state.
    useEffect(() => {
        if (!isOnline) return;
        const unsub = subscribe('requestState', (msg) => {
            if (msg.gameId !== gameId) return;
            if (stateRef.current) send({ kind: 'state', gameId, state: stateRef.current });
        });
        return unsub;
    }, [isOnline, gameId, subscribe, send]);

    // On mount (online), ask whoever has a live game to send it over.
    useEffect(() => {
        if (isOnline) send({ kind: 'requestState', gameId });
    }, [isOnline, gameId, send]);

    // Broadcast locally-originated changes to the peer.
    useEffect(() => {
        if (!isOnline) return;
        const json = JSON.stringify(gameState ?? null);
        if (json === remoteRef.current) return; // unchanged or came from the peer; don't echo
        remoteRef.current = json; // remember what we've now synced
        send({ kind: 'state', gameId, state: gameState ?? null });
    }, [gameState, isOnline, gameId, send]);

    const isMyTurn = !isOnline || (gameState != null && gameState.currentPlayerId === mySeat);

    return { gameState, setGameState, isOnline, mySeat, isMyTurn, players: net.players };
}
