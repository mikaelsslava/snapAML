import { csvDataService } from './services/csvData.service';

async function testCsvService() {
  try {
    console.log('Testing CsvDataService...\n');

    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if service is ready
    console.log('Service ready:', csvDataService.isReady());
    
    // Get stats
    const stats = csvDataService.getStats();
    console.log('\nData loaded:');
    console.log('- Registry entries:', stats.registryCount);
    console.log('- Tax entries:', stats.taxCount);
    console.log('- Insolvency entries:', stats.insolvencyCount);

    // Test with a sample registration number (you can replace with a real one)
    console.log('\nTesting getAggregateData...');
    
    // This will test the error handling for non-existent registry
    try {
      const data = await csvDataService.getAggregateData('00000000000');
      console.log('Sample data:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('Expected error for non-existent registration:', (error as Error).message);
    }

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testCsvService();
