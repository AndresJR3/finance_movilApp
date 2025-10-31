import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// IMPORTANTE: Reemplaza estos valores con los tuyos de Supabase
// Los obtendrás en: https://supabase.com/dashboard/project/TU_PROYECTO/settings/api
const supabaseUrl = 'https://jtskxssqxhvuxttsduwv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0c2t4c3NxeGh2dXh0dHNkdXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTM4MzQsImV4cCI6MjA3NzMyOTgzNH0.VeAJOJFbf1OakRtjwI_mACPRMn2kc4JxRwukXhmJ3Kg';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});