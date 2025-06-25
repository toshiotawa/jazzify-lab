import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * クラス名を結合し、Tailwind CSSの競合を解決する
 * @param inputs - クラス名の配列または条件付きクラス名
 * @returns 結合されたクラス名
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export default cn; 