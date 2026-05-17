import React from 'react';

interface CardProps {
    card: {
        id: number;
        icon: string;
        isFlipped: boolean;
        isMatched: boolean;
    };
    onClick: (id: number) => void;
    isDisabled: boolean;
}

export const Card: React.FC<CardProps> = ({ card, onClick, isDisabled }) => {
    const { id, icon, isFlipped, isMatched } = card;

    const handleClick = () => {
        if (!isFlipped && !isMatched && !isDisabled) {
            onClick(id);
        }
    };

    const containerClasses = `
        w-20 h-24 sm:w-24 sm:h-28
        card-container
        ${isFlipped || isMatched ? 'flipped' : ''}
        ${isMatched ? 'opacity-50' : ''}
        ${isDisabled || isMatched ? 'cursor-default' : 'cursor-pointer'}
    `;

    return (
        <div className={containerClasses} onClick={handleClick}>
            <div className="card-inner">
                <div className="card-face bg-pink-300 hover:bg-pink-400 transition-colors">
                    <span className="text-4xl text-white">?</span>
                </div>
                <div className="card-face card-back bg-white border-2 border-pink-400">
                    <span className="text-4xl">{icon}</span>
                </div>
            </div>
        </div>
    );
};
