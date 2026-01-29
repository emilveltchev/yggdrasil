# Project Yggdrasil — Game Design Document

*Stick figure sword combat. Blood. Violence. Fun.*

## The Vision

**One sentence:** You're a stick figure with a sword. Kill everyone. Don't die.

**Inspirations:**
- Stick Fight: The Game
- Nidhogg
- Madness Combat
- SUPERHOT (the "flow state" feel)

---

## Core Loop

```
Enter Level → Kill All Enemies → Don't Die → Next Level → Repeat
```

**Win condition:** Clear all enemies
**Lose condition:** HP hits 0 → restart level

---

## Combat Feel (THE PRIORITY)

This game lives or dies on **how the sword feels.**

### What "Good" Looks Like
- **Weighty swings** — Wind-up, follow-through, commitment
- **Hitstop** — Brief freeze frame on contact (5-10 frames)
- **Screen shake** — On kills and heavy hits
- **Blood spray** — Particles burst from hits, pool on ground
- **Ragdoll deaths** — Bodies crumple satisfyingly
- **Sound design** — Whoosh, impact, splatter (stretch goal)

### Controls
- **WASD / Arrow keys** — Move
- **Mouse aim** — Sword points toward cursor
- **Click** — Swing sword
- **Space** — Dash/dodge (brief i-frames)

### Combat Mechanics
- **Swing arc** — Sword sweeps in an arc toward cursor
- **Reach matters** — Position yourself, don't just spam
- **Parry potential** — Swords can clash (stretch goal)
- **Momentum** — Moving while swinging changes the arc

---

## Stick Figure Style

### Player
- Simple stick figure (head, body, 4 limbs)
- White with black outline
- Limbs animate fluidly (procedural or keyframed)
- Holds sword in dominant hand

### Enemies
- Same stick figure base
- Different colors per type:
  - **Red** — Basic melee
  - **Orange** — Fast, low HP
  - **Purple** — Tanky, slow
  - **Green** — Ranged (throws knives)
- Simple AI: approach → attack pattern

### Blood
- **Color:** Deep red (#8B0000), lighter splatter (#CC0000)
- **On hit:** 10-20 particles burst from impact point
- **On kill:** Big burst (50+ particles) + blood pools on ground
- **Persistence:** Blood stays on level (doesn't disappear)
- **Physics:** Particles affected by gravity, bounce once

---

## Levels

### Structure
- **10 levels** in V1
- Each level = arena/room with enemies
- Difficulty scales: more enemies, tougher types
- Simple platforming elements (platforms, pits)

### Level Progression
| Level | Enemies | New Element |
|-------|---------|-------------|
| 1 | 2 red | Tutorial - basic combat |
| 2 | 3 red | Learn spacing |
| 3 | 4 red + 1 orange | Fast enemies introduced |
| 4 | 5 mixed | Platforms introduced |
| 5 | 3 purple | Tanky enemies - patience |
| 6 | 6 mixed | Swarm tactics |
| 7 | 2 green + 3 red | Ranged enemies introduced |
| 8 | 8 mixed | Chaos |
| 9 | 10 mixed | Gauntlet |
| 10 | BOSS | Big stick figure, patterns |

### Environment
- Simple geometric platforms
- Dark background (#1a1a1a)
- Ground line
- Maybe: hazards (spikes, pits) in later levels

---

## Technical Scope

### IN SCOPE — V1
- [x] Stick figure rendering (procedural)
- [x] Sword combat with arc swing
- [x] Blood particle system
- [x] 4 enemy types + basic AI
- [x] 10 levels with progression
- [x] HP system (player and enemies)
- [x] Death/restart flow
- [x] Boss fight (level 10)
- [x] Hitstop and screen shake
- [x] Keyboard + mouse controls

### OUT OF SCOPE — Not V1
- No sound/music (can add later)
- No save system (start from level 1)
- No upgrades/unlocks
- No mobile support
- No multiplayer

---

## Milestones

### M1: The Sword (Days 1-2)
- [ ] Canvas setup, game loop
- [ ] Stick figure rendering (static)
- [ ] Stick figure animation (walk, idle)
- [ ] Sword attached to figure
- [ ] Mouse aim (sword points to cursor)
- [ ] Click to swing (arc motion)
- **PLAYTEST:** Does swinging feel good?

### M2: Blood & Death (Days 3-4)
- [ ] Enemy stick figures (stand there)
- [ ] Hitbox detection (sword vs enemy)
- [ ] HP system
- [ ] Blood particles on hit
- [ ] Death animation (ragdoll/collapse)
- [ ] Blood pools persist
- [ ] Hitstop on hit
- [ ] Screen shake on kill
- **PLAYTEST:** Does killing feel satisfying?

### M3: Combat AI (Days 5-6)
- [ ] Enemy movement toward player
- [ ] Enemy attack patterns
- [ ] 4 enemy types (red, orange, purple, green)
- [ ] Player can take damage
- [ ] Player death → restart
- [ ] Dash/dodge with i-frames
- **PLAYTEST:** Is combat challenging and fair?

### M4: Levels (Days 7-8)
- [ ] Level structure (clear enemies → next level)
- [ ] 10 level definitions
- [ ] Platform rendering
- [ ] Level transitions
- [ ] Difficulty curve
- **PLAYTEST:** Is progression satisfying?

### M5: Polish & Boss (Days 9-10)
- [ ] Boss fight (level 10)
- [ ] Title screen
- [ ] Game over / victory screens
- [ ] Balance pass
- [ ] Bug fixes
- [ ] Deploy to GitHub Pages
- **PLAYTEST:** Would Emil actually play this?

---

## File Structure

```
projects/game/
├── DESIGN.md          ← This file
├── BUGS.md            ← Bug tracker
├── PLAYTEST.md        ← Playtest notes
├── PROGRESS.md        ← Current status
├── index.html         ← Entry point
├── src/
│   ├── game.js        ← Main loop, state
│   ├── player.js      ← Player stick figure
│   ├── enemies.js     ← Enemy types and AI
│   ├── combat.js      ← Sword, hitboxes, damage
│   ├── blood.js       ← Particle system
│   ├── levels.js      ← Level definitions
│   ├── render.js      ← Drawing stick figures
│   └── input.js       ← Keyboard/mouse handling
```

---

## Success Criteria

**V1 is DONE when:**
1. Swinging the sword feels satisfying
2. Kills feel brutal (blood, ragdoll, feedback)
3. 10 levels playable start to finish
4. Boss fight is memorable
5. Emil plays and wants to keep playing
6. No game-breaking bugs

---

*Last updated: 2026-01-29*
*Owner: 🦉 Mimir*
*Requested by: Emil ("roguelikes are boring, give me blood")*
