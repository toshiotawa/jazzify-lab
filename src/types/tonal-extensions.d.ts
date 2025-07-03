import 'tonal';

declare module 'tonal' {
  namespace Key {
    // Missing from official typings: transpose key by interval
    // interval can be string like "5P" or object returned by Interval.fromSemitones.
    // Return value is the transposed key name, e.g., "C major" → "D major".
    // Using `unknown` for interval here keeps it flexible but typed.
    function transpose(keyName: string, interval: unknown): string;
  }
}