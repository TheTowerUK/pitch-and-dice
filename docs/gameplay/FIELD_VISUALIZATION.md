# Field Visualization

Design contract and reference for the compact-match field diagram (`FieldPitchDiagram`).

**Code sources (source of truth for coordinates):**

- `src/engine/fieldDiagramLayout.js` — base slot coordinates and role markers
- `src/engine/responsiveFieldLayout.js` — Phase 1 visual presets (attacking / balanced / defensive), tablet spread, optional bowling/pressure nudges
- `src/components/FieldPitchDiagram.js` — SVG rendering and subtle field-change animation
- `src/engine/fieldEngine.js` — zone counts, presets, and gameplay modifiers (logic only)

---

## Purpose

The field map is a **visual representation only**. It helps players see how the current tactical field is set during compact mobile play.

- Reads **`state.field`** zone counts (same object used by AI and manual field setup).
- Infers **attacking / balanced / defensive** from zone counts (or preset match) and adjusts dot positions visually.
- **Tablet** (shortest edge ≥ 768px): wider fielder spacing; **phone**: slightly tighter to avoid edge clutter.
- Optional visual nudges from **`selectedBowling`** and chase **pressure** (layout only).
- Updates when the field changes (new over, AI placement, or manual confirmation).
- **Does not** affect probabilities, dice outcomes, scoring, or any game logic.

Gameplay field effects remain in `fieldEngine.js` (`getFieldMod`, `checkBoundarySave`, `getSlipCatchBoost`, etc.).

---

## Coordinate System

| Property | Value |
|----------|--------|
| SVG `viewBox` | `0 0 100 100` |
| Oval | `cx=50`, `cy=50`, `rx=43`, `ry=47` |
| Pitch strip | `x=43`, `y=22`, `width=14`, `height=56` |

**Orientation (top-down, broadcast-style):**

| Direction | On diagram |
|-----------|------------|
| Batter (striker) | Top |
| Bowler | Bottom |
| Off side | Left |
| Leg side | Right |

The SVG scales inside a fixed-size card (`preserveAspectRatio="xMidYMid meet"`). The card does not resize when dots or commentary change.

---

## Fixed Entities

These are **cosmetic** markers. They are not part of the nine placeable fielders in `state.field`.

| Role | x | y | Colour (in UI) |
|------|---|---|----------------|
| Wicketkeeper | 50 | 21 | Gold |
| Batter | 50 | 34 | Blue |
| Bowler | 50 | 75 | Orange |

Stumps are drawn at the striker end (`50`, `26`) and bowler end (`50`, `74`).

---

## Position reference mapping

A full cricket field has **40+ named positions** (see reference diagram in project assets). Pitch & Dice uses **six tactical zones** and **nine placeable fielders**. Each zone slot is mapped to the **nearest standard position** on that diagram so field updates look cricket-like.

| Game zone | Slot | Cricket position (reference) | x | y |
|-----------|------|------------------------------|---|---|
| `slip` | 0 | 1st slip | 45 | 18 |
| `slip` | 1 | 2nd slip | 40 | 17 |
| `slip` | 2 | 3rd slip | 35 | 19 |
| `cover` | 0 | Cover point | 18 | 37 |
| `cover` | 1 | Cover | 20 | 56 |
| `midOff` | 0 | Extra cover | 28 | 58 |
| `midOff` | 1 | Mid-off | 32 | 84 |
| `midOn` | 0 | Short mid-on | 63 | 46 |
| `midOn` | 1 | Mid-on | 68 | 84 |
| `midwicket` | 0 | Mid-wicket | 76 | 55 |
| `midwicket` | 1 | Square leg | 80 | 37 |
| `deepBound` | 0 | Straight / long-on (rope) | 50 | 5 |
| `deepBound` | 1 | Third man | 22 | 15 |
| `deepBound` | 2 | Fine leg | 63 | 16 |

Placeable fielder centres sit **outside** the pitch strip (`x` 43–57, `y` 22–78), with margin for dot radius.

**Not used as placeable slots** (shown on diagram only): bowler, wicketkeeper, batter, gully, silly point, short leg, point, long-off, deep square leg, sweeper, and others. Those names are **not** separate `state.field` keys.

When `state.field` changes (AI or manual), only the **count per zone** changes—which **slots** appear—not the slot coordinates.

---

## Zone coordinates (by zone)

Zone keys match `fieldEngine.js`: `slip`, `cover`, `midOff`, `midOn`, `midwicket`, `deepBound`.

### Slip (max 3) — protects `work`, `drive`

| Slot | Cricket label | x | y |
|------|---------------|---|---|
| 0 | 1st slip | 45 | 18 |
| 1 | 2nd slip | 40 | 17 |
| 2 | 3rd slip | 35 | 19 |

### Cover (max 2) — protects `drive`

