import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import LoginScreen from '../screens/auth/LoginScreen'
import RecuperarSenhaScreen from '../screens/auth/RecuperarSenhaScreen'
import DashboardScreen from '../screens/dashboard/DashboardScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Vendas" component={DashboardScreen} /> // Temporário
      <Tab.Screen name="Mov" component={DashboardScreen} /> // Temporário
      <Tab.Screen name="Estoque" component={DashboardScreen} /> // Temporário
      <Tab.Screen name="Perfil" component={DashboardScreen} /> // Temporário
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}