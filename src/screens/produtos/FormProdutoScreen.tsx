import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export default function FormProdutoScreen({ route, navigation }) {
  const { id } = route.params || {};
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('');
  const [precoBase, setPrecoBase] = useState('');
  const [precoSugerido, setPrecoSugerido] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) carregarProduto();
  }, [id]);

  async function carregarProduto() {
    const { data, error } = await supabase
      .from('Produto')
      .select('*')
      .eq('idProduto', id)
      .single();
    if (!error && data) {
      setNome(data.nome);
      setCategoria(data.categoria || '');
      setUnidadeMedida(data.unidadeMedida || '');
      setPrecoBase(data.precoBase?.toString() || '');
      setPrecoSugerido(data.precoSugerido?.toString() || '');
    }
  }

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Nome é obrigatório');
      return;
    }
    if (!unidadeMedida.trim()) {
      Alert.alert('Atenção', 'Unidade de medida é obrigatória');
      return;
    }
    setLoading(true);
    const dados = {
      nome,
      categoria: categoria || null,
      unidadeMedida,
      precoBase: parseFloat(precoBase) || 0,
      precoSugerido: parseFloat(precoSugerido) || null,
    };

    if (id) {
      // Atualizar produto existente
      const { error } = await supabase
        .from('Produto')
        .update(dados)
        .eq('idProduto', id);
      if (error) Alert.alert('Erro', error.message);
      else navigation.goBack();
    } else {
      // Inserir novo produto e criar estoque associado
      const { data: novoProduto, error: insertError } = await supabase
        .from('Produto')
        .insert([dados])
        .select()
        .single();

      if (insertError) {
        Alert.alert('Erro', insertError.message);
      } else {
        // Criar registro de estoque para este produto (quantidade inicial 0)
        const { error: estoqueError } = await supabase
          .from('Estoque')
          .insert({ idProduto: novoProduto.idProduto, quantidadeAtual: 0 });
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
      <Input value={unidadeMedida} onChangeText={setUnidadeMedida} placeholder="kg, un, dúzia, litro" />

      <Text style={styles.label}>Preço Base (R$)</Text>
      <Input value={precoBase} onChangeText={setPrecoBase} keyboardType="numeric" placeholder="0.00" />

      <Text style={styles.label}>Preço Sugerido (R$)</Text>
      <Input value={precoSugerido} onChangeText={setPrecoSugerido} keyboardType="numeric" placeholder="0.00" />

      <Button title={id ? 'Atualizar' : 'Salvar'} onPress={salvar} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#2C2C2C', marginBottom: 6, marginTop: 12 },
});