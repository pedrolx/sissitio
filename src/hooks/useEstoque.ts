import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from '../services/storage';
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
      try {
        // Buscar estoque
        const { data: estoqueData, error: estError } = await supabase
          .from('estoque')
          .select('*')
          .order('idproduto');

        if (estError) throw estError;

        // Buscar produtos
        const { data: produtos, error: prodError } = await supabase
          .from('produto')
          .select('idproduto, nome, categoria, unidademedida');

        if (prodError) throw prodError;

        // Combinar
        const estoqueComProdutos = estoqueData.map(e => ({
          ...e,
          produto: produtos?.find(p => p.idproduto === e.idproduto) || null,
        }));

        setEstoque(estoqueComProdutos);
        await saveLocalData(CACHE_KEY, estoqueComProdutos);
      } catch (err) {
        console.error('[useEstoque] erro ao carregar:', err);
      }
    }

    setLoading(false);
  }, [isConnected]);

  const atualizarEstoque = useCallback(async (idproduto: number, novaQuantidade: number) => {

  }, [isConnected, carregar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { estoque, loading, carregar, atualizarEstoque };
}