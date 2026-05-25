import React, { useEffect } from 'react';
import { AvatarState } from '../types';
import { AVATAR_IMAGES } from '../constants';
import { useI18n } from '../hooks/useI18n';
import { playSfx } from '../hooks/soundEffects';

export interface DisplayPlayer {
    id: 1 | 2;
    name: string;
    avatar: string;
    score: number;
}


const PlayerAvatar: React.FC<{ avatar: string; state: AvatarState; isWinner?: boolean; isLoser?: boolean }> = ({ avatar, state, isWinner, isLoser }) => {
    const animationStyle: React.CSSProperties = {
        animationName: isWinner ? 'celebrate' : (isLoser ? 'idle-breath' : 'idle-breath'),
        animationDuration: isWinner ? '1.5s' : '2s',
        animationIterationCount: 'infinite'
    };

    return (
        <div className="relative">
            <div style={animationStyle}>
                <img src={AVATAR_IMAGES[avatar]} alt="Player Avatar" className="w-24 h-24" />
            </div>
            {isWinner && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl">👑</div>}
            {isLoser && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl animate-pulse">👏</div>}
        </div>
    );
};


interface GameOverModalProps {
    winner: DisplayPlayer;
    players: [DisplayPlayer, DisplayPlayer];
    onNewGame: () => void;
    onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ winner, players, onNewGame, onGoHome }) => {
    const { t } = useI18n();
    const isTie = winner.name === t('gameOver.tie');

    // Celebrate once when the results appear.
    useEffect(() => {
        playSfx('win');
    }, []);

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200">
                <h2 className="text-3xl font-bold text-cyan-500 mb-2">{t('gameOver.title')}</h2>
                
                {isTie ? (
                     <div className="text-2xl font-bold text-amber-500 my-4">{t('gameOver.tie')}</div>
                ) : (
                    <>
                    <div className="w-24 h-24 mx-auto my-4 flex items-center justify-center">
                       <PlayerAvatar avatar={winner.avatar} state="celebrate" isWinner={true} />
                    </div>
                    <p className="text-xl text-gray-700 mb-4">
                        <span className="font-bold text-cyan-600">{winner.name}</span> {t('gameOver.wins')}
                    </p>
                    </>
                )}
                
                <div className="text-left space-y-2 my-6">
                    {players.map(p => (
                         <div key={p.id} className={`flex justify-between items-center bg-gray-100 p-3 rounded-lg border-2 ${winner.id === p.id && !isTie ? 'border-cyan-500' : 'border-transparent'}`}>
                            <div className="flex items-center gap-3">
                                <img src={AVATAR_IMAGES[p.avatar]} alt={p.name} className="w-12 h-12 rounded-full" />
                                <span className="font-semibold text-lg text-gray-800">{p.name}</span>
                            </div>
                            <span className="font-bold text-xl text-cyan-500">{p.score}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-4 space-y-2">
                    <button
                        onClick={onNewGame}
                        className="w-full px-6 py-3 bg-cyan-500 text-slate-900 font-bold text-lg rounded-lg shadow-md hover:bg-cyan-400 transition-colors duration-300"
                    >
                        {t('button.playAgain')}
                    </button>
                    <button
                        onClick={onGoHome}
                        className="w-full px-6 py-2 bg-gray-200 text-slate-700 font-semibold text-md rounded-lg hover:bg-gray-300 transition-colors duration-300"
                    >
                        {t('button.backToHome')}
                    </button>
                </div>
            </div>
        </div>
    );
};