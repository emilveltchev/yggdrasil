# Project Yggdrasil — Progress Tracker

*Mimir checks this file during heartbeats to continue work*

## Current Status

**Phase:** M1-M4 COMPLETE (core build)
**Started:** 2026-01-29
**Deployed:** https://emilveltchev.github.io/yggdrasil/

## What's Built

✅ Canvas setup, 60fps game loop
✅ Stick figure rendering with animations
✅ Player movement (WASD)
✅ Mouse aiming - sword points at cursor
✅ Sword swing with windup/swing/followthrough phases
✅ Blood particle system (spray on hit, pools on ground)
✅ 4 enemy types (red, orange, purple, green)
✅ Enemy AI (approach, attack patterns)
✅ Combat collision detection
✅ Hitstop on hits
✅ Screen shake on kills
✅ Death ragdolls
✅ 10 levels with progression
✅ HP system for player and enemies
✅ Dash with i-frames (spacebar)
✅ Title screen, game over, victory screens
✅ Level transitions

## Next Action

🎯 **NOW:** Playtest and fix bugs. Then polish.

## Known Issues to Fix

- [x] Green enemies (ranged) don't actually throw projectiles yet — FIXED
- [x] Boss on level 10 is just a big purple guy, needs unique patterns — FIXED (scaled up, named, big sword)
- [ ] No sound (out of scope for V1 but would add a lot)
- [ ] Balance pass needed - is damage/HP tuned right?
- [ ] Boss could use more interesting attack patterns (multi-swing, ground slam?)

## Playtest Checklist

- [ ] Does the sword swing feel good?
- [ ] Is combat challenging but fair?
- [ ] Do kills feel satisfying (blood, shake, ragdoll)?
- [ ] Is level progression smooth?
- [ ] Any game-breaking bugs?

---

## Log

### 2026-01-29 12:37
- Pivoted from deckbuilder to stick figure combat (Emil's request)
- Built entire game in one session:
  - input.js (1.8k) - keyboard/mouse handling
  - render.js (7k) - stick figure + sword drawing
  - blood.js (3.7k) - particle system
  - player.js (9.7k) - player with sword mechanics  
  - enemies.js (9.6k) - 4 enemy types with AI
  - combat.js (2.7k) - collision detection
  - levels.js (3.8k) - 10 level definitions
  - game.js (8.7k) - main loop and state machine
- Total: ~47k bytes / ~1,980 lines
- Deployed to GitHub Pages

### 2026-01-29 13:00 (Heartbeat)
- Added projectiles.js for ranged enemy knives
- Green enemies now throw knives at player
- Boss enemy type with 1.8x scale, bigger sword, name display
- Deployed update to GitHub Pages

### Next Session
- Playtest the new changes
- Add more interesting boss attack patterns
- Balance pass on damage/HP
- Test all 10 levels
