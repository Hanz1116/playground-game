import React from 'react';
import { useI18n } from '../hooks/useI18n';

interface DieProps {
    value: number;
    isHeld: boolean;
    onToggleHold: () => void;
    isRolling: boolean;
    canHold: boolean;
}

const DieFace: React.FC<{ value: number }> = ({ value }) => {
    const pips = {
        1: ['center'],
        2: ['top-left', 'bottom-right'],
        3: ['top-left', 'center', 'bottom-right'],
        4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
        6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
    }[value] || [];

    const pipPositions: { [key: string]: string } = {
        'top-left': 'top-[20%] left-[20%]',
        'top-right': 'top-[20%] right-[20%]',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'middle-left': 'top-1/2 left-[20%] -translate-y-1/2',
        'middle-right': 'top-1/2 right-[20%] -translate-y-1/2',
        'bottom-left': 'bottom-[20%] left-[20%]',
        'bottom-right': 'bottom-[20%] right-[20%]',
    };

    return (
        <div className="relative w-full h-full">
            {pips.map(pos => (
                 <div key={pos} className={`absolute w-1/4 h-1/4 bg-slate-700 rounded-full ${pipPositions[pos]}`}></div>
            ))}
        </div>
    );
};

export const Die: React.FC<DieProps> = ({ value, isHeld, onToggleHold, isRolling, canHold }) => {
    const { t } = useI18n();
    const dieClasses = `
        w-14 h-14 sm:w-16 sm:h-16 
        rounded-lg shadow-lg 
        flex items-center justify-center 
        transition-all duration-300
        relative
        p-2
        ${isHeld ? 'bg-amber-200 border-2 border-amber-400 transform scale-105' : 'bg-stone-200'}
        ${canHold ? 'cursor-pointer' : 'cursor-default'}
        ${isRolling && !isHeld ? 'animate-spin' : ''}
    `;
    
    const handleClick = () => {
        if(canHold) {
            onToggleHold();
        }
    };
    
    const ariaLabel = t('die.ariaLabel', {
        value: value,
        status: isHeld ? t('die.held') : t('die.notHeld')
    });


    return (
        <div 
            className={dieClasses} 
            onClick={handleClick}
            role="button"
            aria-pressed={isHeld}
            aria-label={ariaLabel}
        >
            <DieFace value={value} />
            {isHeld && (
                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center" aria-hidden="true">
                    <i className="fas fa-lock text-white text-2xl"></i>
                </div>
            )}
        </div>
    );
};