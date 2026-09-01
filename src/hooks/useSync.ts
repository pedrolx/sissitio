import { useEffect, useRef } from 'react';
import { processQueue, startPeriodicSync } from '../services/sync';

export function useSync(autoSync = true) {
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    processQueue();

    if (autoSync) {
      stopRef.current = startPeriodicSync(30000);
    }
    return () => {
      if (stopRef.current) stopRef.current();
    };
  }, [autoSync]);
}