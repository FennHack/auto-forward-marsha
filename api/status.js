// api/status.js
// Simple status page to confirm the bot is running

module.exports = async function handler(req, res) {
  const config = require('../config');

  const status = {
    bot: 'Marsha JKT48 Auto-Post Bot',
    status: '🟢 Running',
    platforms: {
      instagram: config.TARGETS.instagram.enabled ? '✅ Active' : '❌ Disabled',
      tiktok: config.TARGETS.tiktok.enabled ? '✅ Active' : '❌ Disabled',
      twitter: config.TARGETS.twitter.enabled ? '✅ Active' : '❌ Disabled',
      threads: config.TARGETS.threads.enabled ? '✅ Active' : '❌ Disabled',
    },
    config: {
      channel: config.TELEGRAM_CHANNEL_ID || 'NOT SET',
      checkIntervalMinutes: config.CHECK_INTERVAL_MINUTES,
      botTokenSet: !!config.TELEGRAM_BOT_TOKEN,
      rapidApiSet: !!config.RAPIDAPI_KEY,
      redisSet: !!config.UPSTASH_REDIS_URL,
    },
    timestamp: new Date().toISOString(),
  };

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(status);
};
