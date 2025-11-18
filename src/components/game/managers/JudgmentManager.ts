import type { JudgmentResult } from '@/types';

export type JudgmentListener = (judgment: JudgmentResult) => void;

export class JudgmentManager {
  private readonly listeners = new Set<JudgmentListener>();

  subscribe(listener: JudgmentListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(judgment: JudgmentResult): void {
    this.listeners.forEach(listener => {
      try {
        listener(judgment);
      } catch (error) {
        console.warn('Judgment listener error', error);
      }
    });
  }
}
