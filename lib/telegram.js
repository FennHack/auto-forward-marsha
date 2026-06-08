// lib/telegram.js

const config = require('../config');

const BASE = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}`;
const CHANNEL = config.TELEGRAM_CHANNEL_ID;

// Helper: buat tag custom emoji HTML
// Fallback ke karakter unicode jika emoji ID tidak tersedia
function e(id, fallback) {
  if (!id) return fallback;
  return `<tg-emoji emoji-id="${id}">${fallback}</tg-emoji>`;
}

async function apiCall(method, body) {
  const res = await fetch(`${BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`[Telegram] Error on ${method}:`, data.description);
  }
  return data;
}

async function sendPhoto(url, caption = '') {
  return apiCall('sendPhoto', {
    chat_id: CHANNEL,
    photo: url,
    caption: caption.slice(0, 1024),
    parse_mode: 'HTML',
  });
}

async function sendVideo(url, caption = '') {
  return apiCall('sendVideo', {
    chat_id: CHANNEL,
    video: url,
    caption: caption.slice(0, 1024),
    parse_mode: 'HTML',
    supports_streaming: true,
  });
}

async function sendMessage(text) {
  return apiCall('sendMessage', {
    chat_id: CHANNEL,
    text: text.slice(0, 4096),
    parse_mode: 'HTML',
    disable_web_page_preview: false,
  });
}

async function sendMediaGroup(mediaItems) {
  const groups = [];
  for (let i = 0; i < mediaItems.length; i += 10) {
    groups.push(mediaItems.slice(i, i + 10));
  }
  for (const group of groups) {
    if (group.length === 1) {
      const item = group[0];
      if (item.type === 'video') await sendVideo(item.media, item.caption || '');
      else await sendPhoto(item.media, item.caption || '');
    } else {
      await apiCall('sendMediaGroup', {
        chat_id: CHANNEL,
        media: group.map((item, idx) => ({
          type: item.type,
          media: item.media,
          ...(idx === 0 && item.caption
            ? { caption: item.caption.slice(0, 1024), parse_mode: 'HTML' }
            : {}),
        })),
      });
    }
    await sleep(1000);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// FORMAT CAPTION — ELEGANT & MINIMAL dengan Custom Emoji
// ============================================================
function buildCaption(post) {
  // ID custom emoji premium dari kamu
  const platformEmojiId = {
    instagram: '5319160079465857105',
    tiktok:    '5327982530702359565',
    twitter:   '5330337435500951363',
    threads:   '5334592721594105691',
  };

  const platformLabel = {
    instagram: 'Instagram',
    tiktok:    'TikTok',
    twitter:   'X · Twitter',
    threads:   'Threads',
  };

  // Bungkus ID jadi tag <tg-emoji> yang valid (wajib ada fallback emoji di dalam)
  function tgEmoji(id, fallback) {
    return `<tg-emoji emoji-id="${id}">${fallback}</tg-emoji>`;
  }

  const emojiId = platformEmojiId[post.platform];
  const icon    = emojiId ? tgEmoji(emojiId, '✦') : '✦';
  const label   = platformLabel[post.platform] || post.platform;

  const date = new Date(post.timestamp).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day:    '2-digit',
    month:  'long',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });

  const storyBadge = post.isStory
    ? `${tgEmoji('5282843764451195532', '📌')} <i>Story ${label}</i>\n`
    : '';

  const bodyText = post.text
    ? `${post.text.slice(0, 700)}${post.text.length > 700 ? '…' : ''}\n\n`
    : '';

  return (
    `${icon} <b>Marsha JKT48</b>  ·  ${label}\n` +
    storyBadge +
    `${'─'.repeat(22)}\n\n` +
    bodyText +
    `${tgEmoji('5397782960512444700', '↗')} <a href="${post.url}">Lihat di ${label}</a>\n` +
    `${tgEmoji('5282843764451195532', '◷')} <i>${date} WIB</i>`
  );
}

module.exports = { sendPhoto, sendVideo, sendMessage, sendMediaGroup, buildCaption };
