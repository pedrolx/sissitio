import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from '../services/storage';
import { enqueueOperation } from '../services/sync';
import { useNetInfo } from './useNetInfo';

const CACHE_KEY = '@clientes';

export function useClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetInfo();
  const isSaving = useRef(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const cached = await getLocalData<any[]>(CACHE_KEY);
    if (cached) setClientes(cached);

    if (isConnected) {
      const { data, error } = await supabase
        .from('cliente')
        .select('*')
        .order('nome');
      if (!error && data) {
        const cleanData = data.map(item => {
          const { _pending, ...rest } = item;
          return rest;
        });
        setClientes(cleanData);
        await saveLocalData(CACHE_KEY, cleanData);
      }
    }
    setLoading(false);
  }, [isConnected]);

  const salvarCliente = useCallback(async (cliente: any, id?: number) => {
    if (isSaving.current) return;
    isSaving.current = true;
    try {
      const cached = await getLocalData<any[]>(CACHE_KEY) || [];
      let newClientes: any[];
      let tempId = Date.now();
      if (id) {
        newClientes = cached.map(c =>
          c.idcliente === id ? { ...c, ...cliente, _pending: true } : c
        );
      } else {
        newClientes = [
          ...cached,
          { ...cliente, idcliente: tempId, _pending: true },
        ];
      }
      setClientes(newClientes);
      await saveLocalData(CACHE_KEY, newClientes);

      await enqueueOperation({
        table: 'cliente',
        action: id ? 'update' : 'insert',
        data: id ? { ...cliente, idcliente: id } : cliente,
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

  const excluirCliente = useCallback(async (id: number) => {
    const cached = await getLocalData<any[]>(CACHE_KEY) || [];
    const newClientes = cached.filter(c => c.idcliente !== id);
    setClientes(newClientes);
    await saveLocalData(CACHE_KEY, newClientes);

    await enqueueOperation({
      table: 'cliente',
      action: 'delete',
      data: { idcliente: id },
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

  return { clientes, loading, carregar, salvarCliente, excluirCliente };
}