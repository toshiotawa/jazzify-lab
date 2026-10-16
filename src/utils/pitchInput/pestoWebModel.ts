import { PESTO_MODEL_ID } from './pitchInputTypes';

const MODEL_URL = `/models/pesto/${PESTO_MODEL_ID}.onnx`;
const MODEL_SIZE = 11_150_637;
const MODEL_SHA256 = 'c50ca16a07297ddc2b788403268a43736cceb792ec599746da7d5486bca974b8';

/** The build emits exactly the same compact-v2 bytes; reconstruction stays offline. */
export const loadPestoWebModel = async (): Promise<Uint8Array> => {
  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Error('Failed to load PESTO model');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength !== MODEL_SIZE) throw new Error('Invalid PESTO model size');
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== MODEL_SHA256) throw new Error('PESTO model checksum mismatch');
  return new Uint8Array(buffer);
};
