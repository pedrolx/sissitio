import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export default function MovimentacaoEstoqueScreen({ route, navigation }) {
  const { idProduto, tipo } = route.params;
  const [quantidade, setQuantidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  async function confirmar() {
    const qtd = parseFloat(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      Alert.alert('Erro', 'Quantidade deve ser maior que zero');
      return;
    }

    setLoading(true);
    // 1. Obter estoque atual
    const { data: estoque, error: errEst } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', idProduto)
      .single();
    if (errEst) {
      Alert.alert('Erro', errEst.message);
      setLoading(false);
      return;
    }

    let novaQuantidade = estoque.quantidadeAtual;
    if (tipo === 'entrada') novaQuantidade += qtd;
    else novaQuantidade -= qtd;

    if (novaQuantidade < 0) {
      Alert.alert('Erro', 'Estoque não pode ficar negativo');
      setLoading(false);
      return;
    }

    // 2. Atualizar estoque
    const { error: updateErr } = await supabase
      .from('Estoque')
      .update({ quantidadeAtual: novaQuantidade })
      .eq('idProduto', idProduto);

    if (updateErr) {
      Alert.alert('Erro', updateErr.message);
      setLoading(false);
      return;
    }

    // 3. Registrar movimentação
    const { error: movErr } = await supabase.from('Movimentacao').insert({
      idProduto,
      quantidade: qtd,
      tipoMovimentacao: tipo,
      observacoes: observacoes || null,
      dataMovimentacao: new Date().toISOString(),
    });

    if (movErr) Alert.alert('Erro', movErr.message);
    else {
      Alert.alert('Sucesso', `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!`);
      navigation.goBack();
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}</Text>
      <Input
        placeholder="Quantidade"
        keyboardType="numeric"
        value={quantidade}
        onChangeText={setQuantidade}
      />
      <Input
        placeholder="Observações (opcional)"
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
      />
      <Button title="Confirmar" onPress={confirmar} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F5EF' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
});