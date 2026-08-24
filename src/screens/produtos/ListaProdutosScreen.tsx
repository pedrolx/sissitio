// src/screens/produtos/ListaProdutosScreen.tsx
import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useProdutos } from '../../hooks/useProdutos';
import { Button } from '../../components/Button';
import { useFocusEffect } from '@react-navigation/native';
import { processQueue } from '../../services/sync';

export default function ListaProdutosScreen({ navigation }) {
  const { produtos, loading, excluirProduto } = useProdutos();

  useFocusEffect(
    useCallback(() => {
      processQueue();
    }, [])
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text>{item.categoria} • {item.unidademedida}</Text>
        <Text>R$ {item.precobase?.toFixed(2)}</Text>
      </View>
      <View style={styles.actions}>
        {/* Ícone de pendência (aparece se o item ainda não foi sincronizado) */}
        {item._pending && (
          <Text style={styles.pendingIcon}>⏳</Text>
        )}
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
  actions: { flexDirection: 'row', alignItems: 'center' },
  edit: { fontSize: 20, marginRight: 8, color: '#3E7C59' },
  delete: { fontSize: 20, color: '#C17F59' },
  pendingIcon: { fontSize: 20, marginRight: 8, color: '#FFA500' },
});