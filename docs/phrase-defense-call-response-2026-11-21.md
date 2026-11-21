# Phrase Defense — call/response specification (2026-11-21)

## Confirmed product behavior
- One phrase alternates **C call bars** and **C response bars**. C is configurable.
- The backing audio has **L bars per loop**. L must be a positive multiple of 2×C. At L=8 and C=1, the cycle is (call 1, response 1) ×4, then repeats.
- Call: no judge (except 30ms pre-response onset window), notes still display on MIDI/on-screen piano; monsters dance **in place**, do not approach or start attacks. Dance frames/transform are independent of the walking animation. Response: monsters resume their normal approach/attack.
- Judge opens at **30ms before the next response bar** using the audible backing transport clock, not the animation clock. It closes on response→call; complete/partial judge state must not leak across turns. Latency and audio speed changes must remain aligned.
- After **three complete, successful phrase renditions**, switch to the next phrase. Partial progress must reset per response; completed rendition count persists across response intervals. Count only one completion per user rendition, never mere playback or call input.
- Keep a **single uninterrupted BGM channel**; do not introduce separate reference melody playback, automatic audio muting or headphone requirements.
- Web and iOS must match; keep tutorial/voicing/legacy stages backward-compatible.

## In this PR (foundation only)
- Added tested pure beat-position phase calculation in Web and iOS transport.
- Existing playback, judgment, animation, stage configuration and Supabase DB are **not yet wired**. This PR does not implement the full change.

## Follow-on integration checklist
1. Add validated per-stage settings for audio loop bars and call bars (DB migration, admin editor, Web/iOS models/parsers). Ensure both live only when feature enabled.
2. Wire audible beat position of per-phrase/shared-progression/single source transports into the phase calculator; do not drive from elapsed gameplay time. Verify 8/1 and 8/2, rate changes, pause/resume, loop wrap and phrase switches.
3. Disable attacks, movement and scoring during call (with precise 30ms scoring lead); show distinct rhythmic dance on stationary enemy sprites. Keep notes visible.
4. At call start reset incomplete notes/steps but preserve successful response count. Enforce three complete renditions before phrase switch. Verify anti-bleed between successive windows, with voice, MIDI and touch inputs.
5. Add deterministic engine/session tests, Web test/lint/typecheck and iOS test/build; manual mic + speaker tests to quantify BGM false positives. **Do not merge without integration and CI verification**.

## Related
- Existing audible code-progression synchronization: PR #1115 (merged).
- Current master has independent speaker bleed / audio session work; avoid reverting it.
