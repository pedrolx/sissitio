import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Telas de autenticação
import LoginScreen from './src/screens/auth/LoginScreen';
import RecuperarSenhaScreen from './src/screens/auth/RecuperarSenhaScreen';

// Telas principais
import DashboardScreen from './src/screens/dashboard/DashboardScreen';

// Clientes
import ListaClientesScreen from './src/screens/clientes/ListaClientesScreen';
import FormClienteScreen from './src/screens/clientes/FormClienteScreen';

// Produtos
import ListaProdutosScreen from './src/screens/produtos/ListaProdutosScreen';
import FormProdutoScreen from './src/screens/produtos/FormProdutoScreen';

// Animais
import ListaAnimaisScreen from './src/screens/animais/ListaAnimaisScreen';
import FormAnimalScreen from './src/screens/animais/FormAnimalScreen';

// Estoque
import ListaEstoqueScreen from './src/screens/estoque/ListaEstoqueScreen';
import MovimentacaoEstoqueScreen from './src/screens/estoque/MovimentacaoEstoqueScreen';

// Movimentações (histórico)
import ListaMovimentacoesScreen from './src/screens/movimentacoes/ListaMovimentacoesScreen';

import ListaVendasScreen from './src/screens/vendas/ListaVendasScreen';
import FormVendaScreen from './src/screens/vendas/FormVendaScreen';
import DetalhesVendaScreen from './src/screens/vendas/DetalhesVendaScreen';

// Vendas (placeholder - você criará depois)
// import ListaVendasScreen from '../screens/vendas/ListaVendasScreen';
// import FormVendaScreen from '../screens/vendas/FormVendaScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Vendas" component={ListaVendasScreen} />
      <Tab.Screen name="Mov" component={ListaMovimentacoesScreen} />
      <Tab.Screen name="Estoque" component={ListaEstoqueScreen} />
      <Tab.Screen name="Perfil" component={DashboardScreen} /> {/* substituir depois */}
    </Tab.Navigator>
  );
}

export default function AppNavigator({ initialRouteName = 'Login' }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>

        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />

        <Stack.Screen name="Main" component={MainTabs} />

        <Stack.Screen name="ListaClientes" component={ListaClientesScreen} />
        <Stack.Screen name="FormCliente" component={FormClienteScreen} />

        <Stack.Screen name="ListaProdutos" component={ListaProdutosScreen} />
        <Stack.Screen name="FormProduto" component={FormProdutoScreen} />

        <Stack.Screen name="ListaAnimais" component={ListaAnimaisScreen} />
        <Stack.Screen name="FormAnimal" component={FormAnimalScreen} />

        <Stack.Screen name="ListaEstoque" component={ListaEstoqueScreen} />
        <Stack.Screen name="MovimentacaoEstoque" component={MovimentacaoEstoqueScreen} />

        <Stack.Screen name="ListaMovimentacoes" component={ListaMovimentacoesScreen} />

        <Stack.Screen name="ListaVendas" component={ListaVendasScreen} />
        <Stack.Screen name="FormVenda" component={FormVendaScreen} />
        <Stack.Screen name="DetalhesVenda" component={DetalhesVendaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}