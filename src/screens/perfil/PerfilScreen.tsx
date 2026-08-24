import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { clearAllCache } from '../../services/storage';
import { getPendingQueue, processQueue } from '../../services/sync';

export default function PerfilScreen({ navigation }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    buscarUsuario();
  }, []);

  async function buscarUsuario() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      setUser(user);
    }
    setLoading(false);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      // 1. Verificar se há operações pendentes
      const queue = await getPendingQueue();
      if (queue.length > 0) {
        // 2. Tentar processar a fila (se estiver online)
        await processQueue();
        // Verificar novamente se ainda há pendências
        const remaining = await getPendingQueue();
        if (remaining.length > 0) {
          // Ainda há pendências: perguntar ao usuário
          Alert.alert(
            'Dados não sincronizados',
            `Você tem ${remaining.length} operações pendentes. Deseja sair mesmo assim? Os dados serão perdidos.`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => setIsLoggingOut(false) },
              {
                text: 'Sair e perder dados',
                style: 'destructive',
                onPress: async () => {
                  await clearAllCache();
                  await supabase.auth.signOut();
                  navigation.replace('Login');
                  setIsLoggingOut(false);
                },
              },
            ]
          );
          return;
        }
      }

      // Se chegou aqui, não há pendências ou foram sincronizadas
      await clearAllCache();
      await supabase.auth.signOut();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fazer logout. Tente novamente.');
      console.error('Erro no logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MEU PERFIL</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email || '—'}</Text>

        <Text style={styles.label}>ID do Usuário:</Text>
        <Text style={styles.value}>{user?.id?.slice(0, 8) || '—'}...</Text>

        <Text style={styles.label}>Criado em:</Text>
        <Text style={styles.value}>
          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.buttonLogout, isLoggingOut && styles.buttonDisabled]}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonLogoutText}>SAIR DO SISTEMA</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20, justifyContent: 'center' },
  loadingText: { textAlign: 'center', fontSize: 16, color: '#8A8A8A' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#3E7C59', marginBottom: 30 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 3 },
  label: { fontSize: 14, color: '#8A8A8A', marginTop: 12 },
  value: { fontSize: 16, fontWeight: '500', color: '#2C2C2C', marginBottom: 8 },
  buttonLogout: { marginTop: 30, backgroundColor: '#C17F59', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonLogoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});