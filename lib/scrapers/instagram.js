// lib/scrapers/instagram.js
// Menggunakan Apify Actor: apify/instagram-scraper

const config = require('../../config');

const APIFY_TOKEN = config.APIFY_TOKEN;
const USERNAME = config.TARGETS.instagram.username;
const MAX = config.MAX_POSTS_PER_CHECK;

async function runActor(actorId, input) {
  // Jalankan actor dan tunggu hasilnya (synchronous run)
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=60&memory=256`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) {
    console.error(`[Instagram] Apify error: ${res.status} ${await res.text()}`);
    return [];
  }
  return res.json();
}

async function getPosts() {
  try {
    const items = await runActor('apify~instagram-scraper', {
      directUrls: [`https://www.instagram.com/${USERNAME}/`],
      resultsType: 'posts',
      resultsLimit: MAX,
      addParentData: false,
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
      } else {
        mediaItems = [{ type: 'photo', media: item.displayUrl }];
      }

      return {
        id: `ig_${item.id || item.shortCode}`,
        platform: 'instagram',
        isStory: false,
        text: item.caption || '',
        timestamp: new Date(item.timestamp).getTime() || Date.now(),
        url: item.url || `https://www.instagram.com/p/${item.shortCode}/`,
        mediaItems,
      };
    }).filter(p => p.mediaItems.length > 0 && p.mediaItems[0].media);

  } catch (err) {
    console.error('[Instagram] getPosts error:', err.message);
    return [];
  }
}

async function getStories() {
  try {
    const items = await runActor('apify~instagram-scraper', {
      directUrls: [`https://www.instagram.com/stories/${USERNAME}/`],
      resultsType: 'stories',
      resultsLimit: 20,
    });

    return items.map(item => ({
      id: `ig_story_${item.id || item.shortCode}`,
      platform: 'instagram',
      isStory: true,
      text: item.caption || '',
      timestamp: new Date(item.timestamp).getTime() || Date.now(),
      url: `https://www.instagram.com/stories/${USERNAME}/`,
      mediaItems: [{
        type: item.videoUrl ? 'video' : 'photo',
        media: item.videoUrl || item.displayUrl,
      }],
    })).filter(p => p.mediaItems[0]?.media);

  } catch (err) {
    console.error('[Instagram] getStories error:', err.message);
    return [];
  }
}

module.exports = { getPosts, getStories };
