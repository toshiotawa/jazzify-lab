import {
  buildNetlifyFormBody,
  CONTACT_EMAIL_MAX_LENGTH,
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_NAME_MAX_LENGTH,
  normalizeContactInput,
  validateContactInput,
} from '@/utils/contactSubmission';

describe('normalizeContactInput', () => {
  it('trims fields and defaults source to web', () => {
    expect(normalizeContactInput({
      name: '  Alice  ',
      email: ' alice@example.com ',
      message: ' Hello ',
      botField: '',
    })).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello',
      botField: '',
      source: 'web',
      locale: undefined,
      appVersion: undefined,
    });
  });

  it('accepts ios source and optional metadata', () => {
    expect(normalizeContactInput({
      name: 'Bob',
      email: 'bob@example.com',
      message: 'Hi',
      source: 'ios',
      locale: 'ja',
      appVersion: '1.4.8',
    })).toEqual({
      name: 'Bob',
      email: 'bob@example.com',
      message: 'Hi',
      botField: '',
      source: 'ios',
      locale: 'ja',
      appVersion: '1.4.8',
    });
  });
});

describe('validateContactInput', () => {
  const validInput = normalizeContactInput({
    name: 'Alice',
    email: 'alice@example.com',
    message: 'Hello',
  });

  it('accepts valid input', () => {
    expect(validateContactInput(validInput)).toEqual({ ok: true });
  });

  it('rejects empty name', () => {
    expect(validateContactInput({ ...validInput, name: '' })).toEqual({
      ok: false,
      reason: 'name',
    });
  });

  it('rejects invalid email', () => {
    expect(validateContactInput({ ...validInput, email: 'not-an-email' })).toEqual({
      ok: false,
      reason: 'email',
    });
  });

  it('rejects empty message', () => {
    expect(validateContactInput({ ...validInput, message: '' })).toEqual({
      ok: false,
      reason: 'message',
    });
  });

  it('rejects overly long fields', () => {
    expect(validateContactInput({
      ...validInput,
      name: 'a'.repeat(CONTACT_NAME_MAX_LENGTH + 1),
    })).toEqual({ ok: false, reason: 'tooLong' });

    expect(validateContactInput({
      ...validInput,
      email: `${'a'.repeat(CONTACT_EMAIL_MAX_LENGTH)}@x.com`,
    })).toEqual({ ok: false, reason: 'tooLong' });

    expect(validateContactInput({
      ...validInput,
      message: 'm'.repeat(CONTACT_MESSAGE_MAX_LENGTH + 1),
    })).toEqual({ ok: false, reason: 'tooLong' });
  });
});

describe('buildNetlifyFormBody', () => {
  it('builds urlencoded body for Netlify Forms', () => {
    expect(buildNetlifyFormBody({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Hello world',
    })).toBe(
      'form-name=contact&bot-field=&name=Alice&email=alice%40example.com&message=Hello%20world',
    );
  });
});
