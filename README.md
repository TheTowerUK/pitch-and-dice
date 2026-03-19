# Pitch & Dice 🎲🏏
### React Native + Expo — Phase 1 MVP

---

## Quick Start in Cursor

### 1. Open the project folder in Cursor
```
File → Open Folder → select pitch-and-dice/
```

### 2. Install dependencies
Open the Cursor terminal (Ctrl+` or Cmd+`) and run:
```bash
npm install
```

### 3. Start Expo
```bash
npx expo start
```

### 4. Open on your phone
- Install **Expo Go** from the App Store or Google Play
- Scan the QR code shown in the terminal
- The app loads instantly on your device

---

## Project Structure

```
App.js                  ← Entry point
src/
  constants/theme.js    ← Design system (colours, fonts, spacing)
  engine/
    diceEngine.js       ← Core dice logic (framework-free)
    useGameState.js     ← Game state management hook
  components/           ← UI components (display only, no game logic)
  screens/
    GameScreen.js       ← Main screen
```

## Key Principle
**All game logic lives in `/engine` only.**
Components receive data and call actions — they never compute outcomes directly.
This keeps the game logic portable and testable.

---

## Phase 1 Features
- D4 / D6 / D8 / D10 / D12 dice per shot type
- 5 shot types: Defend, Work, Drive, Power, Slog
- 3 aggression levels with ±1 modifier
- Wicket sub-roll (D6 → dismissal type)
- Full innings lifecycle: batting → wicket → innings end → target chase
- T20 / ODI / Test format switching
- Ball-by-ball commentary feed

## Phase 2 (next)
- Momentum engine
- Player skill ratings
- Pitch conditions
- Bowling decisions + field placement
