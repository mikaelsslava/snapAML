# Risk Profile Generation - Complete Implementation Guide

## Overview
This document describes the complete implementation of the automated risk profiling system that aggregates data from multiple sources when a company lookup is performed.

## Architecture

### Flow Diagram
```
Client Request (registrationNumber)
         ↓
CompanyController.generateRiskProfile()
         ↓
    ┌────┴────────────────────────────────┐
    │  Step A: Get Submission             │
    │  CompanyService.getCompany()        │
    └────┬────────────────────────────────┘
         ↓
    ┌────┴────────────────────────────────┐
    │  Step B: Parallel Data Aggregation  │
    │  ┌────────────────────────────────┐ │
    │  │ 1. CsvDataService              │ │
    │  │    - Registry Data             │ │
    │  │    - Tax Ratings               │ │
    │  │    - Insolvency Records        │ │
    │  ├────────────────────────────────┤ │
    │  │ 2. ExternalApiService          │ │
    │  │    - Sanctions Check           │ │
    │  │    - PEP Check                 │ │
    │  ├────────────────────────────────┤ │
    │  │ 3. AdverseMediaService         │ │
    │  │    - AI Media Analysis         │ │
    │  │    - Risk Scoring              │ │
    │  └────────────────────────────────┘ │
    └────┬────────────────────────────────┘
         ↓
    ┌────┴────────────────────────────────┐
    │  Step C: Calculate Risk Level       │
    └────┬────────────────────────────────┘
         ↓
    ┌────┴────────────────────────────────┐
    │  Step D: Save to Database           │
    │  (company_risk_profiles table)      │
    └────┬────────────────────────────────┘
         ↓
    ┌────┴────────────────────────────────┐
    │  Step E: Return Complete Profile    │
    └─────────────────────────────────────┘
```

## Components

### 1. CsvDataService (Singleton)

**Location**: `src/services/CsvDataService.ts`

**Purpose**: Loads local CSV files into memory for instant O(1) lookup.

**Initialization**:
```typescript
// Called in src/index.ts on server startup
await CsvDataService.getInstance().init();
```

**Data Sources**:
- `registry.csv` - Company registry (delimiter: `;`)
- `taxpayer_rating.csv` - Tax ratings (delimiter: `,`)
- `insolvency.csv` - Insolvency records (delimiter: `;`)

**Key Methods**:
- `init()`: Loads all CSV files into Maps
- `getAggregateData(regNumber)`: Returns combined data from all 3 sources

**Returns**:
```typescript
{
  name: string;
  address: string;
  registered: string;
  type_text: string;
  terminated: string;
  is_active: boolean;
  rating: string | null;
  explanation: string | null;
  proceeding_resolution_name: string | null;
  has_insolvency: boolean;
}
```

### 2. ExternalApiService

**Location**: `src/services/ExternalApiService.ts`

**Purpose**: Checks external APIs for sanctions and PEP status.

**Key Method**:
```typescript
ExternalApiService.checkAll(registrationNumber, companyName)
```

**Returns**:
```typescript
{
  sanctions: {
    is_sanctioned: boolean;
    sources: string[];
    details: string | null;
  };
  pep_check: {
    is_pep: boolean;
    details: string | null;
  };
  checked_at: string;
}
```

**TODO**: Implement actual API integrations
- OFAC Sanctions List
- EU Sanctions List
- UN Sanctions List
- PEP databases

### 3. AdverseMediaService

**Location**: `src/services/AdverseMediaService.ts`

**Purpose**: AI-powered analysis of company reputation from media sources.

**Key Method**:
```typescript
AdverseMediaService.analyzeReputation(companyName)
```

**Returns**:
```typescript
{
  risk_score: number; // 0-100
  negative_mentions: number;
  summary: string;
  sources: string[];
  analyzed_at: string;
}
```

**TODO**: Implement actual AI analysis
- Web scraping of news sources
- AI/LLM sentiment analysis
- Pattern recognition for adverse events

### 4. CompanyController

**Location**: `src/controllers/company.controller.ts`

**Main Method**: `generateRiskProfile(req, res)`

**Process**:

1. **Validate Request**
   - Ensures `registrationNumber` is provided

2. **Get Submission** (Step A)
   - Queries `kyb_submissions` table
   - Returns 404 if not found

3. **Parallel Data Aggregation** (Step B)
   ```typescript
   const [localData, apiResults, aiResults] = await Promise.all([
     CsvDataService.getInstance().getAggregateData(regNumber),
     ExternalApiService.checkAll(regNumber, companyName),
     AdverseMediaService.analyzeReputation(companyName)
   ]);
   ```

4. **Risk Calculation** (Step C)
   - Terminated: +30 points
   - Insolvency: +40 points
   - Sanctioned: +50 points
   - PEP: +25 points
   - Adverse Media: +0-30 points (weighted)
   - Poor Tax Rating: +20 points
   
   **Risk Levels**:
   - 0-24: LOW
   - 25-49: MEDIUM
   - 50-79: HIGH
   - 80+: CRITICAL

5. **Save Profile** (Step D)
   - Inserts into `company_risk_profiles` table
   - Stores complete profile as JSON

