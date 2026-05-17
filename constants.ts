import { Category, AchievementId } from './types';

interface CategoryDetails {
    id: Category;
    nameKey: string;
}

export const CATEGORIES: CategoryDetails[] = [
    { id: 'aces', nameKey: 'categories.aces' },
    { id: 'twos', nameKey: 'categories.twos' },
    { id: 'threes', nameKey: 'categories.threes' },
    { id: 'fours', nameKey: 'categories.fours' },
    { id: 'fives', nameKey: 'categories.fives' },
    { id: 'sixes', nameKey: 'categories.sixes' },
    { id: 'threeOfAKind', nameKey: 'categories.threeOfAKind' },
    { id: 'fourOfAKind', nameKey: 'categories.fourOfAKind' },
    { id: 'fullHouse', nameKey: 'categories.fullHouse' },
    { id: 'smallStraight', nameKey: 'categories.smallStraight' },
    { id: 'largeStraight', nameKey: 'categories.largeStraight' },
    { id: 'yahtzee', nameKey: 'categories.yahtzee' },
    { id: 'chance', nameKey: 'categories.chance' },
];

export const AVATARS = ['dog', 'rabbit'];

export const AVATAR_IMAGES: { [key: string]: string } = {
    'dog': `${import.meta.env.BASE_URL}doggo.png`,
    'rabbit': `${import.meta.env.BASE_URL}bunny.png`,
};


export const EMOTE_MESSAGE_KEYS = [
    'emotes.great',
    'emotes.lucky',
    'emotes.love',
    'emotes.close',
    'emotes.nice',
    'emotes.myTurn',
];

export const ACHIEVEMENTS: { [key in AchievementId]: { nameKey: string; descriptionKey: string; } } = {
    perfectPair: { nameKey: "achievements.perfectPair.name", descriptionKey: "achievements.perfectPair.description" },
    firstYahtzee: { nameKey: "achievements.firstYahtzee.name", descriptionKey: "achievements.firstYahtzee.description" },
    dynamicDuo: { nameKey: "achievements.dynamicDuo.name", descriptionKey: "achievements.dynamicDuo.description" }
};