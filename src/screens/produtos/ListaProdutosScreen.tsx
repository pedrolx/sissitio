import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';

type Produto = {
  idproduto: number;
  nome: string;
  categoria: string;
  unidademedida: string;
  precobase: number;
  precosugerido: number;
};

export default function ListaProdutosScreen({ navigation }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    setLoading(true);
    const { data, error } = await supabase.from('produto').select('*').order('nome');
    if (error) Alert.alert('Erro', error.message);
    else setProdutos(data || []);
    setLoading(false);
  }

  async function excluirProduto(id: number) {
    Alert.alert('Excluir', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('produto').delete().eq('idproduto', id);
          if (error) Alert.alert('Erro', error.message);
          else carregarProdutos();
        },
      },
    ]);
  }

  const renderItem = ({ item }: { item: Produto }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text>{item.categoria} • {item.unidademedida}</Text>
        <Text>R$ {item.precobase?.toFixed(2)}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('FormProduto', { id: item.idproduto })}>
          <Text style={styles.edit}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => excluirProduto(item.idproduto)}>
          <Text style={styles.delete}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title="+ Novo Produto" onPress={() => navigation.navigate('FormProduto')} />
      {loading ? <Text>Carregando...</Text> : <FlatList data={produtos} renderItem={renderItem} keyExtractor={(item) => item.idproduto.toString()} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nome: { fontSize: 16, fontWeight: 'bold' },
  actions: { flexDirection: 'row' },
  edit: { fontSize: 20, marginRight: 8, color: '#3E7C59' },
  delete: { fontSize: 20, color: '#C17F59' },
});
