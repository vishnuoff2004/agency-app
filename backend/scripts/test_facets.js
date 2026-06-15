require('dotenv').config();
const { algoliasearch } = require('algoliasearch');

async function test() {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_API_KEY;
  console.log('App ID:', appId);
  console.log('API Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'missing');

  if (!appId || !apiKey) {
    console.log('Algolia keys missing');
    return;
  }

  const client = algoliasearch(appId, apiKey);

  // Check current settings
  try {
    const settings = await client.getSettings({ indexName: 'routes' });
    console.log('Current attributesForFaceting:', JSON.stringify(settings.attributesForFaceting, null, 2));
  } catch (e) {
    console.log('Failed to get settings:', e.message);
  }

  // Check if there are any records
  try {
    const result = await client.searchSingleIndex({
      indexName: 'routes',
      searchParams: { query: '', hitsPerPage: 5, facets: ['vehicleType'] },
    });
    console.log('Total hits:', result.nbHits);
    console.log('Facets:', JSON.stringify(result.facets, null, 2));
    if (result.hits.length > 0) {
      console.log('Sample hit vehicleType:', result.hits[0].vehicleType);
    }
  } catch (e) {
    console.log('Search failed:', e.message);
  }
}

test();
