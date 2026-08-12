import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function RecuperarSenhaScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRecover() {
    if (!email) {
      Alert.alert('Atenção', 'Informe seu email')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'sissitio://reset-password',
    })
    if (error) {
      Alert.alert('Erro', error.message)
    } else {
      Alert.alert('Enviado', 'Verifique seu email para redefinir a senha')
      navigation.goBack()
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RECUPERAR SENHA</Text>

      <TextInput
        style={styles.input}
        placeholder="Email ou Usuário"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.infoText}>
        Instruções de recuperação serão enviadas para seu email registrado.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleRecover} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Voltar</Text>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#3E7C59',
    textAlign: 'center',
    marginBottom: 32,
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
  infoText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3E7C59',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    alignItems: 'center',
  },
  backText: {
    color: '#3E7C59',
    fontFamily: 'Inter',
    fontSize: 14,
  },
})
