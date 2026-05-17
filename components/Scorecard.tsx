import React from 'react';
import { Player, Category, Scores, AvatarState } from '../types';
import { CATEGORIES, AVATAR_IMAGES } from '../constants';
import { useI18n } from '../hooks/useI18n';

const PlayerAvatar: React.FC<{ avatar: string; state: AvatarState; isWinner?: boolean; }> = ({ avatar, state, isWinner }) => {
    const animationStyle: React.CSSProperties = {
        // Fix: Changed comparison from 'sad-droop' to 'sad' to match the AvatarState type.
        animationDuration: state === 'thinking' || state === 'sad' ? '1s' : '0.7s',
        animationIterationCount: state === 'idle' || state === 'thinking' ? 'infinite' : 1,
        animationName: state === 'celebrate' ? 'celebrate' : (state === 'happy' ? 'happy-bounce' : (state === 'thinking' ? 'thinking' : (state === 'sad' ? 'sad-droop' : 'idle-breath')))
    };

    return (
        <div className="relative">
            <div style={animationStyle}>
                <img src={AVATAR_IMAGES[avatar]} alt="Player Avatar" className="w-20 h-20" />
            </div>
            {isWinner && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">👑</div>}
        </div>
    );
};


interface ScorecardProps {
    player: Player;
    potentialScores: { [key in Category]?: number };
    onScore: (category: Category) => void;
    isMyTurn: boolean;
    calculateTotalScore: (scores: Scores) => number;
    avatarState: AvatarState;
    emote: { message: string } | null;
    themeColor: string;
}

const ScoreRow: React.FC<{
    cat: { id: Category; nameKey: string };
    score: number | null;
    potentialScore?: number;
    onScore: () => void;
    isMyTurn: boolean;
    themeColor: string;
}> = ({ cat, score, potentialScore, onScore, isMyTurn, themeColor }) => {
    const { t } = useI18n();
    const isScored = score !== null;
    const canScore = isMyTurn && !isScored;

    const handleClick = () => {
        if (canScore) {
            onScore();
        }
    };

    let scoreDisplay: React.ReactNode = '';
    let textColor = 'text-gray-500';

    if (isScored) {
        scoreDisplay = score;
        textColor = score === 0 ? 'text-gray-400' : `text-${themeColor}-600 font-bold`;
    } else if (canScore && potentialScore !== undefined && potentialScore > 0) {
        scoreDisplay = <span className={`text-${themeColor}-500 opacity-75`}>{potentialScore}</span>;
    } else if (canScore && potentialScore !== undefined) {
         scoreDisplay = <span className="text-gray-400 opacity-75">0</span>;
    }

    return (
        <tr className={`border-b border-gray-200 transition-colors ${canScore ? 'cursor-pointer hover:bg-gray-100' : ''} ${isScored ? `bg-${themeColor}-100` : ''}`} onClick={handleClick}>
            <td className="p-2 text-sm sm:text-base text-slate-600">{t(cat.nameKey)}</td>
            <td className={`p-2 w-16 text-center text-sm sm:text-base font-mono ${textColor}`}>{scoreDisplay}</td>
        </tr>
    );
};

export const Scorecard: React.FC<ScorecardProps> = ({ player, potentialScores, onScore, isMyTurn, calculateTotalScore, avatarState, emote, themeColor }) => {
    const { t } = useI18n();
    const upperSectionIds: Category[] = ['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    const lowerSectionIds: Category[] = ['threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'];

    const upperSubtotal = upperSectionIds.reduce((sum, id) => sum + (player.scores[id] || 0), 0);
    const upperBonus = upperSubtotal >= 63 ? 35 : 0;
    
    const grandTotal = calculateTotalScore(player.scores);

    return (
        <div className="bg-white rounded-lg w-full relative">
             {emote && (
                <div className={`absolute -top-10 ${player.id === 1 ? 'left-20' : 'right-20'} z-10 bg-slate-700 text-white text-sm px-3 py-2 rounded-lg shadow-lg`}>
                    {emote.message}
                    <div className={`absolute bottom-[-8px] ${player.id === 1 ? 'left-4' : 'right-4'} w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-700`}/>
                </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-t-lg">
                <PlayerAvatar avatar={player.avatar} state={avatarState} />
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{player.name}</h3>
                    <p className="text-sm text-slate-500 -mb-1">{t('scorecard.totalScore')}</p>
                    <p className={`text-3xl font-black text-${themeColor}-500`}>{grandTotal}</p>
                </div>
            </div>
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b-2 border-gray-200">
                        <th className={`p-2 text-base sm:text-lg font-semibold text-${themeColor}-500`}>{t('scorecard.upperSection')}</th>
                        <th className={`p-2 w-16 text-center text-base sm:text-lg font-semibold text-${themeColor}-500`}>{t('scorecard.score')}</th>
                    </tr>
                </thead>
                <tbody>
                    {CATEGORIES.filter(c => upperSectionIds.includes(c.id)).map(cat => (
                        <ScoreRow 
                            key={cat.id} 
                            cat={cat} 
                            score={player.scores[cat.id]} 
                            potentialScore={potentialScores[cat.id]}
                            onScore={() => onScore(cat.id)}
                            isMyTurn={isMyTurn}
                            themeColor={themeColor}
                        />
                    ))}
                    <tr className="font-semibold bg-gray-50">
                        <td className="p-2 text-slate-600">{t('scorecard.subtotal')}</td>
                        <td className="p-2 text-center text-slate-600">{upperSubtotal} / 63</td>
                    </tr>
                    <tr className="font-semibold bg-gray-50">
                        <td className="p-2 text-slate-600">{t('scorecard.bonus')}</td>
                        <td className={`p-2 text-center text-${themeColor}-500`}>{upperBonus}</td>
                    </tr>
                </tbody>
                 <thead>
                    <tr className="border-b-2 border-t-4 border-gray-200">
                        <th className={`p-2 text-base sm:text-lg font-semibold text-${themeColor}-500`}>{t('scorecard.lowerSection')}</th>
                        <th className="p-2 w-16 text-center"></th>
                    </tr>
                </thead>
                <tbody>
                    {CATEGORIES.filter(c => lowerSectionIds.includes(c.id)).map(cat => (
                        <ScoreRow 
                            key={cat.id} 
                            cat={cat} 
                            score={player.scores[cat.id]} 
                            potentialScore={potentialScores[cat.id]}
                            onScore={() => onScore(cat.id)}
                            isMyTurn={isMyTurn}
                            themeColor={themeColor}
                        />
                    ))}
                     <tr className="font-semibold bg-gray-50">
                        <td className="p-2 text-slate-600">{t('scorecard.yahtzeeBonus')}</td>
                        <td className={`p-2 text-center text-${themeColor}-500`}>{player.scores.yahtzeeBonus}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};