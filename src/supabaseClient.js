// src/supabaseClient.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vtiuhtmkkotnojdmujaw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0aXVodG1ra290bm9qZG11amF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjI5MTQsImV4cCI6MjA2NjM5ODkxNH0._1xwFyl6UVKmvBO1I82ot_lp1e2sWiTuyrqBcp0mYAI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});