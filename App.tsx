import React, { useState, useCallback } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { YahtzeeGame } from './components/YahtzeeGame';
import { MatchingGame } from './components/MatchingGame';
import { DotsAndBoxesGame } from './components/DotsAndBoxesGame';
import { ShutTheBoxGame } from './components/ShutTheBoxGame';
import { WordLadderGame } from './components/WordLadderGame';

export type View = 'home' | 'yahtzee' | 'matching' | 'dotsAndBoxes' | 'shutTheBox' | 'wordLadder';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('home');

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
            case 'home':
            default:
                return <HomeScreen 
                    onStartYahtzee={handleStartYahtzee} 
                    onStartMatching={handleStartMatching} 
                    onStartDotsAndBoxes={handleStartDotsAndBoxes} 
                    onStartShutTheBox={handleStartShutTheBox}
                    onStartWordLadder={handleStartWordLadder}
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
            {renderView()}
        </div>
    );
};

export default App;