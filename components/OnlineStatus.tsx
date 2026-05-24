import React from 'react';
import { useI18n } from '../hooks/useI18n';
import { AVATAR_IMAGES } from '../constants';

/** Full-screen "waiting for the game to start" placeholder shown online while
 *  a game component has no synced state yet. */
export const OnlineWaiting: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    const { t } = useI18n();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
            <span className="inline-block w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            <p className="text-xl text-slate-600">{t('online.waitingForGame')}</p>
            <button onClick={onGoHome} className="px-4 py-2 bg-white/60 text-slate-700 rounded-lg hover:bg-white/90 transition-colors">
                &larr; {t('button.backToHome')}
            </button>
        </div>
    );
};

/** Small inline banner telling the player whether they may act right now. */
export const TurnBanner: React.FC<{ isMyTurn: boolean; currentName: string }> = ({ isMyTurn, currentName }) => {
    const { t } = useI18n();
    return (
        <div className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${isMyTurn ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`inline-block w-2 h-2 rounded-full ${isMyTurn ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
            {isMyTurn ? t('online.yourTurn') : t('online.theirTurn', { name: currentName })}
        </div>
    );
};

/** Persistent top bar shown across all screens while an online session is live. */
export const OnlineBar: React.FC<{
    roomCode: string | null;
    p1Name: string;
    p2Name: string;
    onLeave: () => void;
}> = ({ roomCode, p1Name, p2Name, onLeave }) => {
    const { t } = useI18n();
    return (
        <div className="w-full bg-cyan-500/90 text-white text-sm flex items-center justify-center gap-3 py-1.5 px-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-semibold">
                <span className="inline-block w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                {t('online.online')}
            </span>
            <span className="inline-flex items-center gap-1">
                <img src={AVATAR_IMAGES['dog']} alt="" className="w-5 h-5 rounded-full" />{p1Name}
                <span className="opacity-70">vs</span>
                <img src={AVATAR_IMAGES['rabbit']} alt="" className="w-5 h-5 rounded-full" />{p2Name}
            </span>
            {roomCode && <span className="font-mono tracking-widest opacity-90">{roomCode}</span>}
            <button onClick={onLeave} className="px-2 py-0.5 bg-white/20 rounded hover:bg-white/30 transition-colors">
                {t('online.leave')}
            </button>
        </div>
    );
};
