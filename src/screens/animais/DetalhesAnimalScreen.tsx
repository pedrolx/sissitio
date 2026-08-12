import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';

// Interface com os nomes EXATOS do banco (minúsculo)
interface Animal {
  idanimal: number;
  especie: string;
  datanascimento: string | null;
  status: string;
  pesoatual: number | null;
  observacoes: string | null;
}

// Tipagem das props
interface Props {
  route: { params: { id: number } };
  navigation: any;
}

export default function DetalhesAnimalScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAnimal();
  }, []);

  async function carregarAnimal() {
    const { data, error } = await supabase
      .from('animal')
      .select('*')
      .eq('idanimal', id)
      .single();
    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      setAnimal(data as Animal);
    }
    setLoading(false);
  }

  async function registrarAbate() {
    if (!animal) return;
    Alert.alert('Abater Animal', `Confirma o abate do animal ${animal.especie}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          const { error: updateError } = await supabase
            .from('animal')
            .update({ status: 'abatido' })
            .eq('idanimal', id);
          if (updateError) {
            Alert.alert('Erro', updateError.message);
            setLoading(false);
            return;
          }
          const { error: movError } = await supabase.from('movimentacao').insert({
            idanimal: id,
            tipomovimentacao: 'abate',
            datamovimentacao: new Date().toISOString(),
            observacoes: `Animal ${animal.especie} abatido`,
          });
          if (movError) Alert.alert('Erro', movError.message);
          else Alert.alert('Sucesso', 'Abate registrado');
          setLoading(false);
          navigation.goBack();
        },
      },
    ]);
  }

  if (loading || !animal) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes do Animal</Text>
      <View style={styles.card}>
        <Text style={styles.label}>
          Espécie: <Text style={styles.value}>{animal.especie}</Text>
        </Text>
        <Text style={styles.label}>
          Nascimento: <Text style={styles.value}>{animal.datanascimento || '—'}</Text>
        </Text>
        <Text style={styles.label}>
          Status: <Text style={styles.value}>{animal.status}</Text>
        </Text>
        <Text style={styles.label}>
          Peso: <Text style={styles.value}>{animal.pesoatual || '—'} kg</Text>
        </Text>
        <Text style={styles.label}>
          Observações: <Text style={styles.value}>{animal.observacoes || '—'}</Text>
        </Text>
      </View>

      {animal.status === 'vivo' && (
        <Button title="Registrar Abate" onPress={registrarAbate} variant="danger" />
      )}
      <Button title="Editar" onPress={() => navigation.navigate('FormAnimal', { id: animal.idanimal })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 8, color: '#2C2C2C' },
  value: { fontWeight: 'normal', color: '#555' },
});