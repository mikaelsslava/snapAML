import * as fs from 'fs';
import { parse } from 'csv-parse';
import * as path from 'path';

// Define interfaces for each CSV data type
export interface RegistryData {
  name: string;
  address: string;
  registered: string;
  type_text: string;
  terminated: string;
  is_active: boolean;
}

export interface TaxData {
  rating: string;
  explanation: string;
}

export interface InsolvencyData {
  proceeding_resolution_name: string;
  has_insolvency: boolean;
}

export interface AggregateData {
  // Registry data (required)
  name: string;
  address: string;
  registered: string;
  type_text: string;
  terminated: string;
  is_active: boolean;
  // Tax data (optional)
  rating: string | null;
  explanation: string | null;
  // Insolvency data (optional)
  proceeding_resolution_name: string | null;
  has_insolvency: boolean;
}

export class CsvDataService {
  private static instance: CsvDataService | null = null;
  private registryMap: Map<string, RegistryData> = new Map();
  private taxMap: Map<string, TaxData> = new Map();
  private insolvencyMap: Map<string, InsolvencyData> = new Map();
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor for Singleton pattern
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
   * Initialize the service by loading all CSV files
   * This must be called when the server starts
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('CsvDataService already initialized');
      return;
    }
    try {
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
   * Load registry.csv into memory
   */
  private async loadRegistryData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(__dirname, '../data/csv/registry.csv');

      fs.createReadStream(filePath)
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
            };
            this.registryMap.set(regcode, data);
          }
        })
        .on('error', (error: Error) => {
          reject(new Error(`Failed to load registry.csv: ${error.message}`));
        })
        .on('end', () => {
          resolve();
        });
    });
  }

  /**
   * Load taxpayer_rating.csv into memory
   */
  private async loadTaxData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(__dirname, '../data/csv/taxpayer_rating.csv');

      fs.createReadStream(filePath)
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
            };
            this.taxMap.set(regcode, data);
          }
        })
        .on('error', (error: Error) => {
          reject(new Error(`Failed to load taxpayer_rating.csv: ${error.message}`));
        })
        .on('end', () => {
          resolve();
        });
    });
  }

  /**
   * Load insolvency.csv into memory
   */
  private async loadInsolvencyData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(__dirname, '../data/csv/insolvency.csv');

      fs.createReadStream(filePath)
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
            };
            this.insolvencyMap.set(regcode, data);
          }
        })
        .on('error', (error: Error) => {
          reject(new Error(`Failed to load insolvency.csv: ${error.message}`));
        })
        .on('end', () => {
          resolve();
        });
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
      // Tax data (optional)
      rating: taxData?.rating || null,
      explanation: taxData?.explanation || null,
      // Insolvency data (optional)
      proceeding_resolution_name: insolvencyData?.proceeding_resolution_name || null,
      has_insolvency: insolvencyData?.has_insolvency || false,
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
