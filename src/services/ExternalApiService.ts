/**
 * ExternalApiService - Handles external API checks for company verification
 */

export interface SanctionCheckResult {
  is_sanctioned: boolean;
  sources: string[];
  details: string | null;
}

export interface ExternalApiResults {
  sanctions: SanctionCheckResult;
  pep_check: {
    is_pep: boolean;
    details: string | null;
  };
  checked_at: string;
}

export class ExternalApiService {
  /**
   * Check all external sources for company
   * @param registrationNumber - Company registration number
   * @param companyName - Company name
   * @returns Combined results from all external APIs
   */
  public static async checkAll(
    registrationNumber: string,
    companyName: string
  ): Promise<ExternalApiResults> {
    try {
      // Run all checks in parallel
      const [sanctions, pep] = await Promise.all([
        this.checkSanctions(registrationNumber, companyName),
        this.checkPEP(registrationNumber, companyName),
      ]);

      return {
        sanctions,
        pep_check: pep,
        checked_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('External API check failed:', error);
      // Return safe defaults if checks fail
      return {
        sanctions: {
          is_sanctioned: false,
          sources: [],
          details: 'Check failed',
        },
        pep_check: {
          is_pep: false,
          details: 'Check failed',
        },
        checked_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Check sanctions lists
   * @param registrationNumber - Company registration number
   * @param companyName - Company name
   * @returns Sanction check results
   */
  private static async checkSanctions(
    registrationNumber: string,
    companyName: string
  ): Promise<SanctionCheckResult> {
    // TODO: Implement actual sanctions API calls
    // For now, return mock data
    console.log(`Checking sanctions for ${companyName} (${registrationNumber})`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      is_sanctioned: false,
      sources: ['OFAC', 'EU Sanctions', 'UN Sanctions'],
      details: null,
    };
  }

  /**
   * Check Politically Exposed Person (PEP) status
   * @param registrationNumber - Company registration number
   * @param companyName - Company name
   * @returns PEP check results
   */
  private static async checkPEP(
    registrationNumber: string,
    companyName: string
  ): Promise<{ is_pep: boolean; details: string | null }> {
    // TODO: Implement actual PEP API calls
    // For now, return mock data
    console.log(`Checking PEP status for ${companyName} (${registrationNumber})`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      is_pep: false,
      details: null,
    };
  }
}
