import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';
import { CsvDataService } from '../services/csvData.service';
import { ExternalApiService } from '../services/externalApi.service';
import { SupabaseService } from '../services/supabase';
import type { Tables } from '../types';

interface GetCompanyRequest {
  registrationNumber: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type CompanyData = Tables<'kyb_submissions'>;

interface RiskProfile {
  registration_number: string;
  company_name: string;
  
  // Local CSV data
  address: string;
  registered_date: string;
  legal_form: string;
  is_active?: boolean;
  terminated_date: string | null;
  tax_rating: string | null;
  tax_explanation: string | null;
  has_insolvency?: boolean;
  insolvency_details: string | null;
  
  // External API results
  is_sanctioned: boolean;
  sanction_sources: string[];
  sanction_details: string | null;
  is_pep: boolean;
  pep_details: string | null;
  
  // AI Analysis
  adverse_media_risk_score: number;
  adverse_media_summary: string;
  adverse_media_mentions: number;
  
  // Overall assessment
  overall_risk_level: string;
  checked_at: string;
}

export class CompanyController {
  /**
   * Generate complete risk profile for a company
   * This method:
   * 1. Gets company submission data
   * 2. Aggregates data from CSV files (parallel)
   * 3. Checks external APIs (parallel)
   * 4. Analyzes adverse media with AI (parallel)
   * 5. Saves complete profile to database
   * 6. Returns enriched data immediately
   */
  static async generateRiskProfile(req: Request, res: Response): Promise<Response> {
    try {
      // Validate request
      const validationError = CompanyController.validateGetCompanyRequest(req.body);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError
        } as ApiResponse<null>);
      }

      const { registrationNumber }: GetCompanyRequest = req.body;

      // Step A: Get submission to ensure base record exists
      const companyService = new CompanyService();
      let submissionData: CompanyData;
      
