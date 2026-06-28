/**
 * Web Audio 用に MP3 等を丸ごと取得する。
 * キャッシュ検証の 206（1 byte Range）では body が欠けるため、必要なら再取得する。
 */
export const fetchFullAudioBuffer = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url, {
    mode: 'cors',
    credentials: 'omit',
  });

  if (response.status === 206) {
    const fullResponse = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    });
    if (!fullResponse.ok) {
      throw new Error(`Failed to fetch audio (retry): ${fullResponse.status}`);
    }
    if (fullResponse.status === 206) {
      throw new Error('Failed to fetch full audio: partial content only');
    }
    return fullResponse.arrayBuffer();
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }

  return response.arrayBuffer();
};
