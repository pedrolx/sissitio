import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, StatusBar, View, ActivityIndicator, Text } from 'react-native';
import AppNavigator from './src/navigation';
import { useAuth } from './src/hooks/useAuth';
import { useSync } from './src/hooks/useSync';
import { OfflineBanner } from './src/components/OfflineBanner';
import Toast from 'react-native-toast-message';

export default function App() {

  useSync();

  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F5EF" />
        <ActivityIndicator size="large" color="#3E7C59" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F5EF" />
        <OfflineBanner />  
        <AppNavigator initialRouteName={isAuthenticated ? 'Main' : 'Login'} />
        <Toast position="bottom" bottomOffset={20} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5EF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F5EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8A8A8A',
    fontFamily: 'Inter',
  },
});