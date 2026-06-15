const { algoliasearch } = require('algoliasearch');

let client = null;
const appId = process.env.ALGOLIA_APP_ID;
const apiKey = process.env.ALGOLIA_API_KEY;

const INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || 'routes';
const INDEX_ROUTES = INDEX_NAME;
const INDEX_USERS = process.env.ALGOLIA_USERS_INDEX_NAME || 'users';
const INDEX_AGENCIES = process.env.ALGOLIA_AGENCIES_INDEX_NAME || 'agencies';
const INDEX_BOOKINGS = process.env.ALGOLIA_BOOKINGS_INDEX_NAME || 'bookings';

if (appId && apiKey) {
  try {
    client = algoliasearch(appId, apiKey);
    console.log(`Algolia client initialized successfully for App ID: ${appId}`);

    // Auto-apply index settings (facets/searchable fields) for all indices
    const applySettings = async () => {
      try {
        await client.setSettings({
          indexName: INDEX_ROUTES,
          indexSettings: {
            searchableAttributes: ['source', 'destination', 'driverName', 'vehicleType', 'agencyName'],
            attributesForFaceting: [
              'filterOnly(available)',
              'filterOnly(status)',
              'filterOnly(departureTimeTimestamp)',
              'filterOnly(fare)',
              'filterOnly(capacity)',
            ],
          },
        });
        console.log(`Algolia search/facet settings applied successfully to index: ${INDEX_ROUTES}`);

        await client.setSettings({
          indexName: INDEX_USERS,
          indexSettings: {
            searchableAttributes: ['name', 'email', 'phone', 'role'],
            attributesForFaceting: [
              'filterOnly(role)',
              'filterOnly(active)',
            ],
          },
        });
        console.log(`Algolia search/facet settings applied successfully to index: ${INDEX_USERS}`);

        await client.setSettings({
          indexName: INDEX_AGENCIES,
          indexSettings: {
            searchableAttributes: ['name', 'email', 'phone'],
            attributesForFaceting: [
              'filterOnly(active)',
            ],
          },
        });
        console.log(`Algolia search/facet settings applied successfully to index: ${INDEX_AGENCIES}`);

        await client.setSettings({
          indexName: INDEX_BOOKINGS,
          indexSettings: {
            searchableAttributes: [
              'id',
              'travelerName',
              'travelerEmail',
              'travelerPhone',
              'routeSource',
              'routeDestination',
              'driverName',
              'agencyName',
              'status',
            ],
            attributesForFaceting: [
              'filterOnly(status)',
              'filterOnly(travelDateTimestamp)',
              'filterOnly(userId)',
            ],
          },
        });
        console.log(`Algolia search/facet settings applied successfully to index: ${INDEX_BOOKINGS}`);
      } catch (settingsErr) {
        console.error(`Failed to apply Algolia index settings:`, settingsErr.message);
      }
    };

    applySettings();

  } catch (err) {
    console.error('Failed to initialize Algolia client:', err.message);
  }
} else {
  console.warn('Algolia keys missing (ALGOLIA_APP_ID, ALGOLIA_API_KEY). Search will fallback to SQL database.');
}

function getAlgoliaClient() {
  return client;
}

module.exports = {
  getAlgoliaClient,
  INDEX_NAME,
  INDEX_ROUTES,
  INDEX_USERS,
  INDEX_AGENCIES,
  INDEX_BOOKINGS,
};

