import React from 'react';
import type { LandingChordRunVideoCopy } from '@/components/landing/landingCopy';
import { LpYouTubeVideo } from '@/components/landing/sections/LpYouTubeVideo';
import {
  CHORD_RUN_VIDEO_ID,
  CHORD_RUN_VIDEO_START_SECONDS,
} from '@/components/landing/landingLinks';

interface LpChordRunVideoProps {
  copy: LandingChordRunVideoCopy;
}

export const LpChordRunVideo: React.FC<LpChordRunVideoProps> = ({ copy }) => (
  <div className="lp-chord-run-video">
    <LpYouTubeVideo
      copy={copy}
      videoId={CHORD_RUN_VIDEO_ID}
      startSeconds={CHORD_RUN_VIDEO_START_SECONDS}
      gaEventName="lp_chord_run_video_play"
      className=""
    />
  </div>
);
