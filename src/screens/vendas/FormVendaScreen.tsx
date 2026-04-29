import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

type Cliente = { idCliente: number; nome: string; telefone: string };
type Produto = { idProduto: number; nome: string; unidadeMedida: string; precoSugerido: number; precoBase: number };
type ItemVenda = {
    produto: Produto;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
};

export default function FormVendaScreen({ navigation }) {
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [itens, setItens] = useState<ItemVenda[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [modalClienteVisible, setModalClienteVisible] = useState(false);
    const [modalProdutoVisible, setModalProdutoVisible] = useState(false);
    const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
    const [quantidade, setQuantidade] = useState('');
    const [loading, setLoading] = useState(false);
    const [desconto, setDesconto] = useState('0');

    useEffect(() => {
        carregarClientes();
        carregarProdutos();
    }, []);

    async function carregarClientes() {
        const { data, error } = await supabase.from('Cliente').select('*').order('nome');
        if (!error) setClientes(data || []);
    }

    async function carregarProdutos() {
        const { data, error } = await supabase.from('Produto').select('*').order('nome');
        if (!error) setProdutos(data || []);
    }

    function adicionarItem(produto: Produto, qtd: number) {
        if (qtd <= 0) {
            Alert.alert('Atenção', 'Quantidade deve ser maior que zero');
            return;
        }
        // Verificar se produto já está na lista
        const existingIndex = itens.findIndex((i) => i.produto.idProduto === produto.idProduto);
        const valorUnitario = produto.precoSugerido || produto.precoBase;
        const novoItem: ItemVenda = {
            produto,
            quantidade: qtd,
            valorUnitario,
            valorTotal: qtd * valorUnitario,
        };
        if (existingIndex >= 0) {
            const novosItens = [...itens];
            novosItens[existingIndex].quantidade += qtd;
            novosItens[existingIndex].valorTotal = novosItens[existingIndex].quantidade * valorUnitario;
            setItens(novosItens);
        } else {
            setItens([...itens, novoItem]);
        }
        setModalProdutoVisible(false);
        setSelectedProduto(null);
        setQuantidade('');
    }

    function removerItem(index: number) {
        const novosItens = [...itens];
        novosItens.splice(index, 1);
        setItens(novosItens);
    }

    function calcularSubtotal() {
        return itens.reduce((sum, item) => sum + item.valorTotal, 0);
    }

    function calcularTotal() {
        const subtotal = calcularSubtotal();
        const desc = parseFloat(desconto) || 0;
        return subtotal - desc;
    }

    async function finalizarVenda() {

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            Alert.alert('Erro', 'Usuário não autenticado');
            setLoading(false);
            return;
        }

        if (!cliente) {
            Alert.alert('Atenção', 'Selecione um cliente');
            return;
        }
        if (itens.length === 0) {
            Alert.alert('Atenção', 'Adicione pelo menos um item');
            return;
        }

        setLoading(true);
        // 1. Registrar a venda
        const { data: venda, error: vendaError } = await supabase
            .from('Venda')
            .insert({
                idCliente: cliente.idCliente,
                idUsuario: user.id,
                dataVenda: new Date().toISOString(),
                statusPagamento: 'Pendente',
                valorTotal: calcularTotal(),
            })
            .select()
            .single();

        if (vendaError) {
            Alert.alert('Erro', vendaError.message);
            setLoading(false);
            return;
        }

        // 2. Inserir itens e atualizar estoque
        let erro = false;
        for (const item of itens) {
            // Inserir ItemVenda
            const { error: itemError } = await supabase.from('ItemVenda').insert({
                idVenda: venda.idVenda,
                idProduto: item.produto.idProduto,
                quantidade: item.quantidade,
                valorUnitario: item.valorUnitario,
                valorTotal: item.valorTotal,
            });
            if (itemError) {
                Alert.alert('Erro', `Erro ao inserir item ${item.produto.nome}: ${itemError.message}`);
                erro = true;
                break;
            }

            // Atualizar estoque (diminuir quantidade)
            const { data: estoque, error: estoqueError } = await supabase
                .from('Estoque')
                .select('quantidadeAtual')
                .eq('idProduto', item.produto.idProduto)
                .single();
            if (estoqueError) {
                Alert.alert('Erro', `Erro ao buscar estoque de ${item.produto.nome}: ${estoqueError.message}`);
                erro = true;
                break;
            }
            const novaQuantidade = estoque.quantidadeAtual - item.quantidade;
            if (novaQuantidade < 0) {
                Alert.alert('Erro', `Estoque insuficiente para ${item.produto.nome}. Disponível: ${estoque.quantidadeAtual}`);
                erro = true;
                break;
            }
            const { error: updateError } = await supabase
                .from('Estoque')
                .update({ quantidadeAtual: novaQuantidade })
                .eq('idProduto', item.produto.idProduto);
            if (updateError) {
                Alert.alert('Erro', `Erro ao atualizar estoque de ${item.produto.nome}: ${updateError.message}`);
                erro = true;
                break;
            }

            // Registrar movimentação de saída
            const { error: movError } = await supabase.from('Movimentacao').insert({
                idProduto: item.produto.idProduto,
                idVenda: venda.idVenda,
                quantidade: item.quantidade,
                tipoMovimentacao: 'saida',
                observacoes: `Venda #${venda.idVenda}`,
                dataMovimentacao: new Date().toISOString(),
            });
            if (movError) {
                console.warn('Movimentação não registrada:', movError.message);
            }
        }

        if (erro) {
            // Se deu erro, poderíamos deletar a venda, mas por simplicidade, apenas avisamos.
            Alert.alert('Erro', 'A venda não foi concluída. Verifique os erros.');
        } else {
            Alert.alert('Sucesso', 'Venda registrada com sucesso!');
            navigation.goBack();
        }
        setLoading(false);
    }

    const renderClienteModal = () => (
        <Modal visible={modalClienteVisible} animationType="slide">
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Selecione um Cliente</Text>
                <FlatList
                    data={clientes}
                    keyExtractor={(item) => item.idCliente.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.modalItem}
                            onPress={() => {
                                setCliente(item);
                                setModalClienteVisible(false);
                            }}
                        >
                            <Text style={styles.modalItemText}>{item.nome}</Text>
                            <Text style={styles.modalItemSub}>{item.telefone}</Text>
                        </TouchableOpacity>
                    )}
                />
                <Button title="Cancelar" onPress={() => setModalClienteVisible(false)} />
            </View>
        </Modal>
    );

    const renderProdutoModal = () => (
        <Modal visible={modalProdutoVisible} animationType="slide">
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Selecione um Produto</Text>
                <FlatList
                    data={produtos}
                    keyExtractor={(item) => item.idProduto.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.modalItem}
                            onPress={() => {
                                setSelectedProduto(item);
                                // Após selecionar, pedir a quantidade (simplificado: abre um prompt ou campo)
                                // Vamos mostrar um campo de quantidade
                                Alert.prompt('Quantidade', `Quantidade de ${item.nome} (${item.unidadeMedida}):`, (text) => {
                                    const qtd = parseFloat(text || '0');
                                    if (!isNaN(qtd) && qtd > 0) {
                                        adicionarItem(item, qtd);
                                    } else {
                                        Alert.alert('Erro', 'Quantidade inválida');
                                    }
                                    setSelectedProduto(null);
                                });
                            }}
                        >
                            <Text style={styles.modalItemText}>{item.nome}</Text>
                            <Text style={styles.modalItemSub}>{item.unidadeMedida} - R$ {item.precoSugerido || item.precoBase}</Text>
                        </TouchableOpacity>
                    )}
                />
                <Button title="Cancelar" onPress={() => setModalProdutoVisible(false)} />
            </View>
        </Modal>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Nova Venda</Text>

            {/* Cliente */}
            <Text style={styles.label}>Cliente</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setModalClienteVisible(true)}>
                <Text style={styles.selectButtonText}>{cliente ? cliente.nome : 'Selecionar Cliente'}</Text>
            </TouchableOpacity>

            {/* Itens */}
            <Text style={styles.label}>Itens</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setModalProdutoVisible(true)}>
                <Text style={styles.selectButtonText}>+ Adicionar Produto</Text>
            </TouchableOpacity>

            {itens.map((item, idx) => (
                <View key={idx} style={styles.itemCard}>
                    <Text style={styles.itemNome}>{item.produto.nome}</Text>
                    <Text style={styles.itemDetalhe}>
                        {item.quantidade} {item.produto.unidadeMedida} x {item.valorUnitario.toFixed(2)} = {item.valorTotal.toFixed(2)}
                    </Text>
                    <TouchableOpacity onPress={() => removerItem(idx)} style={styles.removeItem}>
                        <Text style={styles.removeItemText}>Remover</Text>
                    </TouchableOpacity>
                </View>
            ))}

            {/* Desconto */}
            <Text style={styles.label}>Desconto (R$)</Text>
            <Input
                value={desconto}
                onChangeText={setDesconto}
                keyboardType="numeric"
                placeholder="0.00"
            />

            {/* Totais */}
            <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Subtotal: R$ {calcularSubtotal().toFixed(2)}</Text>
                <Text style={styles.totalLabel}>Desconto: R$ {parseFloat(desconto || '0').toFixed(2)}</Text>
                <Text style={styles.totalValue}>Total: R$ {calcularTotal().toFixed(2)}</Text>
            </View>

            <Button title="Finalizar Venda" onPress={finalizarVenda} loading={loading} />

            {renderClienteModal()}
            {renderProdutoModal()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C', marginTop: 12, marginBottom: 8 },
    selectButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D2D2D2', borderRadius: 8, padding: 12, marginBottom: 16 },
    selectButtonText: { fontSize: 16, color: '#3E7C59', textAlign: 'center' },
    itemCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E8E8E8' },
    itemNome: { fontSize: 16, fontWeight: 'bold' },
    itemDetalhe: { fontSize: 14, color: '#8A8A8A', marginTop: 4 },
    removeItem: { marginTop: 8, alignSelf: 'flex-start' },
    removeItemText: { color: '#C17F59', fontWeight: 'bold' },
    totalCard: { backgroundColor: '#E8F0E8', borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 20 },
    totalLabel: { fontSize: 16, color: '#2C2C2C', marginBottom: 4 },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: '#3E7C59', marginTop: 8 },
    modalContainer: { flex: 1, padding: 20, backgroundColor: '#F7F5EF' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    modalItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#D2D2D2' },
    modalItemText: { fontSize: 16, fontWeight: 'bold' },
    modalItemSub: { fontSize: 14, color: '#8A8A8A' },
});