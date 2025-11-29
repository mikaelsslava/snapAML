import { parse } from 'csv-parse';
import { SupabaseService } from './supabase';
import { Readable } from 'stream';

// Define interfaces for each CSV data type
export interface RegistryData {
  name: string;
  address: string;
  registered: string;
  type_text: string;
  terminated: string;
  is_active: boolean;
  // Priority 1 KYC/AML fields
  sepa: string;
  regtype_text: string;
  type: string;
  closed: string;
  region: string;
  city: string;
}

export interface TaxData {
  rating: string;
  explanation: string;
  // Priority 1 KYC/AML field
  rating_updated_date: string;
}

export interface InsolvencyData {
  proceeding_resolution_name: string;
  has_insolvency: boolean;
  // Priority 1 KYC/AML fields
  proceeding_started_on: string;
  proceeding_ended_on: string;
  proceeding_form: string;
  proceeding_type: string;
  court_name: string;
}

export interface AggregateData {
  // Registry data (required)
  name: string;
  address: string;
  registered: string;
  type_text: string;
  terminated: string;
  is_active: boolean;
  // Registry Priority 1 KYC/AML fields
  sepa: string;
  regtype_text: string;
  type: string;
  closed: string;
  region: string;
  city: string;
  // Tax data (optional)
  rating: string | null;
  explanation: string | null;
  // Tax Priority 1 KYC/AML field
  rating_updated_date: string | null;
  // Insolvency data (optional)
  proceeding_resolution_name: string | null;
  has_insolvency: boolean;
  // Insolvency Priority 1 KYC/AML fields
  proceeding_started_on: string | null;
  proceeding_ended_on: string | null;
  proceeding_form: string | null;
  proceeding_type: string | null;
  court_name: string | null;
}

export class CsvDataService {
  private static instance: CsvDataService | null = null;
  private registryMap: Map<string, RegistryData> = new Map();
  private taxMap: Map<string, TaxData> = new Map();
  private insolvencyMap: Map<string, InsolvencyData> = new Map();
  private isInitialized: boolean = false;
  private supabaseService: SupabaseService;

  private constructor() {
    // Private constructor for Singleton pattern
    this.supabaseService = new SupabaseService();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): CsvDataService {
    if (!CsvDataService.instance) {
      CsvDataService.instance = new CsvDataService();
    }
    return CsvDataService.instance;
  }

  /**
   * Initialize the service by loading all CSV files from Supabase bucket
   * This must be called when the server starts
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('CsvDataService already initialized');
      return;
    }
    try {
      // Sign in to Supabase
      await this.supabaseService.signIn();
      
      await Promise.all([
        this.loadRegistryData(),
        this.loadTaxData(),
        this.loadInsolvencyData(),
      ]);
      this.isInitialized = true;
      console.log('CsvDataService initialized successfully');
      console.log(`Loaded ${this.registryMap.size} registry entries`);
      console.log(`Loaded ${this.taxMap.size} tax entries`);
      console.log(`Loaded ${this.insolvencyMap.size} insolvency entries`);
    } catch (error) {
      console.error('Failed to initialize CsvDataService:', error);
      throw error;
    }
  }

  /**
   * Ensure the service is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('CsvDataService not initialized. Call init() first.');
    }
  }

  /**
   * Download file from Supabase bucket and return as string
   */
  private async downloadFileFromBucket(fileName: string): Promise<string> {
    console.log(`Attempting to download ${fileName} from kyc-data bucket...`);
    
    const { data, error } = await this.supabaseService.getClient()
      .storage
      .from('kyc-data')
      .download(fileName);

    if (error) {
      console.error(`Download error for ${fileName}:`, error);
      throw new Error(`Failed to download ${fileName} from Supabase: ${JSON.stringify(error)}`);
    }

    if (!data) {
      throw new Error(`No data received for ${fileName}`);
    }

    console.log(`✓ Successfully downloaded ${fileName} (${data.size} bytes)`);
    
    // Convert Blob to text
    return await data.text();
  }

