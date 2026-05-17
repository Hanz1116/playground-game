import React, { useState } from 'react';
import { AVATARS, AVATAR_IMAGES } from '../constants';
import { useI18n } from '../hooks/useI18n';

interface PlayerSetupModalProps {
    onStart: (player1Name: string, player1Avatar: string, player2Name: string, player2Avatar: string) => void;
    onGoHome: () => void;
}

export const PlayerSetupModal: React.FC<PlayerSetupModalProps> = ({ onStart, onGoHome }) => {
    const { t } = useI18n();
    const [p1Name, setP1Name] = useState('老狗');
    const [p2Name, setP2Name] = useState('老婆');
    const p1Avatar = AVATARS[0];
    const p2Avatar = AVATARS[1];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onStart(p1Name, p1Avatar, p2Name, p2Avatar);
    };

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-2xl border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">{t('setup.title')}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Player 1 Setup */}
                        <div className="space-y-4 p-4 bg-gray-100 rounded-lg border-2 border-amber-400">
                            <h3 className="text-xl font-semibold text-amber-500">{t('setup.player1')}</h3>
                            <div>
                                <label htmlFor="p1Name" className="block text-sm font-medium text-gray-600 mb-1">{t('setup.name')}</label>
                                <input
                                    type="text"
                                    id="p1Name"
                                    value={p1Name}
                                    onChange={(e) => setP1Name(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">{t('setup.avatar')}</label>
                                <div className="flex justify-center p-2 bg-gray-200 rounded-lg">
                                    <img
                                        src={AVATAR_IMAGES[AVATARS[0]]}
                                        alt="Captain Doggo"
                                        className={`w-24 h-24 rounded-full ring-4 ring-amber-500`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Player 2 Setup */}
                         <div className="space-y-4 p-4 bg-gray-100 rounded-lg border-2 border-pink-400">
                            <h3 className="text-xl font-semibold text-pink-500">{t('setup.player2')}</h3>
                            <div>
                                <label htmlFor="p2Name" className="block text-sm font-medium text-gray-600 mb-1">{t('setup.name')}</label>
                                <input
                                    type="text"
                                    id="p2Name"
                                    value={p2Name}
                                    onChange={(e) => setP2Name(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">{t('setup.avatar')}</label>
                                <div className="flex justify-center p-2 bg-gray-200 rounded-lg">
                                    <img
                                        src={AVATAR_IMAGES[AVATARS[1]]}
                                        alt="Duchess Bunny"
                                        className={`w-24 h-24 rounded-full ring-4 ring-pink-500`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 space-y-2">
                        <button type="submit" className="w-full px-6 py-3 bg-cyan-500 text-slate-900 font-bold text-lg rounded-lg shadow-md hover:bg-cyan-400 transition-colors duration-300">
                            {t('button.startGame')}
                        </button>
                         <button 
                            type="button" 
                            onClick={onGoHome}
                            className="w-full px-6 py-2 bg-gray-200 text-slate-700 font-semibold text-md rounded-lg hover:bg-gray-300 transition-colors duration-300"
                        >
                            {t('button.backToHome')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};