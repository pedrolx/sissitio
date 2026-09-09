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

    // Cache
    const cached = await getLocalData<any[]>(CACHE_KEY);
    if (cached) setVendas(cached);

    if (isConnected) {
      try {
        const { data: vendasData, error: vendaError } = await supabase
          .from('venda')
          .select('*')
          .order('datavenda', { ascending: false });

        if (vendaError) {
          console.error('[useVendas] erro na consulta:', vendaError);
        } else {
          // Exibe o primeiro item para confirmar
          if (vendasData && vendasData.length > 0) {
          }
        }

        if (!vendaError && vendasData) {
          // Buscar clientes e usuários
          const { data: clientes } = await supabase.from('cliente').select('idcliente, nome');
          const { data: usuarios } = await supabase.from('usuario').select('iduser, nome');

          const vendasComNomes = vendasData.map(v => ({
            ...v,
            cliente: clientes?.find(c => c.idcliente === v.idcliente) || null,
            usuario: usuarios?.find(u => u.iduser === v.idusuario) || null,
          }));
          
          setVendas(vendasComNomes);
          await saveLocalData(CACHE_KEY, vendasComNomes);
        }
      } catch (err) {
        console.error('[useVendas] exceção:', err);
      }
    }

    setLoading(false);
  }, [isConnected]);

  const criarVenda = useCallback(async (vendaData: any) => {
    if (!isConnected) {
      throw new Error('Sem conexão com a internet. Conecte-se para registrar a venda.');
    }

    try {
      const { data, error } = await supabase
        .from('venda')
        .insert([vendaData])
        .select()
        .single();

      if (error) throw error;

      // Recarregar a lista após inserir
      await carregar();
      return data;
    } catch (error) {
      console.error('[useVendas] Erro ao criar venda:', error);
      throw error;
    }
  }, [isConnected, carregar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { vendas, loading, carregar, criarVenda };
}