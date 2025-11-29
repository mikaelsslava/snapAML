import axios from 'axios';

// Interfaces for the OpenSanctions API Response
interface OpenSanctionsMatch {
  id: string;
  caption: string; // The name found in the database
  schema: string;  // 'Company', 'Person', 'Organization'
  score: number;   // 0.0 to 1.0 (1.0 is exact match)
  properties: {
    topics?: string[]; // e.g., ["sanction", "role.pep"]
    sourceUrl?: string[];
  };
}

interface OpenSanctionsResponse {
  responses: {
    query1: {
      results: OpenSanctionsMatch[];
    };
  };
}

// Interface for our Service's Output
interface SanctionCheckResult {
  is_sanctioned: boolean;
  sanction_details: any | null; // Detailed JSON for the DB
  sanction_sources: string[];   // List of sources (e.g. "OFAC", "EU")
}

export class ExternalApiService {
  private static readonly OPENSANCTIONS_URL = 'https://api.opensanctions.org/match/default';
  
  // Threshold: If match score is below 70%, ignore it (fuzzy match noise)
  private static readonly MATCH_THRESHOLD = 0.7;

  /**
   * Main function to check everything
   */
  public static async checkAll(regNumber: string, companyName: string, countryCode: string = 'LV') {
    // Run API checks in parallel
    const [vies, sanctions] = await Promise.all([
      this.checkVies(countryCode, regNumber),
      this.checkOpenSanctions(companyName)
    ]);

    return {
      vies_valid: vies.isValid,
      vies_address: vies.address,
      is_sanctioned: sanctions.is_sanctioned,
      sanction_details: sanctions.sanction_details,
      sanction_sources: sanctions.sanction_sources
    };
  }

  /**
   * Check EU VIES (VAT Validation)
   */
  public static async checkVies(countryCode: string, regNumber: string) {
    try {
      // Clean the country code and Reg number
      const country = countryCode.toUpperCase();
      const number = regNumber.replace(/[^0-9A-Za-z]/g, '');

      console.log(`🔍 Checking VIES for VAT number: ${country}${number}`);

      // Check VIES REST API - Correct endpoint format
      const url = `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${country}/vat/${number}`;
      const { data } = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json'
        }
      });

      const isValid = data.isValid === true;
      const address = data.traderAddress || data.address || null;

      if (isValid) {
        console.log(`✅ VIES Check VALID: ${country}${number} is registered in EU VIES database`);
        if (address) {
          console.log(`   Address: ${address}`);
        }
      } else {
        console.log(`⚠️  VIES Check INVALID: ${country}${number} is not valid in EU VIES database`);
      }

      return {
        isValid,
        address
      };
    } catch (error) {
      // Check if it's a 404 - which means VAT number not found in VIES
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn(`❌ VIES Check: VAT number ${countryCode}${regNumber} not found in EU VIES database`);
        return { isValid: false, address: null };
      }
      
      console.error('❌ VIES Check failed:', error instanceof Error ? error.message : error);
      // Fail open: Don't block the process if VIES is down, just mark invalid/unknown
      return { isValid: false, address: null };
    }
  }

  /**
   * Check OpenSanctions API (Real Live Check)
   * Uses Match API with LegalEntity schema to reduce false positives
   */
  public static async checkOpenSanctions(companyName: string): Promise<SanctionCheckResult> {
    const apiKey = process.env.OPENSANCTIONS_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ No OPENSANCTIONS_API_KEY found. Skipping live sanction check.');
      return { is_sanctioned: false, sanction_details: null, sanction_sources: [] };
    }

    try {
      console.log(`🔍 Checking OpenSanctions for: "${companyName}"`);

      // Construct the Query Body for the "Match" endpoint
      // We explicitly say schema: 'LegalEntity' so we don't match people
      const body = {
        queries: {
          query1: {
            schema: 'LegalEntity',
            properties: {
              name: [companyName]
            }
          }
        }
      };

      const response = await axios.post<OpenSanctionsResponse>(
        this.OPENSANCTIONS_URL,
        body,
        {
          headers: {
            'Authorization': `ApiKey ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const results = response.data.responses.query1.results;
      
      if (results.length === 0) {
        console.log(`✅ No sanctions found - ${companyName} is CLEAN`);
        return { is_sanctioned: false, sanction_details: null, sanction_sources: [] };
      }

      console.log(`⚠️  Found ${results.length} potential match(es) for ${companyName}`);

      // Log matches for debugging
      results.forEach((match, index) => {
        console.log(`  Match ${index + 1}: ${match.caption} (${(match.score * 100).toFixed(1)}% - ${match.schema})`);
      });

      // Filter for High Confidence Matches
      const highConfidenceMatches = results.filter(
        (match) => match.score >= this.MATCH_THRESHOLD
      );

      if (highConfidenceMatches.length > 0) {
        // We found a sanctioned entity
        const bestMatch = highConfidenceMatches[0];
        
        console.log(`🚨 HIGH CONFIDENCE MATCH - ${companyName} appears SANCTIONED`);
        console.log(`   Best match: ${bestMatch.caption} (${(bestMatch.score * 100).toFixed(1)}%)`);
        
        // Extract topic tags (e.g. "sanction") to list sources
        const sources = bestMatch.properties.topics || ['Unspecified Sanction List'];

        return {
          is_sanctioned: true,
          sanction_details: highConfidenceMatches, // Store full match array in DB
          sanction_sources: sources
        };
      }

      console.log(`✅ Matches below ${this.MATCH_THRESHOLD * 100}% threshold - ${companyName} is likely CLEAN`);
      return { is_sanctioned: false, sanction_details: null, sanction_sources: [] };

    } catch (error) {
      console.error('❌ OpenSanctions API failed:', error instanceof Error ? error.message : error);
      // If API fails, we return false but log it. 
      // In Production, you might want to throw error to trigger a retry.
      return { is_sanctioned: false, sanction_details: { error: 'API Request Failed' }, sanction_sources: [] };
    }
  }
}
