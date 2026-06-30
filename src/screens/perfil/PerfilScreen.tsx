import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function PerfilScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    Alert.alert('Sair', 'Deseja realmente sair do aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          // O App.tsx já escuta a mudança de autenticação e redireciona para Login
        },
      },
    ]);
  }

  if (loading) return <View style={styles.container}><Text>Carregando...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MEU PERFIL</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={styles.label}>ID do Usuário:</Text>
        <Text style={styles.value}>{user?.id?.slice(0, 8)}...</Text>

        <Text style={styles.label}>Criado em:</Text>
        <Text style={styles.value}>
          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
        </Text>
      </View>

      <TouchableOpacity style={styles.buttonLogout} onPress={handleLogout}>
        <Text style={styles.buttonLogoutText}>SAIR DO SISTEMA</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5EF', padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#3E7C59', marginBottom: 30 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 3 },
  label: { fontSize: 14, color: '#8A8A8A', marginTop: 12 },
  value: { fontSize: 16, fontWeight: '500', color: '#2C2C2C', marginBottom: 8 },
  buttonLogout: { marginTop: 30, backgroundColor: '#C17F59', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonLogoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});