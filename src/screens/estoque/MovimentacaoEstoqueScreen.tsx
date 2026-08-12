import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

interface Props {
  route: { params: { idproduto: number; tipo: 'entrada' | 'saida' } };
  navigation: any;
}

export default function MovimentacaoEstoqueScreen({ route, navigation }: Props) {
  const { idproduto, tipo } = route.params;
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
    if (tipo === 'entrada') novaQuantidade += qtd;
    else novaQuantidade -= qtd;

    if (novaQuantidade < 0) {
      Alert.alert('Erro', 'Estoque não pode ficar negativo');
      setLoading(false);
      return;
    }

    const { error: updateErr } = await supabase
      .from('estoque')
      .update({ quantidadeatual: novaQuantidade })
      .eq('idproduto', idproduto);

    if (updateErr) {
      Alert.alert('Erro', updateErr.message);
      setLoading(false);
      return;
    }

    const { error: movErr } = await supabase.from('movimentacao').insert({
      idproduto,
      quantidade: qtd,
      tipomovimentacao: tipo,
      observacoes: observacoes || null,
      datamovimentacao: new Date().toISOString(),
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
      <Input placeholder="Quantidade" keyboardType="numeric" value={quantidade} onChangeText={setQuantidade} />
      <Input placeholder="Observações (opcional)" value={observacoes} onChangeText={setObservacoes} multiline />
      <Button title="Confirmar" onPress={confirmar} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F5EF' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
});