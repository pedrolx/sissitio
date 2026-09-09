import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useAnotacoes } from '../../hooks/useAnotacoes';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Picker } from '@react-native-picker/picker';

export default function FormAnotacaoScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { anotacoes, salvarAnotacao } = useAnotacoes();
  const [texto, setTexto] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const anotacao = anotacoes.find(a => a.idanotacao === id);
      if (anotacao) {
        setTexto(anotacao.texto);
        setPrioridade(anotacao.prioridade || 'media');
      }
    }
  }, [id, anotacoes]);

  async function salvar() {
    if (!texto.trim()) {
      Alert.alert('Atenção', 'Texto é obrigatório');
      return;
    }
    setLoading(true);
    const dados = {
      texto: texto.trim(),
      prioridade,
    };
    await salvarAnotacao(dados, id);
    setLoading(false);
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Texto *</Text>
      <Input
        value={texto}
        onChangeText={setTexto}
        placeholder="Digite sua anotação..."
        multiline
        style={{ height: 120 }}
      />

      <Text style={styles.label}>Prioridade</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={prioridade}
          onValueChange={(val) => setPrioridade(val)}
          style={styles.picker}
        >
          <Picker.Item label="Baixa" value="baixa" />
          <Picker.Item label="Média" value="media" />
          <Picker.Item label="Alta" value="alta" />
        </Picker>
      </View>

      <Button title={id ? 'Atualizar' : 'Salvar'} onPress={salvar} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#2C2C2C', marginBottom: 6, marginTop: 12 },
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D2D2D2', borderRadius: 8, marginBottom: 16 },
  picker: { height: 50 },
});