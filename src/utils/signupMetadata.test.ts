import { describe, it, expect } from 'vitest';
import {
  normalizeCountryCode,
  resolveWebSignupCountry,
  resolveWebSignupPlatform,
} from './signupMetadata';

describe('normalizeCountryCode', () => {
  it('2文字の有効な ISO コードを大文字化する', () => {
    expect(normalizeCountryCode('jp')).toBe('JP');
    expect(normalizeCountryCode(' US ')).toBe('US');
  });

  it('無効・空・非標準値は null', () => {
    expect(normalizeCountryCode(null)).toBeNull();
    expect(normalizeCountryCode('')).toBeNull();
    expect(normalizeCountryCode('japan')).toBeNull();
    expect(normalizeCountryCode('ZZ')).toBeNull();
  });
});

describe('resolveWebSignupPlatform', () => {
  it('web を返す', () => {
    expect(resolveWebSignupPlatform()).toBe('web');
  });
});

describe('resolveWebSignupCountry', () => {
  it('geoStore の値を正規化する', () => {
    expect(resolveWebSignupCountry('jp')).toBe('JP');
    expect(resolveWebSignupCountry('invalid')).toBeNull();
  });
});
