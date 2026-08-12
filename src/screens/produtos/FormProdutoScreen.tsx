import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export default function FormProdutoScreen({ route, navigation }) {
  const { id } = route.params || {};
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [unidademedida, setunidademedida] = useState('');
  const [precobase, setprecobase] = useState('');
  const [precosugerido, setprecosugerido] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) carregarProduto();
  }, [id]);

  async function carregarProduto() {
    const { data, error } = await supabase
      .from('produto')
      .select('*')
      .eq('idproduto', id)
      .single();
    if (!error && data) {
      setNome(data.nome);
      setCategoria(data.categoria || '');
      setunidademedida(data.unidademedida || '');
      setprecobase(data.precobase?.toString() || '');
      setprecosugerido(data.precosugerido?.toString() || '');
    }
  }

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Nome é obrigatório');
      return;
    }
    if (!unidademedida.trim()) {
      Alert.alert('Atenção', 'Unidade de medida é obrigatória');
      return;
    }
    setLoading(true);
    const dados = {
      nome,
      categoria: categoria || null,
      unidademedida,
      precobase: parseFloat(precobase) || 0,
      precosugerido: parseFloat(precosugerido) || null,
    };

    if (id) {
      // Atualizar produto existente
      const { error } = await supabase
        .from('produto')
        .update(dados)
        .eq('idproduto', id);
      if (error) Alert.alert('Erro', error.message);
      else navigation.goBack();
    } else {
      // Inserir novo produto e criar estoque associado
      const { data: novoProduto, error: insertError } = await supabase
        .from('produto')
        .insert([dados])
        .select()
        .single();

      if (insertError) {
        Alert.alert('Erro', insertError.message);
      } else {
        // Criar registro de estoque para este produto (quantidade inicial 0)
        const { error: estoqueError } = await supabase
          .from('estoque')
          .insert({ idproduto: novoProduto.idproduto, quantidadeatual: 0 });
        if (estoqueError) {
          Alert.alert('Aviso', 'Produto criado, mas erro ao criar estoque: ' + estoqueError.message);
        }
        navigation.goBack();
      }
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome *</Text>
      <Input value={nome} onChangeText={setNome} placeholder="Ex: Tomate Italiano" />

      <Text style={styles.label}>Categoria</Text>
      <Input value={categoria} onChangeText={setCategoria} placeholder="Ex: Hortaliça" />

      <Text style={styles.label}>Unidade de Medida *</Text>
      <Input value={unidademedida} onChangeText={setunidademedida} placeholder="kg, un, dúzia, litro" />

      <Text style={styles.label}>Preço Base (R$)</Text>
      <Input value={precobase} onChangeText={setprecobase} keyboardType="numeric" placeholder="0.00" />

      <Text style={styles.label}>Preço Sugerido (R$)</Text>
      <Input value={precosugerido} onChangeText={setprecosugerido} keyboardType="numeric" placeholder="0.00" />

      <Button title={id ? 'Atualizar' : 'Salvar'} onPress={salvar} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#2C2C2C', marginBottom: 6, marginTop: 12 },
});
