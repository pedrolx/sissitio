import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export default function FormClienteScreen({ route, navigation }) {
  const { id } = route.params || {};
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) carregarCliente();
  }, [id]);

  async function carregarCliente() {
    const { data, error } = await supabase
      .from('Cliente')
      .select('*')
      .eq('idCliente', id)
      .single();
    if (!error && data) {
      setNome(data.nome);
      setTelefone(data.telefone || '');
      setObservacoes(data.observacoes || '');
    }
  }

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Nome é obrigatório');
      return;
    }
    setLoading(true);
    const dados = { nome, telefone, observacoes };
    if (id) {
      const { error } = await supabase.from('Cliente').update(dados).eq('idCliente', id);
      if (error) Alert.alert('Erro', error.message);
      else navigation.goBack();
    } else {
      const { error } = await supabase.from('Cliente').insert([dados]);
      if (error) Alert.alert('Erro', error.message);
      else navigation.goBack();
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome *</Text>
      <Input value={nome} onChangeText={setNome} placeholder="Nome do cliente" />
      <Text style={styles.label}>Telefone</Text>
      <Input value={telefone} onChangeText={setTelefone} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
      <Text style={styles.label}>Observações</Text>
      <Input value={observacoes} onChangeText={setObservacoes} placeholder="Informações extras" multiline style={{ height: 80 }} />
      <Button title={id ? 'Atualizar' : 'Salvar'} onPress={salvar} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#2C2C2C', marginBottom: 6, marginTop: 12 },
});