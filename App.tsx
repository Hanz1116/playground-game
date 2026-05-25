import React, { useState, useCallback, useEffect, useRef } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { YahtzeeGame } from './components/YahtzeeGame';
import { MatchingGame } from './components/MatchingGame';
import { DotsAndBoxesGame } from './components/DotsAndBoxesGame';
import { ShutTheBoxGame } from './components/ShutTheBoxGame';
import { WordLadderGame } from './components/WordLadderGame';
import { BattleshipGame } from './components/BattleshipGame';
import { OnlineLobby } from './components/OnlineLobby';
import { OnlineBar } from './components/OnlineStatus';
import { useBackgroundMusic } from './hooks/useBackgroundMusic';
import { useNetwork } from './context/NetworkContext';
import type { TrackKey } from './hooks/musicTracks';

export type View = 'home' | 'yahtzee' | 'matching' | 'dotsAndBoxes' | 'shutTheBox' | 'wordLadder' | 'battleship';

const SpeakerOnIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
);

const SpeakerOffIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
);

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [showLobby, setShowLobby] = useState(false);
    // View names happen to match the music track keys, so we can pass it directly.
    const { isMuted, toggleMute } = useBackgroundMusic(currentView as TrackKey);
    const net = useNetwork();

    // Keep both devices on the same screen. Track the last view we received from
    // the peer so re-broadcasting it doesn't bounce back and forth.
    const remoteViewRef = useRef<View | undefined>(undefined);
    useEffect(() => {
        if (!net.isOnline) return;
        const unsub = net.subscribe('view', (msg) => {
            remoteViewRef.current = msg.view as View;
            setCurrentView(msg.view as View);
        });
        return unsub;
    }, [net.isOnline, net.subscribe]);

    useEffect(() => {
        if (!net.isOnline) return;
        if (currentView === remoteViewRef.current) return;
        net.send({ kind: 'view', view: currentView });
    }, [currentView, net.isOnline, net.send]);

    // Once connected, swap the lobby for the home screen. When a session ends,
    // fall back home so we never linger on a now-dead game.
    useEffect(() => {
        if (net.isOnline) setShowLobby(false);
        if (net.status === 'idle') {
            remoteViewRef.current = undefined;
            setCurrentView('home');
        }
    }, [net.isOnline, net.status]);

    const handleStartYahtzee = useCallback(() => {
        setCurrentView('yahtzee');
    }, []);

    const handleStartMatching = useCallback(() => {
        setCurrentView('matching');
    }, []);

    const handleStartDotsAndBoxes = useCallback(() => {
        setCurrentView('dotsAndBoxes');
    }, []);

    const handleStartShutTheBox = useCallback(() => {
        setCurrentView('shutTheBox');
    }, []);

    const handleStartWordLadder = useCallback(() => {
        setCurrentView('wordLadder');
    }, []);

    const handleStartBattleship = useCallback(() => {
        setCurrentView('battleship');
    }, []);

    const handleGoHome = useCallback(() => {
        setCurrentView('home');
    }, []);

    const renderView = () => {
        switch (currentView) {
            case 'yahtzee':
                return <YahtzeeGame onGoHome={handleGoHome} />;
            case 'matching':
                return <MatchingGame onGoHome={handleGoHome} />;
            case 'dotsAndBoxes':
                return <DotsAndBoxesGame onGoHome={handleGoHome} />;
            case 'shutTheBox':
                return <ShutTheBoxGame onGoHome={handleGoHome} />;
            case 'wordLadder':
                return <WordLadderGame onGoHome={handleGoHome} />;
            case 'battleship':
                return <BattleshipGame onGoHome={handleGoHome} />;
            case 'home':
            default:
                return <HomeScreen
                    onStartYahtzee={handleStartYahtzee}
                    onStartMatching={handleStartMatching}
                    onStartDotsAndBoxes={handleStartDotsAndBoxes}
                    onStartShutTheBox={handleStartShutTheBox}
                    onStartWordLadder={handleStartWordLadder}
                    onStartBattleship={handleStartBattleship}
                    onPlayOnline={() => setShowLobby(true)}
                    isOnline={net.isOnline}
                />;
        }
    };

    return (
        <div 
            className="min-h-screen font-sans"
            style={{
                backgroundImage: 'linear-gradient(to bottom right, #f0f9ff, #fdf2f8)',
                backgroundSize: '100% 100vh',
                backgroundAttachment: 'fixed',
            }}
        >
            {net.isOnline && net.players && (
                <OnlineBar
                    roomCode={net.roomCode}
                    p1Name={net.players.p1.name}
                    p2Name={net.players.p2.name}
                    onLeave={net.leave}
                />
            )}
            {renderView()}
            {showLobby && !net.isOnline && <OnlineLobby onClose={() => setShowLobby(false)} />}
            <button
                onClick={toggleMute}
                title={isMuted ? 'Unmute sound' : 'Mute sound'}
                className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center hover:bg-white transition-colors text-gray-600"
            >
                {isMuted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
            </button>
        </div>
    );
};

export default App;