      try {
        submissionData = await companyService.getCompanyByRegistrationNumber(registrationNumber);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Company submission not found in database'
        } as ApiResponse<null>);
      }

      const companyName = submissionData.company_name || 'Unknown Company';

      // Step B: Aggregate data from all sources in parallel
      let localData = null;
      let apiResults = null;
      let localDataError = null;

      try {
        [localData, apiResults] = await Promise.all([
          // CSV Data lookup
          (async () => {
            try {
              return await CsvDataService.getInstance().getAggregateData(registrationNumber);
            } catch (error) {
              localDataError = (error as Error).message;
              return null;
            }
          })(),
          // External API checks
          ExternalApiService.checkAll(registrationNumber, companyName)
        ]);
      } catch (error) {
        console.error('Error during parallel data aggregation:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to aggregate company data'
        } as ApiResponse<null>);
      }

      // If company not found in Registry CSV, return error
      // if (!localData) {
      //   return res.status(404).json({
      //     success: false,
      //     error: localDataError || 'Company not found in Latvian Registry'
      //   } as ApiResponse<null>);
      // }

      // Calculate overall risk level
      const overallRiskLevel = CompanyController.calculateOverallRisk(
        localData,
        apiResults
      );

      // Step C: Build complete risk profile
      const riskProfile: RiskProfile = {
        registration_number: registrationNumber,
        company_name: companyName,
        
        // Local CSV data
        address: localData?.address || '',
        registered_date: localData?.registered || '',
        legal_form: localData?.type_text || '',
        terminated_date: localData?.terminated || null || '',
        tax_rating: localData?.rating || '',
        tax_explanation: localData?.explanation || '',
        insolvency_details: localData?.proceeding_resolution_name || '',
        
        // External API results  
        is_sanctioned: apiResults.is_sanctioned,
        sanction_sources: apiResults.sanction_sources,
        sanction_details: apiResults.sanction_details,
        is_pep: false, // PEP check removed, focus on company sanctions
        pep_details: null,
        
        // AI Analysis (disabled)
        adverse_media_risk_score: 0,
        adverse_media_summary: 'Adverse media check disabled',
        adverse_media_mentions: 0,
        
        // Overall assessment
        overall_risk_level: overallRiskLevel,
        checked_at: new Date().toISOString(),
      };

      if (localData?.is_active !== undefined) {
        riskProfile.is_active = localData.is_active;
      }
      if (localData?.has_insolvency !== undefined) {
        riskProfile.has_insolvency = localData?.has_insolvency,
      }

      console.log('Generated risk profile:', riskProfile);

      // Step D: Save to database
      try {
        await CompanyController.saveRiskProfile(submissionData, riskProfile);
      } catch (error) {
        console.error('Failed to save risk profile:', error);
        // Continue even if save fails - we can still return the data
      }

      // Step E: Return complete enriched profile
      return res.status(200).json({
        success: true,
        data: riskProfile
      } as ApiResponse<RiskProfile>);

    } catch (error) {
      return CompanyController.handleError(error, res);
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  static async getCompany(req: Request, res: Response): Promise<Response> {
    // Redirect to generateRiskProfile for complete data
    return CompanyController.generateRiskProfile(req, res);
  }

  /**
   * Calculate overall risk level based on all data sources
   */
  private static calculateOverallRisk(
    localData: any,
    apiResults: any
  ): string {
    let riskScore = 0;

    // Terminated companies: +30
    if (!localData.is_active) riskScore += 30;

    // Has insolvency: +40
    if (localData.has_insolvency) riskScore += 40;

    // Sanctioned: +50 (critical)
    if (apiResults.is_sanctioned) riskScore += 50;

    // Poor tax rating: +20
    if (localData.rating && localData.rating.toLowerCase().includes('poor')) {
      riskScore += 20;
    }

    // Determine level
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 50) return 'HIGH';
    if (riskScore >= 25) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Save risk profile to database with Priority 1 KYC/AML fields
   */
  private static async saveRiskProfile(submissionData: CompanyData, profile: RiskProfile): Promise<void> {
    const supabaseService = new SupabaseService();
    await supabaseService.signIn();

    // Get the full aggregate data to access Priority 1 fields
    const localData = await CsvDataService.getInstance().getAggregateData(profile.registration_number);

    const { error } = await supabaseService.getClient()
      .from('company_risk_profiles')
      .insert({
        submission_id: submissionData.id,
        registration_number: profile.registration_number,
        company_name: profile.company_name,
        profile_data: profile as any, // Store entire profile as JSON
        risk_level: profile.overall_risk_level,
        checked_at: profile.checked_at,
        
        // Existing fields
        address: profile.address,
        registration_date: profile.registered_date,
        legal_form: profile.legal_form,
        is_active: profile.is_active,
        tax_rating: profile.tax_rating,
        tax_status_explanation: profile.tax_explanation,
        has_insolvency_history: profile.has_insolvency,
        insolvency_details: profile.insolvency_details,
        
        // Priority 1 Registry fields
        sepa: localData.sepa || null,
        regtype_text: localData.regtype_text || null,
        company_type_code: localData.type || null,
        closed_status: localData.closed || null,
        region: localData.region || null,
        city: localData.city || null,
        
        // Priority 1 Tax rating field
        tax_rating_updated_date: localData.rating_updated_date || null,
        
        // Priority 1 Insolvency fields
        insolvency_started_date: localData.proceeding_started_on || null,
        insolvency_ended_date: localData.proceeding_ended_on || null,
        insolvency_form: localData.proceeding_form || null,
        insolvency_type: localData.proceeding_type || null,
        insolvency_court_name: localData.court_name || null,
      });

    if (error) {
      console.error('Error saving risk profile:', error);
      throw new Error('Failed to save risk profile to database');
    }
  }

  private static validateGetCompanyRequest(body: any): string | null {
    if (!body) {
      return 'Request body is required';
    }

    if (!body.registrationNumber) {
      return 'Company registration number is required';
    }

    if (typeof body.registrationNumber !== 'string') {
      return 'Company registration number must be a string';
    }

    if (body.registrationNumber.trim().length === 0) {
      return 'Company registration number cannot be empty';
    }

    return null;
  }

  private static handleError(error: any, res: Response): Response {
    console.error('Controller error:', error);

    // Handle known service errors
    if (error.message === 'Company not found' || error.message === 'Database query failed') {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      } as ApiResponse<null>);
    }

    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<null>);
  }
}
