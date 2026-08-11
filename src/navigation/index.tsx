import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import LoginScreen from '../screens/auth/LoginScreen'
import RecuperarSenhaScreen from '../screens/auth/RecuperarSenhaScreen'
import DashboardScreen from '../screens/dashboard/DashboardScreen'
import DetalhesAnimalScreen from '../screens/animais/DetalhesAnimalScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={DashboardScreen} />
      {/* Temporário: substituir pelas telas reais depois */}
      <Tab.Screen name="Vendas" component={DashboardScreen} />
      <Tab.Screen name="Mov" component={DashboardScreen} />
      <Tab.Screen name="Estoque" component={DashboardScreen} />
      <Tab.Screen name="Perfil" component={DashboardScreen} />
    </Tab.Navigator>
  )
}

// 👇 Adicione a interface para as props
interface AppNavigatorProps {
  initialRouteName?: 'Login' | 'Main'
}

// 👇 Agora o componente aceita a prop initialRouteName
export default function AppNavigator({ initialRouteName = 'Login' }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="DetalhesAnimal" component={DetalhesAnimalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}