import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Picker } from '@react-native-picker/picker';

interface Props {
  route: { params?: { idproduto?: number; tipo: 'entrada' | 'saida' } };
  navigation: any;
}

export default function MovimentacaoEstoqueScreen({ route, navigation }: Props) {
  const { idproduto: idProdutoParam, tipo } = route.params || { tipo: 'entrada' };
  const [produtos, setProdutos] = useState<{ idproduto: number; nome: string }[]>([]);
  const [idproduto, setIdProduto] = useState<number | null>(idProdutoParam || null);
  const [quantidade, setQuantidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  // Carregar lista de produtos
  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    setLoadingProdutos(true);
    const { data, error } = await supabase
      .from('produto')
      .select('idproduto, nome')
      .order('nome');
    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      setProdutos(data || []);
    }
    setLoadingProdutos(false);
  }

  async function confirmar() {
    if (!idproduto) {
      Alert.alert('Atenção', 'Selecione um produto.');
      return;
    }
    const qtd = parseFloat(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      Alert.alert('Erro', 'Quantidade deve ser maior que zero.');
      return;
    }

    setLoading(true);
    // Buscar estoque atual do produto selecionado
    const { data: estoque, error: errEst } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', idproduto)
      .single();

    if (errEst) {
      Alert.alert('Erro', errEst.message);
      setLoading(false);
      return;
    }

    let novaQuantidade = estoque.quantidadeatual;
    if (tipo === 'entrada') {
      novaQuantidade += qtd;
    } else {
      novaQuantidade -= qtd;
    }

    if (novaQuantidade < 0) {
      Alert.alert('Erro', 'Estoque não pode ficar negativo.');
      setLoading(false);
      return;
    }

    // Atualizar estoque
    const { error: updateErr } = await supabase
      .from('estoque')
      .update({ quantidadeatual: novaQuantidade })
      .eq('idproduto', idproduto);

    if (updateErr) {
      Alert.alert('Erro', updateErr.message);
      setLoading(false);
      return;
    }

    // Inserir movimentação
    const { error: movErr } = await supabase.from('movimentacao').insert({
      idproduto,
      quantidade: qtd,
      tipomovimentacao: tipo,
      observacoes: observacoes || null,
      datamovimentacao: new Date().toISOString(),
    });

    if (movErr) {
      Alert.alert('Erro', movErr.message);
    } else {
      Alert.alert('Sucesso', `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!`);
      navigation.goBack();
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
      </Text>

      {/* Seletor de produto */}
      <Text style={styles.label}>Produto *</Text>
      {loadingProdutos ? (
        <Text>Carregando produtos...</Text>
      ) : (
        <Picker
          selectedValue={idproduto}
          onValueChange={(itemValue) => setIdProduto(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Selecione um produto" value={null} />
          {produtos.map((p) => (
            <Picker.Item key={p.idproduto} label={p.nome} value={p.idproduto} />
          ))}
        </Picker>
      )}

      <Text style={styles.label}>Quantidade *</Text>
      <Input
        placeholder="Digite a quantidade"
        keyboardType="numeric"
        value={quantidade}
        onChangeText={setQuantidade}
      />

      <Text style={styles.label}>Observações (opcional)</Text>
      <Input
        placeholder="Observações"
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
        style={{ height: 80 }}
      />

      <Button title="Confirmar" onPress={confirmar} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F5EF' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 8, color: '#2C2C2C' },
  picker: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D2D2D2', borderRadius: 8, marginBottom: 16 },
});