6. **Return Response** (Step E)
   - Returns enriched profile immediately
   - Client gets instant comprehensive data

## API Endpoint

**URL**: `POST /api/company`

**Request Body**:
```json
{
  "registrationNumber": "12345678901"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "registration_number": "12345678901",
    "company_name": "Example Company SIA",
    
    // Local CSV data
    "address": "Riga, Latvia",
    "registered_date": "2020-01-15",
    "legal_form": "SIA",
    "is_active": true,
    "terminated_date": null,
    "tax_rating": "A",
    "tax_explanation": "Good taxpayer",
    "has_insolvency": false,
    "insolvency_details": null,
    
    // External API results
    "is_sanctioned": false,
    "sanction_sources": ["OFAC", "EU", "UN"],
    "sanction_details": null,
    "is_pep": false,
    "pep_details": null,
    
    // AI Analysis
    "adverse_media_risk_score": 10,
    "adverse_media_summary": "No significant adverse media found",
    "adverse_media_mentions": 0,
    
    // Overall assessment
    "overall_risk_level": "LOW",
    "checked_at": "2025-11-29T17:20:00.000Z"
  }
}
```

**Error Responses**:

- **400 Bad Request**: Missing or invalid registration number
- **404 Not Found**: 
  - Company submission not in database
  - Company not in Latvian Registry
- **500 Internal Server Error**: Server error during processing

## Database Schema

### Required Table: `company_risk_profiles`

```sql
CREATE TABLE company_risk_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number TEXT NOT NULL,
  company_name TEXT NOT NULL,
  profile_data JSONB NOT NULL,
  risk_level TEXT NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_risk_profiles_reg_number ON company_risk_profiles(registration_number);
CREATE INDEX idx_risk_profiles_risk_level ON company_risk_profiles(risk_level);
CREATE INDEX idx_risk_profiles_checked_at ON company_risk_profiles(checked_at DESC);
```

## Server Initialization

**File**: `src/index.ts`

```typescript
async function startServer() {
  try {
    // Initialize CSV Data Service BEFORE starting server
    console.log('Initializing CSV Data Service...');
    await CsvDataService.getInstance().init();
    console.log('CSV Data Service initialized successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

## Error Handling

### CSV Data Not Found
```typescript
// Returns 404 with specific error
{
  "success": false,
  "error": "Company not found in Latvian Registry"
}
```

### External API Failures
- System continues with available data
- Missing checks return safe defaults
- Errors logged but don't block response

### Database Save Failures
- Profile still returned to client
- Error logged for investigation
- System remains operational

## Performance Considerations

1. **CSV Loading**: Done once on server startup (~2-3 seconds)
2. **Lookup Speed**: O(1) - instant from memory
3. **Parallel Processing**: All checks run simultaneously
4. **Total Response Time**: ~200-500ms (depending on external APIs)

## Future Enhancements

### Phase 1 (Current)
- ✅ Local CSV data integration
- ✅ Mock external API checks
- ✅ Mock AI analysis
- ✅ Database storage

### Phase 2
- 🔲 Real sanctions API integration
- 🔲 Real PEP database integration
- 🔲 Actual AI/LLM for media analysis
- 🔲 Caching layer for repeated lookups

### Phase 3
- 🔲 Real-time monitoring for profile changes
- 🔲 Automated alerts for risk level increases
- 🔲 Historical risk tracking
- 🔲 Trend analysis

## Testing

### Manual Test
```bash
# Start server (initializes CSV data)
npm run dev

# Make request
curl -X POST http://localhost:3000/api/company \
  -H "Content-Type: application/json" \
  -d '{"registrationNumber": "12345678901"}'
```

### Check Initialization
```bash
# Server logs should show:
# Initializing CSV Data Service...
# Loaded XXXXX registry entries
# Loaded XXXXX tax entries
# Loaded XXXXX insolvency entries
# CSV Data Service initialized successfully
```

## Troubleshooting

### Issue: "CsvDataService not initialized"
**Solution**: Ensure `CsvDataService.getInstance().init()` is called in `index.ts` before server starts

### Issue: CSV files not found
**Solution**: Verify files exist in `src/data/csv/` directory

### Issue: TypeScript errors for Node types
**Solution**: Already configured in `tsconfig.json` with `"types": ["node"]`

### Issue: Slow response times
**Solution**: 
- Check external API latency
- Verify CSV data loaded into memory
- Consider adding caching layer

## Security Notes

1. **Data Privacy**: CSV data stays in memory, never exposed directly
2. **Rate Limiting**: Consider adding for external API calls
3. **Input Validation**: Registration number validated before processing
4. **Error Messages**: Generic errors to avoid information disclosure
5. **Database**: Use parameterized queries (Supabase handles this)

## Monitoring

### Key Metrics to Track
- CSV initialization time
- Lookup success/failure rates
- Average response time
- External API success rates
- Risk level distribution
- Database save success rate

### Recommended Logging
```typescript
console.log('Risk profile generated:', {
  registrationNumber,
  riskLevel,
  processingTime,
  dataSourcesUsed
});
