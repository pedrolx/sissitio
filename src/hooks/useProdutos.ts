// src/hooks/useProdutos.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from '../services/storage';
import { enqueueOperation } from '../services/sync';
import { useNetInfo } from './useNetInfo';

const CACHE_KEY = '@produtos';

export function useProdutos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetInfo();
  const isSaving = useRef(false); // trava para evitar duplicação

  const carregar = useCallback(async () => {
    setLoading(true);
    const cached = await getLocalData<any[]>(CACHE_KEY);
    if (cached) setProdutos(cached);

    if (isConnected) {
      const { data, error } = await supabase
        .from('produto')
        .select('*')
        .order('nome');
      if (!error && data) {
        const cleanData = data.map(item => {
          const { _pending, ...rest } = item;
          return rest;
        });
        setProdutos(cleanData);
        await saveLocalData(CACHE_KEY, cleanData);
      }
    }
    setLoading(false);
  }, [isConnected]);

  const salvarProduto = useCallback(async (produto: any, id?: number) => {
    if (isSaving.current) return; // previne chamadas simultâneas
    isSaving.current = true;

    try {
      const cached = await getLocalData<any[]>(CACHE_KEY) || [];
      let newProdutos: any[];
      let tempId = Date.now();
      if (id) {
        newProdutos = cached.map(p =>
          p.idproduto === id ? { ...p, ...produto, _pending: true } : p
        );
      } else {
        newProdutos = [
          ...cached,
          { ...produto, idproduto: tempId, _pending: true },
        ];
      }
      setProdutos(newProdutos);
      await saveLocalData(CACHE_KEY, newProdutos);

      await enqueueOperation({
        table: 'produto',
        action: id ? 'update' : 'insert',
        data: id ? { ...produto, idproduto: id } : produto,
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

  const excluirProduto = useCallback(async (id: number) => {
    const cached = await getLocalData<any[]>(CACHE_KEY) || [];
    const newProdutos = cached.filter(p => p.idproduto !== id);
    setProdutos(newProdutos);
    await saveLocalData(CACHE_KEY, newProdutos);

    await enqueueOperation({
      table: 'produto',
      action: 'delete',
      data: { idproduto: id },
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

  return {
    produtos,
    loading,
    carregar,
    salvarProduto,
    excluirProduto,
  };
}