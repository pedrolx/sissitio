import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAnotacoes } from '../hooks/useAnotacoes';

export function AnotacoesWidget({ navigation }) {
  const { anotacoes, carregar } = useAnotacoes();
  const [pendentes, setPendentes] = useState<any[]>([]);

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    const naoConcluidas = anotacoes.filter(a => !a.concluida).slice(0, 3);
    setPendentes(naoConcluidas);
  }, [anotacoes]);

  if (pendentes.length === 0) return null;

  return (
    <TouchableOpacity style={styles.widget} onPress={() => navigation.navigate('ListaAnotacoes')}>
      <Text style={styles.title}>📝 Anotações pendentes</Text>
      {pendentes.map((item) => (
        <View key={item.idanotacao} style={styles.item}>
          <Text style={styles.itemTexto} numberOfLines={1}>
            {item.texto}
          </Text>
          <Text style={styles.itemPrioridade}>
            {item.prioridade === 'alta' ? '🔴' : item.prioridade === 'media' ? '🟡' : '🟢'}
          </Text>
        </View>
      ))}
      <Text style={styles.verMais}>Ver todas →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  widget: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 8 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemTexto: { fontSize: 14, color: '#2C2C2C', flex: 1 },
  itemPrioridade: { fontSize: 16, marginLeft: 8 },
  verMais: { fontSize: 14, color: '#3E7C59', marginTop: 8, textAlign: 'right' },
});