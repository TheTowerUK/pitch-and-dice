![Expo](https://img.shields.io/badge/Expo-SDK%2054-blue)
![Platform](https://img.shields.io/badge/iOS-Android-green)
![Status](https://img.shields.io/badge/Status-In%20Development-orange)

# 🏏 Pitch & Dice

Strategic cricket dice game for iOS & Android
Built with React Native + Expo

Every ball is a decision. Every dice roll is fate.

---

## 🎮 What is Pitch & Dice?

Pitch & Dice is a strategy-first cricket simulation where:

- You choose shot type, aggression, bowling variation, and field
- Dice determine outcomes — but your decisions shape the probabilities
- Momentum, pressure, and match context evolve every ball

This is not random dice cricket — it's a tactical engine disguised as a game

---

## ⚡ Key Features

- 🎲 Multi-dice system (D4–D12) tied to player decisions
- 🧠 Momentum engine (-10 → +10) affecting outcomes
- 🏏 Multiple formats: T20 / ODI / Test
- 🤖 AI opponent (batting, bowling, field logic)
- 📊 Match persistence + history (AsyncStorage)
- 🎯 Field placement system (zone-based)
- 🎧 Audio engine (crowd, commentary, SFX)
- 🎭 Special events system (D20 triggers)

---

## 🧠 Core Idea

**Decision → Dice Pool → Roll → Modify → Resolve → Momentum Update**

Strategy shapes probability — not the other way around

---

## 🚀 Getting Started

```bash
npm install
npx expo start
```

---

## 📚 Documentation (Read in Order)

| # | File | Purpose |
|---|------|---------|
| 1 | `Cricket_Dice_Game_RPD.md` | Design intent (vision, feel, philosophy) |
| 2 | `CONTEXT_BRIEF.md` | What's built (systems, phases, architecture) |
| 3 | `PitchandDice.md` | Engineering guide (code map, rules, pitfalls) |
| 4 | `README.md` | You are here |

If RPD conflicts with implementation, **code + CONTEXT_BRIEF win**

**ODI format scope:** see [`ODI_SCOPE.md`](./ODI_SCOPE.md) for product intent (match length and atmosphere vs full real-world ODI rules, and post-release tuning).

---

## 🏗️ Architecture

| Layer | Location |
|-------|----------|
| Game logic | `src/engine/` |
| State | `useGameState.js` |
| UI | `src/components/` + `src/screens/` |
| Persistence | AsyncStorage via `storageEngine` |

No business logic in UI components.

---

## 🧪 Status

- ✅ Phases 1–4 complete (core gameplay + AI + teams)
- 🚧 Phase 5 in progress (polish, audio, store readiness)

---

## 📄 Licence

[MIT](LICENSE) — Copyright (c) 2026 TheTowerUK