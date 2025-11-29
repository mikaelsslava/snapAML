import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

export class SupabaseService {
  private client: SupabaseClient<Database>;

  
  constructor() {
    console.log('invoke')
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
    }

    this.client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
  }

  async signIn() {
    const { error } = await this.client.auth.signInWithPassword({
      email: 'admin@snapAML.com',
      password: 'adminadmin'
    });

    if (error) {
      console.error('Error signing in:', error);
    }
  }

  getClient(): SupabaseClient<Database> {
    return this.client;
  }
}
