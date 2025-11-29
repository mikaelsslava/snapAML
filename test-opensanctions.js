// Direct test of OpenSanctions Match API
const axios = require('axios');

async function testOpenSanctions(companyName) {
  const apiKey = '2153f9c31b2b9ffe71cda9fbc1c52109';
  const url = 'https://api.opensanctions.org/match/default';

  console.log(`\n🔍 Testing OpenSanctions Match API for: "${companyName}"\n`);

  try {
    const body = {
      queries: {
        query1: {
          schema: 'LegalEntity',  // Company entity type
          properties: {
            name: [companyName]
          }
        }
      }
    };

    console.log('📤 Request:');
    console.log(JSON.stringify(body, null, 2));
    console.log(`\n🌐 Endpoint: ${url}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);

    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Response received!\n');
    const results = response.data.responses.query1.results;

    if (results.length === 0) {
      console.log('✅ No sanctions found - Company is CLEAN');
      return { is_sanctioned: false };
    }

    console.log(`⚠️  Found ${results.length} potential match(es):\n`);

    results.forEach((match, index) => {
      console.log(`Match ${index + 1}:`);
      console.log(`  Name: ${match.caption}`);
      console.log(`  Score: ${(match.score * 100).toFixed(1)}%`);
      console.log(`  Schema: ${match.schema}`);
      console.log(`  Topics: ${match.properties.topics?.join(', ') || 'N/A'}`);
      console.log(`  ID: ${match.id}`);
      console.log();
    });

    // Check for high confidence matches (≥70%)
    const highConfidenceMatches = results.filter(m => m.score >= 0.7);

    if (highConfidenceMatches.length > 0) {
      console.log(`🚨 HIGH CONFIDENCE MATCH - Company appears to be SANCTIONED`);
      console.log(`   Best match: ${highConfidenceMatches[0].caption} (${(highConfidenceMatches[0].score * 100).toFixed(1)}%)`);
      return { is_sanctioned: true, matches: highConfidenceMatches };
    } else {
      console.log('✅ Matches below 70% threshold - Company is likely CLEAN');
      return { is_sanctioned: false, low_confidence_matches: results };
    }

  } catch (error) {
    console.error('\n❌ API Error:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`  ${error.message}`);
    }
    throw error;
  }
}

// Run tests
(async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  OpenSanctions Match API Test Suite');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test 1: Known sanctioned entity
  console.log('\n📋 TEST 1: Known Sanctioned Company');
  console.log('─────────────────────────────────────');
  await testOpenSanctions('PJSC ROSNEFT OIL COMPANY');

  // Test 2: Clean company (likely no match)
  console.log('\n\n📋 TEST 2: Clean Company');
  console.log('─────────────────────────────────────');
  await testOpenSanctions('Acme Corporation Latvia');

  // Test 3: Another sanctioned entity
  console.log('\n\n📋 TEST 3: Another Sanctioned Entity');
  console.log('─────────────────────────────────────');
  await testOpenSanctions('Sberbank');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Tests Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
})();
