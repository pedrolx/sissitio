import { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { processQueue } from '../services/sync';
import { useNetInfo } from './useNetInfo';
import React from 'react';

export function useFocusSync() {
  const { isConnected } = useNetInfo();

  useFocusEffect(
    React.useCallback(() => {
      if (isConnected) {
        processQueue();
      }
    }, [isConnected])
  );
}