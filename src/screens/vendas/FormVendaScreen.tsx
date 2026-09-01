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

type Cliente = { idcliente: number; nome: string; telefone: string };
type Produto = { idproduto: number; nome: string; unidademedida: string; precosugerido: number; precobase: number };
type Animal = { idanimal: number; especie: string; status: string; pesoatual: number; observacoes?: string | null };
type ItemVenda = {
    tipo: 'produto' | 'animal';
    id: number;
    nome: string;
    unidade: string;
    quantidade: number;
    valorunitario: number;
    valortotal: number;
    animalId?: number;
};

export default function FormVendaScreen({ navigation }) {
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [itens, setItens] = useState<ItemVenda[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [animais, setAnimais] = useState<Animal[]>([]);
    const [modalClienteVisible, setModalClienteVisible] = useState(false);
    const [modalProdutoVisible, setModalProdutoVisible] = useState(false);
    const [modalAnimalVisible, setModalAnimalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [desconto, setDesconto] = useState('0');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para os modais de input
    const [inputModalVisible, setInputModalVisible] = useState(false);
    const [inputModalType, setInputModalType] = useState<'quantidade' | 'valor'>('quantidade');
    const [inputModalTitle, setInputModalTitle] = useState('');
    const [inputModalPlaceholder, setInputModalPlaceholder] = useState('');
    const [inputModalValue, setInputModalValue] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        carregarClientes();
        carregarProdutos();
        carregarAnimais();
    }, []);

    async function carregarClientes() {
        const { data, error } = await supabase.from('cliente').select('*').order('nome');
        if (!error) setClientes(data || []);
    }

    async function carregarProdutos() {
        const { data, error } = await supabase.from('produto').select('*').order('nome');
        if (!error) setProdutos(data || []);
    }

    async function carregarAnimais() {
        const { data, error } = await supabase
            .from('animal')
            .select('*')
            .eq('status', 'vivo')
            .order('especie');
        if (!error) setAnimais(data || []);
    }

    // Função para abrir modal de input
    function openInputModal(type: 'quantidade' | 'valor', item: any, title: string, placeholder: string) {
        setInputModalType(type);
        setSelectedItem(item);
        setInputModalTitle(title);
        setInputModalPlaceholder(placeholder);
        setInputModalValue('');
        setInputModalVisible(true);
    }

    // Função chamada ao confirmar o modal de input
    function confirmInputModal() {
        const val = parseFloat(inputModalValue);
        if (isNaN(val) || val <= 0) {
            Alert.alert('Erro', 'Valor inválido');
            return;
        }
        if (inputModalType === 'quantidade') {
            // Para produto: usa o preço sugerido ou base
            const valorUnitario = selectedItem.precosugerido || selectedItem.precobase || 0;
            if (valorUnitario <= 0) {
                Alert.alert('Erro', 'Produto sem preço definido');
                return;
            }
            adicionarItem('produto', selectedItem, val, valorUnitario);
        } else {
            // Para animal: valor unitário informado
            adicionarItem('animal', selectedItem, 1, val);
        }
        setInputModalVisible(false);
    }

    function adicionarItem(tipo: 'produto' | 'animal', item: any, quantidade: number, valorunitario: number) {
        if (quantidade <= 0) {
            Alert.alert('Atenção', 'Quantidade deve ser maior que zero');
            return;
        }
        const novoItem: ItemVenda = {
            tipo,
            id: tipo === 'produto' ? item.idproduto : item.idanimal,
            nome: tipo === 'produto' ? item.nome : item.especie,
            unidade: tipo === 'produto' ? item.unidademedida : 'un',
            quantidade,
            valorunitario,
            valortotal: quantidade * valorunitario,
            animalId: tipo === 'animal' ? item.idanimal : undefined,
        };
        if (tipo === 'produto') {
            const existingIndex = itens.findIndex(i => i.tipo === 'produto' && i.id === item.idproduto);
            if (existingIndex >= 0) {
                const novos = [...itens];
                novos[existingIndex].quantidade += quantidade;
                novos[existingIndex].valortotal = novos[existingIndex].quantidade * valorunitario;
                setItens(novos);
                setModalProdutoVisible(false);
                return;
            }
        }
        setItens([...itens, novoItem]);
        if (tipo === 'produto') setModalProdutoVisible(false);
        else setModalAnimalVisible(false);
    }

    function removerItem(index: number) {
        const novos = [...itens];
        novos.splice(index, 1);
        setItens(novos);
    }

    function calcularSubtotal() {
        return itens.reduce((sum, item) => sum + item.valortotal, 0);
    }

    function calcularTotal() {
        const subtotal = calcularSubtotal();
        const desc = parseFloat(desconto) || 0;
        return subtotal - desc;
    }

    async function finalizarVenda() {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            Alert.alert('Erro', 'Usuário não autenticado');
            setIsSubmitting(false);
            return;
        }
        if (!cliente) {
            Alert.alert('Atenção', 'Selecione um cliente');
            setIsSubmitting(false);
            return;
        }
        if (itens.length === 0) {
            Alert.alert('Atenção', 'Adicione pelo menos um item');
            setIsSubmitting(false);
            return;
        }

        setLoading(true);
        let vendaId: number | null = null;

        try {
            // Inserir cabeçalho da venda
            const { data: venda, error: vendaError } = await supabase
                .from('venda')
                .insert({
                    idcliente: cliente.idcliente,
                    idusuario: user.id,
                    datavenda: new Date().toISOString(),
                    statuspagamento: 'Pendente',
                    valortotal: calcularTotal(),
                })
                .select()
                .single();

            if (vendaError) throw new Error(`Erro ao criar venda: ${vendaError.message}`);
            vendaId = venda.idvenda;

            // Processar cada item
            for (const item of itens) {
                if (item.tipo === 'produto') {
                    // Inserir item
                    const { error: itemError } = await supabase.from('itemvenda').insert({
                        idvenda: vendaId,
                        idproduto: item.id,
                        quantidade: item.quantidade,
                        valorunitario: item.valorunitario,
                        valortotal: item.valortotal,
                    });
                    if (itemError) throw new Error(`Erro ao inserir item ${item.nome}: ${itemError.message}`);

                    // Buscar estoque
                    const { data: estoque, error: estError } = await supabase
                        .from('estoque')
                        .select('quantidadeatual')
                        .eq('idproduto', item.id)
                        .single();
                    if (estError) throw new Error(`Erro ao buscar estoque de ${item.nome}: ${estError.message}`);

                    const novaQtd = estoque.quantidadeatual - item.quantidade;
                    if (novaQtd < 0) throw new Error(`Estoque insuficiente para ${item.nome}. Disponível: ${estoque.quantidadeatual}`);

                    const { error: updateError } = await supabase
                        .from('estoque')
                        .update({ quantidadeatual: novaQtd })
                        .eq('idproduto', item.id);
                    if (updateError) throw new Error(`Erro ao atualizar estoque de ${item.nome}: ${updateError.message}`);

                    // Movimentação
                    const { error: movError } = await supabase.from('movimentacao').insert({
                        idproduto: item.id,
                        idvenda: vendaId,
                        quantidade: item.quantidade,
                        tipomovimentacao: 'saida',
                        observacoes: `Venda #${vendaId}`,
                        datamovimentacao: new Date().toISOString(),
                    });
                    if (movError) throw new Error(`Erro ao registrar movimentação de ${item.nome}: ${movError.message}`);

                } else if (item.tipo === 'animal') {
                    // Atualizar status do animal
                    const { error: updateAnimal } = await supabase
                        .from('animal')
                        .update({ status: 'vendido' })
                        .eq('idanimal', item.animalId);
                    if (updateAnimal) throw new Error(`Erro ao atualizar status do animal ${item.nome}: ${updateAnimal.message}`);

                    // Movimentação de venda de animal
                    const { error: movError } = await supabase.from('movimentacao').insert({
                        idanimal: item.animalId,
                        idvenda: vendaId,
                        quantidade: 1,
                        tipomovimentacao: 'venda_animal',
                        observacoes: `Venda #${vendaId} - Animal ${item.nome}`,
                        datamovimentacao: new Date().toISOString(),
                    });
                    if (movError) throw new Error(`Erro ao registrar movimentação do animal ${item.nome}: ${movError.message}`);
                }
            }

            // Se chegou aqui, tudo deu certo
            Alert.alert('Sucesso', 'Venda registrada com sucesso!');
            navigation.goBack();

        } catch (error: any) {
            // Em caso de erro, excluir a venda para não ficar inconsistente
            if (vendaId) {
                await supabase.from('venda').delete().eq('idvenda', vendaId);
                // Também limpar itens e movimentações associadas
                await supabase.from('itemvenda').delete().eq('idvenda', vendaId);
                await supabase.from('movimentacao').delete().eq('idvenda', vendaId);
            }
            Alert.alert('Erro', error.message || 'Falha ao finalizar venda');
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    }

    // ---------- MODAIS ----------
    const renderClienteModal = () => (
        <Modal visible={modalClienteVisible} animationType="slide">
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Selecione um Cliente</Text>
                <FlatList
                    data={clientes}
                    keyExtractor={(item) => item.idcliente.toString()}
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
                    keyExtractor={(item) => item.idproduto.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.modalItem}
                            onPress={() => {
                                openInputModal('quantidade', item, `Quantidade de ${item.nome}`, `Digite a quantidade (${item.unidademedida})`);
                            }}
                        >
                            <Text style={styles.modalItemText}>{item.nome}</Text>
                            <Text style={styles.modalItemSub}>
                                {item.unidademedida} - R$ {item.precosugerido || item.precobase}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
                <Button title="Cancelar" onPress={() => setModalProdutoVisible(false)} />
            </View>
        </Modal>
    );

    const renderAnimalModal = () => (
        <Modal visible={modalAnimalVisible} animationType="slide">
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Selecione um Animal Vivo</Text>
                <FlatList
                    data={animais}
                    keyExtractor={(item) => item.idanimal.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.modalItem}
                            onPress={() => {
                                openInputModal('valor', item, `Valor da venda de ${item.especie}`, 'Digite o valor unitário');
                            }}
                        >
                            <Text style={styles.modalItemText}>{item.especie}</Text>
                            {item.observacoes ? (
                                <Text style={styles.modalItemSub}>📝 {item.observacoes}</Text>
                            ) : null}
                            <Text style={styles.modalItemSub}>Peso: {item.pesoatual || '—'} kg</Text>
                        </TouchableOpacity>
                    )}
                />
                <Button title="Cancelar" onPress={() => setModalAnimalVisible(false)} />
            </View>
        </Modal>
    );

    // Modal de input
    const renderInputModal = () => (
        <Modal visible={inputModalVisible} transparent animationType="fade">
            <View style={styles.inputModalOverlay}>
                <View style={styles.inputModalContainer}>
                    <Text style={styles.inputModalTitle}>{inputModalTitle}</Text>
                    <TextInput
                        style={styles.inputModalInput}
                        placeholder={inputModalPlaceholder}
                        keyboardType="numeric"
                        value={inputModalValue}
                        onChangeText={setInputModalValue}
                        autoFocus
                    />
                    <View style={styles.inputModalButtons}>
                        <TouchableOpacity style={[styles.inputModalButton, styles.inputModalCancel]} onPress={() => setInputModalVisible(false)}>
                            <Text style={styles.inputModalButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.inputModalButton, styles.inputModalConfirm]} onPress={confirmInputModal}>
                            <Text style={styles.inputModalButtonText}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Nova Venda</Text>

            <Text style={styles.label}>Cliente</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setModalClienteVisible(true)}>
                <Text style={styles.selectButtonText}>{cliente ? cliente.nome : 'Selecionar Cliente'}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Itens</Text>
            <View style={styles.rowButtons}>
                <TouchableOpacity style={[styles.selectButton, styles.halfButton]} onPress={() => setModalProdutoVisible(true)}>
                    <Text style={styles.selectButtonText}>+ Produto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.selectButton, styles.halfButton]} onPress={() => setModalAnimalVisible(true)}>
                    <Text style={styles.selectButtonText}>+ Animal</Text>
                </TouchableOpacity>
            </View>

            {itens.map((item, idx) => (
                <View key={idx} style={styles.itemCard}>
                    <Text style={styles.itemNome}>{item.nome} {item.tipo === 'animal' ? '(Animal)' : ''}</Text>
                    <Text style={styles.itemDetalhe}>
                        {item.quantidade} {item.unidade} x R$ {item.valorunitario.toFixed(2)} = R$ {item.valortotal.toFixed(2)}
                    </Text>
                    <TouchableOpacity onPress={() => removerItem(idx)} style={styles.removeItem}>
                        <Text style={styles.removeItemText}>Remover</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <Text style={styles.label}>Desconto (R$)</Text>
            <Input value={desconto} onChangeText={setDesconto} keyboardType="numeric" placeholder="0.00" />

            <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Subtotal: R$ {calcularSubtotal().toFixed(2)}</Text>
                <Text style={styles.totalLabel}>Desconto: R$ {parseFloat(desconto || '0').toFixed(2)}</Text>
                <Text style={styles.totalValue}>Total: R$ {calcularTotal().toFixed(2)}</Text>
            </View>

            <Button
                title="Finalizar Venda"
                onPress={finalizarVenda}
                loading={loading}
                disabled={isSubmitting}
            />

            {renderClienteModal()}
            {renderProdutoModal()}
            {renderAnimalModal()}
            {renderInputModal()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2C', marginTop: 12, marginBottom: 8 },
    selectButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D2D2D2', borderRadius: 8, padding: 12, marginBottom: 16 },
    rowButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    halfButton: { flex: 0.48 },
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
    inputModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    inputModalContainer: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, width: '80%', elevation: 5 },
    inputModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    inputModalInput: { borderWidth: 1, borderColor: '#D2D2D2', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
    inputModalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    inputModalButton: { flex: 0.45, padding: 12, borderRadius: 8, alignItems: 'center' },
    inputModalCancel: { backgroundColor: '#C17F59' },
    inputModalConfirm: { backgroundColor: '#3E7C59' },
    inputModalButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});