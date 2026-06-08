// lib/storage.js
// Uses Upstash Redis (free tier) to track already-posted media IDs
// Prevents duplicate posts across Vercel serverless function restarts

const config = require('../config');

const BASE_URL = config.UPSTASH_REDIS_URL;
const TOKEN = config.UPSTASH_REDIS_TOKEN;

async function redisCommand(...args) {
  if (!BASE_URL || !TOKEN) {
    // Fallback to in-memory if Redis not configured
    return null;
  }
  const res = await fetch(`${BASE_URL}/${args.join('/')}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = await res.json();
  return data.result;
}

// In-memory fallback when Redis not available
const memoryStore = new Set();

async function isPosted(id) {
  if (!BASE_URL) return memoryStore.has(id);
  const val = await redisCommand('GET', `posted:${id}`);
  return val === '1';
}

async function markPosted(id) {
  if (!BASE_URL) {
    memoryStore.add(id);
    return;
  }
  // Expire after 30 days
  await redisCommand('SET', `posted:${id}`, '1', 'EX', '2592000');
}

async function getLastChecked(platform) {
  if (!BASE_URL) return null;
  return await redisCommand('GET', `lastcheck:${platform}`);
}

async function setLastChecked(platform) {
  if (!BASE_URL) return;
  await redisCommand('SET', `lastcheck:${platform}`, Date.now().toString());
}

module.exports = { isPosted, markPosted, getLastChecked, setLastChecked };
