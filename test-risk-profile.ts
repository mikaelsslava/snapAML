import * as dotenv from 'dotenv';
dotenv.config();

import { CompanyService } from './src/services/company.service';
import { CsvDataService } from './src/services/csvData.service';
import { ExternalApiService } from './src/services/externalApi.service';

async function testGenerateRiskProfile(registrationNumber: string) {
  try {
    console.log('='.repeat(80));
    console.log(`Testing Risk Profile Generation for: ${registrationNumber}`);
    console.log('='.repeat(80));
    console.log();

    // Step 1: Test CSV Data Service
    console.log('Step 1: Loading CSV Data...');
    const csvService = CsvDataService.getInstance();
    await csvService.init();
    console.log('✓ CSV Service initialized');
    
    const stats = csvService.getStats();
    console.log(`  - Registry entries: ${stats.registryCount}`);
    console.log(`  - Tax entries: ${stats.taxCount}`);
    console.log(`  - Insolvency entries: ${stats.insolvencyCount}`);
    // Step 2: Get local data
    console.log('Step 2: Fetching local CSV data...');
    let localData = null;
    try {
      localData = await csvService.getAggregateData(registrationNumber);
      console.log('✓ Local data found:');
      console.log(`  - Company Name: ${localData.name}`);
      console.log(`  - Address: ${localData.address}`);
      console.log(`  - Legal Form: ${localData.type_text}`);
      console.log(`  - Registered Date: ${localData.registered}`);
      console.log(`  - Is Active: ${localData.is_active}`);
      console.log(`  - Tax Rating: ${localData.rating || 'N/A'}`);
      console.log(`  - Has Insolvency: ${localData.has_insolvency}`);
      console.log(`  - Sepa: ${localData.sepa}`);
      console.log(`  - Type: ${localData.type}`);
      console.log(`  - Closed: ${localData.closed}`);
      console.log(`  - rating updated date: ${localData.rating_updated_date}`);
      console.log(`  - Proceeding Type: ${localData.proceeding_type}`);
      console.log(`  - regtype_text: ${localData.regtype_text}`);
    } catch (error) {
      console.error('✗ Error fetching local data:', (error as Error).message);
      return;
    }
    console.log();

    // Step 3: Check company in database
    console.log('Step 3: Checking company submission in database...');
    try {
      const companyService = new CompanyService();
      let submissionData = null;
      try {
        submissionData = await companyService.getCompanyByRegistrationNumber(registrationNumber);
        console.log('✓ Company submission found:');
        console.log(`  - ID: ${submissionData.id}`);
        console.log(`  - Company Name: ${submissionData.company_name}`);
        console.log(`  - Created At: ${submissionData.created_at}`);
      } catch (error) {
        console.log('⚠ Company submission not found in database (this is expected if not yet submitted)');
        console.log('  Note: You may need to create a submission first for full testing');
      }
    } catch (error) {
      console.log('⚠ Supabase not configured (missing environment variables)');
      console.log('  Skipping database check - this is optional for testing');
    }
    console.log();

    // Step 4: Test External API checks
    console.log('Step 4: Checking external APIs (sanctions, PEPs)...');
    const companyName = localData?.name || 'Unknown Company';
    try {
      const apiResults = await ExternalApiService.checkAll(registrationNumber, companyName);
      console.log('✓ External API checks completed:');
      console.log(`  - Is Sanctioned: ${apiResults.is_sanctioned}`);
      console.log(`  - Sanction Sources: ${apiResults.sanction_sources.join(', ') || 'None'}`);
      console.log(`  - Sanction Details: ${apiResults.sanction_details || 'None'}`);
    } catch (error) {
      console.error('✗ Error checking external APIs:', (error as Error).message);
    }
    console.log();

    // Step 5: Run parallel aggregation (simulating controller logic)
    console.log('Step 5: Running parallel data aggregation...');
    const startTime = Date.now();
    try {
      const [csvData, apiResults] = await Promise.all([
        csvService.getAggregateData(registrationNumber),
        ExternalApiService.checkAll(registrationNumber, companyName)
      ]);
      const endTime = Date.now();
      console.log(`✓ Parallel aggregation completed in ${endTime - startTime}ms`);
      console.log();

      // Calculate overall risk
      console.log('Step 6: Calculating overall risk level...');
      let riskScore = 0;
      
      if (!csvData.is_active) {
        console.log('  + Terminated company: +30');
        riskScore += 30;
      }
      
      if (csvData.has_insolvency) {
        console.log('  + Has insolvency: +40');
        riskScore += 40;
      }
      
      if (apiResults.is_sanctioned) {
        console.log('  + Is sanctioned: +50');
        riskScore += 50;
      }
      
      if (csvData.rating && csvData.rating.toLowerCase().includes('poor')) {
        console.log('  + Poor tax rating: +20');
        riskScore += 20;
      }
      
      let overallRiskLevel = 'LOW';
      if (riskScore >= 80) overallRiskLevel = 'CRITICAL';
      else if (riskScore >= 50) overallRiskLevel = 'HIGH';
      else if (riskScore >= 25) overallRiskLevel = 'MEDIUM';
      
      console.log();
      console.log('='.repeat(80));
      console.log('RISK ASSESSMENT SUMMARY');
      console.log('='.repeat(80));
      console.log(`Total Risk Score: ${riskScore.toFixed(1)}/100`);
      console.log(`Overall Risk Level: ${overallRiskLevel}`);
      console.log('='.repeat(80));
      console.log();

      // Display complete risk profile
      console.log('COMPLETE RISK PROFILE:');
      console.log('-'.repeat(80));
      console.log(`Registration Number: ${registrationNumber}`);
      console.log(`Company Name: ${companyName}`);
      console.log(`Address: ${csvData.address}`);
      console.log(`Registered Date: ${csvData.registered}`);
      console.log(`Legal Form: ${csvData.type_text}`);
      console.log(`Is Active: ${csvData.is_active}`);
      console.log(`Terminated Date: ${csvData.terminated || 'N/A'}`);
      console.log(`Tax Rating: ${csvData.rating || 'N/A'}`);
      console.log(`Tax Explanation: ${csvData.explanation || 'N/A'}`);
      console.log(`Has Insolvency: ${csvData.has_insolvency}`);
      console.log(`Insolvency Details: ${csvData.proceeding_resolution_name || 'N/A'}`);
      console.log(`Is Sanctioned: ${apiResults.is_sanctioned}`);
      console.log(`Sanction Sources: ${apiResults.sanction_sources.join(', ') || 'None'}`);
      console.log(`Adverse Media Risk Score: 0/100 (Disabled)`);
      console.log(`Adverse Media Summary: Adverse media check disabled`);
      console.log(`Adverse Media Mentions: 0`);
      console.log(`Overall Risk Level: ${overallRiskLevel}`);
      console.log('-'.repeat(80));

    } catch (error) {
      console.error('✗ Error during parallel aggregation:', error);
    }

    console.log();
    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test with the specified registration number
const registrationNumber = process.argv[2] || '41503051616';
testGenerateRiskProfile(registrationNumber);
