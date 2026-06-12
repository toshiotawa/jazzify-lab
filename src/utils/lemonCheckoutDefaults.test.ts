import {
  isJapanCountryCode,
  readGeoCountryFromHeaders,
  resolveCheckoutDefaults,
} from '../../netlify/functions/lib/lemonCheckoutDefaults';

describe('isJapanCountryCode', () => {
  it('accepts JP aliases', () => {
    expect(isJapanCountryCode('JP')).toBe(true);
    expect(isJapanCountryCode('jpn')).toBe(true);
    expect(isJapanCountryCode(' Japan ')).toBe(true);
  });

  it('rejects non-Japan codes', () => {
    expect(isJapanCountryCode('US')).toBe(false);
    expect(isJapanCountryCode(null)).toBe(false);
  });
});

describe('resolveCheckoutDefaults', () => {
  it('prefers profile country when set to Japan', () => {
    expect(resolveCheckoutDefaults({
      profileCountry: 'JP',
      geoCountry: 'US',
      preferredLocale: 'en',
    })).toEqual({ country: 'JP', locale: 'ja' });
  });

  it('uses US when profile country is explicitly non-Japan', () => {
    expect(resolveCheckoutDefaults({
      profileCountry: 'DE',
      geoCountry: 'JP',
      preferredLocale: 'ja',
    })).toEqual({ country: 'US', locale: 'en' });
  });

  it('falls back to geo country when profile country is missing', () => {
    expect(resolveCheckoutDefaults({
      profileCountry: null,
      geoCountry: 'JP',
      preferredLocale: null,
    })).toEqual({ country: 'JP', locale: 'ja' });

    expect(resolveCheckoutDefaults({
      profileCountry: null,
      geoCountry: 'GB',
      preferredLocale: null,
    })).toEqual({ country: 'US', locale: 'en' });
  });

  it('falls back to preferred locale when country hints are missing', () => {
    expect(resolveCheckoutDefaults({
      profileCountry: null,
      geoCountry: null,
      preferredLocale: 'ja',
    })).toEqual({ country: 'JP', locale: 'ja' });
  });

  it('defaults to US when no hints are available', () => {
    expect(resolveCheckoutDefaults({
      profileCountry: null,
      geoCountry: null,
      preferredLocale: null,
    })).toEqual({ country: 'US', locale: 'en' });
  });
});

describe('readGeoCountryFromHeaders', () => {
  it('reads x-country header case-insensitively', () => {
    expect(readGeoCountryFromHeaders({ 'x-country': 'jp' })).toBe('JP');
    expect(readGeoCountryFromHeaders({ 'X-Country': 'us' })).toBe('US');
    expect(readGeoCountryFromHeaders({})).toBeNull();
  });
});
