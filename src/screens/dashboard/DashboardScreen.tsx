import React, { useState, useEffect, useCallback } from 'react';
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
import { processQueue } from '../../services/sync';
import { useFocusEffect } from '@react-navigation/native';
import { formatDateBR } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';
import { AnotacoesWidget } from '../../components/AnotacoesWidget';

const screenWidth = Dimensions.get('window').width - 32;

// ========== INTERFACES ==========
interface Movimentacao {
  idmovimentacao: number;
  datamovimentacao: string;
  tipomovimentacao: string;
  quantidade: number;
  produto: { nome: string } | null;
  animal: { especie: string; observacoes?: string } | null;
}

interface ProdutoEstoque {
  quantidadeatual: number;
  produto: { nome: string; unidademedida: string } | null;
}

// ========== FUNÇÕES AUXILIARES ==========
function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayRangeUTC(date: Date): { start: string; end: string } {
  const dateStr = getDateString(date);
  return {
    start: `${dateStr}T00:00:00.000Z`,
    end: `${dateStr}T23:59:59.999Z`,
  };
}

// ========== COMPONENTE ==========
export default function DashboardScreen({ navigation }: { navigation: any }) {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [totalVendasHoje, setTotalVendasHoje] = useState<number>(0);
  const [totalVendasMes, setTotalVendasMes] = useState<number>(0);
  const [produtosBaixo, setProdutosBaixo] = useState<ProdutoEstoque[]>([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<{ nome: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  useFocusEffect(
    useCallback(() => {
      processQueue();
    }, [])
  );

  async function carregarDados() {
    setLoading(true);
    try {
      // ====== 1. ÚLTIMAS MOVIMENTAÇÕES ======
      const { data: movData } = await supabase
        .from('movimentacao')
        .select('*')
        .order('datamovimentacao', { ascending: false })
        .limit(3);

      const produtosIds = movData?.map(m => m.idproduto).filter((id): id is number => id !== null && id !== undefined) || [];
      const animaisIds = movData?.map(m => m.idanimal).filter((id): id is number => id !== null && id !== undefined) || [];

      let produtosMap: Record<number, { nome: string }> = {};
      let animaisMap: Record<number, { especie: string; observacoes?: string }> = {};

      if (produtosIds.length > 0) {
        const { data: prods } = await supabase.from('produto').select('idproduto, nome').in('idproduto', produtosIds);
        if (prods) {
          produtosMap = prods.reduce<Record<number, { nome: string }>>((acc, p) => {
            acc[p.idproduto] = { nome: p.nome };
            return acc;
          }, {});
        }
      }

      if (animaisIds.length > 0) {
        const { data: anims } = await supabase.from('animal').select('idanimal, especie, observacoes').in('idanimal', animaisIds);
        if (anims) {
          animaisMap = anims.reduce<Record<number, { especie: string; observacoes?: string }>>((acc, a) => {
            acc[a.idanimal] = { especie: a.especie, observacoes: a.observacoes };
            return acc;
          }, {});
        }
      }

      const movsComNomes = movData?.map(m => ({
        ...m,
        produto: m.idproduto && produtosMap[m.idproduto] ? produtosMap[m.idproduto] : null,
        animal: m.idanimal && animaisMap[m.idanimal] ? animaisMap[m.idanimal] : null,
      })) || [];
      setMovimentacoes(movsComNomes);

      // ====== 2. VENDAS DE HOJE ======
      const hoje = new Date();
      const { start: startHoje, end: endHoje } = getDayRangeUTC(hoje);
      const { data: vendasHoje, error: errHoje } = await supabase
        .from('venda')
        .select('valortotal')
        .gte('datavenda', startHoje)
        .lt('datavenda', endHoje);

      if (errHoje) console.error('[Dashboard] Erro ao buscar vendas de hoje:', errHoje);
      const totalHoje = vendasHoje?.reduce((sum, v) => sum + (v.valortotal || 0), 0) || 0;
      setTotalVendasHoje(totalHoje);

      // ====== 3. VENDAS DO MÊS ======
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const { start: startMes } = getDayRangeUTC(primeiroDiaMes);
      const { data: vendasMes, error: errMes } = await supabase
        .from('venda')
        .select('valortotal')
        .gte('datavenda', startMes);

      if (errMes) console.error('[Dashboard] Erro ao buscar vendas do mês:', errMes);
      const totalMes = vendasMes?.reduce((sum, v) => sum + (v.valortotal || 0), 0) || 0;
      setTotalVendasMes(totalMes);

      // ====== 4. PRODUTOS COM ESTOQUE BAIXO ======
      const { data: estoque } = await supabase
        .from('estoque')
        .select('quantidadeatual, idproduto')
        .lt('quantidadeatual', 5);

      const idsEstoque = estoque?.map(e => e.idproduto).filter((id): id is number => id !== null && id !== undefined) || [];
      let prodEstoqueMap: Record<number, { nome: string; unidademedida: string }> = {};
      if (idsEstoque.length > 0) {
        const { data: prods } = await supabase.from('produto').select('idproduto, nome, unidademedida').in('idproduto', idsEstoque);
        if (prods) {
          prodEstoqueMap = prods.reduce<Record<number, { nome: string; unidademedida: string }>>((acc, p) => {
            acc[p.idproduto] = { nome: p.nome, unidademedida: p.unidademedida };
            return acc;
          }, {});
        }
      }

      const estoqueComProdutos = estoque?.map(e => ({
        quantidadeatual: e.quantidadeatual,
        produto: e.idproduto && prodEstoqueMap[e.idproduto] ? prodEstoqueMap[e.idproduto] : null,
      })) || [];
      setProdutosBaixo(estoqueComProdutos);

      // ====== 5. PRODUTOS MAIS VENDIDOS ======
      const { data: maisVendidos } = await supabase
        .from('itemvenda')
        .select('idproduto, quantidade')
        .order('quantidade', { ascending: false })
        .limit(5);

      const idsProd = maisVendidos?.map(i => i.idproduto).filter((id): id is number => id !== null && id !== undefined) || [];
      let prodNomesMap: Record<number, string> = {};
      if (idsProd.length > 0) {
        const { data: prods } = await supabase.from('produto').select('idproduto, nome').in('idproduto', idsProd);
        if (prods) {
          prodNomesMap = prods.reduce<Record<number, string>>((acc, p) => {
            acc[p.idproduto] = p.nome;
            return acc;
          }, {});
        }
      }

      const grouped: Record<string, number> = {};
      (maisVendidos || []).forEach((item) => {
        const nome = item.idproduto && prodNomesMap[item.idproduto] ? prodNomesMap[item.idproduto] : 'Produto removido';
        grouped[nome] = (grouped[nome] || 0) + (item.quantidade || 0);
      });
      const top5 = Object.entries(grouped)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setProdutosMaisVendidos(top5);

    } catch (error) {
      console.error('[Dashboard] Erro ao carregar dados:', error);
    }
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = () => {
    setRefreshing(true);
    carregarDados();
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

        {/* GRID DE ACESSO RÁPIDO */}
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaProdutos')}>
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={styles.menuText}>Produtos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaEstoque')}>
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>Estoque</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaAnimais')}>
            <Text style={styles.menuIcon}>🐓</Text>
            <Text style={styles.menuText}>Animais</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaVendas')}>
            <Text style={styles.menuIcon}>💰</Text>
            <Text style={styles.menuText}>Vendas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaClientes')}>
            <Text style={styles.menuIcon}>👥</Text>
            <Text style={styles.menuText}>Clientes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Relatorios')}>
            <Text style={styles.menuIcon}>📈</Text>
            <Text style={styles.menuText}>Relatórios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaAnotacoes')}>
            <Text style={styles.menuIcon}>📝</Text>
            <Text style={styles.menuText}>Anotações</Text>
          </TouchableOpacity>
        </View>

        {/* Cards de resumo */}
        <View style={styles.cardsRow}>
          <View style={[styles.cardPequeno, { backgroundColor: '#3E7C59' }]}>
            <Text style={styles.cardPequenoLabel}>Vendas Hoje</Text>
            <Text style={styles.cardPequenoValor}>{formatCurrency(totalVendasHoje)}</Text>
          </View>
          <View style={[styles.cardPequeno, { backgroundColor: '#C17F59' }]}>
            <Text style={styles.cardPequenoLabel}>Vendas Mês</Text>
            <Text style={styles.cardPequenoValor}>{formatCurrency(totalVendasMes)}</Text>
          </View>
        </View>

        <AnotacoesWidget navigation={navigation} />

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
            produtosBaixo.map((item, idx) => (
              <Text key={idx} style={styles.movimento}>
                {item.produto?.nome || 'Produto removido'} – {item.quantidadeatual} {item.produto?.unidademedida || ''}
              </Text>
            ))
          )}
        </View>

        {/* Últimas movimentações */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔄 Últimas Movimentações</Text>
          {movimentacoes.length === 0 ? (
            <Text style={styles.movimento}>Nenhuma movimentação registrada</Text>
          ) : (
            movimentacoes.map((item, idx) => {
              const nomeProduto = item.produto?.nome || null;
              const nomeAnimal = item.animal?.especie || null;
              const observacaoAnimal = item.animal?.observacoes || '';
              let descricao = '';
              if (nomeProduto) descricao = nomeProduto;
              else if (nomeAnimal) descricao = `${nomeAnimal} ${observacaoAnimal ? `(${observacaoAnimal})` : ''}`;
              else descricao = 'Item removido';

              return (
                <Text key={idx} style={styles.movimento}>
                  {formatDateBR(item.datamovimentacao, true)} – {item.tipomovimentacao} – {descricao}{' '}
                  {item.quantidade ? `(${item.quantidade})` : ''}
                </Text>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF' },
  containerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5EF' },
  loadingText: { marginTop: 16, color: '#8A8A8A', fontFamily: 'Inter' },
  title: { fontSize: 22, fontFamily: 'Montserrat', fontWeight: '700', color: '#2C2C2C', padding: 20, textAlign: 'center' },

  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
  menuItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    margin: '1.5%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: { fontSize: 32 },
  menuText: { marginTop: 8, fontFamily: 'Inter', fontSize: 12, color: '#2C2C2C' },

  cardsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, gap: 12 },
  cardPequeno: { flex: 1, padding: 16, borderRadius: 12, elevation: 3 },
  cardPequenoLabel: { color: '#FFF', fontSize: 14, fontFamily: 'Inter', opacity: 0.9 },
  cardPequenoValor: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 8 },

  card: { backgroundColor: '#FFFFFF', margin: 20, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter', fontWeight: '600', marginBottom: 12, color: '#2C2C2C' },
  movimento: { fontSize: 14, fontFamily: 'Inter', color: '#8A8A8A', marginBottom: 8 },
  chart: { marginVertical: 8, borderRadius: 8 },
});