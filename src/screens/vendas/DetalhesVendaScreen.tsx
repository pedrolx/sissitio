import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';

type Venda = {
  idvenda: number;
  datavenda: string;
  valortotal: number;
  statuspagamento: string;
  Cliente: { nome: string; telefone: string };
  Usuario: { nome: string };
};

type ItemVenda = {
  iditemvenda: number;
  quantidade: number;
  valorunitario: number;
  valortotal: number;
  Produto: { nome: string; unidademedida: string };
};

export default function DetalhesVendaScreen({ route }) {
  const { id } = route.params;
  const [venda, setVenda] = useState<Venda | null>(null);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDetalhes();
  }, []);

  async function carregarDetalhes() {
    setLoading(true);
    // Buscar cabeçalho da venda
    const { data: vendaData, error: vendaError } = await supabase
      .from('venda')
      .select('*, cliente(nome, telefone), usuario(nome)')
      .eq('idvenda', id)
      .single();
    if (vendaError) {
      Alert.alert('Erro', vendaError.message);
      setLoading(false);
      return;
    }
    setVenda(vendaData);

    // Buscar itens da venda
    const { data: itensData, error: itensError } = await supabase
      .from('itemvenda')
      .select('*, produto(nome, unidademedida)')
      .eq('idvenda', id);
    if (itensError) Alert.alert('Erro', itensError.message);
    else setItens(itensData || []);
    setLoading(false);
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) return <Text style={styles.loading}>Carregando...</Text>;
  if (!venda) return <Text style={styles.loading}>Venda não encontrada</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Venda #{venda.idvenda}</Text>
      <View style={styles.infoCard}>
        <Text style={styles.label}>Data:</Text>
        <Text style={styles.value}>{formatarData(venda.datavenda)}</Text>
        <Text style={styles.label}>Cliente:</Text>
        <Text style={styles.value}>{venda.Cliente?.nome || '—'}</Text>
        <Text style={styles.label}>Telefone:</Text>
        <Text style={styles.value}>{venda.Cliente?.telefone || '—'}</Text>
        <Text style={styles.label}>Usuário:</Text>
        <Text style={styles.value}>{venda.Usuario?.nome || '—'}</Text>
        <Text style={styles.label}>Status Pagamento:</Text>
        <Text style={styles.value}>{venda.statuspagamento}</Text>
      </View>

      <Text style={styles.subtitle}>Itens</Text>
      {itens.map((item) => (
        <View key={item.iditemvenda} style={styles.itemCard}>
          <Text style={styles.itemNome}>{item.Produto?.nome}</Text>
          <Text style={styles.itemDetalhe}>
            {item.quantidade} {item.Produto?.unidademedida} x {formatarMoeda(item.valorunitario)}
          </Text>
          <Text style={styles.itemTotal}>{formatarMoeda(item.valortotal)}</Text>
        </View>
      ))}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>{formatarMoeda(venda.valortotal)}</Text>
      </View>

      <Button
        title="Atualizar Status"
        onPress={() => {
          Alert.alert('Funcionalidade em desenvolvimento', 'Em breve será possível alterar o status.');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 20, textAlign: 'center' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#8A8A8A', marginTop: 8 },
  value: { fontSize: 16, color: '#2C2C2C', marginBottom: 4 },
  subtitle: { fontSize: 18, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 12 },
  itemCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8 },
  itemNome: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C' },
  itemDetalhe: { fontSize: 14, color: '#8A8A8A', marginTop: 4 },
  itemTotal: { fontSize: 16, fontWeight: 'bold', color: '#3E7C59', textAlign: 'right', marginTop: 8 },
  totalCard: { backgroundColor: '#3E7C59', borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 30, alignItems: 'center' },
  totalLabel: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  totalValue: { fontSize: 24, color: '#FFF', fontWeight: 'bold', marginTop: 8 },
});
