// lib/scrapers/twitter.js
// Menggunakan Apify Actor: apidojo/tweet-scraper

const config = require('../../config');

const APIFY_TOKEN = config.APIFY_TOKEN;
const USERNAME = config.TARGETS.twitter.username;
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
    console.error(`[Twitter] Apify error: ${res.status} ${await res.text()}`);
    return [];
  }
  return res.json();
}

async function getPosts() {
  try {
    const items = await runActor('apidojo~tweet-scraper', {
      twitterHandles: [USERNAME],
      maxItems: MAX * 3, // fetch lebih banyak karena difilter yang ada media
      onlyImage: false,
      onlyVideo: false,
      onlyVerifiedUsers: false,
    });

    const withMedia = items.filter(item => {
      const media = item.extendedEntities?.media || item.entities?.media || [];
      return media.length > 0;
    });

    return withMedia.slice(0, MAX).map(item => {
      const media = item.extendedEntities?.media || item.entities?.media || [];

      const mediaItems = media.map(m => {
        if (m.type === 'video' || m.type === 'animated_gif') {
          const variants = m.videoInfo?.variants || [];
          const mp4s = variants.filter(v => v.contentType === 'video/mp4').sort((a, b) => b.bitrate - a.bitrate);
          return { type: 'video', media: mp4s[0]?.url || variants[0]?.url };
        }
        return { type: 'photo', media: m.mediaUrlHttps + ':orig' };
      }).filter(m => m.media);

      return {
        id: `tw_${item.id}`,
        platform: 'twitter',
        isStory: false,
        text: item.fullText || item.text || '',
        timestamp: new Date(item.createdAt).getTime() || Date.now(),
        url: `https://x.com/${USERNAME}/status/${item.id}`,
        mediaItems,
      };
    }).filter(p => p.mediaItems.length > 0);

  } catch (err) {
    console.error('[Twitter] getPosts error:', err.message);
    return [];
  }
}

module.exports = { getPosts };
