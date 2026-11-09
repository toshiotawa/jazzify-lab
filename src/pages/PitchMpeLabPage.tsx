import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PitchInputController } from '@/utils/PitchInputController';
import { PestoLabObserver } from '@/utils/pitchLab/pestoLabObserver';
import {
  analyzeEffetuneOffline,
  connectEffetuneLive,
  disconnectEffetuneLive,
  effetuneDroppedFrames,
  type EffetuneLabLiveHandle,
} from '@/utils/pitchLab/effetuneLab';
import {
  analyzePitchPleaseFile,
  createPitchPleaseLab,
  pitchPleaseStats,
  startPitchPleaseOnStream,
  stopPitchPlease,
  type PitchPleaseLabHandle,
} from '@/utils/pitchLab/pitchPleaseLab';
import {
  LAB_MONO_FIXTURES,
  additiveMixFixtureDescription,
  buildAdditiveMixBuffer,
  buildSineFixtureBuffer,
  labelForAdditiveMix,
  labelForMonophonic,
} from '@/utils/pitchLab/polyPitchFixtures';
import {
  downloadPolyPitchSession,
  PolyPitchSessionRecorder,
  type PolyPitchLabeledTrial,
  type PolyPitchSessionMeta,
} from '@/utils/pitchLab/polyPitchSession';
import type { PolyPitchEngineId, PolyPitchFrame } from '@/utils/pitchLab/polyPitchTypes';
import { computeTrialMetrics } from '@/utils/pitchLab/polyPitchMetrics';

const DISPLAY_HZ = 15;
const ENGINE_LABELS: Record<PolyPitchEngineId, string> = {
  pesto: 'PESTO (単音)',
  'pitchplease-fast': 'PitchPlease fast',
  'pitchplease-piano': 'PitchPlease piano',
  'effetune-immediate': 'EffeTune NoteSpectrogram（即時・JIT-MPE系・論文モデルではない）',
  'effetune-revised-40ms': 'EffeTune 40ms 更新',
};

type EngineSnapshot = Partial<Record<PolyPitchEngineId, PolyPitchFrame>>;

