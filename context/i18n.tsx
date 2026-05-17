import React, { createContext, useState, useCallback, useMemo } from 'react';
import { en } from '../locales/en';
import { zh } from '../locales/zh';

type Language = 'en' | 'zh-Hans';

interface I18nContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string, vars?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations = {
    'en': en,
    'zh-Hans': zh,
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const getInitialLang = (): Language => {
        const savedLang = localStorage.getItem('yahtzeeLang');
        if (savedLang === 'en' || savedLang === 'zh-Hans') {
            return savedLang;
        }
        return 'zh-Hans';
    };

    const [lang, setLangState] = useState<Language>(getInitialLang);

    const setLang = useCallback((newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('yahtzeeLang', newLang);
        document.documentElement.lang = newLang;
    }, []);

    const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
        const langDict = translations[lang];
        let text = key.split('.').reduce((obj, k) => (obj as any)?.[k], langDict) || key;
        
        if (vars) {
            Object.entries(vars).forEach(([varKey, value]) => {
                text = text.replace(`{${varKey}}`, String(value));
            });
        }

        return text;
    }, [lang]);

    const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
};