| Slot | Cricket label | x | y |
|------|---------------|---|---|
| 0 | Cover point | 18 | 37 |
| 1 | Cover | 20 | 56 |

### Mid-off (max 2) — protects `drive`, `power`

| Slot | Cricket label | x | y |
|------|---------------|---|---|
| 0 | Extra cover | 28 | 58 |
| 1 | Mid-off | 32 | 84 |

### Mid-on (max 2) — protects `work`, `power`

| Slot | Cricket label | x | y |
|------|---------------|---|---|
| 0 | Short mid-on | 63 | 46 |
| 1 | Mid-on | 68 | 84 |

### Midwicket (max 2) — protects `work`, `slog`

| Slot | Cricket label | x | y |
|------|---------------|---|---|
| 0 | Mid-wicket | 76 | 55 |
| 1 | Square leg | 80 | 37 |

### Deep boundary (max 3) — protects `power`, `slog`, `drive`

| Slot | Cricket label | x | y |
|------|---------------|---|---|
| 0 | Straight / long-on | 50 | 5 |
| 1 | Third man | 22 | 15 |
| 2 | Fine leg | 60 | 16 |

---

## Rendering Rule

For each zone, render **only the first N slots**, where `N = state.field[zone]` (capped at the zone maximum).

**Example:**

```js
state.field.slip === 2
```

→ Draw slip slots **0** and **1** only: **1st slip** + **2nd slip**. Slot 2 (3rd slip) is hidden.

**Example (full balanced field — AI FIELD 9/9):**

```js
{
  slip: 2,
  cover: 1,
  midOff: 1,
  midOn: 1,
  midwicket: 1,
  deepBound: 3,
}
```

| # | Dot appears at |
|---|----------------|
| 1–2 | 1st slip, 2nd slip |
| 3 | Cover point |
| 4 | Extra cover |
| 5 | Short mid-on |
| 6 | Mid-wicket |
| 7–9 | Straight/long-on, third man, fine leg |

Nine white fielder dots total (2 + 1 + 1 + 1 + 1 + 3). Mid-off slot stays hidden until `midOff: 2`.

Implementation: `buildFieldDiagramDots()` in `fieldDiagramLayout.js`.

On compact phone layouts, the diagram shows **dots only** (optional small `FIELD` title). Zone text labels are omitted to avoid clutter.

---

## AI Examples

AI returns zone **counts** via `getAIFieldPlacement()` in `aiEngine.js`. The diagram reflects those counts; it does not choose positions independently.

### Attacking

`wickets < 3` and `momentum < 0`

```js
{ slip: 3, cover: 1, midOff: 1, midOn: 1, midwicket: 1, deepBound: 2 }
```

Visual: all three slips; cover point; extra cover; short mid-on; mid-wicket; straight + third man (no fine-leg deep slot).

### Balanced (default)

```js
{ slip: 2, cover: 1, midOff: 1, midOn: 1, midwicket: 1, deepBound: 3 }
```

Same as `DEFAULT_FIELD` in `fieldEngine.js`.

### Defensive

Death overs (`currentOver >= totalOvers - 4`) or `momentum > 5`

```js
{ slip: 1, cover: 1, midOff: 1, midOn: 1, midwicket: 1, deepBound: 4 }
```

Note: `deepBound` max is **3** in `fieldEngine.js`; the fourth deep fielder is represented by filling all three deep slots (straight, third man, fine leg).

Same as `DEFENSIVE_FIELD` preset.

### Spin

`pitchType === 'turning'`

```js
{ slip: 2, cover: 2, midOff: 1, midOn: 1, midwicket: 1, deepBound: 2 }
```

Visual: 1st + 2nd slip; cover point + cover; extra cover; short mid-on; mid-wicket; straight + third man.

Manual presets (`ATTACKING_FIELD`, `DEFAULT_FIELD`, `DEFENSIVE_FIELD`) in `fieldEngine.js` use the same count shapes as attacking, balanced, and defensive respectively.

---

## Important Constraint

Pitch & Dice uses **tactical zones**, not exact cricket fielding coordinates for each ball.

- The diagram is **illustrative** and **broadcast-style**.
- Dots should look **cricket-like** but are tied to zone slots, not individual player IDs or ball tracking.
- Do **not** interpret diagram positions as simulation geometry, Hawk-Eye data, or per-delivery field movement.
- Changing coordinates in `fieldDiagramLayout.js` affects **presentation only**. Changing zone counts or modifiers belongs in `fieldEngine.js` / `aiEngine.js`.

When adjusting the visual:

1. Edit slot coordinates in `fieldDiagramLayout.js`.
2. Keep `viewBox` at `0 0 100 100` unless the whole layout contract is intentionally revised.
3. Update this document if the coordinate model changes.

---

## See Also

- [Match Logic](./match-logic.md)
- [Rules](./rules.md)
- `src/engine/fieldEngine.js` — zone limits and gameplay modifiers
