import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useProdutos } from '../../hooks/useProdutos';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export default function FormProdutoScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { produtos, salvarProduto } = useProdutos();
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [unidademedida, setUnidademedida] = useState('');
  const [precobase, setPrecobase] = useState('');
  const [precosugerido, setPrecosugerido] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const produto = produtos.find(p => p.idproduto === id);
      if (produto) {
        setNome(produto.nome);
        setCategoria(produto.categoria || '');
        setUnidademedida(produto.unidademedida || '');
        setPrecobase(produto.precobase?.toString() || '');
        setPrecosugerido(produto.precosugerido?.toString() || '');
      }
    }
  }, [id, produtos]);

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
    await salvarProduto(dados, id);
    setLoading(false);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nome *</Text>
      <Input value={nome} onChangeText={setNome} placeholder="Ex: Tomate Italiano" />
      <Text style={styles.label}>Categoria</Text>
      <Input value={categoria} onChangeText={setCategoria} placeholder="Ex: Hortaliça" />
      <Text style={styles.label}>Unidade de Medida *</Text>
      <Input value={unidademedida} onChangeText={setUnidademedida} placeholder="kg, un, dúzia, litro" />
      <Text style={styles.label}>Preço Base (R$)</Text>
      <Input value={precobase} onChangeText={setPrecobase} keyboardType="numeric" placeholder="* Custo real de produção (ex: R$ 5,00 por dúzia)" />
      <Text style={styles.label}>Preço Sugerido (R$)</Text>
      <Input value={precosugerido} onChangeText={setPrecosugerido} keyboardType="numeric" placeholder="* Valor recomendado para venda (ex: R$ 10,50 por dúzia)" />
      <Button title={id ? 'Atualizar' : 'Salvar'} onPress={salvar} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#2C2C2C', marginBottom: 6, marginTop: 12 },
});