# Call-phase enemy dance preview
Uses each monster's existing idle sprite, but applies a dedicated beat-synced lift, tilt and squash pose. Unlike the walk cycle, the x position does not change. Each enemy has a slightly offset phase. The animation returns to the original scale/rotation on response.

Web: set `runtime.enemyDanceActive` and `runtime.danceBpm` from the audio transport. iOS: set `DefenseScene.enemyDanceActive` and `enemyDanceBpm`.

**Integration remains incomplete**: the transport has not yet been wired to these flags, and iOS enemy simulation freezing is not yet implemented. This is a preview-ready animation foundation, not a finished playable change.
