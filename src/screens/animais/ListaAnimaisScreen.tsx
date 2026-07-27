import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';

type Animal = {
  idAnimal: number;
  especie: string;
  dataNascimento: string;
  status: string;
  pesoAtual: number;
  observacoes: string;
};

export default function ListaAnimaisScreen({ navigation }) {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAnimais();
  }, []);

  async function carregarAnimais() {
    setLoading(true);
    const { data, error } = await supabase
      .from('Animal')
      .select('*')
      .order('especie');
    if (error) Alert.alert('Erro', error.message);
    else setAnimais(data || []);
    setLoading(false);
  }

  async function excluirAnimal(id: number) {
    Alert.alert('Excluir', 'Tem certeza? Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('Animal').delete().eq('idAnimal', id);
          if (error) Alert.alert('Erro', error.message);
          else carregarAnimais();
        },
      },
    ]);
  }

  const formatarData = (data: string) => {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const renderItem = ({ item }: { item: Animal }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DetalhesAnimal', { id: item.idAnimal })}>
      <View style={styles.cardContent}>
        <Text style={styles.especie}>{item.especie}</Text>
        <Text style={styles.detalhe}>Nascimento: {formatarData(item.dataNascimento)}</Text>
        <Text style={styles.detalhe}>Status: {item.status}</Text>
        {item.pesoAtual ? <Text style={styles.detalhe}>Peso: {item.pesoAtual} kg</Text> : null}
      </View>
      <Text style={styles.detailIcon}>👉</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button title="+ Novo Animal" onPress={() => navigation.navigate('FormAnimal')} />
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : (
        <FlatList
          data={animais}
          keyExtractor={(item) => item.idAnimal.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  detailIcon: { fontSize: 20, color: '#C17F59' },
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
  especie: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C' },
  detalhe: { fontSize: 14, color: '#8A8A8A', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  edit: { fontSize: 20, marginRight: 8, color: '#3E7C59' },
  delete: { fontSize: 20, color: '#C17F59' },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
});