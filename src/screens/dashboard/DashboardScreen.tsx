import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width - 32;

// ========== INTERFACES ==========
interface Movimentacao {
  idmovimentacao: number;
  datamovimentacao: string;
  tipomovimentacao: string;
  quantidade: number;
  produto: { nome: string }[] | null;
}

interface ProdutoEstoque {
  quantidadeatual: number;
  produto: { nome: string; unidademedida: string }[] | null;
}

interface ItemVenda {
  idproduto: number;
  quantidade: number;
  produto: { nome: string }[] | null;
}

// ========== COMPONENTE ==========
export default function DashboardScreen({ navigation }: { navigation: any }) {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [totalVendasHoje, setTotalVendasHoje] = useState<number>(0);
  const [totalVendasMes, setTotalVendasMes] = useState<number>(0);
  const [produtosBaixo, setProdutosBaixo] = useState<ProdutoEstoque[]>([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<
    { nome: string; total: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      // 1. Últimas 3 movimentações
      const { data: movData, error: movError } = await supabase
        .from('movimentacao')
        .select('*, produto(nome)')
        .order('datamovimentacao', { ascending: false })
        .limit(3);

      if (movError) throw movError;
      setMovimentacoes((movData as unknown as Movimentacao[]) || []);

      // 2. Total de vendas de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const { data: vendasHoje, error: vendaHojeError } = await supabase
        .from('venda')
        .select('valortotal')
        .gte('datavenda', hoje.toISOString())
        .lt('datavenda', amanha.toISOString());

      if (vendaHojeError) throw vendaHojeError;
      const totalHoje = vendasHoje?.reduce((sum, v) => sum + v.valortotal, 0) || 0;
      setTotalVendasHoje(totalHoje);

      // 3. Total de vendas do mês
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const { data: vendasMes, error: vendaMesError } = await supabase
        .from('venda')
        .select('valortotal')
        .gte('datavenda', primeiroDiaMes.toISOString());

      if (vendaMesError) throw vendaMesError;
      const totalMes = vendasMes?.reduce((sum, v) => sum + v.valortotal, 0) || 0;
      setTotalVendasMes(totalMes);

      // 4. Produtos com estoque baixo (menos de 5)
      const { data: estoque, error: estoqueError } = await supabase
        .from('estoque')
        .select('quantidadeatual, produto(nome, unidademedida)')
        .lt('quantidadeatual', 5);

      if (estoqueError) throw estoqueError;
      setProdutosBaixo((estoque as unknown as ProdutoEstoque[]) || []);

      // 5. Produtos mais vendidos (Top 5)
      const { data: maisVendidos, error: maisVendidosError } = await supabase
        .from('itemvenda')
        .select('idproduto, quantidade, produto(nome)')
        .order('quantidade', { ascending: false })
        .limit(5);

      if (maisVendidosError) throw maisVendidosError;

      // Agrupar por nome do produto
      const grouped: Record<string, number> = {};
      (maisVendidos as unknown as ItemVenda[]).forEach((item) => {
        const nome = item.produto?.[0]?.nome || 'Desconhecido';
        grouped[nome] = (grouped[nome] || 0) + item.quantidade;
      });

      const top5 = Object.entries(grouped)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setProdutosMaisVendidos(top5);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = () => {
    setRefreshing(true);
    carregarDados();
  };

  const formatarData = (data: string | null | undefined): string => {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.containerLoading}>
        <ActivityIndicator size="large" color="#3E7C59" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>📊 SIS SÍTIO</Text>

        {/* Cards de totais */}
        <View style={styles.cardsRow}>
          <View style={[styles.cardPequeno, { backgroundColor: '#3E7C59' }]}>
            <Text style={styles.cardPequenoLabel}>Hoje</Text>
            <Text style={styles.cardPequenoValor}>R$ {totalVendasHoje.toFixed(2)}</Text>
          </View>
          <View style={[styles.cardPequeno, { backgroundColor: '#C17F59' }]}>
            <Text style={styles.cardPequenoLabel}>Mês</Text>
            <Text style={styles.cardPequenoValor}>R$ {totalVendasMes.toFixed(2)}</Text>
          </View>
        </View>

        {/* Gráfico de produtos mais vendidos */}
        {produtosMaisVendidos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Produtos Mais Vendidos</Text>
            <BarChart
              data={{
                labels: produtosMaisVendidos.map((item) => item.nome.substring(0, 10)),
                datasets: [{ data: produtosMaisVendidos.map((item) => item.total) }],
              }}
              width={screenWidth}
              height={200}
              chartConfig={{
                backgroundColor: '#FFF',
                backgroundGradientFrom: '#FFF',
                backgroundGradientTo: '#FFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(62, 124, 89, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 8 },
              }}
              style={styles.chart}
              fromZero={true}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        )}

        {/* Produtos em baixa */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Produtos com Estoque Baixo</Text>
          {produtosBaixo.length === 0 ? (
            <Text style={styles.movimento}>Nenhum produto em baixa</Text>
          ) : (
            produtosBaixo.map((item, idx) => {
              const nome = item.produto?.[0]?.nome || '—';
              const unidade = item.produto?.[0]?.unidademedida || '';
              return (
                <Text key={idx} style={styles.movimento}>
                  {nome} – {item.quantidadeatual} {unidade}
                </Text>
              );
            })
          )}
        </View>

        {/* Últimas movimentações */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔄 Últimas Movimentações</Text>
          {movimentacoes.length === 0 ? (
            <Text style={styles.movimento}>Nenhuma movimentação registrada</Text>
          ) : (
            movimentacoes.map((item, idx) => {
              const nomeProduto = item.produto?.[0]?.nome || 'Animal';
              return (
                <Text key={idx} style={styles.movimento}>
                  {formatarData(item.datamovimentacao)} – {item.tipomovimentacao} – {nomeProduto}{' '}
                  {item.quantidade ? `(${item.quantidade})` : ''}
                </Text>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Menu inferior fixo */}
      <View style={styles.bottomMenu}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Text>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ListaVendas')}>
          <Text>🛒</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ListaMovimentacoes')}>
          <Text>🔄</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ListaEstoque')}>
          <Text>📦</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
          <Text>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF' },
  containerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F5EF',
  },
  loadingText: { marginTop: 16, color: '#8A8A8A', fontFamily: 'Inter' },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat',
    fontWeight: '700',
    color: '#2C2C2C',
    padding: 20,
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  cardPequeno: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  cardPequenoLabel: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Inter',
    opacity: 0.9,
  },
  cardPequenoValor: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 12,
    color: '#2C2C2C',
  },
  movimento: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#8A8A8A',
    marginBottom: 8,
  },
  chart: { marginVertical: 8, borderRadius: 8 },
  bottomMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D2D2D2',
  },
});