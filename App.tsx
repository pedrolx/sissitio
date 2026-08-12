// App.tsx
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, StatusBar, View } from 'react-native';
import { supabase } from './src/lib/supabase';
import AppNavigator from './src/navigation';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Main'>('Login');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setInitialRoute(session ? 'Main' : 'Login');
      setIsReady(true);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setInitialRoute(session ? 'Main' : 'Login');
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (!isReady) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F5EF" />
        <AppNavigator initialRouteName={initialRoute} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5EF',
  },
});