import React from 'react';
import { useI18n } from '../hooks/useI18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AVATAR_IMAGES } from '../constants';

interface HomeScreenProps {
    onStartYahtzee: () => void;
    onStartMatching: () => void;
    onStartDotsAndBoxes: () => void;
    onStartShutTheBox: () => void;
    onStartWordLadder: () => void;
    onStartBattleship: () => void;
    onPlayOnline: () => void;
    isOnline: boolean;
}

const GameCard: React.FC<{
    title: string;
    description: string;
    onClick?: () => void;
    emoji: string;
    comingSoon?: boolean;
}> = ({ title, description, onClick, emoji, comingSoon }) => {
    const cardClasses = `
        bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 text-center 
        flex flex-col items-center
        border-2 border-transparent
        transition-all duration-300
        ${comingSoon ? 'opacity-60 cursor-default' : 'cursor-pointer hover:shadow-2xl hover:border-cyan-400 hover:-translate-y-2'}
    `;

    return (
        <div className={cardClasses} onClick={!comingSoon ? onClick : undefined}>
            <div className="text-6xl mb-4">{emoji}</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-600">{description}</p>
        </div>
    );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartYahtzee, onStartMatching, onStartDotsAndBoxes, onStartShutTheBox, onStartWordLadder, onStartBattleship, onPlayOnline, isOnline }) => {
    const { t } = useI18n();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <header className="text-center mb-12">
                <div className="flex justify-center items-center gap-8">
                    <img src={AVATAR_IMAGES['dog']} alt="Doggo" className="w-32 h-32" style={{ animation: 'float 3s ease-in-out infinite' }} />
                    <img src={AVATAR_IMAGES['rabbit']} alt="Bunny" className="w-32 h-32" style={{ animation: 'float 3s ease-in-out infinite', animationDelay: '0.5s' }}/>
                </div>
                <h1 className="text-5xl font-extrabold text-slate-800 mt-4 tracking-wide">
                    {t('appName')}
                </h1>
                <p className="text-xl text-slate-600 mt-2">{t('home.selectGame')}</p>
                {!isOnline && (
                    <button
                        onClick={onPlayOnline}
                        className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white font-bold rounded-full shadow-md hover:bg-cyan-400 transition-colors"
                    >
                        <i className="fas fa-wifi"></i>
                        {t('online.playOnline')}
                    </button>
                )}
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
                <GameCard 
                    title={t('games.yahtzee.title')}
                    description={t('games.yahtzee.description')}
                    onClick={onStartYahtzee}
                    emoji="🎲"
                />
                <GameCard 
                    title={t('games.matchingPair.title')}
                    description={t('games.matchingPair.description')}
                    onClick={onStartMatching}
                    emoji="🃏"
                />
                <GameCard 
                    title={t('games.dotsAndBoxes.title')}
                    description={t('games.dotsAndBoxes.description')}
                    onClick={onStartDotsAndBoxes}
                    emoji="✒️"
                />
                 <GameCard 
                    title={t('games.shutTheBox.title')}
                    description={t('games.shutTheBox.description')}
                    onClick={onStartShutTheBox}
                    emoji="📦"
                />
                <GameCard
                    title={t('games.wordLadder.title')}
                    description={t('games.wordLadder.description')}
                    onClick={onStartWordLadder}
                    emoji="🪜"
                />
                <GameCard
                    title={t('games.battleship.title')}
                    description={t('games.battleship.description')}
                    onClick={onStartBattleship}
                    emoji="🚢"
                />
            </main>
        </div>
    );
};