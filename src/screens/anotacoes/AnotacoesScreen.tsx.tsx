import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useAnotacoes, Anotacao } from '../../hooks/useAnotacoes';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useFocusEffect } from '@react-navigation/native';
import { processQueue } from '../../services/sync';
import { Picker } from '@react-native-picker/picker';

type Prioridade = 'baixa' | 'media' | 'alta';

const PRIORIDADES: Prioridade[] = ['baixa', 'media', 'alta'];
const CORES_PRIORIDADE = {
  baixa: '#8A8A8A',
  media: '#F5A623',
  alta: '#C17F59',
};
const LABEL_PRIORIDADE = {
  baixa: '🟢 Baixa',
  media: '🟡 Média',
  alta: '🔴 Alta',
};

export default function AnotacoesScreen() {
  const { anotacoes, loading, salvarAnotacao, excluirAnotacao, marcarConcluida } = useAnotacoes();
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Anotacao | null>(null);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('baixa');
  const [categoria, setCategoria] = useState('');

  useFocusEffect(
    useCallback(() => {
      processQueue();
    }, [])
  );

  const abrirModal = (anotacao?: Anotacao) => {
    if (anotacao) {
      setEditando(anotacao);
      setTitulo(anotacao.titulo);
      setConteudo(anotacao.conteudo || '');
      setPrioridade(anotacao.prioridade);
      setCategoria(anotacao.categoria || '');
    } else {
      setEditando(null);
      setTitulo('');
      setConteudo('');
      setPrioridade('baixa');
      setCategoria('');
    }
    setModalVisible(true);
  };

  const salvar = async () => {
    if (!titulo.trim()) {
      Alert.alert('Atenção', 'O título é obrigatório');
      return;
    }

    const dados = {
      titulo: titulo.trim(),
      conteudo: conteudo.trim() || null,
      prioridade,
      categoria: categoria.trim() || null,
      concluida: editando?.concluida || false,
    };

    await salvarAnotacao(dados, editando?.idanotacao);
    setModalVisible(false);
  };

  const handleExcluir = (id: number) => {
    Alert.alert('Confirmar', 'Deseja excluir esta anotação?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => excluirAnotacao(id) },
    ]);
  };

  const toggleConcluida = (anotacao: Anotacao) => {
    marcarConcluida(anotacao.idanotacao, !anotacao.concluida);
  };

  const renderItem = ({ item }: { item: Anotacao }) => (
    <TouchableOpacity
      style={[styles.card, item.concluida && styles.cardConcluida]}
      onPress={() => abrirModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={[styles.titulo, item.concluida && styles.tituloConcluido]}>
            {item.titulo}
          </Text>
          <View style={[styles.prioridadeBadge, { backgroundColor: CORES_PRIORIDADE[item.prioridade] }]}>
            <Text style={styles.prioridadeTexto}>{LABEL_PRIORIDADE[item.prioridade]}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          {item._pending && <Text style={styles.pendingIcon}>⏳</Text>}
          <TouchableOpacity onPress={() => toggleConcluida(item)} style={styles.actionButton}>
            <Text style={styles.actionIcon}>{item.concluida ? '✅' : '⬜'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExcluir(item.idanotacao)} style={styles.actionButton}>
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      {item.conteudo ? (
        <Text style={[styles.conteudo, item.concluida && styles.conteudoConcluido]} numberOfLines={2}>
          {item.conteudo}
        </Text>
      ) : null}
      {item.categoria ? (
        <Text style={styles.categoria}>#{item.categoria}</Text>
      ) : null}
      <Text style={styles.data}>
        {new Date(item.data_criacao).toLocaleDateString('pt-BR')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button title="+ Nova Anotação" onPress={() => abrirModal()} />

      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : anotacoes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma anotação ainda</Text>
          <Text style={styles.emptySub}>Toque em "+ Nova Anotação" para começar</Text>
        </View>
      ) : (
        <FlatList
          data={anotacoes}
          keyExtractor={(item) => item.idanotacao.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de cadastro/edição */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <ScrollView style={styles.modalContainer} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editando ? 'Editar Anotação' : 'Nova Anotação'}
          </Text>

          <Text style={styles.label}>Título *</Text>
          <Input value={titulo} onChangeText={setTitulo} placeholder="Ex: Comprar ração" />

          <Text style={styles.label}>Conteúdo</Text>
          <Input
            value={conteudo}
            onChangeText={setConteudo}
            placeholder="Detalhes da anotação..."
            multiline
            style={styles.textArea}
          />

          <Text style={styles.label}>Prioridade</Text>
          <View style={styles.prioridadeContainer}>
            {PRIORIDADES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.prioridadeOption,
                  prioridade === p && styles.prioridadeOptionActive,
                  { borderColor: CORES_PRIORIDADE[p] },
                ]}
                onPress={() => setPrioridade(p)}
              >
                <Text
                  style={[
                    styles.prioridadeOptionText,
                    prioridade === p && styles.prioridadeOptionTextActive,
                  ]}
                >
                  {LABEL_PRIORIDADE[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Categoria (opcional)</Text>
          <Input
            value={categoria}
            onChangeText={setCategoria}
            placeholder="Ex: Compras, Urgente, Lembretes"
          />

          <View style={styles.modalButtons}>
            <Button title="Cancelar" onPress={() => setModalVisible(false)} variant="secondary" />
            <Button title="Salvar" onPress={salvar} />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 16 },
  listContent: { paddingBottom: 20 },
  loading: { textAlign: 'center', marginTop: 50, color: '#8A8A8A' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: '#8A8A8A', fontWeight: 'bold' },
  emptySub: { fontSize: 14, color: '#A9A9A9', marginTop: 8 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardConcluida: {
    opacity: 0.7,
    backgroundColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  tituloConcluido: {
    textDecorationLine: 'line-through',
    color: '#8A8A8A',
  },
  prioridadeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  prioridadeTexto: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  conteudo: {
    fontSize: 14,
    color: '#8A8A8A',
    marginTop: 8,
  },
  conteudoConcluido: {
    textDecorationLine: 'line-through',
    color: '#A9A9A9',
  },
  categoria: {
    fontSize: 12,
    color: '#3E7C59',
    marginTop: 4,
    fontStyle: 'italic',
  },
  data: {
    fontSize: 10,
    color: '#A9A9A9',
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 18,
  },
  pendingIcon: {
    fontSize: 18,
    color: '#FFA500',
    marginRight: 4,
  },
  modalContainer: { flex: 1, backgroundColor: '#F7F5EF' },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C2C2C', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '500', color: '#2C2C2C', marginBottom: 6, marginTop: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  prioridadeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  prioridadeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  prioridadeOptionActive: {
    backgroundColor: '#F7F5EF',
  },
  prioridadeOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  prioridadeOptionTextActive: {
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
});