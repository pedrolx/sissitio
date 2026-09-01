import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useMovimentacoes } from '../../hooks/useMovimentacoes';
import { Input } from '../../components/Input';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../lib/supabase';
import { formatDateBR } from '../../utils/dateUtils';

export default function ListaMovimentacoesScreen() {
  const { movimentacoes, loading, carregar } = useMovimentacoes();
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroProduto, setFiltroProduto] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [produtos, setProdutos] = useState<{ idproduto: number; nome: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data } = await supabase.from('produto').select('idproduto, nome').order('nome');
    if (data) setProdutos(data);
  }

  const aplicarFiltros = () => {
    carregar();
    setModalVisible(false);
  };

  const limparFiltros = () => {
    setFiltroTipo('todos');
    setFiltroProduto('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setModalVisible(false);
    carregar();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.data}>{formatDateBR(item.datamovimentacao, true)}</Text>
      <Text style={styles.tipo}>Tipo: {item.tipomovimentacao}</Text>
      <Text>Produto: {item.produto?.[0]?.nome || 'Produto removido'}</Text>
      <Text>
        Animal: {item.animal?.[0]?.especie || 'Animal removido'}
        {item.animal?.[0]?.observacoes ? ` (${item.animal[0].observacoes})` : ''}
      </Text>
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
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#3E7C59' }]} onPress={aplicarFiltros}>
              <Text style={styles.modalButtonText}>Aplicar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#C17F59' }]} onPress={limparFiltros}>
              <Text style={styles.modalButtonText}>Limpar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading ? <Text style={styles.loading}>Carregando...</Text> : <FlatList data={movimentacoes} renderItem={renderItem} keyExtractor={(item) => item.idmovimentacao.toString()} />}
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