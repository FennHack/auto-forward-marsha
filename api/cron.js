// api/cron.js
// Vercel Cron Job endpoint - called automatically every 15 minutes
// Configure in vercel.json: {"crons": [{"path": "/api/cron", "schedule": "*/15 * * * *"}]}

const { runCycle } = require('../lib/processor');

// Secret to prevent unauthorized triggers (optional but recommended)
const CRON_SECRET = process.env.CRON_SECRET;

module.exports = async function handler(req, res) {
  // Verify cron secret if set
  if (CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Cron] Triggered at', new Date().toISOString());
    const count = await runCycle();
    return res.status(200).json({
      success: true,
      posted: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron] Fatal error:', err);
    return res.status(500).json({ error: err.message });
  }
};
