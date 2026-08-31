import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAnimais } from '../../hooks/useAnimais';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatarDataBR, parseDateBRtoISO } from '../../utils/dateUtils';

export default function FormAnimalScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { animais, salvarAnimal } = useAnimais();
  const [especie, setEspecie] = useState('');
  const [datanascimento, setDatanascimento] = useState('');
  const [status, setStatus] = useState('vivo');
  const [pesoatual, setPesoatual] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado para o DatePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (id) {
      const animal = animais.find(a => a.idanimal === id);
      if (animal) {
        setEspecie(animal.especie);
        // Se tiver data, converte para o formato BR para exibir
        if (animal.datanascimento) {
          setDatanascimento(formatarDataBR(animal.datanascimento));
          setTempDate(new Date(animal.datanascimento));
        }
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

    // Converte a data do formato BR para ISO antes de salvar
    let dataISO = null;
    if (datanascimento) {
      dataISO = parseDateBRtoISO(datanascimento);
      if (!dataISO) {
        Alert.alert('Erro', 'Data de nascimento inválida. Use o formato DD/MM/AAAA.');
        setLoading(false);
        return;
      }
    }

    const dados = {
      especie,
      datanascimento: dataISO,
      status,
      pesoatual: parseFloat(pesoatual) || null,
      observacoes: observacoes || null,
    };

    await salvarAnimal(dados, id);
    setLoading(false);
    navigation.goBack();
  }

  // Ao selecionar uma data no DatePicker
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTempDate(selectedDate);
      // Atualiza o campo com a data no formato BR
      setDatanascimento(formatarDataBR(selectedDate));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Espécie *</Text>
      <Input
        value={especie}
        onChangeText={setEspecie}
        placeholder="Ex: Galinha, Porco, Cabra"
      />

      <Text style={styles.label}>Data de Nascimento</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {datanascimento || 'Selecionar data'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

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
      <Input
        value={pesoatual}
        onChangeText={setPesoatual}
        keyboardType="numeric"
        placeholder="0.0"
      />

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
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2C2C2C',
  },
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