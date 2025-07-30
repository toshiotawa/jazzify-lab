import React, { useEffect } from 'react';
import { useGlobalTimeStore } from '@/stores/globalTimeStore';
import { devLog } from '@/utils/logger';

export const TestRhythmMode: React.FC = () => {
  devLog.debug('🧪 TestRhythmMode: Component rendering');
  
  let storeAccessed = false;
  let storeError: any = null;
  let storeData: any = null;
  
  try {
    devLog.debug('🧪 TestRhythmMode: Attempting to access store');
    const store = useGlobalTimeStore();
    storeAccessed = true;
    storeData = {
      currentTime: store.currentTime,
      isPlaying: store.isPlaying,
      bpm: store.bpm,
      timeSignature: store.timeSignature
    };
    devLog.debug('🧪 TestRhythmMode: Store accessed successfully', storeData);
  } catch (error) {
    storeError = error;
    devLog.error('🧪 TestRhythmMode: Store access failed', error);
  }
  
  useEffect(() => {
    devLog.debug('🧪 TestRhythmMode: useEffect running');
  }, []);
  
  return (
    <div style={{ padding: '20px', border: '2px solid red', margin: '20px' }}>
      <h2>Rhythm Mode Test Component</h2>
      <div>
        <h3>Store Access Test:</h3>
        <p>Store Accessed: {storeAccessed ? '✅ Yes' : '❌ No'}</p>
        {storeError && (
          <div>
            <p>Error: {storeError.message || 'Unknown error'}</p>
            <pre>{JSON.stringify(storeError, null, 2)}</pre>
          </div>
        )}
        {storeData && (
          <div>
            <p>Store Data:</p>
            <pre>{JSON.stringify(storeData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};