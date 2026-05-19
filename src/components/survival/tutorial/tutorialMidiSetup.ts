/** Web MIDI: 接続済み入力デバイスがあるか（iOS OnboardingScript.hadDeviceInitially 相当） */
export async function hasWebMidiInputDeviceInitially(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      return false;
    }
    const access = await navigator.requestMIDIAccess({ sysex: false });
    return access.inputs.size > 0;
  } catch {
    return false;
  }
}
