import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from '../services/storage';
import { useNetInfo } from './useNetInfo';

const CACHE_KEY = '@vendas';

export function useVendas() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetInfo();

  const carregar = useCallback(async () => {
    setLoading(true);
    const cached = await getLocalData<any[]>(CACHE_KEY);
    if (cached) setVendas(cached);

    if (isConnected) {
      const { data, error } = await supabase
        .from('venda')
        .select('*, cliente(nome), usuario(nome)')
        .order('datavenda', { ascending: false });
      if (!error && data) {
        setVendas(data);
        await saveLocalData(CACHE_KEY, data);
      }
    }
    setLoading(false);
  }, [isConnected]);

  const criarVenda = useCallback(async (vendaData: any) => {

    if (isConnected) {
    }
    
  }, [isConnected]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { vendas, loading, carregar };
}