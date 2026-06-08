// lib/scrapers/threads.js
// Threads pakai Instagram scraper Apify (Meta property, endpoint sama)

const config = require('../../config');

const APIFY_TOKEN = config.APIFY_TOKEN;
const USERNAME = config.TARGETS.threads.username;
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
    console.error(`[Threads] Apify error: ${res.status} ${await res.text()}`);
    return [];
  }
  return res.json();
}

async function getPosts() {
  try {
    const items = await runActor('apify~instagram-scraper', {
      directUrls: [`https://www.threads.net/@${USERNAME}`],
      resultsType: 'posts',
      resultsLimit: MAX,
    });

    return items.slice(0, MAX).map(item => {
      const isVideo = item.type === 'Video' || item.videoUrl;
      const isCarousel = item.type === 'Sidecar' && item.childPosts?.length > 0;

      let mediaItems = [];
      if (isCarousel) {
        mediaItems = item.childPosts.map(c => ({
          type: c.videoUrl ? 'video' : 'photo',
          media: c.videoUrl || c.displayUrl,
        })).filter(m => m.media);
      } else if (isVideo) {
        mediaItems = [{ type: 'video', media: item.videoUrl }];
      } else if (item.displayUrl) {
        mediaItems = [{ type: 'photo', media: item.displayUrl }];
      }

      if (!mediaItems.length) return null;

      return {
        id: `th_${item.id || item.shortCode}`,
        platform: 'threads',
        isStory: false,
        text: item.caption || '',
        timestamp: new Date(item.timestamp).getTime() || Date.now(),
        url: `https://www.threads.net/@${USERNAME}/post/${item.shortCode}`,
        mediaItems,
      };
    }).filter(Boolean);

  } catch (err) {
    console.error('[Threads] getPosts error:', err.message);
    return [];
  }
}

module.exports = { getPosts };
