# Color Reference

This file lists color references currently used by the app code under `src/`.

## Theme Palette (`src/constants/theme.js`)

| Token | Value |
|---|---|
| `COLOURS.ink` | `#1a1a1a` |
| `COLOURS.slate` | `#2c3e50` |
| `COLOURS.slateMid` | `#3d5166` |
| `COLOURS.slateLight` | `#4a6080` |
| `COLOURS.cream` | `#f5f0e8` |
| `COLOURS.gold` | `#d4a017` |
| `COLOURS.goldLight` | `#f0c040` |
| `COLOURS.red` | `#c0392b` |
| `COLOURS.pitch` | `#2d5a1b` |
| `COLOURS.pitchLight` | `#3a7a24` |
| `COLOURS.dot` | `#7f8c8d` |
| `COLOURS.boundary` | `#e67e22` |
| `COLOURS.six` | `#e74c3c` |
| `COLOURS.wicket` | `#8e44ad` |
| `COLOURS.runs1` | `#27ae60` |
| `COLOURS.runs2` | `#2980b9` |
| `COLOURS.runs3` | `#8e44ad` |
| `COLOURS.white` | `#ffffff` |
| `COLOURS.overlay` | `rgba(0,0,0,0.85)` |

## Direct Hex Literals (outside theme tokens)

| Color | Found in |
|---|---|
| `#e056fd` | `src/components/Commentary.js`, `src/components/NewBatsmanModal.js` |
| `#2e2e2e` | `src/components/OverBalls.js` |
| `#1f1f1f` | `src/screens/HelpScreen.js` |
| `#27ae60` | `src/screens/PlayerSetup.js`, `src/screens/TeamSelectScreen.js`, `src/engine/momentumEngine.js` |
| `#e74c3c` | `src/screens/PlayerSetup.js`, `src/screens/TeamSelectScreen.js`, `src/engine/momentumEngine.js` |
| `#f0c040` | `src/components/Commentary.js`, `src/engine/momentumEngine.js` |
| `#e67e22` | `src/components/Commentary.js`, `src/screens/PlayerSetup.js`, `src/engine/momentumEngine.js` |
| `#8e44ad` | `src/screens/PlayerSetup.js` |
| `#c0392b` | `src/screens/PlayerSetup.js` |
| `#2980b9` | `src/screens/PlayerSetup.js` |
| `#7f8c8d` | `src/screens/PlayerSetup.js`, `src/engine/momentumEngine.js` |

## Notes

- Preferred palette lives in `src/constants/theme.js` and is consumed via `COLOURS`.
- Several components still use hardcoded literals; those are cataloged above for cleanup/refactor planning.

---

## 🔗 See Also

- [Scoreboard System](../systems/scoreboard-system.md)
- [Audio System](../systems/audio-system.md)
- [Documentation Index](../README.md)
