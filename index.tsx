import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Telas
import RelatoriosScreen from './src/screens/relatorios/RelatoriosScreen';
import PerfilScreen from './src/screens/perfil/PerfilScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RecuperarSenhaScreen from './src/screens/auth/RecuperarSenhaScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import ListaClientesScreen from './src/screens/clientes/ListaClientesScreen';
import FormClienteScreen from './src/screens/clientes/FormClienteScreen';
import ListaProdutosScreen from './src/screens/produtos/ListaProdutosScreen';
import FormProdutoScreen from './src/screens/produtos/FormProdutoScreen';
import ListaAnimaisScreen from './src/screens/animais/ListaAnimaisScreen';
import FormAnimalScreen from './src/screens/animais/FormAnimalScreen';
import DetalhesAnimalScreen from './src/screens/animais/DetalhesAnimalScreen'; // nova
import ListaEstoqueScreen from './src/screens/estoque/ListaEstoqueScreen';
import MovimentacaoEstoqueScreen from './src/screens/estoque/MovimentacaoEstoqueScreen';
import ListaMovimentacoesScreen from './src/screens/movimentacoes/ListaMovimentacoesScreen';
import ListaVendasScreen from './src/screens/vendas/ListaVendasScreen';
import FormVendaScreen from './src/screens/vendas/FormVendaScreen';
import DetalhesVendaScreen from './src/screens/vendas/DetalhesVendaScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Vendas" component={ListaVendasScreen} />
      <Tab.Screen name="Mov" component={ListaMovimentacoesScreen} />
      <Tab.Screen name="Estoque" component={ListaEstoqueScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

// Tipagem das props do AppNavigator
interface AppNavigatorProps {
  initialRouteName?: 'Login' | 'Main';
}

export default function AppNavigator({ initialRouteName = 'Login' }: AppNavigatorProps) {
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
        <Stack.Screen name="DetalhesAnimal" component={DetalhesAnimalScreen} />

        <Stack.Screen name="ListaEstoque" component={ListaEstoqueScreen} />
        <Stack.Screen name="MovimentacaoEstoque" component={MovimentacaoEstoqueScreen} />

        <Stack.Screen name="ListaMovimentacoes" component={ListaMovimentacoesScreen} />

        <Stack.Screen name="ListaVendas" component={ListaVendasScreen} />
        <Stack.Screen name="FormVenda" component={FormVendaScreen} />
        <Stack.Screen name="DetalhesVenda" component={DetalhesVendaScreen} />

        <Stack.Screen name="Relatorios" component={RelatoriosScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}