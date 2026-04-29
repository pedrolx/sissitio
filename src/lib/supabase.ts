import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

// Substitua pelos dados do SEU projeto no Supabase
const supabaseUrl = 'https://lekudjvmkxopccpvljda.supabase.co'
const supabaseAnonKey = 'sb_publishable_SlVIx2JLhol_DOjx4JQrEg_d558ezSo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)