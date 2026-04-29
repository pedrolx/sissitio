import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

type EstoqueItem = {
  idEstoque: number;
  idProduto: number;
  quantidadeAtual: number;
  Produto: { nome: string; unidadeMedida: string };
};

export default function ListaEstoqueScreen({ navigation }) {
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEstoque();
  }, []);

  async function carregarEstoque() {
    setLoading(true);
    const { data, error } = await supabase
      .from('Estoque')
      .select('*, Produto(nome, unidadeMedida)');
    if (error) Alert.alert('Erro', error.message);
    else setItens(data || []);
    setLoading(false);
  }

  async function registrarMovimentacao(idProduto: number, tipo: 'entrada' | 'saida', quantidade: number, observacoes?: string) {
    // validação de quantidade > 0, etc.
    // Para simplificar, vamos navegar para uma tela de formulário
    navigation.navigate('MovimentacaoEstoque', { idProduto, tipo });
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.nome}>{item.Produto.nome}</Text>
      <Text>Quantidade: {item.quantidadeAtual} {item.Produto.unidadeMedida}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('MovimentacaoEstoque', { idProduto: item.idProduto, tipo: 'entrada' })}>
          <Text>➕ Entrada</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('MovimentacaoEstoque', { idProduto: item.idProduto, tipo: 'saida' })}>
          <Text>➖ Saída</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('HistoricoMovimentacoes', { idProduto: item.idProduto })}>
          <Text>📋 Histórico</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? <Text>Carregando...</Text> : <FlatList data={itens} renderItem={renderItem} keyExtractor={(item) => item.idEstoque.toString()} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F7F5EF' },
  card: { backgroundColor: '#FFF', padding: 16, marginBottom: 12, borderRadius: 12 },
  nome: { fontSize: 18, fontWeight: 'bold' },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  btn: { backgroundColor: '#E8E8E8', padding: 8, borderRadius: 8 },
});