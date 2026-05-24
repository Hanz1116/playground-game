import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useNetwork } from '../context/NetworkContext';
import { AVATAR_IMAGES } from '../constants';

interface OnlineLobbyProps {
    onClose: () => void;
}

type Mode = 'choose' | 'host' | 'join';

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({ onClose }) => {
    const { t } = useI18n();
    const { status, roomCode, error, createRoom, joinRoom, leave } = useNetwork();
    const [mode, setMode] = useState<Mode>('choose');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    const handleHost = () => {
        setMode('host');
        createRoom(name);
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setMode('join');
        joinRoom(code, name);
    };

    const handleBack = () => {
        leave();
        setMode('choose');
    };

    const errorText = error ? (t(`online.errors.${error}`) || t('online.errors.peerError')) : null;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-md border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-1">{t('online.title')}</h2>
                <p className="text-center text-slate-500 mb-6 text-sm">{t('online.subtitle')}</p>

                <div className="mb-4">
                    <label htmlFor="onlineName" className="block text-sm font-medium text-gray-600 mb-1">{t('online.yourName')}</label>
                    <input
                        id="onlineName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={mode !== 'choose'}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-gray-100"
                    />
                </div>

                {mode === 'choose' && (
                    <div className="space-y-3">
                        <button
                            onClick={handleHost}
                            className="w-full px-6 py-3 bg-amber-400 text-slate-900 font-bold rounded-lg shadow-md hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <img src={AVATAR_IMAGES['dog']} alt="" className="w-7 h-7 rounded-full" />
                            {t('online.create')}
                        </button>
                        <form onSubmit={handleJoin} className="space-y-2">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder={t('online.enterCode')}
                                maxLength={5}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-center font-mono tracking-[0.4em] text-2xl uppercase text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!code.trim()}
                                className="w-full px-6 py-3 bg-pink-400 text-slate-900 font-bold rounded-lg shadow-md hover:bg-pink-300 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400"
                            >
                                <img src={AVATAR_IMAGES['rabbit']} alt="" className="w-7 h-7 rounded-full" />
                                {t('online.join')}
                            </button>
                        </form>
                        <button onClick={onClose} className="w-full px-6 py-2 mt-2 bg-gray-200 text-slate-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                            {t('button.backToHome')}
                        </button>
                    </div>
                )}

                {mode === 'host' && (
                    <div className="text-center space-y-4">
                        {roomCode ? (
                            <>
                                <p className="text-slate-600">{t('online.shareCode')}</p>
                                <div className="text-5xl font-mono font-bold tracking-[0.3em] text-cyan-600 bg-cyan-50 rounded-lg py-4 select-all">
                                    {roomCode}
                                </div>
                                <p className="text-slate-500 flex items-center justify-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                    {t('online.waitingForPlayer')}
                                </p>
                            </>
                        ) : (
                            <p className="text-slate-500">{t('online.creating')}</p>
                        )}
                        {errorText && <p className="text-red-500 text-sm">{errorText}</p>}
                        <button onClick={handleBack} className="w-full px-6 py-2 bg-gray-200 text-slate-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                            {t('online.cancel')}
                        </button>
                    </div>
                )}

                {mode === 'join' && (
                    <div className="text-center space-y-4">
                        <p className="text-slate-500 flex items-center justify-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                            {status === 'error' ? '' : t('online.connecting')}
                        </p>
                        {errorText && <p className="text-red-500 text-sm">{errorText}</p>}
                        <button onClick={handleBack} className="w-full px-6 py-2 bg-gray-200 text-slate-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                            {t('online.back')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
