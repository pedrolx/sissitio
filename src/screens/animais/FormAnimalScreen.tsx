import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Switch, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { TouchableOpacity } from 'react-native';

export default function FormAnimalScreen({ route, navigation }) {
    const { id } = route.params || {};
    const [especie, setEspecie] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [status, setStatus] = useState('vivo');
    const [pesoAtual, setPesoAtual] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) carregarAnimal();
    }, [id]);

    async function carregarAnimal() {
        const { data, error } = await supabase
            .from('Animal')
            .select('*')
            .eq('idAnimal', id)
            .single();
        if (!error && data) {
            setEspecie(data.especie);
            setDataNascimento(data.dataNascimento?.slice(0, 10) || '');
            setStatus(data.status);
            setPesoAtual(data.pesoAtual?.toString() || '');
            setObservacoes(data.observacoes || '');
        }
    }

    async function salvar() {
        if (!especie.trim()) {
            Alert.alert('Atenção', 'Espécie é obrigatória');
            return;
        }
        setLoading(true);
        const dados = {
            especie,
            dataNascimento: dataNascimento || null,
            status,
            pesoAtual: parseFloat(pesoAtual) || null,
            observacoes: observacoes || null,
        };

        if (id) {
            const { error } = await supabase
                .from('Animal')
                .update(dados)
                .eq('idAnimal', id);
            if (error) Alert.alert('Erro', error.message);
            else navigation.goBack();
        } else {
            const { error } = await supabase.from('Animal').insert([dados]);
            if (error) Alert.alert('Erro', error.message);
            else navigation.goBack();
        }
        setLoading(false);
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Espécie *</Text>
            <Input value={especie} onChangeText={setEspecie} placeholder="Ex: Galinha, Porco, Cabra" />

            <Text style={styles.label}>Data de Nascimento (AAAA-MM-DD)</Text>
            <Input
                value={dataNascimento}
                onChangeText={setDataNascimento}
                placeholder="2024-01-15"
                keyboardType="default"
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
                {['vivo', 'abatido', 'vendido'].map((opt) => (
                    <TouchableOpacity
                        key={opt}
                        style={[
                            styles.statusOption,
                            status === opt && styles.statusOptionActive,
                        ]}
                        onPress={() => setStatus(opt)}
                    >
                        <Text style={[styles.statusText, status === opt && styles.statusTextActive]}>
                            {opt.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Peso Atual (kg)</Text>
            <Input value={pesoAtual} onChangeText={setPesoAtual} keyboardType="numeric" placeholder="0.0" />

            <Text style={styles.label}>Observações</Text>
            <Input
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Informações adicionais"
                multiline
                style={{ height: 80 }}
            />

            <Button title={id ? 'Atualizar' : 'Salvar'} onPress={salvar} loading={loading} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20 },
    label: { fontSize: 14, fontWeight: '500', color: '#2C2C2C', marginBottom: 6, marginTop: 12 },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statusButton: {
        flex: 1,
        marginHorizontal: 4,
    },
    statusOption: {
        flex: 1,
        backgroundColor: '#E8E8E8',
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statusOptionActive: {
        backgroundColor: '#3E7C59',
    },
    statusText: {
        color: '#2C2C2C',
        fontWeight: '600',
    },
    statusTextActive: {
        color: '#FFFFFF',
    },
});