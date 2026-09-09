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
      try {
        // Buscar movimentações
        const { data: movs, error: movError } = await supabase
          .from('movimentacao')
          .select('*')
          .order('datamovimentacao', { ascending: false });

        if (movError) throw movError;

        // Buscar produtos (para obter nomes)
        const { data: produtos, error: prodError } = await supabase
          .from('produto')
          .select('idproduto, nome, unidademedida');

        if (prodError) throw prodError;

        // Buscar animais (para obter espécie e observações)
        const { data: animais, error: animalError } = await supabase
          .from('animal')
          .select('idanimal, especie, observacoes');

        if (animalError) throw animalError;

        // Combinar
        const movsComNomes = movs.map(m => ({
          ...m,
          produto: produtos?.find(p => p.idproduto === m.idproduto) || null,
          animal: animais?.find(a => a.idanimal === m.idanimal) || null,
        }));

        setMovimentacoes(movsComNomes);
        await saveLocalData(CACHE_KEY, movsComNomes);
      } catch (err) {
        console.error('[useMovimentacoes] erro ao carregar:', err);
      }
    }

    setLoading(false);
  }, [isConnected]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { movimentacoes, loading, carregar };
}