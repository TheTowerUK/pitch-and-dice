# State Management

## Overview

- Core state is managed in the game engine hooks
- State transitions are phase-driven
- UI derives display from canonical match state

## Principles

- Single source of truth for match progression
- Deterministic updates for scoring and wickets
- Explicit phase transitions for modal and audio behavior

## Key Areas

- Match lifecycle state
- Ball resolution and pending outcomes
- Phase and delivery phase synchronization

---

## 🔗 See Also

- [Game Flow](./game-flow.md)
- [Data Model](./data-model.md)
- [Match Logic](../gameplay/match-logic.md)
- [Documentation Index](../README.md)
