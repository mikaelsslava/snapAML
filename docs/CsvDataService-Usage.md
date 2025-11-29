# CsvDataService Usage Guide

## Overview
The CsvDataService loads three CSV files into memory at startup for instant O(1) lookups by registration number.

## Data Sources
1. **registry.csv** - Main company registry (delimiter: `;`, key: `regcode`)
2. **taxpayer_rating.csv** - Tax ratings (delimiter: `,`, key: `Registracijas_kods`)
3. **insolvency.csv** - Insolvency records (delimiter: `;`, key: `debtor_registration_number`)

## Usage

### Import the service
```typescript
import { csvDataService } from './services/CsvDataService';
```

### Get aggregated company data
```typescript
try {
  const data = await csvDataService.getAggregateData('12345678901');
  
  console.log(data.name);              // Company name
  console.log(data.address);           // Company address
  console.log(data.registered);        // Registration date
  console.log(data.type_text);         // Legal form
  console.log(data.terminated);        // Termination date (empty if active)
  console.log(data.is_active);         // Boolean: true if terminated is empty
  
  // Tax data (null if not found)
  console.log(data.rating);            // Tax rating
  console.log(data.explanation);       // Rating explanation
  
  // Insolvency data
  console.log(data.has_insolvency);    // Boolean: true if found in insolvency.csv
  console.log(data.proceeding_resolution_name); // Details (null if not found)
  
} catch (error) {
  // Error thrown if registration number not found in registry
  console.error(error.message);
}
```

### Check service status
```typescript
// Check if data is loaded
const isReady = csvDataService.isReady();

// Get statistics
const stats = csvDataService.getStats();
console.log(stats.registryCount);     // Number of registry entries
console.log(stats.taxCount);          // Number of tax entries
console.log(stats.insolvencyCount);   // Number of insolvency entries
console.log(stats.isInitialized);     // Initialization status
```

## Key Features

### O(1) Lookup Performance
All data is stored in `Map<string, T>` structures for instant retrieval by registration number.

### Automatic Initialization
The service automatically loads all CSV files when first imported. The loading happens asynchronously in the background.

### Error Handling
- Throws error if registration number not found in registry
- Returns `null` for optional fields (tax/insolvency) when not found
- Returns `false` for `has_insolvency` when no insolvency record exists

### Business Logic
- `is_active` is `true` when `terminated` field is empty
- `has_insolvency` is `true` when record exists in insolvency.csv

## Data Types

```typescript
interface AggregateData {
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
```

## Testing

Run the test script to verify the service:
```bash
ts-node src/test-csv-service.ts
```

Or build and run:
```bash
npm run build
node dist/test-csv-service.js