  /**
   * Load registry.csv into memory from Supabase bucket
   * 
   * TODO: BUcket in Supabase needs to be - this was only set for DEMO 
   */
  private async loadRegistryData(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Downloading registry.csv from Supabase bucket...');
        const csvContent = await this.downloadFileFromBucket('registry.csv');
        
        // Create a readable stream from the string
        const stream = Readable.from([csvContent]);
        
        stream
          .pipe(
            parse({
              columns: true,
              delimiter: ';',
              skip_empty_lines: true,
              trim: true,
            })
          )
          .on('data', (row: any) => {
            const regcode = row.regcode?.trim();
            if (regcode) {
              const data: RegistryData = {
                name: row.name || '',
                address: row.address || '',
                registered: row.registered || '',
                type_text: row.type_text || '',
                terminated: row.terminated || '',
                is_active: !row.terminated || row.terminated.trim() === '',
                // Priority 1 KYC/AML fields
                sepa: row.sepa || '',
                regtype_text: row.regtype_text || '',
                type: row.type || '',
                closed: row.closed || '',
                region: row.region || '',
                city: row.city || '',
              };
              this.registryMap.set(regcode, data);
            }
          })
          .on('error', (error: Error) => {
            reject(new Error(`Failed to parse registry.csv: ${error.message}`));
          })
          .on('end', () => {
            console.log(`✓ Registry data loaded: ${this.registryMap.size} entries`);
            resolve();
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Load taxpayer_rating.csv into memory from Supabase bucket
   */
  private async loadTaxData(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Downloading taxpayer_rating.csv from Supabase bucket...');
        const csvContent = await this.downloadFileFromBucket('taxpayer_rating.csv');
        
        // Create a readable stream from the string
        const stream = Readable.from([csvContent]);
        
        stream
          .pipe(
            parse({
              columns: true,
              delimiter: ',',
              skip_empty_lines: true,
              trim: true,
              quote: '"',
              relax_quotes: true,
            })
          )
          .on('data', (row: any) => {
            const regcode = row.Registracijas_kods?.trim();
            if (regcode) {
              const data: TaxData = {
                rating: row.Reitings || '',
                explanation: row.Skaidrojums || '',
                // Priority 1 KYC/AML field
                rating_updated_date: row.Informacijas_atjaunosanas_datums || '',
              };
              this.taxMap.set(regcode, data);
            }
          })
          .on('error', (error: Error) => {
            reject(new Error(`Failed to parse taxpayer_rating.csv: ${error.message}`));
          })
          .on('end', () => {
            console.log(`✓ Tax data loaded: ${this.taxMap.size} entries`);
            resolve();
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Load insolvency.csv into memory from Supabase bucket
   */
  private async loadInsolvencyData(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Downloading insolvency.csv from Supabase bucket...');
        const csvContent = await this.downloadFileFromBucket('insolvency.csv');
        
        // Create a readable stream from the string
        const stream = Readable.from([csvContent]);
        
        stream
          .pipe(
            parse({
              columns: true,
              delimiter: ';',
              skip_empty_lines: true,
              trim: true,
            })
          )
          .on('data', (row: any) => {
            const regcode = row.debtor_registration_number?.trim();
            if (regcode) {
              const data: InsolvencyData = {
                proceeding_resolution_name: row.proceeding_resolution_name || '',
                has_insolvency: true, // If record exists, has_insolvency is true
                // Priority 1 KYC/AML fields
                proceeding_started_on: row.proceeding_started_on || '',
                proceeding_ended_on: row.proceeding_ended_on || '',
                proceeding_form: row.proceeding_form || '',
                proceeding_type: row.proceeding_type || '',
                court_name: row.court_name || '',
              };
              this.insolvencyMap.set(regcode, data);
            }
          })
          .on('error', (error: Error) => {
            reject(new Error(`Failed to parse insolvency.csv: ${error.message}`));
          })
          .on('end', () => {
            console.log(`✓ Insolvency data loaded: ${this.insolvencyMap.size} entries`);
            resolve();
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get aggregated data for a given registration number
   * @param regNumber - The registration number to lookup
   * @returns AggregateData object combining all data sources
   * @throws Error if registration number not found in registry
   */
  public getAggregateData(regNumber: string): AggregateData {
    this.ensureInitialized();

    console.log(`Looking up aggregate data for regNumber: ${regNumber}`);

    const registryData = this.registryMap.get(regNumber);
    if (!registryData) {
      throw new Error(`Registration number ${regNumber} not found in registry`);
    }

    const taxData = this.taxMap.get(regNumber);
    const insolvencyData = this.insolvencyMap.get(regNumber);

    return {
      // Registry data (always present)
      name: registryData.name,
      address: registryData.address,
      registered: registryData.registered,
      type_text: registryData.type_text,
      terminated: registryData.terminated,
      is_active: registryData.is_active,
      // Registry Priority 1 KYC/AML fields
      sepa: registryData.sepa,
      regtype_text: registryData.regtype_text,
      type: registryData.type,
      closed: registryData.closed,
      region: registryData.region,
      city: registryData.city,
      // Tax data (optional)
      rating: taxData?.rating || null,
      explanation: taxData?.explanation || null,
      // Tax Priority 1 KYC/AML field
      rating_updated_date: taxData?.rating_updated_date || null,
      // Insolvency data (optional)
      proceeding_resolution_name: insolvencyData?.proceeding_resolution_name || null,
      has_insolvency: insolvencyData?.has_insolvency || false,
      // Insolvency Priority 1 KYC/AML fields
      proceeding_started_on: insolvencyData?.proceeding_started_on || null,
      proceeding_ended_on: insolvencyData?.proceeding_ended_on || null,
      proceeding_form: insolvencyData?.proceeding_form || null,
      proceeding_type: insolvencyData?.proceeding_type || null,
      court_name: insolvencyData?.court_name || null,
    };
  }

  /**
   * Check if the service is ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get statistics about loaded data
   */
  public getStats() {
    return {
      registryCount: this.registryMap.size,
      taxCount: this.taxMap.size,
      insolvencyCount: this.insolvencyMap.size,
      isInitialized: this.isInitialized,
    };
  }
}

// Export getInstance function for easy access
export const getCsvDataService = () => CsvDataService.getInstance();
