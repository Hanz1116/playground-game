# 老狗 & 老婆的游乐园 / Playground Game

A two-player, pass-and-play playground featuring a small collection of classic games. Built with React, TypeScript, Tailwind CSS, and Vite.

## Games

- **Yahtzee** — full scoring logic, three rolls per turn, hold/re-roll dice
- **Dots and Boxes** — claim boxes by completing the fourth side
- **Shut the Box** — roll dice and shut tiles that sum to the roll
- **Word Ladder** — change one letter at a time to reach the target word
- **Matching** — flip cards to find pairs

## Features

- Bilingual UI (中文 / English) with a language switcher
- Personalized avatars and player setup
- Save / load game state
- Background music with mute toggle
- Responsive layout for desktop and mobile

## Run locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

The dev server starts on http://localhost:3000.

## Build

```bash
npm run build
npm run preview
```

## Deployment

The app is configured for GitHub Pages under the `/playground-game/` base path (see `vite.config.ts`). Build output is emitted to `dist/`.

## Project layout

```
components/   Game screens and shared UI
context/      React context providers (language, etc.)
hooks/        Custom hooks
locales/      en.ts / zh.ts translation strings
utils/        Game logic helpers
public/       Static assets bundled by Vite
```
