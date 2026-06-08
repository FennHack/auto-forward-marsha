// lib/scrapers/tiktok.js
// Menggunakan Apify Actor: clockworks/free-tiktok-scraper

const config = require('../../config');

const APIFY_TOKEN = config.APIFY_TOKEN;
const USERNAME = config.TARGETS.tiktok.username;
const MAX = config.MAX_POSTS_PER_CHECK;

async function runActor(actorId, input) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=60&memory=256`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) {
    console.error(`[TikTok] Apify error: ${res.status} ${await res.text()}`);
    return [];
  }
  return res.json();
}

async function getPosts() {
  try {
    const items = await runActor('clockworks~free-tiktok-scraper', {
      profiles: [`https://www.tiktok.com/@${USERNAME}`],
      resultsPerPage: MAX,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    });

    return items.slice(0, MAX).map(item => ({
      id: `tt_${item.id}`,
      platform: 'tiktok',
      isStory: false,
      text: item.text || item.desc || '',
      timestamp: (item.createTime || Date.now() / 1000) * 1000,
      url: item.webVideoUrl || `https://www.tiktok.com/@${USERNAME}/video/${item.id}`,
      mediaItems: [{
        type: 'video',
        media: item.videoMeta?.downloadAddr || item.mediaUrls?.[0],
      }],
    })).filter(p => p.mediaItems[0]?.media);

  } catch (err) {
    console.error('[TikTok] getPosts error:', err.message);
    return [];
  }
}

async function getStories() {
  try {
    // TikTok stories via profile scrape dengan filter
    const items = await runActor('clockworks~free-tiktok-scraper', {
      profiles: [`https://www.tiktok.com/@${USERNAME}`],
      resultsPerPage: 10,
      scrapeStories: true,
    });

    const stories = items.filter(i => i.isStory || i.type === 'story');

    return stories.map(item => ({
      id: `tt_story_${item.id}`,
      platform: 'tiktok',
      isStory: true,
      text: item.text || '',
      timestamp: (item.createTime || Date.now() / 1000) * 1000,
      url: `https://www.tiktok.com/@${USERNAME}`,
      mediaItems: [{
        type: item.isImage ? 'photo' : 'video',
        media: item.videoMeta?.downloadAddr || item.mediaUrls?.[0],
      }],
    })).filter(p => p.mediaItems[0]?.media);

  } catch (err) {
    console.error('[TikTok] getStories error:', err.message);
    return [];
  }
}

module.exports = { getPosts, getStories };
