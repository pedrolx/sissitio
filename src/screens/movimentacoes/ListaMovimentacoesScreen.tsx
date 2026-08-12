import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Picker } from '@react-native-picker/picker';

interface Movimentacao {
  idmovimentacao: number;
  datamovimentacao: string;
  tipomovimentacao: string;
  quantidade: number;
  observacoes: string | null;
  produto: { nome: string }[] | null;
  animal: { especie: string }[] | null;
}

export default function ListaMovimentacoesScreen() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroProduto, setFiltroProduto] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [produtos, setProdutos] = useState<{ idproduto: number; nome: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    carregarMovimentacoes();
  }, [filtroTipo, filtroProduto, filtroDataInicio, filtroDataFim]);

  async function carregarProdutos() {
    const { data } = await supabase.from('produto').select('idproduto, nome').order('nome');
    if (data) setProdutos(data);
  }

  async function carregarMovimentacoes() {
    setLoading(true);
    let query = supabase
      .from('movimentacao')
      .select('*, produto(nome), animal(especie)')
      .order('datamovimentacao', { ascending: false });

    if (filtroTipo !== 'todos') query = query.eq('tipomovimentacao', filtroTipo);
    if (filtroProduto) query = query.eq('idproduto', parseInt(filtroProduto));
    if (filtroDataInicio) query = query.gte('datamovimentacao', new Date(filtroDataInicio).toISOString());
    if (filtroDataFim) {
      const fim = new Date(filtroDataFim);
      fim.setHours(23, 59, 59, 999);
      query = query.lte('datamovimentacao', fim.toISOString());
    }

    const { data, error } = await query;
    if (error) console.error(error);
    else setMovimentacoes(data || []);
    setLoading(false);
  }

  function limparFiltros() {
    setFiltroTipo('todos');
    setFiltroProduto('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setModalVisible(false);
  }

  const renderItem = ({ item }: { item: Movimentacao }) => (
    <View style={styles.card}>
      <Text style={styles.data}>{new Date(item.datamovimentacao).toLocaleString()}</Text>
      <Text style={styles.tipo}>Tipo: {item.tipomovimentacao}</Text>
      <Text>Produto: {item.produto?.[0]?.nome || '—'}</Text>
      <Text>Animal: {item.animal?.[0]?.especie || '—'}</Text>
      <Text>Quantidade: {item.quantidade}</Text>
      <Text>Observação: {item.observacoes || '—'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.filtroButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.filtroButtonText}>🔍 Filtrar</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Filtros</Text>
          <Text style={styles.label}>Tipo</Text>
          <Picker selectedValue={filtroTipo} onValueChange={(val) => setFiltroTipo(val)} style={styles.picker}>
            <Picker.Item label="Todos" value="todos" />
            <Picker.Item label="Entrada" value="entrada" />
            <Picker.Item label="Saída" value="saida" />
            <Picker.Item label="Abate" value="abate" />
            <Picker.Item label="Venda de Animal" value="venda_animal" />
            <Picker.Item label="Ajuste" value="ajuste" />
          </Picker>

          <Text style={styles.label}>Produto</Text>
          <Picker selectedValue={filtroProduto} onValueChange={(val) => setFiltroProduto(val)} style={styles.picker}>
            <Picker.Item label="Todos" value="" />
            {produtos.map((p) => (
              <Picker.Item key={p.idproduto} label={p.nome} value={p.idproduto.toString()} />
            ))}
          </Picker>

          <Text style={styles.label}>Data Início (YYYY-MM-DD)</Text>
          <Input value={filtroDataInicio} onChangeText={setFiltroDataInicio} placeholder="2025-01-01" />

          <Text style={styles.label}>Data Fim (YYYY-MM-DD)</Text>
          <Input value={filtroDataFim} onChangeText={setFiltroDataFim} placeholder="2025-12-31" />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#3E7C59' }]} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Aplicar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#C17F59' }]} onPress={limparFiltros}>
              <Text style={styles.modalButtonText}>Limpar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : (
        <FlatList
          data={movimentacoes}
          keyExtractor={(item) => item.idmovimentacao.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 16 },
  filtroButton: { backgroundColor: '#3E7C59', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  filtroButtonText: { color: '#FFF', fontWeight: 'bold' },
  loading: { textAlign: 'center', marginTop: 50 },
  card: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8 },
  data: { fontSize: 14, fontWeight: 'bold', color: '#2C2C2C' },
  tipo: { fontSize: 14, color: '#3E7C59', marginVertical: 4 },
  modalContainer: { flex: 1, padding: 20, backgroundColor: '#F7F5EF' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  picker: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D2D2D2', borderRadius: 8, marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  modalButton: { padding: 12, borderRadius: 8, flex: 0.4, alignItems: 'center' },
  modalButtonText: { color: '#FFF', fontWeight: 'bold' },
});