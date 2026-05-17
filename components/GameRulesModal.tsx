import React from 'react';
import { useI18n } from '../hooks/useI18n';

interface GameRulesModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div 
                className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-2xl border border-gray-200 relative max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-4 flex-shrink-0">{title}</h2>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 text-3xl leading-none"
                    aria-label="Close"
                >
                    &times;
                </button>
                <div className="overflow-y-auto space-y-4 text-slate-700 pr-2">
                    {children}
                </div>
            </div>
        </div>
    );
};
