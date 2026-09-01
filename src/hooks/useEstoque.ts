import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from '../services/storage';
import { enqueueOperation } from '../services/sync';
import { useNetInfo } from './useNetInfo';

const CACHE_KEY = '@estoque';

export function useEstoque() {
  const [estoque, setEstoque] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetInfo();

  const carregar = useCallback(async () => {
    setLoading(true);
    const cached = await getLocalData<any[]>(CACHE_KEY);
    if (cached) setEstoque(cached);

    if (isConnected) {
      const { data, error } = await supabase
        .from('estoque')
        .select('*, produto(nome, categoria, unidademedida)')
        .order('produto(nome)');
      if (!error && data) {
        setEstoque(data);
        await saveLocalData(CACHE_KEY, data);
      }
    }
    setLoading(false);
  }, [isConnected]);

  const atualizarEstoque = useCallback(async (idproduto: number, novaQuantidade: number) => {
    const cached = await getLocalData<any[]>(CACHE_KEY) || [];
    const newEstoque = cached.map(e => 
      e.idproduto === idproduto ? { ...e, quantidadeatual: novaQuantidade } : e
    );
    setEstoque(newEstoque);
    await saveLocalData(CACHE_KEY, newEstoque);

    await enqueueOperation({
      table: 'estoque',
      action: 'update',
      data: { idproduto, quantidadeatual: novaQuantidade },
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

  return { estoque, loading, carregar, atualizarEstoque };
}