import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from '../services/storage';
import { enqueueOperation } from '../services/sync';
import { useNetInfo } from './useNetInfo';
import { useAuth } from './useAuth';

const CACHE_KEY = '@anotacoes';

export interface Anotacao {
  idanotacao: number;
  titulo: string;
  conteudo: string | null;
  prioridade: 'baixa' | 'media' | 'alta';
  categoria: string | null;
  data_criacao: string;
  data_atualizacao: string;
  concluida: boolean;
  _pending?: boolean;
}

export function useAnotacoes() {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetInfo();
  const { user } = useAuth();
  const isSaving = useRef(false);

  const carregar = useCallback(async () => {
    if (!user) {
      setAnotacoes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const cached = await getLocalData<Anotacao[]>(CACHE_KEY);
    if (cached) setAnotacoes(cached);

    if (isConnected) {
      const { data, error } = await supabase
        .from('anotacao')
        .select('*')
        .eq('iduser', user.id)
        .order('data_criacao', { ascending: false });

      if (!error && data) {
        const cleanData = data.map(item => {
          const { _pending, ...rest } = item;
          return rest;
        });
        setAnotacoes(cleanData as Anotacao[]);
        await saveLocalData(CACHE_KEY, cleanData);
      }
    }
    setLoading(false);
  }, [isConnected, user]);

  const salvarAnotacao = useCallback(async (anotacao: Omit<Anotacao, 'idanotacao' | 'data_criacao' | 'data_atualizacao'>, id?: number) => {
    if (isSaving.current || !user) return;
    isSaving.current = true;

    try {
      const cached = await getLocalData<Anotacao[]>(CACHE_KEY) || [];
      let newAnotacoes: Anotacao[];
      let tempId = Date.now();

      const novaAnotacao: Anotacao = {
        ...anotacao,
        idanotacao: tempId,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        _pending: true,
      } as Anotacao;

      if (id) {
        newAnotacoes = cached.map(a =>
          a.idanotacao === id ? { ...a, ...anotacao, data_atualizacao: new Date().toISOString(), _pending: true } : a
        );
      } else {
        newAnotacoes = [novaAnotacao, ...cached];
      }

      setAnotacoes(newAnotacoes);
      await saveLocalData(CACHE_KEY, newAnotacoes);

      await enqueueOperation({
        table: 'anotacao',
        action: id ? 'update' : 'insert',
        data: id ? { ...anotacao, idanotacao: id, iduser: user.id } : { ...anotacao, iduser: user.id },
      });

      if (isConnected) {
        const { processQueue } = await import('../services/sync');
        await processQueue();
      }
      await carregar();
    } finally {
      isSaving.current = false;
    }
  }, [isConnected, carregar, user]);

  const excluirAnotacao = useCallback(async (id: number) => {
    const cached = await getLocalData<Anotacao[]>(CACHE_KEY) || [];
    const newAnotacoes = cached.filter(a => a.idanotacao !== id);
    setAnotacoes(newAnotacoes);
    await saveLocalData(CACHE_KEY, newAnotacoes);

    await enqueueOperation({
      table: 'anotacao',
      action: 'delete',
      data: { idanotacao: id },
    });

    if (isConnected) {
      const { processQueue } = await import('../services/sync');
      await processQueue();
    }
    await carregar();
  }, [isConnected, carregar]);

  const marcarConcluida = useCallback(async (id: number, concluida: boolean) => {
    const cached = await getLocalData<Anotacao[]>(CACHE_KEY) || [];
    const newAnotacoes = cached.map(a =>
      a.idanotacao === id ? { ...a, concluida, _pending: true } : a
    );
    setAnotacoes(newAnotacoes);
    await saveLocalData(CACHE_KEY, newAnotacoes);

    await enqueueOperation({
      table: 'anotacao',
      action: 'update',
      data: { idanotacao: id, concluida },
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
    anotacoes,
    loading,
    carregar,
    salvarAnotacao,
    excluirAnotacao,
    marcarConcluida,
  };
}