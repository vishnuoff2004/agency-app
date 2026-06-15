require('dotenv').config();
const { syncAllRoutesToAlgolia } = require('../src/utils/algoliaSync');

async function run() {
  console.log('--- Triggering Algolia Rebuild Index ---');
  await syncAllRoutesToAlgolia();
  process.exit(0);
}

run();
