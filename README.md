# 老狗 & 老婆的游乐园 / Playground Game

A two-player, pass-and-play playground featuring a small collection of classic games. Built with React, TypeScript, Tailwind CSS, and Vite.

## Games

- **Yahtzee** — full scoring logic, three rolls per turn, hold/re-roll dice
- **Dots and Boxes** — claim boxes by completing the fourth side
- **Shut the Box** — roll dice and shut tiles that sum to the roll
- **Word Ladder** — change one letter at a time to reach the target word
- **Matching** — flip cards to find pairs

## Features

- **Online play across two devices** — pass-and-play *or* connect two phones/laptops with a room code (see below)
- Bilingual UI (中文 / English) with a language switcher
- Personalized avatars and player setup
- Save / load game state
- Background music with mute toggle
- Responsive layout for desktop and mobile

## Online multiplayer

From the home screen tap **Play Online (2 devices)**. One player **creates a room**
and shares the 5-character code; the other **joins** with it. After connecting,
the host picks a game and both screens stay in sync — it's still turn-based, so
each device can only act on its own turn.

How it works:

- Peer-to-peer over **WebRTC** via [PeerJS](https://peerjs.com) — no game server is
  needed, so it runs as-is on GitHub Pages. PeerJS's public broker is only used for
  the initial handshake; gameplay data flows directly between the two devices.
- The active player's device computes each move and broadcasts the whole game state;
  the other device mirrors it. The host is player 1 (🐶), the guest is player 2 (🐰).
- Works on the same Wi-Fi and, in most cases, across networks too.
- **Battleship** has a dedicated online flow that preserves hidden information:
  both players place their fleets **privately and simultaneously**, and only
  individual shots (`{x,y}`) and their results (`hit` / `sunk`) are exchanged —
  ship positions never leave the device that owns them. Every other game uses
  the shared full-state mirror described above.

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
components/   Game screens and shared UI (incl. OnlineLobby, OnlineStatus)
context/      React context providers (language, NetworkContext for P2P)
hooks/        Custom hooks (incl. useNetworkedGame state-sync wrapper)
locales/      en.ts / zh.ts translation strings
utils/        Game logic helpers
public/       Static assets bundled by Vite
```
