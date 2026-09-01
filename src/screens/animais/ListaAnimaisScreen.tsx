import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useAnimais } from '../../hooks/useAnimais';
import { Button } from '../../components/Button';
import { useFocusEffect } from '@react-navigation/native';
import { processQueue } from '../../services/sync';
import { formatDateBR } from '../../utils/dateUtils';

export default function ListaAnimaisScreen({ navigation }) {
  const { animais, loading, excluirAnimal } = useAnimais();

  useFocusEffect(
    useCallback(() => {
      processQueue();
    }, [])
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DetalhesAnimal', { id: item.idanimal })}>
      <View style={styles.cardContent}>
        <Text style={styles.especie}>{item.especie}</Text>
        {/* Exibe o nome do animal (observações) se existir */}
        {item.observacoes ? (
          <Text style={styles.nomeAnimal}>🐾 {item.observacoes}</Text>
        ) : null}
        <Text style={styles.detalhe}>Nascimento: {formatDateBR(item.datanascimento)}</Text>
        <Text style={styles.detalhe}>Status: {item.status}</Text>
        {item.pesoatual ? <Text style={styles.detalhe}>Peso: {item.pesoatual} kg</Text> : null}
      </View>
      <View style={styles.actions}>
        {item._pending && (
          <Text style={styles.pendingIcon}>⏳</Text>
        )}
        <Text style={styles.detailIcon}>👉</Text>
      </View>
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
          keyExtractor={(item) => item.idanimal.toString()}
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
  nomeAnimal: { fontSize: 14, color: '#3E7C59', fontStyle: 'italic', marginTop: 2 },
  detalhe: { fontSize: 14, color: '#8A8A8A', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  pendingIcon: { fontSize: 20, marginRight: 8, color: '#FFA500' },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
});