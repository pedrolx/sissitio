import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../components/Button';

const screenWidth = Dimensions.get('window').width - 32;

// Interfaces
interface RelatorioEstoque {
  nome: string;
  quantidadeatual: number;
  unidademedida: string;
}

interface RelatorioVenda {
  totalVendas: number;
  ticketMedio: number;
  totalClientes: number;
  vendasPorDia: { data: string; total: number }[];
}

interface RelatorioMovimentacao {
  totalEntradas: number;
  totalSaidas: number;
  maisEntradas: { nome: string; quantidade: number }[];
  maisSaidas: { nome: string; quantidade: number }[];
}

interface RelatorioAnimal {
  totalVivos: number;
  totalAbatidos: number;
  totalVendidos: number;
  pesoMedio: number;
  especies: { especie: string; quantidade: number }[];
  evolucao: { mes: string; nascimentos: number; abates: number; vendas: number }[];
}

export default function RelatoriosScreen() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'personalizado'>('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'inicio' | 'fim'>('inicio');

  const [estoque, setEstoque] = useState<RelatorioEstoque[]>([]);
  const [vendas, setVendas] = useState<RelatorioVenda | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<RelatorioMovimentacao | null>(null);
  const [animais, setAnimais] = useState<RelatorioAnimal | null>(null);
  const [tipoRelatorio, setTipoRelatorio] = useState<'estoque' | 'vendas' | 'movimentacoes' | 'animais'>('estoque');

  const getDatasPeriodo = () => {
    const hoje = new Date();
    let inicio = new Date(hoje);
    let fim = new Date(hoje);

    switch (periodo) {
      case 'hoje':
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        break;
      case 'semana':
        inicio.setDate(hoje.getDate() - 7);
        break;
      case 'mes':
        inicio.setMonth(hoje.getMonth() - 1);
        break;
      case 'personalizado':
        if (dataInicio) inicio = new Date(dataInicio);
        if (dataFim) fim = new Date(dataFim);
        break;
    }

    return { inicio, fim };
  };

  const carregarDados = async () => {
    setLoading(true);
    const { inicio, fim } = getDatasPeriodo();
    const inicioStr = inicio.toISOString();
    const fimStr = fim.toISOString();

    try {
      if (tipoRelatorio === 'estoque') {
        await carregarEstoque();
      } else if (tipoRelatorio === 'vendas') {
        await carregarVendas(inicioStr, fimStr);
      } else if (tipoRelatorio === 'movimentacoes') {
        await carregarMovimentacoes(inicioStr, fimStr);
      } else if (tipoRelatorio === 'animais') {
        await carregarAnimais();
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- FUNÇÕES DE CARREGAMENTO ----------

  const carregarEstoque = async () => {
    const { data, error } = await supabase
      .from('estoque')
      .select('quantidadeatual, produto(nome, unidademedida)');
    if (error) throw error;
    const formatted = data.map((item: any) => ({
      nome: item.produto?.[0]?.nome || 'Produto removido',
      quantidadeatual: item.quantidadeatual,
      unidademedida: item.produto?.[0]?.unidademedida || '',
    }));
    setEstoque(formatted);
  };

  const carregarVendas = async (inicio: string, fim: string) => {
    const { data: vendasData, error: vendaError } = await supabase
      .from('venda')
      .select('valortotal, idcliente')
      .gte('datavenda', inicio)
      .lte('datavenda', fim);

    if (vendaError) throw vendaError;

    const totalVendas = vendasData?.reduce((sum, v) => sum + v.valortotal, 0) || 0;
    const totalClientes = new Set(vendasData?.map(v => v.idcliente) || []).size;
    const ticketMedio = vendasData?.length ? totalVendas / vendasData.length : 0;

    const { data: vendasDiarias, error: diarioError } = await supabase
      .from('venda')
      .select('datavenda, valortotal')
      .gte('datavenda', inicio)
      .lte('datavenda', fim);

    if (diarioError) throw diarioError;

    const dias: Record<string, number> = {};
    vendasDiarias?.forEach(v => {
      const data = v.datavenda.slice(0, 10);
      dias[data] = (dias[data] || 0) + v.valortotal;
    });

    const vendasPorDia = Object.entries(dias)
      .map(([data, total]) => ({ data, total }))
      .sort((a, b) => a.data.localeCompare(b.data));

    setVendas({ totalVendas, ticketMedio, totalClientes, vendasPorDia });
  };

  const carregarMovimentacoes = async (inicio: string, fim: string) => {
    const { data: movData, error: movError } = await supabase
      .from('movimentacao')
      .select('tipomovimentacao, quantidade, idproduto, produto(nome)')
      .gte('datamovimentacao', inicio)
      .lte('datamovimentacao', fim);

    if (movError) throw movError;

    let totalEntradas = 0;
    let totalSaidas = 0;
    const entradasPorProduto: Record<string, number> = {};
    const saidasPorProduto: Record<string, number> = {};

    movData?.forEach(m => {
      const nome = m.produto?.[0]?.nome || 'Produto removido';
      if (m.tipomovimentacao === 'entrada') {
        totalEntradas += m.quantidade || 0;
        entradasPorProduto[nome] = (entradasPorProduto[nome] || 0) + (m.quantidade || 0);
      } else if (m.tipomovimentacao === 'saida' || m.tipomovimentacao === 'venda_animal') {
        totalSaidas += m.quantidade || 0;
        saidasPorProduto[nome] = (saidasPorProduto[nome] || 0) + (m.quantidade || 0);
      }
    });

    const maisEntradas = Object.entries(entradasPorProduto)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    const maisSaidas = Object.entries(saidasPorProduto)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    setMovimentacoes({ totalEntradas, totalSaidas, maisEntradas, maisSaidas });
  };

  const carregarAnimais = async () => {
    const { data: statusData, error: statusError } = await supabase
      .from('animal')
      .select('status, pesoatual, especie');

    if (statusError) throw statusError;

    const totalVivos = statusData?.filter(a => a.status === 'vivo').length || 0;
    const totalAbatidos = statusData?.filter(a => a.status === 'abatido').length || 0;
    const totalVendidos = statusData?.filter(a => a.status === 'vendido').length || 0;
    const pesos = statusData?.filter(a => a.pesoatual).map(a => a.pesoatual) || [];
    const pesoMedio = pesos.length ? pesos.reduce((a, b) => a + b, 0) / pesos.length : 0;

    const contagemPorEspecie: Record<string, number> = {};
    statusData?.forEach(a => {
      const especie = a.especie || 'Desconhecida';
      contagemPorEspecie[especie] = (contagemPorEspecie[especie] || 0) + 1;
    });

    const especies = Object.entries(contagemPorEspecie)
      .map(([especie, quantidade]) => ({ especie, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const { data: evolucaoData, error: evolucaoError } = await supabase
      .from('movimentacao')
      .select('tipomovimentacao, datamovimentacao')
      .in('tipomovimentacao', ['abate', 'venda_animal']);

    if (evolucaoError) throw evolucaoError;

    const meses: Record<string, { nascimentos: number; abates: number; vendas: number }> = {};
    evolucaoData?.forEach(m => {
      const mes = m.datamovimentacao.slice(0, 7);
      if (!meses[mes]) meses[mes] = { nascimentos: 0, abates: 0, vendas: 0 };
      if (m.tipomovimentacao === 'abate') meses[mes].abates += 1;
      if (m.tipomovimentacao === 'venda_animal') meses[mes].vendas += 1;
    });

    const evolucao = Object.entries(meses)
      .map(([mes, dados]) => ({ mes, ...dados }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    setAnimais({ totalVivos, totalAbatidos, totalVendidos, pesoMedio, especies, evolucao });
  };

  // ---------- RENDERIZAÇÃO ----------

  const renderPeriodoSelector = () => (
    <View style={styles.periodoContainer}>
      <Text style={styles.periodoLabel}>Período:</Text>
      <View style={styles.periodoBotoes}>
        {['hoje', 'semana', 'mes', 'personalizado'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.periodoBotao, periodo === t && styles.periodoBotaoAtivo]}
            onPress={() => {
              setPeriodo(t as any);
              if (t !== 'personalizado') carregarDados();
            }}
          >
            <Text style={[styles.periodoTexto, periodo === t && styles.periodoTextoAtivo]}>
              {t === 'hoje' ? 'Hoje' : t === 'semana' ? 'Semana' : t === 'mes' ? 'Mês' : 'Período'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {periodo === 'personalizado' && (
        <View style={styles.personalizadoContainer}>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setDatePickerType('inicio');
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateButtonText}>
                Início: {dataInicio || 'Selecionar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setDatePickerType('fim');
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateButtonText}>
                Fim: {dataFim || 'Selecionar'}
              </Text>
            </TouchableOpacity>
          </View>
          <Button title="Aplicar filtro" onPress={carregarDados} />
        </View>
      )}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              const dateStr = selectedDate.toISOString().slice(0, 10);
              if (datePickerType === 'inicio') setDataInicio(dateStr);
              else setDataFim(dateStr);
            }
          }}
        />
      )}
    </View>
  );

  const renderConteudo = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3E7C59" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      );
    }

    switch (tipoRelatorio) {
      case 'estoque': return renderEstoque();
      case 'vendas': return renderVendas();
      case 'movimentacoes': return renderMovimentacoes();
      case 'animais': return renderAnimais();
      default: return null;
    }
  };

  const renderEstoque = () => {
    if (estoque.length === 0) return <Text style={styles.emptyText}>Nenhum produto cadastrado.</Text>;

    const sorted = [...estoque].sort((a, b) => b.quantidadeatual - a.quantidadeatual).slice(0, 5);
    const data = {
      labels: sorted.map(item => item.nome.substring(0, 10)),
      datasets: [{ data: sorted.map(item => item.quantidadeatual) }],
    };

    const totalValor = estoque.reduce((acc, item) => acc + item.quantidadeatual, 0);

    return (
      <View>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoLabel}>Total de Itens em Estoque</Text>
          <Text style={styles.resumoValor}>{totalValor} unidades</Text>
        </View>
        <Text style={styles.subtitle}>Top 5 Produtos</Text>
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
            <Text style={styles.itemValue}>
              {item.quantidadeatual} {item.unidademedida}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderVendas = () => {
    if (!vendas) return <Text style={styles.emptyText}>Nenhuma venda no período.</Text>;

    const pieData = [
      { name: 'Vendas', amount: vendas.totalVendas, color: '#3E7C59', legendFontColor: '#2C2C2C', legendFontSize: 12 },
      { name: 'Ticket Médio', amount: vendas.ticketMedio, color: '#C17F59', legendFontColor: '#2C2C2C', legendFontSize: 12 },
    ];

    return (
      <View>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoLabel}>Total de Vendas</Text>
          <Text style={styles.resumoValor}>R$ {vendas.totalVendas.toFixed(2)}</Text>
          <Text style={styles.resumoDetalhe}>Ticket médio: R$ {vendas.ticketMedio.toFixed(2)}</Text>
          <Text style={styles.resumoDetalhe}>Clientes únicos: {vendas.totalClientes}</Text>
        </View>

        <Text style={styles.subtitle}>Vendas por Dia</Text>
        {vendas.vendasPorDia.length > 0 ? (
          <BarChart
            data={{
              labels: vendas.vendasPorDia.slice(-7).map(item => item.data.slice(5)),
              datasets: [{ data: vendas.vendasPorDia.slice(-7).map(item => item.total) }],
            }}
            width={screenWidth}
            height={200}
            chartConfig={{
              backgroundColor: '#FFF',
              backgroundGradientFrom: '#FFF',
              backgroundGradientTo: '#FFF',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(193, 127, 89, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 8 },
            }}
            style={styles.chart}
            fromZero={true}
            yAxisLabel="R$"
            yAxisSuffix=""
          />
        ) : (
          <Text style={styles.emptyText}>Sem dados para o período.</Text>
        )}
      </View>
    );
  };

  const renderMovimentacoes = () => {
    if (!movimentacoes) return <Text style={styles.emptyText}>Nenhuma movimentação no período.</Text>;

    const pieData = [
      { name: 'Entradas', amount: movimentacoes.totalEntradas, color: '#3E7C59', legendFontColor: '#2C2C2C', legendFontSize: 12 },
      { name: 'Saídas', amount: movimentacoes.totalSaidas, color: '#C17F59', legendFontColor: '#2C2C2C', legendFontSize: 12 },
    ];

    return (
      <View>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoLabel}>Entradas vs Saídas</Text>
          <Text style={styles.resumoValor}>Entradas: {movimentacoes.totalEntradas}</Text>
          <Text style={styles.resumoValor}>Saídas: {movimentacoes.totalSaidas}</Text>
        </View>

        {movimentacoes.totalEntradas > 0 || movimentacoes.totalSaidas > 0 ? (
          <PieChart
            data={pieData}
            width={screenWidth}
            height={220}
            chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        ) : (
          <Text style={styles.emptyText}>Sem movimentações no período.</Text>
        )}

        <Text style={styles.subtitle}>Produtos com mais Entradas</Text>
        {movimentacoes.maisEntradas.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.nome}</Text>
            <Text style={styles.itemValue}>{item.quantidade}</Text>
          </View>
        ))}

        <Text style={styles.subtitle}>Produtos com mais Saídas</Text>
        {movimentacoes.maisSaidas.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.nome}</Text>
            <Text style={styles.itemValue}>{item.quantidade}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAnimais = () => {
    if (!animais) return <Text style={styles.emptyText}>Nenhum animal cadastrado.</Text>;

    const pieData = [
      { name: 'Vivos', amount: animais.totalVivos, color: '#3E7C59', legendFontColor: '#2C2C2C', legendFontSize: 12 },
      { name: 'Abatidos', amount: animais.totalAbatidos, color: '#C17F59', legendFontColor: '#2C2C2C', legendFontSize: 12 },
      { name: 'Vendidos', amount: animais.totalVendidos, color: '#5BA16A', legendFontColor: '#2C2C2C', legendFontSize: 12 },
    ];

    return (
      <View>
        <View style={styles.resumoCard}>
          <Text style={styles.resumoLabel}>Resumo do Rebanho</Text>
          <Text style={styles.resumoValor}>Vivos: {animais.totalVivos}</Text>
          <Text style={styles.resumoValor}>Abatidos: {animais.totalAbatidos}</Text>
          <Text style={styles.resumoValor}>Vendidos: {animais.totalVendidos}</Text>
          <Text style={styles.resumoDetalhe}>Peso médio: {animais.pesoMedio.toFixed(1)} kg</Text>
        </View>

        <PieChart
          data={pieData}
          width={screenWidth}
          height={220}
          chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />

        <Text style={styles.subtitle}>Animais por Espécie</Text>
        {animais.especies.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma espécie cadastrada.</Text>
        ) : (
          animais.especies.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.especie}</Text>
              <Text style={styles.itemValue}>{item.quantidade}</Text>
            </View>
          ))
        )}

        {animais.evolucao.length > 0 && (
          <>
            <Text style={styles.subtitle}>Evolução Mensal</Text>
            {animais.evolucao.map((item, idx) => (
              <View key={idx} style={styles.evolucaoRow}>
                <Text style={styles.evolucaoMes}>{item.mes}</Text>
                <Text style={styles.evolucaoDado}>⬆ {item.abates} abates</Text>
                <Text style={styles.evolucaoDado}>⬇ {item.vendas} vendas</Text>
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  useEffect(() => {
    carregarDados();
  }, [tipoRelatorio]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>RELATÓRIOS</Text>
      {renderPeriodoSelector()}
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
      <View style={styles.card}>
        {renderConteudo()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#3E7C59' },
  periodoContainer: { marginBottom: 20 },
  periodoLabel: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 8 },
  periodoBotoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  periodoBotao: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E8E8E8', marginRight: 8, marginBottom: 8 },
  periodoBotaoAtivo: { backgroundColor: '#3E7C59' },
  periodoTexto: { color: '#2C2C2C', fontWeight: '500' },
  periodoTextoAtivo: { color: '#FFFFFF' },
  personalizadoContainer: { marginTop: 12 },
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dateButton: { flex: 1, backgroundColor: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D2D2D2' },
  dateButtonText: { color: '#2C2C2C' },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  botao: { backgroundColor: '#E8E8E8', padding: 10, borderRadius: 8, flex: 1, marginHorizontal: 4, alignItems: 'center' },
  botaoAtivo: { backgroundColor: '#3E7C59' },
  botaoTexto: { fontWeight: '600', color: '#2C2C2C' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#3E7C59', marginTop: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#D2D2D2' },
  itemName: { fontSize: 14, color: '#2C2C2C' },
  itemValue: { fontSize: 14, fontWeight: 'bold', color: '#3E7C59' },
  chart: { marginVertical: 8, borderRadius: 8 },
  resumoCard: { backgroundColor: '#E8F0E8', borderRadius: 12, padding: 16, marginBottom: 16 },
  resumoLabel: { fontSize: 16, color: '#2C2C2C' },
  resumoValor: { fontSize: 22, fontWeight: 'bold', color: '#3E7C59', marginTop: 4 },
  resumoDetalhe: { fontSize: 14, color: '#8A8A8A', marginTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#8A8A8A' },
  emptyText: { textAlign: 'center', color: '#8A8A8A', marginTop: 20 },
  evolucaoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  evolucaoMes: { fontWeight: 'bold', color: '#2C2C2C' },
  evolucaoDado: { color: '#8A8A8A' },
});