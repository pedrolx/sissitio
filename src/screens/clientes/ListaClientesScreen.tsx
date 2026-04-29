import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';

type Cliente = {
  idCliente: number;
  nome: string;
  telefone: string;
  observacoes: string;
};

export default function ListaClientesScreen({ navigation }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('Cliente')
      .select('*')
      .order('nome');
    if (error) Alert.alert('Erro', error.message);
    else setClientes(data || []);
    setLoading(false);
  }

  async function excluirCliente(id: number) {
    Alert.alert('Excluir', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('Cliente').delete().eq('idCliente', id);
          if (error) Alert.alert('Erro', error.message);
          else carregarClientes();
        },
      },
    ]);
  }

  const renderItem = ({ item }: { item: Cliente }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.telefone}>{item.telefone || 'Sem telefone'}</Text>
        <Text style={styles.observacao}>{item.observacoes?.substring(0, 50)}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('FormCliente', { id: item.idCliente })}>
          <Text style={styles.edit}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => excluirCliente(item.idCliente)}>
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
          keyExtractor={(item) => item.idCliente.toString()}
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
  actions: { flexDirection: 'row', gap: 12 },
  edit: { fontSize: 20, marginRight: 8, color: '#3E7C59' },
  delete: { fontSize: 20, color: '#C17F59' },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
});

