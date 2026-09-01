import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNetInfo } from './useNetInfo';
import { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetInfo();

  useEffect(() => {
    // Tentar restaurar a sessão salva
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças de autenticação (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Função para login
  const login = async (email: string, password: string) => {
    // Se estiver offline, não tenta fazer login
    if (!isConnected) {
      throw new Error('Você está offline. Conecte-se à internet para fazer login.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // Função para logout
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Função para verificar se há sessão mesmo offline
  const isAuthenticated = !!session;

  return {
    session,
    user,
    loading,
    isAuthenticated,
    isConnected,
    login,
    logout,
  };
}