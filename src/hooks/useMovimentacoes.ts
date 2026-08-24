import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from '../services/storage';
import { useNetInfo } from './useNetInfo';

const CACHE_KEY = '@movimentacoes';

export function useMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetInfo();

  const carregar = useCallback(async () => {
    setLoading(true);
    const cached = await getLocalData<any[]>(CACHE_KEY);
    if (cached) setMovimentacoes(cached);

    if (isConnected) {
      const { data, error } = await supabase
        .from('movimentacao')
        .select('*, produto(nome), animal(especie)')
        .order('datamovimentacao', { ascending: false });
      if (!error && data) {
        setMovimentacoes(data);
        await saveLocalData(CACHE_KEY, data);
      }
    }
    setLoading(false);
  }, [isConnected]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { movimentacoes, loading, carregar };
}