export type ContactSource = 'web' | 'ios';

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  botField: string;
  source: ContactSource;
  locale?: string;
  appVersion?: string;
}

export type ContactValidationReason = 'name' | 'email' | 'message' | 'tooLong';

export type ContactValidationResult =
  | { ok: true }
  | { ok: false; reason: ContactValidationReason };

export const CONTACT_NAME_MAX_LENGTH = 200;
export const CONTACT_EMAIL_MAX_LENGTH = 320;
export const CONTACT_MESSAGE_MAX_LENGTH = 5000;

const trimOptional = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const trimRequired = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const parseSource = (value: unknown): ContactSource =>
  value === 'ios' ? 'ios' : 'web';

export const normalizeContactInput = (raw: {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  botField?: unknown;
  source?: unknown;
  locale?: unknown;
  appVersion?: unknown;
}): ContactInput => ({
  name: trimRequired(raw.name),
  email: trimRequired(raw.email),
  message: trimRequired(raw.message),
  botField: trimRequired(raw.botField),
  source: parseSource(raw.source),
  locale: trimOptional(raw.locale),
  appVersion: trimOptional(raw.appVersion),
});

export const validateContactInput = (input: ContactInput): ContactValidationResult => {
  if (input.name.length === 0) {
    return { ok: false, reason: 'name' };
  }
  if (input.email.length === 0 || !input.email.includes('@')) {
    return { ok: false, reason: 'email' };
  }
  if (input.message.length === 0) {
    return { ok: false, reason: 'message' };
  }
  if (
    input.name.length > CONTACT_NAME_MAX_LENGTH
    || input.email.length > CONTACT_EMAIL_MAX_LENGTH
    || input.message.length > CONTACT_MESSAGE_MAX_LENGTH
  ) {
    return { ok: false, reason: 'tooLong' };
  }
  return { ok: true };
};

const encodeFormValue = (value: string): string =>
  encodeURIComponent(value);

export const buildNetlifyFormBody = (input: Pick<ContactInput, 'name' | 'email' | 'message'>): string => {
  const params: Array<[string, string]> = [
    ['form-name', 'contact'],
    ['bot-field', ''],
    ['name', input.name],
    ['email', input.email],
    ['message', input.message],
  ];
  return params
    .map(([key, value]) => `${encodeFormValue(key)}=${encodeFormValue(value)}`)
    .join('&');
};
