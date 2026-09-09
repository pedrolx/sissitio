import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';
import { calcularRateio } from '../../services/rateio';
import { formatDateBR } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';
import { Picker } from '@react-native-picker/picker';

interface Venda {
  idvenda: number;
  datavenda: string;
  valortotal: number;
  statuspagamento: string;
  idcliente: number;
  idusuario: string;
  cliente?: { nome: string; telefone: string } | null;
  usuario?: { nome: string } | null;
}

interface ItemVenda {
  iditemvenda: number;
  idvenda: number;
  idproduto: number;
  quantidade: number;
  valorunitario: number;
  valortotal: number;
  produto?: { nome: string; unidademedida: string; categoria?: string } | null;
}

interface Produto {
  idproduto: number;
  nome: string;
  unidademedida: string;
  categoria?: string;
}

const STATUS_OPCOES = ['Pendente', 'Pago', 'Cancelado'];

export default function DetalhesVendaScreen({ route }: any) {
  const { id } = route.params;
  const [venda, setVenda] = useState<Venda | null>(null);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalStatusVisible, setModalStatusVisible] = useState(false);
  const [novoStatus, setNovoStatus] = useState('');

  const rateio = itens.length > 0 ? calcularRateio(itens) : { jane: 0, viviane: 0 };

  useEffect(() => {
    carregarDetalhes();
  }, []);

  async function carregarDetalhes() {
    setLoading(true);
    try {
      const { data: vendaData, error: vendaError } = await supabase
        .from('venda')
        .select('*')
        .eq('idvenda', id)
        .single();
      if (vendaError) throw new Error(vendaError.message);

      let cliente = null;
      if (vendaData.idcliente) {
        const { data } = await supabase
          .from('cliente')
          .select('idcliente, nome, telefone')
          .eq('idcliente', vendaData.idcliente)
          .single();
        cliente = data;
      }

      let usuario = null;
      if (vendaData.idusuario) {
        const { data } = await supabase
          .from('usuario')
          .select('iduser, nome')
          .eq('iduser', vendaData.idusuario)
          .single();
        usuario = data;
      }

      const vendaCompleta: Venda = {
        ...vendaData,
        cliente: cliente || null,
        usuario: usuario || null,
      };
      setVenda(vendaCompleta);
      setNovoStatus(vendaCompleta.statuspagamento);

      const { data: itensData, error: itensError } = await supabase
        .from('itemvenda')
        .select('*')
        .eq('idvenda', id);
      if (itensError) throw new Error(itensError.message);

      if (itensData && itensData.length > 0) {
        const produtosIds = itensData
          .map(item => item.idproduto)
          .filter((id): id is number => id !== null && id !== undefined);

        let produtosMap: Record<number, Produto> = {};
        if (produtosIds.length > 0) {
          const { data: produtos, error: prodError } = await supabase
            .from('produto')
            .select('idproduto, nome, unidademedida, categoria')
            .in('idproduto', produtosIds);
          if (prodError) throw new Error(prodError.message);
          if (produtos) {
            produtosMap = produtos.reduce<Record<number, Produto>>((acc, p) => {
              acc[p.idproduto] = p;
              return acc;
            }, {});
          }
        }

        const itensComProdutos: ItemVenda[] = itensData.map(item => ({
          ...item,
          produto: produtosMap[item.idproduto] || null,
        }));
        setItens(itensComProdutos);
      } else {
        setItens([]);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao carregar detalhes da venda');
    } finally {
      setLoading(false);
    }
  }

  async function atualizarStatus() {
    if (!venda) return;
    if (novoStatus === venda.statuspagamento) {
      setModalStatusVisible(false);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('venda')
        .update({ statuspagamento: novoStatus })
        .eq('idvenda', venda.idvenda);

      if (error) throw new Error(error.message);

      Alert.alert('Sucesso', 'Status de pagamento atualizado!');
      setModalStatusVisible(false);
      await carregarDetalhes(); // recarrega os dados
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar status');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Text style={styles.loading}>Carregando...</Text>;
  if (!venda) return <Text style={styles.loading}>Venda não encontrada</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
        <Text style={[styles.value, styles.statusTexto]}>{venda.statuspagamento}</Text>
      </View>

      <Text style={styles.subtitle}>Itens</Text>
      {itens.map((item) => (
        <View key={item.iditemvenda} style={styles.itemCard}>
          <Text style={styles.itemNome}>{item.produto?.nome || 'Produto removido'}</Text>
          <Text style={styles.itemDetalhe}>
            {item.quantidade} {item.produto?.unidademedida || ''} x {formatCurrency(item.valorunitario)}
          </Text>
          <Text style={styles.itemTotal}>{formatCurrency(item.valortotal)}</Text>
        </View>
      ))}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>{formatCurrency(venda.valortotal)}</Text>
      </View>

      <View style={styles.rateioCard}>
        <Text style={styles.rateioTitle}>Rateio</Text>
        <View style={styles.rateioRow}>
          <Text style={styles.rateioLabel}>Jane:</Text>
          <Text style={styles.rateioValue}>{formatCurrency(rateio.jane)}</Text>
        </View>
        <View style={styles.rateioRow}>
          <Text style={styles.rateioLabel}>Viviane:</Text>
          <Text style={styles.rateioValue}>{formatCurrency(rateio.viviane)}</Text>
        </View>
      </View>

      {/* Botão Atualizar Status com funcionalidade */}
      <Button
        title="Atualizar Status"
        onPress={() => {
          setNovoStatus(venda.statuspagamento);
          setModalStatusVisible(true);
        }}
      />

      {/* Modal para seleção do novo status */}
      <Modal visible={modalStatusVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Alterar Status de Pagamento</Text>
            <Picker
              selectedValue={novoStatus}
              onValueChange={(itemValue) => setNovoStatus(itemValue)}
              style={styles.picker}
            >
              {STATUS_OPCOES.map((status) => (
                <Picker.Item key={status} label={status} value={status} />
              ))}
            </Picker>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#C17F59' }]} onPress={() => setModalStatusVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#3E7C59' }]} onPress={atualizarStatus}>
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 20, textAlign: 'center' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#8A8A8A', marginTop: 8 },
  value: { fontSize: 16, color: '#2C2C2C', marginBottom: 4 },
  statusTexto: { fontWeight: 'bold', color: '#3E7C59' },
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

  // Estilos para o modal de status
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#2C2C2C',
  },
  picker: {
    backgroundColor: '#F7F5EF',
    borderRadius: 8,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});