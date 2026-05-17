
import { Category } from '../types';

export const calculatePotentialScores = (dice: number[]): { [key in Category]?: number } => {
    const counts: { [key: number]: number } = {};
    let sum = 0;
    for (const die of dice) {
        counts[die] = (counts[die] || 0) + 1;
        sum += die;
    }

    const scores: { [key in Category]?: number } = {};

    // Upper Section
    scores.aces = (counts[1] || 0) * 1;
    scores.twos = (counts[2] || 0) * 2;
    scores.threes = (counts[3] || 0) * 3;
    scores.fours = (counts[4] || 0) * 4;
    scores.fives = (counts[5] || 0) * 5;
    scores.sixes = (counts[6] || 0) * 6;

    // Lower Section
    const countsValues = Object.values(counts);
    scores.threeOfAKind = countsValues.some(c => c >= 3) ? sum : 0;
    scores.fourOfAKind = countsValues.some(c => c >= 4) ? sum : 0;
    scores.fullHouse = countsValues.includes(3) && countsValues.includes(2) ? 25 : 0;
    scores.yahtzee = countsValues.includes(5) ? 50 : 0;
    scores.chance = sum;

    // Straights
    const uniqueDice = Array.from(new Set(dice)).sort();
    const uniqueStr = uniqueDice.join('');
    if (/1234|2345|3456/.test(uniqueStr)) {
        scores.smallStraight = 30;
    } else {
        scores.smallStraight = 0;
    }

    if (/12345|23456/.test(uniqueStr)) {
        scores.largeStraight = 40;
    } else {
        scores.largeStraight = 0;
    }

    return scores;
};
