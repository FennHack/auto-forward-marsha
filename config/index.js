// config/index.js
module.exports = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID || '',

  TARGETS: {
    instagram: {
      username: 'jkt48.marsha',
      enabled: true,
      fetchStories: true,
    },
    tiktok: {
      username: 'marsha.jkt48',
      enabled: true,
      fetchStories: true,
    },
    twitter: {
      username: 'L_MarshaJKT48',
      enabled: true,
    },
    threads: {
      username: 'jkt48.marsha',
      enabled: true,
    },
  },

  // Apify (pengganti RapidAPI)
  APIFY_TOKEN: process.env.APIFY_TOKEN || '',

  CHECK_INTERVAL_MINUTES: parseInt(process.env.CHECK_INTERVAL_MINUTES) || 15,
  MAX_POSTS_PER_CHECK: 5,

  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL || '',
  UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN || '',
};
