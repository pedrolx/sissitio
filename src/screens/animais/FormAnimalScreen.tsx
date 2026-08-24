import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useAnimais } from '../../hooks/useAnimais';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export default function FormAnimalScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { animais, salvarAnimal } = useAnimais();
  const [especie, setEspecie] = useState('');
  const [datanascimento, setDatanascimento] = useState('');
  const [status, setStatus] = useState('vivo');
  const [pesoatual, setPesoatual] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const animal = animais.find(a => a.idanimal === id);
      if (animal) {
        setEspecie(animal.especie);
        setDatanascimento(animal.datanascimento?.slice(0, 10) || '');
        setStatus(animal.status);
        setPesoatual(animal.pesoatual?.toString() || '');
        setObservacoes(animal.observacoes || '');
      }
    }
  }, [id, animais]);

  async function salvar() {
    if (!especie.trim()) {
      Alert.alert('Atenção', 'Espécie é obrigatória');
      return;
    }
    setLoading(true);
    const dados = {
      especie,
      datanascimento: datanascimento || null,
      status,
      pesoatual: parseFloat(pesoatual) || null,
      observacoes: observacoes || null,
    };
    await salvarAnimal(dados, id);
    setLoading(false);
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Espécie *</Text>
      <Input value={especie} onChangeText={setEspecie} placeholder="Ex: Galinha, Porco, Cabra" />

      <Text style={styles.label}>Data de Nascimento (AAAA-MM-DD)</Text>
      <Input
        value={datanascimento}
        onChangeText={setDatanascimento}
        placeholder="2024-01-15"
        keyboardType="default"
      />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusContainer}>
        {['vivo', 'abatido', 'vendido'].map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.statusOption, status === opt && styles.statusOptionActive]}
            onPress={() => setStatus(opt)}
          >
            <Text style={[styles.statusText, status === opt && styles.statusTextActive]}>
              {opt.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Peso Atual (kg)</Text>
      <Input value={pesoatual} onChangeText={setPesoatual} keyboardType="numeric" placeholder="0.0" />

      <Text style={styles.label}>Observações</Text>
      <Input
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Informações adicionais"
        multiline
        style={{ height: 80 }}
      />

      <Button title={id ? 'Atualizar' : 'Salvar'} onPress={salvar} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#2C2C2C', marginBottom: 6, marginTop: 12 },
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statusOption: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusOptionActive: { backgroundColor: '#3E7C59' },
  statusText: { color: '#2C2C2C', fontWeight: '600' },
  statusTextActive: { color: '#FFFFFF' },
});