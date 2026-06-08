// api/webhook.js
// Menerima hasil dari Apify dan langsung posting ke Telegram

const { isPosted, markPosted } = require('../lib/storage');
const { sendPhoto, sendVideo, sendMediaGroup, buildCaption } = require('../lib/telegram');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { eventType, actorRunId, resource } = req.body;
    if (eventType !== 'ACTOR.RUN.SUCCEEDED') {
      return res.status(200).json({ skip: true });
    }

    // Ambil hasil dataset dari run Apify
    const datasetId = resource?.defaultDatasetId;
    if (!datasetId) return res.status(200).json({ skip: true });

    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    const resp = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=20`
    );
    const items = await resp.json();

    let posted = 0;
    for (const item of items) {
      const id = `apify_${item.id || item.shortCode || item.aweme_id || Math.random()}`;
      if (await isPosted(id)) continue;

      // Deteksi platform dari URL
      const url = item.url || item.webVideoUrl || '';
      const platform = url.includes('tiktok') ? 'tiktok'
        : url.includes('twitter') || url.includes('x.com') ? 'twitter'
        : url.includes('threads') ? 'threads'
        : 'instagram';

      const post = {
        id,
        platform,
        isStory: item.isStory || false,
        text: item.caption || item.text || item.desc || '',
        timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now(),
        url: url || `https://instagram.com/p/${item.shortCode}`,
        mediaItems: extractMedia(item),
      };

      if (!post.mediaItems.length) continue;

      const caption = buildCaption(post);
      if (post.mediaItems.length === 1) {
        const m = post.mediaItems[0];
        if (m.type === 'video') await sendVideo(m.media, caption);
        else await sendPhoto(m.media, caption);
      } else {
        await sendMediaGroup(post.mediaItems.map((m, i) => ({
          ...m, caption: i === 0 ? caption : undefined
        })));
      }

      await markPosted(id);
      posted++;
      await new Promise(r => setTimeout(r, 1500));
    }

    return res.status(200).json({ success: true, posted });
  } catch (err) {
    console.error('[Webhook]', err.message);
    return res.status(500).json({ error: err.message });
  }
};

function extractMedia(item) {
  const media = [];
  if (item.videoUrl) media.push({ type: 'video', media: item.videoUrl });
  else if (item.displayUrl) media.push({ type: 'photo', media: item.displayUrl });
  else if (item.play || item.videoMeta?.downloadAddr) {
    media.push({ type: 'video', media: item.play || item.videoMeta.downloadAddr });
  }
  if (item.childPosts) {
    item.childPosts.forEach(c => {
      if (c.videoUrl) media.push({ type: 'video', media: c.videoUrl });
      else if (c.displayUrl) media.push({ type: 'photo', media: c.displayUrl });
    });
  }
  return media.filter(m => m.media);
}
