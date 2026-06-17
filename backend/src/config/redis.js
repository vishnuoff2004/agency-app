const Redis = require('ioredis');

let redis;

if (process.env.REDIS_URL && process.env.USE_REDIS === 'true') {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 1) return null;
      return 100;
    },
  });
  redis.on('error', () => {});
} else {
  console.log('Redis is disabled (no REDIS_URL found). Running with mock cache/rate-limiter.');
  redis = {
    incr: async () => 1,
    expire: async () => 1,
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    scan: async () => ['0', []],
    on: () => {},
  };
}

module.exports = redis;
