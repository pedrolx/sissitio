import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { useAnimais } from '../../hooks/useAnimais';
import { Button } from '../../components/Button';
import { useFocusEffect } from '@react-navigation/native';
import { processQueue } from '../../services/sync';
import { formatDateBR } from '../../utils/dateUtils';

// Habilita animação para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Animal = {
  idanimal: number;
  especie: string;
  datanascimento: string | null;
  status: string;
  pesoatual: number | null;
  observacoes: string | null;
  _pending?: boolean;
};

type Grupo = {
  especie: string;
  animals: Animal[];
};

type Secao = {
  status: string; // 'vivo', 'abatido' ou 'vendido'
  titulo: string;
  grupos: Grupo[];
  total: number;
};

export default function ListaAnimaisScreen({ navigation }) {
  const { animais, loading, excluirAnimal } = useAnimais();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    vivo: false,
    abatido: false,
    vendido: false,
  });

  useFocusEffect(
    useCallback(() => {
      processQueue();
    }, [])
  );

  // Construir seções: Vivos, Abatidos e Vendidos
  const secoes = useMemo(() => {
    const vivos: Animal[] = [];
    const abatidos: Animal[] = [];
    const vendidos: Animal[] = [];

    animais.forEach((animal) => {
      if (animal.status === 'vivo') vivos.push(animal);
      else if (animal.status === 'abatido') abatidos.push(animal);
      else if (animal.status === 'vendido') vendidos.push(animal);
    });

    const agruparPorEspecie = (lista: Animal[]): Grupo[] => {
      const grupos: Record<string, Animal[]> = {};
      lista.forEach((animal) => {
        const chave = animal.especie || 'Sem espécie';
        if (!grupos[chave]) grupos[chave] = [];
        grupos[chave].push(animal);
      });
      return Object.keys(grupos)
        .sort((a, b) => a.localeCompare(b))
        .map((especie) => ({ especie, animals: grupos[especie] }));
    };

    const resultado: Secao[] = [
      { status: 'vivo', titulo: 'Vivos', grupos: agruparPorEspecie(vivos), total: vivos.length },
      { status: 'abatido', titulo: 'Abatidos', grupos: agruparPorEspecie(abatidos), total: abatidos.length },
      { status: 'vendido', titulo: 'Vendidos', grupos: agruparPorEspecie(vendidos), total: vendidos.length },
    ];

    return resultado;
  }, [animais]);

  // Alterna expansão de uma seção
  const toggleSection = (status: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  // Alterna expansão de um grupo (chave única: status_especie)
  const toggleGroup = (status: string, especie: string) => {
    const key = `${status}_${especie}`;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Renderiza um animal individual
  const renderAnimalItem = ({ item }: { item: Animal }) => (
    <TouchableOpacity
      style={styles.animalCard}
      onPress={() => navigation.navigate('DetalhesAnimal', { id: item.idanimal })}
    >
      <View style={styles.animalContent}>
        <Text style={styles.animalNome}>{item.observacoes || item.especie}</Text>
        <Text style={styles.animalDetalhe}>
          Nascimento: {formatDateBR(item.datanascimento)}
        </Text>
        <Text style={styles.animalDetalhe}>Status: {item.status}</Text>
        {item.pesoatual ? (
          <Text style={styles.animalDetalhe}>Peso: {item.pesoatual} kg</Text>
        ) : null}
      </View>
      <View style={styles.animalActions}>
        {item._pending && <Text style={styles.pendingIcon}>⏳</Text>}
        <Text style={styles.detailIcon}>👉</Text>
      </View>
    </TouchableOpacity>
  );

  // Renderiza o cabeçalho de um grupo (espécie)
  const renderGroupHeader = (status: string, especie: string, animals: Animal[]) => {
    const key = `${status}_${especie}`;
    const isExpanded = expandedGroups[key] || false;
    return (
      <TouchableOpacity
        style={styles.groupHeader}
        onPress={() => toggleGroup(status, especie)}
        activeOpacity={0.7}
      >
        <View style={styles.groupHeaderContent}>
          <Text style={styles.groupTitle}>{especie}</Text>
          <Text style={styles.groupCount}>({animals.length})</Text>
        </View>
        <Text style={styles.groupArrow}>{isExpanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
    );
  };

  // Renderiza o cabeçalho de uma seção (Vivos, Abatidos, Vendidos)
  const renderSectionHeader = (secao: Secao) => {
    const isExpanded = expandedSections[secao.status] || false;
    return (
      <TouchableOpacity
        style={styles.secaoHeader}
        onPress={() => toggleSection(secao.status)}
        activeOpacity={0.7}
      >
        <View style={styles.secaoHeaderContent}>
          <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
          <Text style={styles.secaoCount}>({secao.total})</Text>
        </View>
        <Text style={styles.secaoArrow}>{isExpanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
    );
  };

  // Renderiza uma seção (Vivos, Abatidos ou Vendidos) com seus grupos
  const renderSecao = ({ item }: { item: Secao }) => {
    const { status, grupos } = item;
    const isExpanded = expandedSections[status] || false;

    return (
      <View style={styles.secaoContainer}>
        {renderSectionHeader(item)}
        {isExpanded && (
          <View style={styles.secaoContent}>
            {grupos.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum animal nesta categoria</Text>
            ) : (
              grupos.map((grupo) => (
                <View key={`${status}_${grupo.especie}`} style={styles.groupContainer}>
                  {renderGroupHeader(status, grupo.especie, grupo.animals)}
                  {expandedGroups[`${status}_${grupo.especie}`] && (
                    <View style={styles.animalsList}>
                      {grupo.animals.map((animal) => (
                        <View key={animal.idanimal}>
                          {renderAnimalItem({ item: animal })}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Button title="+ Novo Animal" onPress={() => navigation.navigate('FormAnimal')} />
      {loading ? (
        <Text style={styles.loading}>Carregando...</Text>
      ) : (
        <FlatList
          data={secoes}
          keyExtractor={(item) => item.status}
          renderItem={renderSecao}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5EF',
    padding: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  secaoContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E8F0E8',
  },
  secaoHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secaoTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
    fontFamily: 'Montserrat',
  },
  secaoCount: {
    fontSize: 16,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  secaoArrow: {
    fontSize: 18,
    color: '#3E7C59',
    fontWeight: 'bold',
  },
  secaoContent: {
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  groupContainer: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F7F7F7',
  },
  groupHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  groupCount: {
    fontSize: 14,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  groupArrow: {
    fontSize: 14,
    color: '#3E7C59',
    fontWeight: 'bold',
  },
  animalsList: {
    paddingTop: 4,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  animalCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  animalContent: {
    flex: 1,
  },
  animalNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  animalDetalhe: {
    fontSize: 14,
    color: '#8A8A8A',
    marginTop: 2,
  },
  animalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingIcon: {
    fontSize: 20,
    color: '#FFA500',
  },
  detailIcon: {
    fontSize: 20,
    color: '#C17F59',
  },
  loading: {
    textAlign: 'center',
    marginTop: 50,
    color: '#8A8A8A',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8A8A8A',
    marginVertical: 12,
    fontStyle: 'italic',
  },
});