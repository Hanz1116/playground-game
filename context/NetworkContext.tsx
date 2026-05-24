import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';

// Host is always seat 1 (dog / amber), guest is seat 2 (rabbit / pink) so the
// fixed avatars line up with every game's existing player-1 / player-2 colours.
export interface LobbyPlayer {
    name: string;
    avatar: string; // 'dog' | 'rabbit'
}

export interface NetMessage {
    kind: string;
    [key: string]: any;
}

type Status = 'idle' | 'hosting' | 'joining' | 'connected' | 'error';

interface NetworkContextType {
    status: Status;
    isOnline: boolean;
    role: 'host' | 'guest' | null;
    mySeat: 1 | 2 | null;
    roomCode: string | null;
    players: { p1: LobbyPlayer; p2: LobbyPlayer } | null;
    error: string | null;
    createRoom: (name: string) => void;
    joinRoom: (code: string, name: string) => void;
    leave: () => void;
    send: (msg: NetMessage) => void;
    subscribe: (kind: string, handler: (msg: NetMessage) => void) => () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const ID_PREFIX = 'playground-game-';
// Unambiguous alphabet (no 0/O, 1/I/L) so codes are easy to read aloud / type.
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 5;

const makeCode = () => {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return code;
};

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<Status>('idle');
    const [role, setRole] = useState<'host' | 'guest' | null>(null);
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [players, setPlayers] = useState<{ p1: LobbyPlayer; p2: LobbyPlayer } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<DataConnection | null>(null);
    const myInfoRef = useRef<LobbyPlayer | null>(null);
    const peerInfoRef = useRef<LobbyPlayer | null>(null);
    const roleRef = useRef<'host' | 'guest' | null>(null);
    // kind -> set of handlers
    const handlersRef = useRef<Map<string, Set<(msg: NetMessage) => void>>>(new Map());

    const dispatch = useCallback((msg: NetMessage) => {
        const set = handlersRef.current.get(msg.kind);
        if (set) set.forEach(h => h(msg));
    }, []);

    const send = useCallback((msg: NetMessage) => {
        const conn = connRef.current;
        if (conn && conn.open) {
            conn.send(msg);
        }
    }, []);

    const subscribe = useCallback((kind: string, handler: (msg: NetMessage) => void) => {
        let set = handlersRef.current.get(kind);
        if (!set) {
            set = new Set();
            handlersRef.current.set(kind, set);
        }
        set.add(handler);
        return () => { set!.delete(handler); };
    }, []);

    const tryComplete = useCallback(() => {
        const mine = myInfoRef.current;
        const theirs = peerInfoRef.current;
        if (!mine || !theirs) return;
        if (roleRef.current === 'host') {
            setPlayers({ p1: mine, p2: theirs });
        } else {
            setPlayers({ p1: theirs, p2: mine });
        }
        setStatus('connected');
    }, []);

    const wireConnection = useCallback((conn: DataConnection) => {
        connRef.current = conn;
        conn.on('open', () => {
            // Announce who I am so the other side can build the players list.
            if (myInfoRef.current) conn.send({ kind: 'hello', player: myInfoRef.current });
        });
        conn.on('data', (raw) => {
            const msg = raw as NetMessage;
            if (!msg || typeof msg.kind !== 'string') return;
            if (msg.kind === 'hello') {
                peerInfoRef.current = msg.player as LobbyPlayer;
                tryComplete();
                return;
            }
            dispatch(msg);
        });
        conn.on('close', () => {
            setError('connectionLost');
            setStatus('error');
        });
        conn.on('error', () => {
            setError('connectionLost');
            setStatus('error');
        });
    }, [dispatch, tryComplete]);

    const cleanup = useCallback(() => {
        try { connRef.current?.close(); } catch { /* noop */ }
        try { peerRef.current?.destroy(); } catch { /* noop */ }
        connRef.current = null;
        peerRef.current = null;
        peerInfoRef.current = null;
    }, []);

    const createRoom = useCallback((name: string) => {
        cleanup();
        setError(null);
        setPlayers(null);
        const code = makeCode();
        myInfoRef.current = { name: name.trim() || 'Player 1', avatar: 'dog' };
        roleRef.current = 'host';
        setRole('host');
        setRoomCode(code);
        setStatus('hosting');

        const peer = new Peer(ID_PREFIX + code);
        peerRef.current = peer;
        peer.on('open', () => setStatus('hosting'));
        peer.on('connection', (conn) => wireConnection(conn));
        peer.on('error', (err: any) => {
            // Retry once with a fresh code if this one is already taken.
            if (err?.type === 'unavailable-id') {
                createRoom(name);
                return;
            }
            setError(err?.type || 'peerError');
            setStatus('error');
        });
    }, [cleanup, wireConnection]);

    const joinRoom = useCallback((code: string, name: string) => {
        cleanup();
        setError(null);
        setPlayers(null);
        const normalized = code.trim().toUpperCase();
        myInfoRef.current = { name: name.trim() || 'Player 2', avatar: 'rabbit' };
        roleRef.current = 'guest';
        setRole('guest');
        setRoomCode(normalized);
        setStatus('joining');

        const peer = new Peer();
        peerRef.current = peer;
        peer.on('open', () => {
            const conn = peer.connect(ID_PREFIX + normalized, { reliable: true });
            wireConnection(conn);
        });
        peer.on('error', (err: any) => {
            const type = err?.type;
            setError(type === 'peer-unavailable' ? 'roomNotFound' : (type || 'peerError'));
            setStatus('error');
        });
    }, [cleanup, wireConnection]);

    const leave = useCallback(() => {
        cleanup();
        myInfoRef.current = null;
        roleRef.current = null;
        setRole(null);
        setRoomCode(null);
        setPlayers(null);
        setError(null);
        setStatus('idle');
    }, [cleanup]);

    useEffect(() => () => cleanup(), [cleanup]);

    const value = useMemo<NetworkContextType>(() => ({
        status,
        isOnline: status === 'connected',
        role,
        mySeat: role === 'host' ? 1 : role === 'guest' ? 2 : null,
        roomCode,
        players,
        error,
        createRoom,
        joinRoom,
        leave,
        send,
        subscribe,
    }), [status, role, roomCode, players, error, createRoom, joinRoom, leave, send, subscribe]);

    return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = (): NetworkContextType => {
    const ctx = useContext(NetworkContext);
    if (!ctx) throw new Error('useNetwork must be used within a NetworkProvider');
    return ctx;
};
