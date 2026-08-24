import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useClientes } from '../../hooks/useClientes';
import { Button } from '../../components/Button';
import { useFocusEffect } from '@react-navigation/native';
import { processQueue } from '../../services/sync';

type Cliente = {
  idcliente: number;
  nome: string;
  telefone: string;
  observacoes: string;
  _pending?: boolean;
};

export default function ListaClientesScreen({ navigation }) {
  const { clientes, loading, excluirCliente } = useClientes();

  useFocusEffect(
    useCallback(() => {
      processQueue();
    }, [])
  );

  const renderItem = ({ item }: { item: Cliente }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.telefone}>{item.telefone || 'Sem telefone'}</Text>
        <Text style={styles.observacao}>{item.observacoes?.substring(0, 50)}</Text>
      </View>
      <View style={styles.actions}>
        {item._pending && (
          <Text style={styles.pendingIcon}>⏳</Text>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('FormCliente', { id: item.idcliente })}>
          <Text style={styles.edit}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => excluirCliente(item.idcliente)}>
          <Text style={styles.delete}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title="+ Novo Cliente" onPress={() => navigation.navigate('FormCliente')} />
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.idcliente.toString()}
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
  nome: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C' },
  telefone: { fontSize: 14, color: '#8A8A8A', marginTop: 4 },
  observacao: { fontSize: 12, color: '#A9A9A9', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  edit: { fontSize: 20, marginRight: 8, color: '#3E7C59' },
  delete: { fontSize: 20, color: '#C17F59' },
  pendingIcon: { fontSize: 20, marginRight: 8, color: '#FFA500' },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
});