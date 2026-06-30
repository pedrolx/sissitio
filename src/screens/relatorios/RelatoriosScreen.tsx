import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

type RelatorioEstoque = {
  nome: string;
  quantidadeAtual: number;
  unidadeMedida: string;
};

type RelatorioVenda = {
  idVenda: number;
  dataVenda: string;
  valorTotal: number;
  cliente: string;
};

export default function RelatoriosScreen() {
  const [estoque, setEstoque] = useState<RelatorioEstoque[]>([]);
  const [vendas, setVendas] = useState<RelatorioVenda[]>([]);
  const [movimentacoesCount, setMovimentacoesCount] = useState(0);
  const [animaisCount, setAnimaisCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tipoRelatorio, setTipoRelatorio] = useState<'estoque' | 'vendas' | 'movimentacoes' | 'animais'>('estoque');

  useEffect(() => {
    carregarDados();
  }, [tipoRelatorio]);

  async function carregarDados() {
    setLoading(true);
    try {
      if (tipoRelatorio === 'estoque') {
        const { data, error } = await supabase
          .from('Estoque')
          .select('quantidadeAtual, Produto(nome, unidadeMedida)');
        if (error) throw error;
        const formatted = data.map(item => ({
          nome: item.Produto.nome,
          quantidadeAtual: item.quantidadeAtual,
          unidadeMedida: item.Produto.unidadeMedida,
        }));
        setEstoque(formatted);
      } else if (tipoRelatorio === 'vendas') {
        const { data, error } = await supabase
          .from('Venda')
          .select('idVenda, dataVenda, valorTotal, Cliente(nome)')
          .order('dataVenda', { ascending: false })
          .limit(50);
        if (error) throw error;
        const formatted = data.map(item => ({
          idVenda: item.idVenda,
          dataVenda: item.dataVenda,
          valorTotal: item.valorTotal,
          cliente: item.Cliente?.nome || 'Cliente não identificado',
        }));
        setVendas(formatted);
      } else if (tipoRelatorio === 'movimentacoes') {
        const { count, error } = await supabase
          .from('Movimentacao')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        setMovimentacoesCount(count || 0);
      } else if (tipoRelatorio === 'animais') {
        const { count, error } = await supabase
          .from('Animal')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        setAnimaisCount(count || 0);
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  }

  const renderConteudo = () => {
    if (loading) return <Text style={styles.loading}>Carregando...</Text>;

    switch (tipoRelatorio) {
      case 'estoque':
        return (
          <View>
            <Text style={styles.subtitle}>Produtos em Estoque</Text>
            {estoque.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.nome}</Text>
                <Text style={styles.itemValue}>
                  {item.quantidadeAtual} {item.unidadeMedida}
                </Text>
              </View>
            ))}
          </View>
        );
      case 'vendas':
        return (
          <View>
            <Text style={styles.subtitle}>Últimas 50 Vendas</Text>
            {vendas.map((venda) => (
              <View key={venda.idVenda} style={styles.itemRow}>
                <Text style={styles.itemName}>#{venda.idVenda} - {new Date(venda.dataVenda).toLocaleDateString()}</Text>
                <Text style={styles.itemValue}>R$ {venda.valorTotal.toFixed(2)}</Text>
                <Text style={styles.itemDetail}>{venda.cliente}</Text>
              </View>
            ))}
          </View>
        );
      case 'movimentacoes':
        return (
          <View>
            <Text style={styles.subtitle}>Total de Movimentações Registradas</Text>
            <Text style={styles.bigNumber}>{movimentacoesCount}</Text>
          </View>
        );
      case 'animais':
        return (
          <View>
            <Text style={styles.subtitle}>Total de Animais no Sistema</Text>
            <Text style={styles.bigNumber}>{animaisCount}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>RELATÓRIOS</Text>

      <View style={styles.linhaBotoes}>
        <TouchableOpacity
          style={[styles.botao, tipoRelatorio === 'estoque' && styles.botaoAtivo]}
          onPress={() => setTipoRelatorio('estoque')}
        >
          <Text style={styles.botaoTexto}>Estoque</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botao, tipoRelatorio === 'vendas' && styles.botaoAtivo]}
          onPress={() => setTipoRelatorio('vendas')}
        >
          <Text style={styles.botaoTexto}>Vendas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botao, tipoRelatorio === 'movimentacoes' && styles.botaoAtivo]}
          onPress={() => setTipoRelatorio('movimentacoes')}
        >
          <Text style={styles.botaoTexto}>Movimentações</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botao, tipoRelatorio === 'animais' && styles.botaoAtivo]}
          onPress={() => setTipoRelatorio('animais')}
        >
          <Text style={styles.botaoTexto}>Animais</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>{renderConteudo()}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#3E7C59' },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  botao: { backgroundColor: '#E8E8E8', padding: 10, borderRadius: 8, flex: 1, marginHorizontal: 4, alignItems: 'center' },
  botaoAtivo: { backgroundColor: '#3E7C59' },
  botaoTexto: { fontWeight: '600', color: '#2C2C2C' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#3E7C59' },
  itemRow: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#D2D2D2', paddingBottom: 8 },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemValue: { fontSize: 14, color: '#3E7C59', fontWeight: 'bold' },
  itemDetail: { fontSize: 12, color: '#8A8A8A' },
  bigNumber: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: '#3E7C59', marginTop: 20 },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
});