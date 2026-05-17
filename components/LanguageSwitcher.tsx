import React from 'react';
import { useI18n } from '../hooks/useI18n';

export const LanguageSwitcher: React.FC = () => {
    const { lang, setLang } = useI18n();

    return (
        <div className="flex items-center bg-white/70 rounded-full p-1">
            <button
                onClick={() => setLang('zh-Hans')}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-300 ${lang === 'zh-Hans' ? 'bg-pink-400 text-white' : 'text-pink-700 hover:bg-pink-100'}`}
            >
                中
            </button>
            <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-300 ${lang === 'en' ? 'bg-pink-400 text-white' : 'text-pink-700 hover:bg-pink-100'}`}
            >
                EN
            </button>
        </div>
    );
};