import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useEstoque } from '../../hooks/useEstoque';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function ListaEstoqueScreen({ navigation }) {
  const { estoque, loading, carregar } = useEstoque();

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.nome}>{item.produto?.nome || 'Produto removido'}</Text>
      <Text style={styles.detalhe}>Categoria: {item.produto?.categoria || '—'}</Text>
      <Text style={styles.detalhe}>
        Quantidade: {item.quantidadeatual} {item.produto?.unidademedida || ''}
      </Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() =>
            navigation.navigate('MovimentacaoEstoque', {
              idproduto: item.idproduto,
              tipo: 'entrada',
            })
          }
        >
          <Text>➕ Entrada</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btn}
          onPress={() =>
            navigation.navigate('MovimentacaoEstoque', {
              idproduto: item.idproduto,
              tipo: 'saida',
            })
          }
        >
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
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : (
        <FlatList
          data={estoque}
          renderItem={renderItem}
          keyExtractor={(item) => item.idestoque.toString()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F7F5EF' },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
  card: { backgroundColor: '#FFF', padding: 16, marginBottom: 12, borderRadius: 12 },
  nome: { fontSize: 18, fontWeight: 'bold', color: '#2C2C2C' },
  detalhe: { fontSize: 14, color: '#8A8A8A', marginTop: 4 },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  btn: { backgroundColor: '#E8E8E8', padding: 8, borderRadius: 8 },
});