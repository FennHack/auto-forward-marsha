// api/test.js
// Endpoint untuk test bot bisa kirim ke channel atau tidak
// Akses: https://forward-ch-tele.vercel.app/api/test

const { sendMessage } = require('../lib/telegram');

module.exports = async function handler(req, res) {
  try {
    const result = await sendMessage(
      `🧪 <b>Test Bot Berhasil!</b>\n\n` +
      `✅ Bot aktif dan bisa posting ke channel ini.\n` +
      `📅 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`
    );

    if (result.ok) {
      return res.status(200).json({
        success: true,
        message: '✅ Pesan test berhasil dikirim ke channel!',
        telegram_response: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '❌ Gagal kirim ke channel',
        error: result.description,
        tips: [
          'Pastikan bot sudah jadi Admin di channel',
          'Cek TELEGRAM_BOT_TOKEN benar',
          'Cek TELEGRAM_CHANNEL_ID benar (format: @nama atau -100xxx)',
        ],
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: '❌ Error',
      error: err.message,
    });
  }
};
