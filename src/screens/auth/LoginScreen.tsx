import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha email e senha')
      return
    }
    setLoading(true)

    const { error, data } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      Alert.alert('Erro no login', error.message)
      setLoading(false)
    } else if (data?.session) {
      // Login bem-sucedido: navega para a área principal
      navigation.replace('Main')  // ou navigation.navigate('Home') – replace evita voltar para login
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SIS SÍTIO</Text>
      <Text style={styles.subtitle}>Gestão simples para quem produz com amor</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('RecuperarSenha')}>
        <Text style={styles.link}>Esqueci minha senha</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F7F5EF',
  },
  title: {
    fontFamily: 'Montserrat',
    fontSize: 32,
    fontWeight: '700',
    color: '#3E7C59',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  button: {
    backgroundColor: '#3E7C59',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    color: '#3E7C59',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Inter',
  },
})