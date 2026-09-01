import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from '../services/storage';
import { enqueueOperation } from '../services/sync';
import { useNetInfo } from './useNetInfo';

const CACHE_KEY = '@animais';

export function useAnimais() {
  const [animais, setAnimais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetInfo();
  const isSaving = useRef(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const cached = await getLocalData<any[]>(CACHE_KEY);
    if (cached) setAnimais(cached);

    if (isConnected) {
      const { data, error } = await supabase
        .from('animal')
        .select('*')
        .order('especie');
      if (!error && data) {
        const cleanData = data.map(item => {
          const { _pending, ...rest } = item;
          return rest;
        });
        setAnimais(cleanData);
        await saveLocalData(CACHE_KEY, cleanData);
      }
    }
    setLoading(false);
  }, [isConnected]);

  const salvarAnimal = useCallback(async (animal: any, id?: number) => {
    if (isSaving.current) return;
    isSaving.current = true;
    try {
      const cached = await getLocalData<any[]>(CACHE_KEY) || [];
      let newAnimais: any[];
      let tempId = Date.now();
      if (id) {
        newAnimais = cached.map(a =>
          a.idanimal === id ? { ...a, ...animal, _pending: true } : a
        );
      } else {
        newAnimais = [
          ...cached,
          { ...animal, idanimal: tempId, _pending: true },
        ];
      }
      setAnimais(newAnimais);
      await saveLocalData(CACHE_KEY, newAnimais);

      await enqueueOperation({
        table: 'animal',
        action: id ? 'update' : 'insert',
        data: id ? { ...animal, idanimal: id } : animal,
      });

      if (isConnected) {
        const { processQueue } = await import('../services/sync');
        await processQueue();
      }
      await carregar();
    } finally {
      isSaving.current = false;
    }
  }, [isConnected, carregar]);

  const excluirAnimal = useCallback(async (id: number) => {
    const cached = await getLocalData<any[]>(CACHE_KEY) || [];
    const newAnimais = cached.filter(a => a.idanimal !== id);
    setAnimais(newAnimais);
    await saveLocalData(CACHE_KEY, newAnimais);

    await enqueueOperation({
      table: 'animal',
      action: 'delete',
      data: { idanimal: id },
    });

    if (isConnected) {
      const { processQueue } = await import('../services/sync');
      await processQueue();
    }
    await carregar();
  }, [isConnected, carregar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { animais, loading, carregar, salvarAnimal, excluirAnimal };
}