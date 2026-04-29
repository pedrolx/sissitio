import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lekudjvmkxopccpvljda.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla3VkanZta3hvcGNjcHZsamRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzEyMTAsImV4cCI6MjA4NzUwNzIxMH0.thXLrvoQMrd4s0seIk_LeLJtOK2Gz1BvVZdacxRxSMo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);