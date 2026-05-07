# Data Model

## Team

- `id`, `name`, `flag`, `colour`, `accent`
- `players[]` with batting/bowling attributes

## Player

- `id`, `name`, `role`, `position`
- `battingSkill`, `bowlingSkill`

## Match State

- Runs, wickets, balls, innings, target
- Current phase and delivery phase
- Batting and bowling squad snapshots

## Constraints

- Roles normalized to engine-compatible values
- Skills normalized to engine-supported range
- Player order resolved by position/index

---

## 🔗 See Also

- [State Management](./state-management.md)
- [Teams & Players](../content/teams-and-players.md)
- [Match Logic](../gameplay/match-logic.md)
- [Documentation Index](../README.md)
