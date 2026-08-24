import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://lekudjvmkxopccpvljda.supabase.co';
const supabaseAnonKey = 'sb_publishable_SlVIx2JLhol_DOjx4JQrEg_d558ezSo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,           // <-- persistência no AsyncStorage
    autoRefreshToken: true,          // renova token automaticamente
    persistSession: true,            // mantém sessão entre reinícios
    detectSessionInUrl: false,       // para deep links, não usado aqui
  },
});