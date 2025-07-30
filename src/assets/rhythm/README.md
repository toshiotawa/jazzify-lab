# Rhythm Mode Music Files

This directory should contain the MP3 files for rhythm mode stages.

## File Format
- Format: MP3
- Recommended bitrate: 128-192 kbps
- Naming convention: `{stage-id}.mp3` (e.g., `demo-1.mp3`)

## Loop Configuration
- Music files should loop from measure 2 back to measure 2
- Measure 1 is used for count-in
- Configure loop points in the stage data:
  - `loop_measures`: Total measures before looping
  - `bpm`: Beats per minute
  - `time_signature`: Time signature (3 or 4)

## Example Files
- `demo-1.mp3`: Demo track for rhythm mode testing
  - BPM: 120
  - Time Signature: 4/4
  - Loop: Measures 2-8