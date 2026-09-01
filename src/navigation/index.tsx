import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let icon = '📄';
          switch (route.name) {
            case 'Home': icon = '🏠'; break;
            case 'Produtos': icon = '📦'; break;
            case 'Vendas': icon = '💰'; break;
            case 'Estoque': icon = '📊'; break;
            case 'Perfil': icon = '👤'; break;
            default: icon = '📄';
          }
          return <Text style={{ fontSize: size, color }}>{icon}</Text>;
        },
        tabBarActiveTintColor: '#3E7C59',
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#D2D2D2',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom || 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 10,
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Produtos" component={ListaProdutosScreen} />
      <Tab.Screen name="Vendas" component={ListaVendasScreen} />
      <Tab.Screen name="Estoque" component={ListaEstoqueScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
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
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
        <Stack.Screen name="Main" component={MainTabs} />

        {/* Telas de Clientes */}
        <Stack.Screen name="ListaClientes" component={ListaClientesScreen} />
        <Stack.Screen name="FormCliente" component={FormClienteScreen} />

        {/* Telas de Produtos */}
        <Stack.Screen name="ListaProdutos" component={ListaProdutosScreen} />
        <Stack.Screen name="FormProduto" component={FormProdutoScreen} />

        {/* Telas de Animais */}
        <Stack.Screen name="ListaAnimais" component={ListaAnimaisScreen} />
        <Stack.Screen name="FormAnimal" component={FormAnimalScreen} />
        <Stack.Screen name="DetalhesAnimal" component={DetalhesAnimalScreen} />

        {/* Telas de Estoque */}
        <Stack.Screen name="ListaEstoque" component={ListaEstoqueScreen} />
        <Stack.Screen name="MovimentacaoEstoque" component={MovimentacaoEstoqueScreen} />

        {/* Telas de Movimentações */}
        <Stack.Screen name="ListaMovimentacoes" component={ListaMovimentacoesScreen} />

        {/* Telas de Vendas */}
        <Stack.Screen name="ListaVendas" component={ListaVendasScreen} />
        <Stack.Screen name="FormVenda" component={FormVendaScreen} />
        <Stack.Screen name="DetalhesVenda" component={DetalhesVendaScreen} />

        {/* Telas de Relatórios e Perfil */}
        <Stack.Screen name="Relatorios" component={RelatoriosScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}