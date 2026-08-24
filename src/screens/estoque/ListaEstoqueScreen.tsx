import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useEstoque } from '../../hooks/useEstoque';

export default function ListaEstoqueScreen({ navigation }) {
  const { estoque, loading } = useEstoque();

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.nome}>{item.produto?.[0]?.nome || '—'}</Text>
      <Text>Quantidade: {item.quantidadeatual} {item.produto?.[0]?.unidademedida || ''}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('MovimentacaoEstoque', { idproduto: item.idproduto, tipo: 'entrada' })}>
          <Text>➕ Entrada</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('MovimentacaoEstoque', { idproduto: item.idproduto, tipo: 'saida' })}>
          <Text>➖ Saída</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ListaMovimentacoes')}>
          <Text>📋 Histórico</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? <Text>Carregando...</Text> : <FlatList data={estoque} renderItem={renderItem} keyExtractor={(item) => item.idestoque.toString()} />}
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