import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function DashboardScreen({ navigation }) {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [totalVendasHoje, setTotalVendasHoje] = useState(0);
  const [produtosBaixo, setProdutosBaixo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      // 1. Últimas 3 movimentações
      const { data: movData } = await supabase
        .from('Movimentacao')
        .select('*, Produto(nome)')
        .order('dataMovimentacao', { ascending: false })
        .limit(3);
      setMovimentacoes(movData || []);

      // 2. Total de vendas de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      const { data: vendasHoje } = await supabase
        .from('Venda')
        .select('valorTotal')
        .gte('dataVenda', hoje.toISOString())
        .lt('dataVenda', amanha.toISOString());
      const total = vendasHoje?.reduce((sum, v) => sum + v.valorTotal, 0) || 0;
      setTotalVendasHoje(total);

      // 3. Produtos com estoque baixo (menos de 5 unidades)
      const { data: estoque } = await supabase
        .from('Estoque')
        .select('quantidadeAtual, Produto(nome, unidadeMedida)')
        .lt('quantidadeAtual', 5);
      setProdutosBaixo(estoque || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const formatarData = (data) => {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Olá, {supabase.auth.getUser()?.data?.user?.email || 'Usuário'}</Text>

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
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Vendas de Hoje</Text>
          <Text style={styles.totalVendas}>R$ {totalVendasHoje.toFixed(2)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Produtos com Estoque Baixo</Text>
          {produtosBaixo.length === 0 ? (
            <Text style={styles.movimento}>Nenhum produto em baixa</Text>
          ) : (
            produtosBaixo.map((item, idx) => (
              <Text key={idx} style={styles.movimento}>
                {item.Produto.nome} – {item.quantidadeAtual} {item.Produto.unidadeMedida}
              </Text>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔄 Últimas Movimentações</Text>
          {movimentacoes.length === 0 ? (
            <Text style={styles.movimento}>Nenhuma movimentação registrada</Text>
          ) : (
            movimentacoes.map((item, idx) => (
              <Text key={idx} style={styles.movimento}>
                {formatarData(item.dataMovimentacao)} – {item.tipoMovimentacao} – {item.Produto?.nome || 'Animal'} {item.quantidade ? `(${item.quantidade})` : ''}
              </Text>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomMenu}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}><Text>🏠</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ListaVendas')}><Text>🛒</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ListaMovimentacoes')}><Text>🔄</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ListaEstoque')}><Text>📦</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}><Text>👤</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF' },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
  title: { fontSize: 24, fontFamily: 'Montserrat', fontWeight: '600', color: '#2C2C2C', padding: 20 },
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
  card: { backgroundColor: '#FFFFFF', margin: 20, padding: 16, borderRadius: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter', fontWeight: '600', marginBottom: 12, color: '#2C2C2C' },
  totalVendas: { fontSize: 28, fontWeight: 'bold', color: '#3E7C59', textAlign: 'center' },
  movimento: { fontSize: 14, fontFamily: 'Inter', color: '#8A8A8A', marginBottom: 8 },
  bottomMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D2D2D2',
  },
});