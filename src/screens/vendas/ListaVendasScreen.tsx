import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useVendas } from '../../hooks/useVendas';
import { Button } from '../../components/Button';
import { useFocusEffect } from '@react-navigation/native';
import { processQueue } from '../../services/sync';

export default function ListaVendasScreen({ navigation }) {
  const { vendas, loading } = useVendas();

  useFocusEffect(
    useCallback(() => {
      processQueue();
    }, [])
  );

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DetalhesVenda', { id: item.idvenda })}
    >
      <View style={styles.cardContent}>
        <Text style={styles.id}>Venda #{item.idvenda}</Text>
        <Text style={styles.data}>{formatarData(item.datavenda)}</Text>
        <Text style={styles.cliente}>Cliente: {item.cliente?.nome || '—'}</Text>
        <Text style={styles.total}>{formatarMoeda(item.valortotal)}</Text>
        <Text style={styles.status}>Status: {item.statuspagamento}</Text>
      </View>
      <Text style={styles.detailIcon}>👉</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button title="+ Nova Venda" onPress={() => navigation.navigate('FormVenda')} />
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : (
        <FlatList
          data={vendas}
          keyExtractor={(item) => item.idvenda.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: { flex: 1 },
  id: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C' },
  data: { fontSize: 14, color: '#8A8A8A', marginTop: 4 },
  cliente: { fontSize: 14, color: '#2C2C2C', marginTop: 4 },
  total: { fontSize: 16, fontWeight: 'bold', color: '#3E7C59', marginTop: 8 },
  status: { fontSize: 14, marginTop: 4, fontStyle: 'italic' },
  detailIcon: { fontSize: 20, color: '#C17F59' },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
});