import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function DashboardScreen({ navigation }) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Olá, Pedro</Text>

        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaProdutos')}>
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={styles.menuText}>Produtos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaEstoque')}>
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>Estoque</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaAnimais')}>
            <Text style={styles.menuIcon}>🐓</Text>
            <Text style={styles.menuText}>Animais</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaVendas')}>
            <Text style={styles.menuIcon}>💰</Text>
            <Text style={styles.menuText}>Vendas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ListaClientes')}>
            <Text style={styles.menuIcon}>👥</Text>
            <Text style={styles.menuText}>Clientes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Relatorios')}>
            <Text style={styles.menuIcon}>📈</Text>
            <Text style={styles.menuText}>Relatórios</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Últimas Movimentações</Text>
          <Text style={styles.movimento}>14:33 – Saída – Tomate (2kg)</Text>
          <Text style={styles.movimento}>10:12 – Entrada – Alface (30un)</Text>
          <Text style={styles.movimento}>Ontem – Venda #104 (R$ 86,00)</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomMenu}>
        <TouchableOpacity><Text>🏠</Text></TouchableOpacity>
        <TouchableOpacity><Text>🛒</Text></TouchableOpacity>
        <TouchableOpacity><Text>🔄</Text></TouchableOpacity>
        <TouchableOpacity><Text>📦</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}><Text>👤</Text></TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5EF',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat',
    fontWeight: '600',
    color: '#2C2C2C',
    padding: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  menuItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    margin: '1.5%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 32,
  },
  menuText: {
    marginTop: 8,
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#2C2C2C',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 12,
    color: '#2C2C2C',
  },
  movimento: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#8A8A8A',
    marginBottom: 8,
  },
  bottomMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D2D2D2',
  },
})