import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import ChordVoicingStaff, {
  type ChordVoicingStaffGroup,
} from "@/components/earTraining/ChordVoicingStaff";
import "@/components/earTraining/chordVoicingStaffEffects.css";

interface ScoreData {
  keyFifths: number;
  staffRightX?: number;
  noteCount?: number;
  voicingGroups?: ChordVoicingStaffGroup[];
  octaveShift?: string | null;
}

declare global {
  interface Window {
    __slideReady?: boolean;
    __slideStaffError?: string;
  }
}

function SomisiraStaffView({ scoreData }: { scoreData: ScoreData }) {
  const groups = scoreData.voicingGroups ?? [];
  const keyFifths = scoreData.keyFifths ?? 0;

  return (
    <div className="somisira-staff-root" style={{ position: "relative", width: "100%", height: "100%" }}>
      <ChordVoicingStaff
        keyFifths={keyFifths}
        voicingGroups={groups}
        ignoreNotationInstrument
        smuflUseForeignObject
        singleMeasureLayout
        literalChordLabels
        showTargetHints={false}
        unpressedNoteOpacity={1}
        fixedActiveStaves={[1]}
        staffLineRightXOverride={scoreData.staffRightX}
        denseCurrentMeasureLayout={groups.length > 5}
        className="somisira-staff"
      />
    </div>
  );
}

function mountStaff() {
  const orientation = document.body.dataset.orientation || "horizontal";
  const mountIds: Record<string, string> = {
    horizontal: "score-h",
    vertical: "score-v",
    vertical_lower: "score-vl",
  };
  const mountEl = document.getElementById(mountIds[orientation] || "score-h");
  const dataEl = document.getElementById("score-data");
  if (!mountEl || !dataEl) {
    window.__slideReady = true;
    return;
  }
  let scoreData: ScoreData;
  try {
    scoreData = JSON.parse(dataEl.textContent || "{}");
  } catch (error) {
    window.__slideStaffError =
      error instanceof Error ? error.message : String(error);
    window.__slideReady = true;
    return;
  }

  try {
    const root = createRoot(mountEl);
    flushSync(() => {
      root.render(<SomisiraStaffView scoreData={scoreData} />);
    });
  } catch (error) {
    window.__slideStaffError =
      error instanceof Error ? error.message : String(error);
  }
  window.__slideReady = true;
}

mountStaff();
