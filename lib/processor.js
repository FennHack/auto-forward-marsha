// lib/processor.js
// Main logic: fetch new content from all platforms and post to Telegram

const config = require('../config');
const storage = require('./storage');
const tg = require('./telegram');

const igScraper = require('./scrapers/instagram');
const ttScraper = require('./scrapers/tiktok');
const twScraper = require('./scrapers/twitter');
const thScraper = require('./scrapers/threads');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Process one post: check if already posted, then send to Telegram
async function processPost(post) {
  try {
    const alreadyPosted = await storage.isPosted(post.id);
    if (alreadyPosted) {
      console.log(`[Processor] Skipping already posted: ${post.id}`);
      return false;
    }

    const caption = tg.buildCaption(post);

    if (post.mediaItems.length === 0) {
      // Text only — shouldn't happen with our filters but just in case
      await tg.sendMessage(caption);
    } else if (post.mediaItems.length === 1) {
      const item = post.mediaItems[0];
      if (item.type === 'video') {
        await tg.sendVideo(item.media, caption);
      } else {
        await tg.sendPhoto(item.media, caption);
      }
    } else {
      // Album: attach caption to first item
      const items = post.mediaItems.map((m, i) => ({
        ...m,
        caption: i === 0 ? caption : undefined,
      }));
      await tg.sendMediaGroup(items);
    }

    await storage.markPosted(post.id);
    console.log(`[Processor] ✅ Posted: ${post.id} [${post.platform}]`);
    return true;
  } catch (err) {
    console.error(`[Processor] Error posting ${post.id}:`, err.message);
    return false;
  }
}

// Run one full cycle across all platforms
async function runCycle() {
  console.log(`[Processor] 🔄 Starting cycle at ${new Date().toISOString()}`);
  let totalPosted = 0;

  // ── Instagram Posts ──
  if (config.TARGETS.instagram.enabled) {
    console.log('[Processor] Checking Instagram posts...');
    const posts = await igScraper.getPosts();
    for (const post of posts) {
      const ok = await processPost(post);
      if (ok) { totalPosted++; await sleep(2000); }
    }

    // Instagram Stories
    if (config.TARGETS.instagram.fetchStories) {
      console.log('[Processor] Checking Instagram stories...');
      const stories = await igScraper.getStories();
      for (const story of stories) {
        const ok = await processPost(story);
        if (ok) { totalPosted++; await sleep(2000); }
      }
    }
  }

  // ── TikTok Videos ──
  if (config.TARGETS.tiktok.enabled) {
    console.log('[Processor] Checking TikTok videos...');
    const posts = await ttScraper.getPosts();
    for (const post of posts) {
      const ok = await processPost(post);
      if (ok) { totalPosted++; await sleep(2000); }
    }

    // TikTok Stories
    if (config.TARGETS.tiktok.fetchStories) {
      console.log('[Processor] Checking TikTok stories...');
      const stories = await ttScraper.getStories();
      for (const story of stories) {
        const ok = await processPost(story);
        if (ok) { totalPosted++; await sleep(2000); }
      }
    }
  }

  // ── Twitter/X ──
  if (config.TARGETS.twitter.enabled) {
    console.log('[Processor] Checking Twitter posts...');
    const posts = await twScraper.getPosts();
    for (const post of posts) {
      const ok = await processPost(post);
      if (ok) { totalPosted++; await sleep(2000); }
    }
  }

  // ── Threads ──
  if (config.TARGETS.threads.enabled) {
    console.log('[Processor] Checking Threads posts...');
    const posts = await thScraper.getPosts();
    for (const post of posts) {
      const ok = await processPost(post);
      if (ok) { totalPosted++; await sleep(2000); }
    }
  }

  console.log(`[Processor] ✅ Cycle complete. Posted ${totalPosted} new items.`);
  return totalPosted;
}

module.exports = { runCycle };
