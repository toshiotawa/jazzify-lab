import { describe, expect, it } from 'vitest';
import {
  shouldCommitOsmdRender,
  shouldShowOsmdRenderError,
} from '@/utils/osmdRenderCommit';

describe('osmdRenderCommit', () => {
  it('commits only when generation matches', () => {
    expect(shouldCommitOsmdRender(3, 3)).toBe(true);
    expect(shouldCommitOsmdRender(3, 4)).toBe(false);
  });

  it('shows render error only for current generation without painted score', () => {
    expect(shouldShowOsmdRenderError({ isCurrent: true, scoreAlreadyPainted: false })).toBe(true);
    expect(shouldShowOsmdRenderError({ isCurrent: true, scoreAlreadyPainted: true })).toBe(false);
    expect(shouldShowOsmdRenderError({ isCurrent: false, scoreAlreadyPainted: false })).toBe(false);
    expect(shouldShowOsmdRenderError({ isCurrent: false, scoreAlreadyPainted: true })).toBe(false);
  });
});
