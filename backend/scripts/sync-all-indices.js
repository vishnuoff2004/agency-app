require('dotenv').config();
const {
  syncAllRoutesToAlgolia,
  syncAllUsersToAlgolia,
  syncAllAgenciesToAlgolia,
  syncAllBookingsToAlgolia,
} = require('../src/utils/algoliaSync');

async function run() {
  console.log('--- Starting Bulk Algolia Index Rebuild ---');
  try {
    await syncAllRoutesToAlgolia();
    await syncAllUsersToAlgolia();
    await syncAllAgenciesToAlgolia();
    await syncAllBookingsToAlgolia();
    console.log('--- Bulk Rebuild Completed Successfully ---');
  } catch (err) {
    console.error('Error in Bulk Algolia Index Rebuild:', err.message);
  }
  process.exit(0);
}

run();
