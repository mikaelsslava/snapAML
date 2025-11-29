import { SupabaseService } from './supabase';
import type { Tables } from '../types';

export class CompanyService {
  private supabaseService: SupabaseService;

  constructor() {
    this.supabaseService = new SupabaseService();
    this.supabaseService.signIn();
  }

  async getCompanyByRegistrationNumber(registrationNumber: string): Promise<Tables<'kyb_submissions'>> {
    console.log('registrationNumber', registrationNumber)
    const { data, error } = await this.supabaseService.getClient()
      .from('kyb_submissions')
      .select('*')
      .eq('company_registration_number', registrationNumber)
      .single();

      console.log('data', data)

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Database query failed');
    }

    if (!data) {
      throw new Error('Company not found');
    }

    return data as unknown as Tables<'kyb_submissions'>;
  }

  async validateCompanyExists(id: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('kyb_submissions')
        .select('id')
        .eq('id', id)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error validating company existence:', error);
      return false;
    }
  }
}
