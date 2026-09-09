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
import { formatDateBR, parseDateBR, formatDateISO } from '../../utils/dateUtils';

export default function FormAnimalScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { animais, salvarAnimal, salvarAnimaisLote } = useAnimais();
  const [especie, setEspecie] = useState('');
  const [datanascimento, setDatanascimento] = useState('');
  const [status, setStatus] = useState('vivo');
  const [pesoatual, setPesoatual] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [quantidade, setQuantidade] = useState('1'); // novo campo
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      const animal = animais.find(a => a.idanimal === id);
      if (animal) {
        setEspecie(animal.especie?.trim() || '');
        if (animal.datanascimento) {
          setDatanascimento(formatDateBR(animal.datanascimento));
          setTempDate(new Date(animal.datanascimento));
        }
        setStatus(animal.status);
        setPesoatual(animal.pesoatual?.toString() || '');
        setObservacoes(animal.observacoes || '');
        setQuantidade('1'); // forçar 1 na edição
      }
    }
  }, [id, animais, isEditing]);

  async function salvar() {
    const especieTrimmed = especie.trim();
    if (!especieTrimmed) {
      Alert.alert('Atenção', 'Espécie é obrigatória');
      return;
    }

    // Valida quantidade apenas se não for edição
    let qtd = 1;
    if (!isEditing) {
      qtd = parseInt(quantidade, 10);
      if (isNaN(qtd) || qtd < 1) {
        Alert.alert('Atenção', 'Quantidade deve ser um número inteiro maior que zero');
        return;
      }
    }

    setLoading(true);

    let dataISO = null;
    if (datanascimento) {
      const parsed = parseDateBR(datanascimento);
      if (!parsed) {
        Alert.alert('Erro', 'Data de nascimento inválida. Use o formato DD/MM/AAAA.');
        setLoading(false);
        return;
      }
      dataISO = formatDateISO(parsed);
    }

    const dadosBase = {
      especie: especieTrimmed,
      datanascimento: dataISO,
      status,
      pesoatual: parseFloat(pesoatual) || null,
      observacoes: observacoes || null,
    };

    try {
      if (isEditing) {
        // Edição: apenas um animal
        await salvarAnimal(dadosBase, id);
      } else {
        // Cadastro: se quantidade > 1, criar array e chamar lote
        if (qtd === 1) {
          await salvarAnimal(dadosBase);
        } else {
          const animaisData = Array.from({ length: qtd }, () => ({ ...dadosBase }));
          await salvarAnimaisLote(animaisData);
        }
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar animal(ais). Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTempDate(selectedDate);
      setDatanascimento(formatDateBR(selectedDate));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Espécie *</Text>
      <Input
        value={especie}
        onChangeText={setEspecie}
        placeholder="Ex: Galinha, Porco, Cabra"
        autoCapitalize="words"
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

      {/* Campo de quantidade visível apenas no cadastro */}
      {!isEditing && (
        <>
          <Text style={styles.label}>Quantidade</Text>
          <Input
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="numeric"
            placeholder="1"
          />
          <Text style={styles.helperText}>
            Se for maior que 1, serão criados vários animais com os mesmos dados.
          </Text>
        </>
      )}

      <Button
        title={isEditing ? 'Atualizar' : 'Salvar'}
        onPress={salvar}
        loading={loading}
      />
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
  dateButtonText: { fontSize: 16, color: '#2C2C2C' },
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
  helperText: {
    fontSize: 12,
    color: '#8A8A8A',
    marginTop: -8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
});