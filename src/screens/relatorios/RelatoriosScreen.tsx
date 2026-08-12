import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width - 32;

interface RelatorioEstoque {
  nome: string;
  quantidadeatual: number;
  unidademedida: string;
}

interface RelatorioVenda {
  idvenda: number;
  datavenda: string;
  valortotal: number;
  cliente: string;
}

export default function RelatoriosScreen() {
  const [estoque, setEstoque] = useState<RelatorioEstoque[]>([]);
  const [vendas, setVendas] = useState<RelatorioVenda[]>([]);
  const [movimentacoesCount, setMovimentacoesCount] = useState(0);
  const [animaisCount, setAnimaisCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tipoRelatorio, setTipoRelatorio] = useState<'estoque' | 'vendas' | 'movimentacoes' | 'animais'>('estoque');

  useEffect(() => {
    carregarDados();
  }, [tipoRelatorio]);

  async function carregarDados() {
    setLoading(true);
    try {
      if (tipoRelatorio === 'estoque') {
        const { data, error } = await supabase
          .from('estoque')
          .select('quantidadeatual, produto(nome, unidademedida)');
        if (error) throw error;
        const formatted = data.map((item: any) => ({
          nome: item.produto?.[0]?.nome || '—',
          quantidadeatual: item.quantidadeatual,
          unidademedida: item.produto?.[0]?.unidademedida || '',
        }));
        setEstoque(formatted);
      } else if (tipoRelatorio === 'vendas') {
        const { data, error } = await supabase
          .from('venda')
          .select('idvenda, datavenda, valortotal, cliente(nome)')
          .order('datavenda', { ascending: false })
          .limit(50);
        if (error) throw error;
        const formatted = data.map((item: any) => ({
          idvenda: item.idvenda,
          datavenda: item.datavenda,
          valortotal: item.valortotal,
          cliente: item.cliente?.[0]?.nome || 'Cliente não identificado',
        }));
        setVendas(formatted);
      } else if (tipoRelatorio === 'movimentacoes') {
        const { count, error } = await supabase
          .from('movimentacao')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        setMovimentacoesCount(count || 0);
      } else if (tipoRelatorio === 'animais') {
        const { count, error } = await supabase
          .from('animal')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        setAnimaisCount(count || 0);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  }

  const renderConteudo = () => {
    if (loading) return <Text style={styles.loading}>Carregando...</Text>;

    switch (tipoRelatorio) {
      case 'estoque': {
        const sorted = [...estoque].sort((a, b) => b.quantidadeatual - a.quantidadeatual).slice(0, 5);
        const data = {
          labels: sorted.map(item => item.nome.substring(0, 10)),
          datasets: [{ data: sorted.map(item => item.quantidadeatual) }],
        };
        return (
          <View>
            <Text style={styles.subtitle}>Top 5 Produtos em Estoque</Text>
            <BarChart
              data={data}
              width={screenWidth}
              height={220}
              chartConfig={{
                backgroundColor: '#FFF',
                backgroundGradientFrom: '#FFF',
                backgroundGradientTo: '#FFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(62, 124, 89, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 8 },
              }}
              style={styles.chart}
              fromZero={true}
              yAxisLabel=""
              yAxisSuffix=""
            />
            {estoque.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.nome}</Text>
                <Text style={styles.itemValue}>{item.quantidadeatual} {item.unidademedida}</Text>
              </View>
            ))}
          </View>
        );
      }
      case 'vendas': {
        const clientes: Record<string, number> = {};
        vendas.forEach((v) => {
          clientes[v.cliente] = (clientes[v.cliente] || 0) + v.valortotal;
        });
        const sortedClientes = Object.entries(clientes).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const pieData = sortedClientes.map(([name, value], index) => ({
          name: name.substring(0, 12),
          amount: value,
          color: ['#3E7C59', '#C17F59', '#5BA16A', '#8AA98A', '#D4A373'][index % 5],
          legendFontColor: '#2C2C2C',
          legendFontSize: 12,
        }));
        return (
          <View>
            <Text style={styles.subtitle}>Vendas por Cliente (Top 5)</Text>
            <PieChart
              data={pieData}
              width={screenWidth}
              height={220}
              chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            {vendas.map((venda) => (
              <View key={venda.idvenda} style={styles.itemRow}>
                <Text style={styles.itemName}>#{venda.idvenda} - {new Date(venda.datavenda).toLocaleDateString()}</Text>
                <Text style={styles.itemValue}>R$ {venda.valortotal.toFixed(2)}</Text>
                <Text style={styles.itemDetail}>{venda.cliente}</Text>
              </View>
            ))}
          </View>
        );
      }
      case 'movimentacoes':
        return (
          <View>
            <Text style={styles.subtitle}>Total de Movimentações Registradas</Text>
            <Text style={styles.bigNumber}>{movimentacoesCount}</Text>
          </View>
        );
      case 'animais':
        return (
          <View>
            <Text style={styles.subtitle}>Total de Animais no Sistema</Text>
            <Text style={styles.bigNumber}>{animaisCount}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>RELATÓRIOS</Text>
      <View style={styles.linhaBotoes}>
        {['estoque', 'vendas', 'movimentacoes', 'animais'].map((tipo) => (
          <TouchableOpacity
            key={tipo}
            style={[styles.botao, tipoRelatorio === tipo && styles.botaoAtivo]}
            onPress={() => setTipoRelatorio(tipo as any)}
          >
            <Text style={styles.botaoTexto}>
              {tipo === 'estoque' ? 'Estoque' :
                tipo === 'vendas' ? 'Vendas' :
                  tipo === 'movimentacoes' ? 'Movimentações' : 'Animais'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.card}>{renderConteudo()}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#3E7C59' },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  botao: { backgroundColor: '#E8E8E8', padding: 10, borderRadius: 8, flex: 1, marginHorizontal: 4, alignItems: 'center' },
  botaoAtivo: { backgroundColor: '#3E7C59' },
  botaoTexto: { fontWeight: '600', color: '#2C2C2C' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#3E7C59' },
  itemRow: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#D2D2D2', paddingBottom: 8 },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemValue: { fontSize: 14, color: '#3E7C59', fontWeight: 'bold' },
  itemDetail: { fontSize: 12, color: '#8A8A8A' },
  bigNumber: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: '#3E7C59', marginTop: 20 },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
  chart: { marginVertical: 8, borderRadius: 8 },
});