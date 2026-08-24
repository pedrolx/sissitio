import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from '../services/storage';
import { enqueueOperation } from '../services/sync';
import { useNetInfo } from './useNetInfo';

const CACHE_KEY = '@clientes';

export function useClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetInfo();

  // Carregar dados: primeiro do cache, depois do servidor se online
  const carregar = useCallback(async () => {
    setLoading(true);
    // 1. Carregar do cache local
    const cached = await getLocalData<any[]>(CACHE_KEY);
    if (cached) {
      setClientes(cached);
    }

    // 2. Se online, buscar do Supabase e atualizar cache
    if (isConnected) {
      const { data, error } = await supabase
        .from('cliente')
        .select('*')
        .order('nome');
      if (!error && data) {
        setClientes(data);
        await saveLocalData(CACHE_KEY, data);
      }
    }
    setLoading(false);
  }, [isConnected]);

  // Salvar (insert/update)
  const salvarCliente = useCallback(async (cliente: any, id?: number) => {
    // Atualizar cache local imediatamente (otimista)
    const cached = await getLocalData<any[]>(CACHE_KEY) || [];
    let newClientes: any[];
    if (id) {
      // update
      newClientes = cached.map(c => c.idcliente === id ? { ...c, ...cliente } : c);
    } else {
      // insert – gerar ID temporário
      const tempId = Date.now();
      newClientes = [...cached, { ...cliente, idcliente: tempId }];
    }
    setClientes(newClientes);
    await saveLocalData(CACHE_KEY, newClientes);

    // Adicionar à fila de sincronização
    await enqueueOperation({
      table: 'cliente',
      action: id ? 'update' : 'insert',
      data: id ? { ...cliente, idcliente: id } : cliente,
    });

    // Se online, processar a fila imediatamente
    if (isConnected) {
      const { processQueue } = await import('../services/sync');
      processQueue();
    }

    // Recarregar para sincronizar (opcional, mas mantém consistência)
    carregar();
  }, [isConnected, carregar]);

  // Excluir
  const excluirCliente = useCallback(async (id: number) => {
    // Atualizar cache local removendo
    const cached = await getLocalData<any[]>(CACHE_KEY) || [];
    const newClientes = cached.filter(c => c.idcliente !== id);
    setClientes(newClientes);
    await saveLocalData(CACHE_KEY, newClientes);

    // Adicionar à fila
    await enqueueOperation({
      table: 'cliente',
      action: 'delete',
      data: { idcliente: id },
    });

    if (isConnected) {
      const { processQueue } = await import('../services/sync');
      processQueue();
    }
    carregar();
  }, [isConnected, carregar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    clientes,
    loading,
    carregar,
    salvarCliente,
    excluirCliente,
  };
}