import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { PlayerSetupModal } from './PlayerSetupModal';
import { GameOverModal, DisplayPlayer } from './GameOverModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GameRulesModal } from './GameRulesModal';
import { WordLadderGameState, WordLadderPlayer, GameStatus } from '../types';
// Fix: Corrected typo from useI1n to useI18n.
import { useI18n } from '../hooks/useI18n';
import { AVATAR_IMAGES } from '../constants';
import { FOUR_LETTER_WORDS } from '../utils/wordlist';

const WORD_PAIRS = [
    { start: "COLD", end: "WARM" },
    { start: "HEAD", end: "TAIL" },
    { start: "SAME", end: "COST" },
    { start: "WORK", end: "PLAY" },
    { start: "FISH", end: "BIRD" },
];

const getInitialPlayer = (id: 1 | 2, name: string, avatar: string): WordLadderPlayer => ({
    id,
    name,
    avatar,
});

const getLetterDifference = (word1: string, word2: string): number => {
    let diff = 0;
    for (let i = 0; i < word1.length; i++) {
        if (word1[i] !== word2[i]) {
            diff++;
        }
    }
    return diff;
};

interface WordLadderGameProps {
    onGoHome: () => void;
}

export const WordLadderGame: React.FC<WordLadderGameProps> = ({ onGoHome }) => {
    const [gameState, setGameState] = useState<WordLadderGameState | null>(null);
    const [guess, setGuess] = useState('');
    const [unrecognizedWord, setUnrecognizedWord] = useState<string | null>(null);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const { t } = useI18n();
    const listEndRef = useRef<HTMLDivElement>(null);

    const initializeGame = useCallback((p1Name: string, p1Avatar: string, p2Name: string, p2Avatar: string) => {
        const { start, end } = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
        setGameState({
            players: [getInitialPlayer(1, p1Name, p1Avatar), getInitialPlayer(2, p2Name, p2Avatar)],
            gameStatus: GameStatus.IN_PROGRESS,
            currentPlayerId: 1,
            startWord: start,
            endWord: end,
            wordHistory: [{ word: start, playerId: 1 }],
            errorMessage: null,
            winner: null,
        });
        setGuess('');
        setUnrecognizedWord(null);
    }, []);

    useEffect(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState?.wordHistory]);

    const handleNewGame = () => {
        setGameState(null);
        setUnrecognizedWord(null);
    };

    const processWordSubmission = (wordToSubmit: string) => {
        if (!gameState) return;

        setGameState(prev => prev ? { ...prev, errorMessage: null } : null);
        setUnrecognizedWord(null);

        const lastWord = gameState.wordHistory[gameState.wordHistory.length - 1].word;

        if (wordToSubmit.length !== 4) {
            setGameState(prev => prev ? { ...prev, errorMessage: t('wordLadderGame.error.length') } : null);
            return;
        }
        if (wordToSubmit === lastWord) {
             setGameState(prev => prev ? { ...prev, errorMessage: t('wordLadderGame.error.sameAsLast') } : null);
            return;
        }
        if (getLetterDifference(lastWord, wordToSubmit) !== 1) {
            setGameState(prev => prev ? { ...prev, errorMessage: t('wordLadderGame.error.oneLetter') } : null);
            return;
        }
        if (!FOUR_LETTER_WORDS.has(wordToSubmit)) {
            setUnrecognizedWord(wordToSubmit);
            return;
        }

        const newHistory = [...gameState.wordHistory, { word: wordToSubmit, playerId: gameState.currentPlayerId }];

        if (wordToSubmit === gameState.endWord) {
            setGameState(prev => prev ? { 
                ...prev, 
                wordHistory: newHistory,
                errorMessage: null,
                gameStatus: GameStatus.GAME_OVER,
                winner: prev.players.find(p => p.id === prev.currentPlayerId)!,
            } : null);
        } else {
            setGameState(prev => prev ? {
                ...prev,
                wordHistory: newHistory,
                currentPlayerId: prev.currentPlayerId === 1 ? 2 : 1,
                errorMessage: null,
            } : null);
        }
        setGuess('');
    };

    const handleSubmitWord = (e: React.FormEvent) => {
        e.preventDefault();
        processWordSubmission(guess.toUpperCase());
    };

    const handleSuggestWord = () => {
        if (unrecognizedWord) {
            FOUR_LETTER_WORDS.add(unrecognizedWord);
            const wordToRetry = unrecognizedWord;
            processWordSubmission(wordToRetry);
        }
    };
    
    const p1Color = 'amber';
    const p2Color = 'pink';
    
    if (!gameState) return <PlayerSetupModal onStart={initializeGame} onGoHome={onGoHome} />;
    
    const { players, currentPlayerId, startWord, endWord, wordHistory, errorMessage, winner, gameStatus } = gameState;
    const currentPlayer = players.find(p => p.id === currentPlayerId)!;
    const [p1, p2] = players;

    if (gameStatus === GameStatus.GAME_OVER && winner) {
        const displayPlayers: [DisplayPlayer, DisplayPlayer] = [
            { ...players[0], score: winner.id === 1 ? 1 : 0 },
            { ...players[1], score: winner.id === 2 ? 1 : 0 }
        ];
        // A simple score to show who won.
        const displayWinner = { ...winner, score: 1 };
        return <GameOverModal winner={displayWinner} players={displayPlayers} onNewGame={handleNewGame} onGoHome={onGoHome} />;
    }

    return (
        <div className="flex flex-col items-center p-2 sm:p-4 min-h-screen">
            {isRulesModalOpen && (
                <GameRulesModal
                    title={t('rules.wordLadder.title')}
                    onClose={() => setIsRulesModalOpen(false)}
                >
                     <div className="space-y-3">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.objectiveTitle')}</h4>
                            <p>{t('rules.wordLadder.objective')}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.gameplayTitle')}</h4>
                            <ul className="list-disc list-inside space-y-1">
                                <li>{t('rules.wordLadder.gameplay_1')}</li>
                                <li>{t('rules.wordLadder.gameplay_2')}</li>
                                <li>{t('rules.wordLadder.gameplay_3')}</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{t('rules.common.winningTitle')}</h4>
                            <p>{t('rules.wordLadder.winning')}</p>
                        </div>
                    </div>
                </GameRulesModal>
            )}
            <header className="w-full max-w-7xl mb-4 text-center relative">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-wider">{t('games.wordLadder.title')}</h1>
                <div className="text-lg text-slate-500 mt-1">{t('game.playersTurn', { name: currentPlayer.name })}</div>
                <div className="absolute top-0 left-2 flex items-center gap-2">
                    <button onClick={onGoHome} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors">&larr; {t('button.backToHome')}</button>
                    <button onClick={handleNewGame} className="px-3 py-2 bg-slate-500/80 text-white rounded-lg hover:bg-slate-500 transition-colors">{t('button.newGame')}</button>
                     <button onClick={() => setIsRulesModalOpen(true)} className="px-3 py-2 bg-white/50 text-slate-700 rounded-lg hover:bg-white/80 transition-colors" title={t('button.gameRules')}>
                        <i className="fas fa-question-circle"></i>
                    </button>
                </div>
                <div className="absolute top-0 right-2"><LanguageSwitcher /></div>
            </header>

            <main className="flex-grow w-full max-w-7xl flex flex-col md:flex-row items-start justify-around gap-4">
                {/* Player 1 Info */}
                <div className={`p-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-lg text-center transition-all duration-300 w-48 ${currentPlayerId === 1 ? `border-2 border-${p1Color}-400` : 'border-2 border-transparent'}`}>
                    <img src={AVATAR_IMAGES[p1.avatar]} alt={p1.name} className="w-28 h-28 mx-auto rounded-full" />
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">{p1.name}</h2>
                </div>
                
                {/* Game Board */}
                <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg flex flex-col items-center gap-3 self-center w-full max-w-md">
                    <div className="flex justify-between w-full text-center">
                        <div>
                            <p className="text-slate-600">{t('wordLadderGame.startWord')}</p>
                            <p className="text-3xl font-bold tracking-widest text-slate-800">{startWord}</p>
                        </div>
                        <div className="self-center text-2xl text-slate-500">&rarr;</div>
                        <div>
                            <p className="text-slate-600">{t('wordLadderGame.endWord')}</p>
                            <p className="text-3xl font-bold tracking-widest text-cyan-500">{endWord}</p>
                        </div>
                    </div>
                    
                    <div className="w-full h-64 bg-gray-100/50 rounded-lg p-2 overflow-y-auto border">
                        {wordHistory.map((item, index) => (
                             <div key={index} className={`flex items-center gap-2 my-1 ${item.playerId === 1 ? 'justify-start' : 'justify-end'}`}>
                                {item.playerId === 1 && <img src={AVATAR_IMAGES[p1.avatar]} className="w-8 h-8 rounded-full" />}
                                <div className={`px-3 py-1 rounded-lg ${item.playerId === 1 ? `bg-${p1Color}-200` : `bg-${p2Color}-200`}`}>
                                    <p className="font-mono tracking-widest text-lg text-slate-800">{item.word}</p>
                                </div>
                                {item.playerId === 2 && <img src={AVATAR_IMAGES[p2.avatar]} className="w-8 h-8 rounded-full" />}
                            </div>
                        ))}
                        <div ref={listEndRef} />
                    </div>
                    
                    <form onSubmit={handleSubmitWord} className="w-full flex flex-col items-center gap-2">
                        <input 
                            type="text"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            maxLength={4}
                            placeholder={t('wordLadderGame.enterWord')}
                            className="w-full p-3 text-center font-mono tracking-widest text-2xl border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            aria-label={t('wordLadderGame.enterWord')}
                        />
                        <div className="h-10 flex flex-col justify-center items-center">
                            {errorMessage && <p className="text-slate-700 text-sm font-semibold">{errorMessage}</p>}
                            {unrecognizedWord && (
                                <div className="text-center text-sm">
                                    <p className="text-slate-700">{t('wordLadderGame.error.notInDictSuggest', { word: unrecognizedWord })}</p>
                                    <button 
                                        type="button" 
                                        onClick={handleSuggestWord}
                                        className="text-cyan-600 hover:text-cyan-800 font-semibold underline"
                                    >
                                        {t('wordLadderGame.suggestWord')}
                                    </button>
                                </div>
                            )}
                        </div>
                        <button type="submit" className={`w-full px-6 py-3 bg-${currentPlayerId === 1 ? p1Color : p2Color}-500 text-slate-900 font-bold text-lg rounded-lg shadow-md hover:bg-${currentPlayerId === 1 ? p1Color : p2Color}-400`}>
                            {t('wordLadderGame.submit')}
                        </button>
                    </form>
                </div>
                
                {/* Player 2 Info */}
                 <div className={`p-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-lg text-center transition-all duration-300 w-48 ${currentPlayerId === 2 ? `border-2 border-${p2Color}-400` : 'border-2 border-transparent'}`}>
                    <img src={AVATAR_IMAGES[p2.avatar]} alt={p2.name} className="w-28 h-28 mx-auto rounded-full" />
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">{p2.name}</h2>
                </div>
            </main>
        </div>
    );
};