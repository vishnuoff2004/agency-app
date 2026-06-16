const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
console.log('Dotenv result:', dotenvResult.error || dotenvResult.parsed ? 'Success' : 'Empty');
console.log('Resolved path:', path.resolve(__dirname, '../.env'));
console.log('Loaded DB_PASS:', process.env.DB_PASS ? 'YES (length: ' + process.env.DB_PASS.length + ')' : 'NO');

const { createServer } = require('http');
const { initSentry, attachSentryErrorHandler } = require('./utils/sentry');
const app = require('./app');
const { createSocketServer } = require('./socket');

const PORT = process.env.PORT || 5000;

initSentry(app);

const httpServer = createServer(app);

const io = createSocketServer(httpServer);

app.set('io', io);

attachSentryErrorHandler(app);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, httpServer, io };