const PitchMpeLabPage = () => {
  const recorderRef = useRef(new PolyPitchSessionRecorder());
  const pestoObserverRef = useRef<PestoLabObserver | null>(null);
  const pitchControllerRef = useRef<PitchInputController | null>(null);
  const pitchPleaseRef = useRef<PitchPleaseLabHandle | null>(null);
  const pitchPleasePianoRef = useRef<PitchPleaseLabHandle | null>(null);
  const effetuneRef = useRef<EffetuneLabLiveHandle | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const displayRef = useRef<EngineSnapshot>({});

  const [running, setRunning] = useState(false);
  const [snapshot, setSnapshot] = useState<EngineSnapshot>({});
  const [enablePiano, setEnablePiano] = useState(false);
  const [enableFourWay, setEnableFourWay] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [labeledTrials, setLabeledTrials] = useState<PolyPitchLabeledTrial[]>([]);
  const [manualMidis, setManualMidis] = useState('60,64,67');
  const [manualOnset, setManualOnset] = useState('0');

  const onFrame = useCallback((frame: PolyPitchFrame) => {
    displayRef.current = { ...displayRef.current, [frame.engineId]: frame };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSnapshot({ ...displayRef.current });
    }, 1000 / DISPLAY_HZ);
    return () => window.clearInterval(id);
  }, []);

  const stopLive = useCallback(async () => {
    if (pitchPleaseRef.current) stopPitchPlease(pitchPleaseRef.current);
    if (pitchPleasePianoRef.current) stopPitchPlease(pitchPleasePianoRef.current);
    if (effetuneRef.current) disconnectEffetuneLive(effetuneRef.current);
    effetuneRef.current = null;
    await pitchControllerRef.current?.disconnect();
    pitchControllerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRunning(false);
  }, []);

  const startLive = useCallback(async () => {
    setStatus(null);
    await stopLive();
    recorderRef.current.clear();
    displayRef.current = {};
    pestoObserverRef.current = new PestoLabObserver(recorderRef.current, onFrame);

    const controller = new PitchInputController({
      onNoteOn: (note, _v, domTs) => pestoObserverRef.current?.noteOn(note, domTs),
      onNoteOff: (note) => pestoObserverRef.current?.noteOff(note),
      onError: (msg) => setStatus(msg),
    });
    pitchControllerRef.current = controller;
    pestoObserverRef.current.resetSessionClock();
    const connected = await controller.connect(undefined, false, 1, 'pesto');
    if (!connected) {
      setStatus('PESTO 接続に失敗しました');
      return;
    }

    const stream = controller.getActiveMediaStream();
    if (!stream) {
      setStatus('マイクストリームを取得できませんでした');
      return;
    }
    streamRef.current = stream;

    const ppModel: 'fast' | 'piano' =
      enableFourWay ? 'fast' : enablePiano ? 'piano' : 'fast';
    const pp = createPitchPleaseLab(ppModel, recorderRef.current, onFrame);
    pitchPleaseRef.current = pp;
    await startPitchPleaseOnStream(pp, stream);

    if (enableFourWay) {
      const ppPiano = createPitchPleaseLab('piano', recorderRef.current, onFrame);
      pitchPleasePianoRef.current = ppPiano;
      await startPitchPleaseOnStream(ppPiano, stream);
    } else {
      pitchPleasePianoRef.current = null;
    }

    const effCtx = new AudioContext({ sampleRate: 48_000, latencyHint: 'interactive' });
    const eff = await connectEffetuneLive(effCtx, stream, recorderRef.current, onFrame);
    effetuneRef.current = eff;

    setRunning(true);
    setStatus('マイク入力中（EC/NS/AGC はオフ。ゲーム既定とは異なります）');
  }, [enableFourWay, enablePiano, onFrame, stopLive]);

  const runFixtureEval = useCallback(async () => {
    setFileBusy(true);
    setStatus('ファイル評価を順実行中…');
    const offlineCtx = new OfflineAudioContext(1, 1, 48_000);
    const trials: PolyPitchLabeledTrial[] = [];

    for (const fixture of LAB_MONO_FIXTURES) {
      const buffer = buildSineFixtureBuffer(
        offlineCtx,
        fixture.nominalMidi,
        fixture.durationSec,
        fixture.sampleRate,
      );
      const label = labelForMonophonic(fixture.nominalMidi, fixture.durationSec);
      const metricsByEngine: PolyPitchLabeledTrial['metricsByEngine'] = {};

      const ppFast = await analyzePitchPleaseFile(buffer, 'fast');
      for (const f of ppFast) recorderRef.current.append(f);
      metricsByEngine['pitchplease-fast'] = computeTrialMetrics(ppFast, label);

      const ppPiano = await analyzePitchPleaseFile(buffer, 'piano');
      for (const f of ppPiano) recorderRef.current.append(f);
      metricsByEngine['pitchplease-piano'] = computeTrialMetrics(ppPiano, label);

      const eff = await analyzeEffetuneOffline(buffer);
      for (const f of eff) recorderRef.current.append(f);
      const imm = eff.filter((f) => f.engineId === 'effetune-immediate');
      metricsByEngine['effetune-immediate'] = computeTrialMetrics(imm, label);

      trials.push({
        label,
        description: fixture.id,
        metricsByEngine,
      });
    }

    const mixMidis = [60, 64, 67] as const;
    const mixBuffer = buildAdditiveMixBuffer(offlineCtx, mixMidis, 0.45, 48_000);
    const mixLabel = labelForAdditiveMix(mixMidis, 0.45);
    const mixMetrics: PolyPitchLabeledTrial['metricsByEngine'] = {};
    const mixFast = await analyzePitchPleaseFile(mixBuffer, 'fast');
    mixMetrics['pitchplease-fast'] = computeTrialMetrics(mixFast, mixLabel);
    const mixPiano = await analyzePitchPleaseFile(mixBuffer, 'piano');
    mixMetrics['pitchplease-piano'] = computeTrialMetrics(mixPiano, mixLabel);
    const mixEff = await analyzeEffetuneOffline(mixBuffer);
    mixMetrics['effetune-immediate'] = computeTrialMetrics(
      mixEff.filter((f) => f.engineId === 'effetune-immediate'),
      mixLabel,
    );
    trials.push({
      label: mixLabel,
      description: additiveMixFixtureDescription(mixMidis),
      metricsByEngine: mixMetrics,
    });

    setLabeledTrials(trials);
    setFileBusy(false);
    setStatus('合成フィクスチャ評価完了（加算混合は演奏ではありません）');
  }, []);

  const addManualTrial = useCallback(() => {
    const expected = manualMidis
      .split(',')
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n));
    const onset = Number.parseFloat(manualOnset);
    const label = {
      onsetTimeSec: Number.isFinite(onset) ? onset : 0,
      sustainEndTimeSec: onset + 2,
      expectedMidis: expected,
    };
    const metricsByEngine: PolyPitchLabeledTrial['metricsByEngine'] = {};
    const engines: PolyPitchEngineId[] = [
      'pesto',
      'pitchplease-fast',
      'effetune-immediate',
    ];
    if (enablePiano || enableFourWay) engines.push('pitchplease-piano');
    for (const id of engines) {
      metricsByEngine[id] = recorderRef.current.buildMetricsForLabel(id, label);
    }
    setLabeledTrials((prev) => [
      ...prev,
      { label, description: `manual-live:${expected.join('-')}`, metricsByEngine },
    ]);
  }, [enableFourWay, enablePiano, manualMidis, manualOnset]);

  const exportSession = useCallback(() => {
    const pp = pitchPleaseRef.current;
    const meta: PolyPitchSessionMeta = {
      startedAtIso: new Date().toISOString(),
      userAgent: navigator.userAgent,
      enablePianoModel: enablePiano || enableFourWay,
      enableFourWayLive: enableFourWay,
      pitchPleaseCpuLoad: pp ? pitchPleaseStats(pp).cpuLoad : undefined,
      effetuneDroppedTelemetry: effetuneRef.current
        ? effetuneDroppedFrames(effetuneRef.current)
        : undefined,
      audioDroppedSamples: PitchInputController.getLatencyStats().diagnostics?.droppedSamples,
    };
    downloadPolyPitchSession(recorderRef.current.export(meta, labeledTrials));
  }, [enableFourWay, enablePiano, labeledTrials]);

  useEffect(() => () => {
    void stopLive();
  }, [stopLive]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-2">多声ピッチ比較ラボ（stg / dev）</h1>
      <p className="text-sm text-slate-400 mb-4 max-w-3xl">
        ゲーム判定には接続しません。EffeTune は JIT-MPE 論文の派生実装であり、論文数値そのものではありません。
        マイクは echoCancellation / noiseSuppression / autoGainControl をすべてオフにします（ゲーム音声入力の既定とは異なります）。
      </p>
      <Link to="/main/dashboard" className="text-purple-300 text-sm underline">
        ダッシュボードへ戻る
      </Link>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={running}
          onClick={() => void startLive()}
        >
          マイク開始
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={!running}
          onClick={() => void stopLive()}
        >
          停止
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={fileBusy}
          onClick={() => void runFixtureEval()}
        >
          合成フィクスチャ評価
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={exportSession}>
          セッション JSON
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enablePiano}
            onChange={(e) => setEnablePiano(e.target.checked)}
          />
          PitchPlease piano をライブに含める（4本同時は Safari 確認用）
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableFourWay}
            onChange={(e) => setEnableFourWay(e.target.checked)}
          />
          fast + piano 同時（高負荷）
        </label>
      </div>

      {status ? <p className="mt-3 text-amber-200 text-sm">{status}</p> : null}

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        {(Object.keys(ENGINE_LABELS) as PolyPitchEngineId[]).map((id) => {
          const frame = snapshot[id];
          const midis = frame?.activeMidis.join(', ') ?? '—';
          const latency =
            frame !== undefined
              ? `${Math.round((frame.emitTimeSec - frame.contentTimeSec) * 1000)} ms`
              : '—';
          return (
            <div key={id} className="rounded border border-slate-700 p-3 font-mono text-xs">
              <p className="text-slate-300 mb-1">{ENGINE_LABELS[id]}</p>
              <p>active: {midis}</p>
              <p>latency: {latency}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-8 border-t border-slate-800 pt-4">
        <h2 className="text-lg font-semibold mb-2">ライブ試行ラベル</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs">
            期待 MIDI（カンマ区切り）
            <input
              className="input input-bordered input-xs ml-2 w-40"
              value={manualMidis}
              onChange={(e) => setManualMidis(e.target.value)}
            />
          </label>
          <label className="text-xs">
            onset秒
            <input
              className="input input-bordered input-xs ml-2 w-20"
              value={manualOnset}
              onChange={(e) => setManualOnset(e.target.value)}
            />
          </label>
          <button type="button" className="btn btn-xs btn-outline" onClick={addManualTrial}>
            試行を記録
          </button>
        </div>
      </section>

      {labeledTrials.length > 0 ? (
        <section className="mt-6 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">指標</h2>
          <table className="table table-xs">
            <thead>
              <tr>
                <th>試行</th>
                <th>引擎</th>
                <th>和音確定</th>
                <th>確定 ms</th>
                <th>余剰</th>
                <th>欠落</th>
              </tr>
            </thead>
            <tbody>
              {labeledTrials.flatMap((trial) =>
                Object.entries(trial.metricsByEngine).map(([engine, m]) => (
                  <tr key={`${trial.description}-${engine}`}>
                    <td>{trial.description}</td>
                    <td>{engine}</td>
                    <td>{m?.chordConfirmed ? 'yes' : 'no'}</td>
                    <td>{m?.confirmLatencyMs?.toFixed(0) ?? '—'}</td>
                    <td>{m?.spuriousMidiRate?.toFixed(3) ?? '—'}</td>
                    <td>{m?.missingMidiRate?.toFixed(3) ?? '—'}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
};

export default PitchMpeLabPage;
