import React from 'react';

export const MinimalTest: React.FC = () => {
  console.log('MinimalTest: Rendering');
  
  let error: any = null;
  
  try {
    console.log('MinimalTest: Before importing store');
    const { useGlobalTimeStore } = require('@/stores/globalTimeStore');
    console.log('MinimalTest: After importing store');
    
    const store = useGlobalTimeStore();
    console.log('MinimalTest: Store accessed', store);
  } catch (e) {
    error = e;
    console.error('MinimalTest: Error', e);
  }
  
  return (
    <div>
      <h1>Minimal Test</h1>
      {error ? (
        <div>
          <p>Error occurred:</p>
          <pre>{error.toString()}</pre>
          <pre>{error.stack}</pre>
        </div>
      ) : (
        <p>No error!</p>
      )}
    </div>
  );
};