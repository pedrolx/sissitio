import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ListaMovimentacoesScreen() {
  const [movimentacoes, setMovimentacoes] = useState([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data, error } = await supabase
      .from('Movimentacao')
      .select('*, Produto(nome)')
      .order('dataMovimentacao', { ascending: false });
    if (!error) setMovimentacoes(data || []);
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text>{new Date(item.dataMovimentacao).toLocaleString()}</Text>
      <Text>Tipo: {item.tipoMovimentacao}</Text>
      <Text>Produto: {item.Produto?.nome || '—'}</Text>
      <Text>Quantidade: {item.quantidade}</Text>
      <Text>Observação: {item.observacoes || '—'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList data={movimentacoes} renderItem={renderItem} keyExtractor={(item) => item.idMovimentacao.toString()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { backgroundColor: '#FFF', padding: 12, marginBottom: 8, borderRadius: 8 },
});