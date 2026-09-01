import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';
import { calcularRateio } from '../../services/rateio';
import { formatDateBR } from '../../utils/dateUtils';

interface Venda {
  idvenda: number;
  datavenda: string;
  valortotal: number;
  statuspagamento: string;
  cliente?: { nome: string; telefone: string } | null;
  usuario?: { nome: string } | null;
}

interface ItemVenda {
  iditemvenda: number;
  quantidade: number;
  valorunitario: number;
  valortotal: number;
  produto?: { nome: string; unidademedida: string } | null;
}

interface Props {
  route: { params: { id: number } };
}

export default function DetalhesVendaScreen({ route }: any) {
  const { id } = route.params;
  const [venda, setVenda] = useState<Venda | null>(null);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const rateio = itens.length > 0 ? calcularRateio(itens) : { jane: 0, tia: 0 };

  useEffect(() => {
    carregarDetalhes();
  }, []);

  async function carregarDetalhes() {
    setLoading(true);
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

    const { data: itensData, error: itensError } = await supabase
      .from('itemvenda')
      .select('*, produto(nome, unidademedida)')
      .eq('idvenda', id);

    if (itensError) {
      Alert.alert('Erro', itensError.message);
    } else {
      setItens(itensData || []);
    }
    setLoading(false);
  }

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
        <Text style={styles.value}>{formatDateBR(venda.datavenda, true)}</Text>

        <Text style={styles.label}>Cliente:</Text>
        <Text style={styles.value}>{venda.cliente?.nome || 'Cliente removido'}</Text>

        <Text style={styles.label}>Telefone:</Text>
        <Text style={styles.value}>{venda.cliente?.telefone || '—'}</Text>

        <Text style={styles.label}>Usuário:</Text>
        <Text style={styles.value}>{venda.usuario?.nome || '—'}</Text>

        <Text style={styles.label}>Status Pagamento:</Text>
        <Text style={styles.value}>{venda.statuspagamento}</Text>
      </View>

      <Text style={styles.subtitle}>Itens</Text>
      {itens.map((item) => (
        <View key={item.iditemvenda} style={styles.itemCard}>
          <Text style={styles.itemNome}>{item.produto?.nome || 'Produto removido'}</Text>
          <Text style={styles.itemDetalhe}>
            {item.quantidade} {item.produto?.unidademedida || ''} x {formatarMoeda(item.valorunitario)}
          </Text>
          <Text style={styles.itemTotal}>{formatarMoeda(item.valortotal)}</Text>
        </View>
      ))}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>{formatarMoeda(venda.valortotal)}</Text>
      </View>

      <View style={styles.rateioCard}>
        <Text style={styles.rateioTitle}>Rateio</Text>
        <View style={styles.rateioRow}>
          <Text style={styles.rateioLabel}>Jane:</Text>
          <Text style={styles.rateioValue}>R$ {rateio.jane.toFixed(2)}</Text>
        </View>
        <View style={styles.rateioRow}>
          <Text style={styles.rateioLabel}>Tia:</Text>
          <Text style={styles.rateioValue}>R$ {rateio.tia.toFixed(2)}</Text>
        </View>
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
  rateioCard: { backgroundColor: '#F0F4F0', borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 16 },
  rateioTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 8 },
  rateioRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  rateioLabel: { fontSize: 14, color: '#2C2C2C' },
  rateioValue: { fontSize: 14, fontWeight: 'bold', color: '#3E7C59' },
});