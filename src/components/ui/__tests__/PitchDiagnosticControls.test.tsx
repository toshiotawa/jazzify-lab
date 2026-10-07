import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { PitchDiagnosticControls } from '../PitchDiagnosticControls';
import { PitchInputController } from '@/utils/PitchInputController';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';

describe('PitchDiagnosticControls', () => {
  afterEach(() => {
    PitchInputController.setDiagnosticRecording(false);
    vi.restoreAllMocks();
  });

  it('continues recording after closing settings and saves after stopping', async () => {
    const download = vi.spyOn(PitchInputController, 'downloadDiagnostics').mockResolvedValue(undefined);
    const first = render(<PitchDiagnosticControls isEnglishCopy={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'ログ収集を開始' }));
    expect(pitchDiagnosticRecording.enabled).toBe(true);
    first.unmount();
    expect(pitchDiagnosticRecording.enabled).toBe(true);
    render(<PitchDiagnosticControls isEnglishCopy={false} />);
    expect(screen.getByText('音声入力の診断ログ：収集中')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '収集を停止' }));
    expect(pitchDiagnosticRecording.enabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '診断ログを保存（JSON）' }));
    await waitFor(() => expect(download).toHaveBeenCalledOnce());
  });
});
