// src/hooks/useProdutos.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from '../services/storage';
import { enqueueOperation } from '../services/sync';
import { useNetInfo } from './useNetInfo';

const CACHE_KEY = '@produtos';

export function useProdutos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetInfo();

  // Carregar dados: primeiro do cache, depois do servidor se online
  const carregar = useCallback(async () => {
    setLoading(true);
    // 1. Carregar do cache local (já pode ter _pending)
    const cached = await getLocalData<any[]>(CACHE_KEY);
    if (cached) {
      setProdutos(cached);
    }

    // 2. Se online, buscar do Supabase e atualizar cache
    if (isConnected) {
      const { data, error } = await supabase
        .from('produto')
        .select('*')
        .order('nome');
      if (!error && data) {
        // Remover qualquer campo _pending que possa ter vindo do cache
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

  // Salvar (insert/update)
  const salvarProduto = useCallback(async (produto: any, id?: number) => {
    // Atualizar cache local imediatamente (otimista) e marcar como pendente
    const cached = await getLocalData<any[]>(CACHE_KEY) || [];
    let newProdutos: any[];
    let tempId = Date.now();
    if (id) {
      // update: manter outros campos e adicionar _pending
      newProdutos = cached.map(p =>
        p.idproduto === id ? { ...p, ...produto, _pending: true } : p
      );
    } else {
      // insert: gerar ID temporário e marcar _pending
      newProdutos = [
        ...cached,
        { ...produto, idproduto: tempId, _pending: true },
      ];
    }
    setProdutos(newProdutos);
    await saveLocalData(CACHE_KEY, newProdutos);

    // Adicionar à fila de sincronização
    await enqueueOperation({
      table: 'produto',
      action: id ? 'update' : 'insert',
      data: id ? { ...produto, idproduto: id } : produto,
    });

    // Se online, processar a fila imediatamente (isso vai remover o _pending)
    if (isConnected) {
      const { processQueue } = await import('../services/sync');
      processQueue();
    }

    // Recarregar para sincronizar (vai remover o _pending quando online)
    carregar();
  }, [isConnected, carregar]);

  // Excluir
  const excluirProduto = useCallback(async (id: number) => {
    // Remover do cache local imediatamente
    const cached = await getLocalData<any[]>(CACHE_KEY) || [];
    const newProdutos = cached.filter(p => p.idproduto !== id);
    setProdutos(newProdutos);
    await saveLocalData(CACHE_KEY, newProdutos);

    // Adicionar à fila
    await enqueueOperation({
      table: 'produto',
      action: 'delete',
      data: { idproduto: id },
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
    produtos,
    loading,
    carregar,
    salvarProduto,
    excluirProduto,
  };
}