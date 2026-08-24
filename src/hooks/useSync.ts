import { useEffect, useRef } from 'react';
import { processQueue, startPeriodicSync } from '../services/sync';

export function useSync(autoSync = true) {
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Processar imediatamente ao montar
    processQueue();

    if (autoSync) {
      stopRef.current = startPeriodicSync(30000); // a cada 30s
    }
    return () => {
      if (stopRef.current) stopRef.current();
    };
  }, [autoSync]);
}