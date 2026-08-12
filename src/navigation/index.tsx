import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Telas
import RelatoriosScreen from '../screens/relatorios/RelatoriosScreen';
import PerfilScreen from '../screens/perfil/PerfilScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RecuperarSenhaScreen from '../screens/auth/RecuperarSenhaScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ListaClientesScreen from '../screens/clientes/ListaClientesScreen';
import FormClienteScreen from '../screens/clientes/FormClienteScreen';
import ListaProdutosScreen from '../screens/produtos/ListaProdutosScreen';
import FormProdutoScreen from '../screens/produtos/FormProdutoScreen';
import ListaAnimaisScreen from '../screens/animais/ListaAnimaisScreen';
import FormAnimalScreen from '../screens/animais/FormAnimalScreen';
import DetalhesAnimalScreen from '../screens/animais/DetalhesAnimalScreen';
import ListaEstoqueScreen from '../screens/estoque/ListaEstoqueScreen';
import MovimentacaoEstoqueScreen from '../screens/estoque/MovimentacaoEstoqueScreen';
import ListaMovimentacoesScreen from '../screens/movimentacoes/ListaMovimentacoesScreen';
import ListaVendasScreen from '../screens/vendas/ListaVendasScreen';
import FormVendaScreen from '../screens/vendas/FormVendaScreen';
import DetalhesVendaScreen from '../screens/vendas/DetalhesVendaScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={DashboardScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Vendas" component={ListaVendasScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Mov" component={ListaMovimentacoesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Estoque" component={ListaEstoqueScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

interface AppNavigatorProps {
  initialRouteName?: 'Login' | 'Main';
}

export default function AppNavigator({ initialRouteName = 'Login' }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="ListaClientes" component={ListaClientesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FormCliente" component={FormClienteScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ListaProdutos" component={ListaProdutosScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FormProduto" component={FormProdutoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ListaAnimais" component={ListaAnimaisScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FormAnimal" component={FormAnimalScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DetalhesAnimal" component={DetalhesAnimalScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ListaEstoque" component={ListaEstoqueScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MovimentacaoEstoque" component={MovimentacaoEstoqueScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ListaMovimentacoes" component={ListaMovimentacoesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ListaVendas" component={ListaVendasScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FormVenda" component={FormVendaScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DetalhesVenda" component={DetalhesVendaScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Relatorios" component={RelatoriosScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Perfil" component={PerfilScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
