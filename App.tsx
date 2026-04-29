// App.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from './src/lib/supabase';
import AppNavigator from './src/navigation';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Main'>('Login');

  useEffect(() => {
    // Verifica se já existe sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setInitialRoute(session ? 'Main' : 'Login');
      setIsReady(true);
    });

    // Escuta mudanças de autenticação (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setInitialRoute(session ? 'Main' : 'Login');
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (!isReady) {
    return null; // ou um componente de splash screen
  }

  return <AppNavigator initialRouteName={initialRoute} />;
}