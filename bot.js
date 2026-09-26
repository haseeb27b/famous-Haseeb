const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const dns = require('dns').promises;

// ═══════════════════════════════════════════════════════════
//  👇 YAHAN APNI VALUES DAALO 👇
// ═══════════════════════════════════════════════════════════
const BOT_TOKEN = '8882057782:AAGH2m8XdcGWs-DQegA8cbk8nKLkSyFXQ0M';
const OWNER_ID  = 8961037712;  // apni numeric Telegram ID
// ═══════════════════════════════════════════════════════════

if (!BOT_TOKEN || BOT_TOKEN === '8882057782:AAGH2m8XdcGWs-DQegA8cbk8nKLkSyFXQ0M') {
  console.error('❌ BOT_TOKEN missing. Edit bot.js and paste your token.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// ─── REPLY KEYBOARD (No Emojis) ──────────────────────────────
const mainReplyKeyboard = Markup.keyboard([
  ['Indian Number', 'Pakistan Number'],
  ['Pakistan CNIC', 'Vehicle Info'],
  ['Pincode', 'IFSC Code'],
  ['IP Address', 'Domain Check'],
  ['GitHub Info', 'TG User To Number'],
  ['Owner']
]).resize();

// ─── DISCO STYLES ─────────────────────────────────────────────
const styles = ['Primary', 'Success', 'Danger'];
let styleIndex = 0;
const discoIntervals = new Map();

function applyDiscoStyle(baseKeyboard) {
  const style = styles[styleIndex];
  styleIndex = (styleIndex + 1) % styles.length;
  const kb = JSON.parse(JSON.stringify(baseKeyboard));
  if (kb.inline_keyboard) {
    kb.inline_keyboard = kb.inline_keyboard.map(row =>
      row.map(btn => ({ ...btn, style }))
    );
  }
  return kb;
}

function startDisco(ctx, messageId, keyboardGenerator) {
  stopDisco(ctx, messageId);
  const key = `${ctx.chat.id}:${messageId}`;
  const interval = setInterval(async () => {
    try {
      const newKb = applyDiscoStyle(keyboardGenerator());
      await ctx.telegram.editMessageReplyMarkup(
        ctx.chat.id,
        messageId,
        null,
        newKb
      );
    } catch (e) {}
  }, 2500);
  discoIntervals.set(key, interval);
}

function stopDisco(ctx, messageId) {
  const key = `${ctx.chat.id}:${messageId}`;
  const interval = discoIntervals.get(key);
  if (interval) {
    clearInterval(interval);
    discoIntervals.delete(key);
  }
}

// ─── INLINE KEYBOARD (No Emojis) ─────────────────────────────
function getMainInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: 'Indian Number', callback_data: 'in_num' },
        { text: 'Pakistan Number', callback_data: 'pk_num' }
      ],
      [
        { text: 'Pakistan CNIC', callback_data: 'pk_cnic' },
        { text: 'Vehicle Info', callback_data: 'vehicle' }
      ],
      [
        { text: 'Pincode', callback_data: 'pincode' },
        { text: 'IFSC Code', callback_data: 'ifsc' }
      ],
      [
        { text: 'IP Address', callback_data: 'ip' },
        { text: 'Domain Check', callback_data: 'domain' }
      ],
      [
        { text: 'GitHub Info', callback_data: 'github' },
        { text: 'TG User To Number', callback_data: 'tg_user' }
      ],
      [
        { text: 'Owner', url: 'https://t.me/BazzHacker963' }
      ]
    ]
  };
}

async function sendDiscoMenu(ctx, text, keyboardGenerator) {
  const msg = await ctx.reply(text, {
    reply_markup: applyDiscoStyle(keyboardGenerator())
  });
  startDisco(ctx, msg.message_id, keyboardGenerator);
  return msg;
}

// ─── USER STATE ───────────────────────────────────────────────
const userState = new Map();

// ─── START ────────────────────────────────────────────────────
bot.start(async (ctx) => {
  const welcomeText =
    `<tg-emoji emoji-id="4956499161319998529">🔥</tg-emoji> WELCOME BAZZ\n\n` +
    `<tg-emoji emoji-id="4956499161319998529">🔥</tg-emoji> BAZZ Hacker Checker\n` +
    `<tg-emoji emoji-id="6206319341487527808">🤖</tg-emoji> All-in-One Info Bot\n\n` +
    `⬇️ Use the keyboard buttons below:`;

  await ctx.reply(welcomeText, {
    parse_mode: 'HTML',
    reply_markup: mainReplyKeyboard
  });

  await sendDiscoMenu(ctx, 'Choose an option:', getMainInlineKeyboard);
});

// ─── HELPERS ──────────────────────────────────────────────────
function validateIndianNumber(num) {
  const cleaned = num.replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `✅ Valid Indian mobile format.\nNumber: ${cleaned}`;
  }
  return '❌ Invalid Indian mobile number. Must be 10 digits and start with 6–9.';
}

function validatePakistanNumber(num) {
  const cleaned = num.replace(/\D/g, '');
  if (/^03\d{9}$/.test(cleaned)) {
    return `✅ Valid Pakistan mobile format.\nNumber: ${cleaned}`;
  }
  return '❌ Invalid Pakistan mobile number. Must be 11 digits and start with 03.';
}

function validateCNIC(cnic) {
  const cleaned = cnic.replace(/\D/g, '');
  if (/^\d{13}$/.test(cleaned)) {
    return `✅ Valid CNIC format.\nCNIC: ${cleaned}`;
  }
  return '❌ Invalid CNIC. Must be 13 digits without dashes.';
}

// ─── ACTION HANDLER ──────────────────────────────────────────
async function handleAction(ctx, action) {
  if (ctx.callbackQuery) {
    stopDisco(ctx, ctx.callbackQuery.message.message_id);
    await ctx.answerCbQuery();
  }

  userState.set(ctx.chat.id, { action });

  switch (action) {
    case 'in_num':
      await ctx.reply('Send Indian mobile number (10 digits):');
      break;
    case 'pk_num':
      await ctx.reply('Send Pakistan mobile number (11 digits starting with 03):');
      break;
    case 'pk_cnic':
      await ctx.reply('Send CNIC (13 digits without dashes):');
      break;
    case 'vehicle':
      await ctx.reply('Vehicle Info lookup is not available in this demo.');
      userState.delete(ctx.chat.id);
      await ctx.reply('Back to menu', mainReplyKeyboard);
      break;
    case 'pincode':
      await ctx.reply('Pincode lookup is not available in this demo.');
      userState.delete(ctx.chat.id);
      await ctx.reply('Back to menu', mainReplyKeyboard);
      break;
    case 'ifsc':
      await ctx.reply('IFSC lookup is not available in this demo.');
      userState.delete(ctx.chat.id);
      await ctx.reply('Back to menu', mainReplyKeyboard);
      break;
    case 'ip':
      await ctx.reply('Send an IP address:');
      break;
    case 'domain':
      await ctx.reply('Send a domain (e.g. example.com):');
      break;
    case 'github':
      await ctx.reply('Send a GitHub username:');
      break;
    case 'tg_user':
      await ctx.reply('TG User To Number is not available in this demo.');
      userState.delete(ctx.chat.id);
      await ctx.reply('Back to menu', mainReplyKeyboard);
      break;
  }
}

// ─── TEXT HANDLER ─────────────────────────────────────────────
bot.on('text', async (ctx) => {
  const state = userState.get(ctx.chat.id);
  if (!state) {
    return ctx.reply('Use the keyboard buttons below.', mainReplyKeyboard);
  }

  const text = ctx.message.text.trim();
  const action = state.action;
  userState.delete(ctx.chat.id);

  if (action === 'in_num') {
    await ctx.reply(validateIndianNumber(text));
  } else if (action === 'pk_num') {
    await ctx.reply(validatePakistanNumber(text));
  } else if (action === 'pk_cnic') {
    await ctx.reply(validateCNIC(text));
  } else if (action === 'ip') {
    try {
      const res = await axios.get(`http://ip-api.com/json/${text}`, { timeout: 10000 });
      const d = res.data;
      if (d.status === 'success') {
        await ctx.reply(
          `IP: ${text}\n` +
          `Country: ${d.country}\n` +
          `Region: ${d.regionName}\n` +
          `City: ${d.city}\n` +
          `ISP: ${d.isp}\n` +
          `Org: ${d.org}`
        );
      } else {
        await ctx.reply('❌ Could not fetch IP info.');
      }
    } catch (e) {
      await ctx.reply('❌ Error fetching IP info.');
    }
  } else if (action === 'domain') {
    try {
      const ips = await dns.resolve4(text.toLowerCase());
      await ctx.reply(`Domain: ${text} → ${ips.join(', ')}`);
    } catch (e) {
      await ctx.reply(`❌ Could not resolve ${text}.`);
    }
  } else if (action === 'github') {
    try {
      const res = await axios.get(`https://api.github.com/users/${text}`, { timeout: 10000 });
      const d = res.data;
      await ctx.reply(
        `GitHub: ${text}\n` +
        `Name: ${d.name || 'N/A'}\n` +
        `Bio: ${d.bio || 'N/A'}\n` +
        `Repos: ${d.public_repos}\n` +
        `Followers: ${d.followers}\n` +
        `Following: ${d.following}\n` +
        `Location: ${d.location || 'N/A'}\n` +
        `Joined: ${d.created_at}`
      );
    } catch (e) {
      await ctx.reply('❌ User not found or error.');
    }
  }

  await ctx.reply('Back to menu', mainReplyKeyboard);
});

// ─── BOT ACTIONS ─────────────────────────────────────────────
bot.action('in_num', (ctx) => handleAction(ctx, 'in_num'));
bot.action('pk_num', (ctx) => handleAction(ctx, 'pk_num'));
bot.action('pk_cnic', (ctx) => handleAction(ctx, 'pk_cnic'));
bot.action('vehicle', (ctx) => handleAction(ctx, 'vehicle'));
bot.action('pincode', (ctx) => handleAction(ctx, 'pincode'));
bot.action('ifsc', (ctx) => handleAction(ctx, 'ifsc'));
bot.action('ip', (ctx) => handleAction(ctx, 'ip'));
bot.action('domain', (ctx) => handleAction(ctx, 'domain'));
bot.action('github', (ctx) => handleAction(ctx, 'github'));
bot.action('tg_user', (ctx) => handleAction(ctx, 'tg_user'));

// ─── BOT HEARS (Reply Keyboard) ──────────────────────────────
bot.hears('Indian Number', (ctx) => handleAction(ctx, 'in_num'));
bot.hears('Pakistan Number', (ctx) => handleAction(ctx, 'pk_num'));
bot.hears('Pakistan CNIC', (ctx) => handleAction(ctx, 'pk_cnic'));
bot.hears('Vehicle Info', (ctx) => handleAction(ctx, 'vehicle'));
bot.hears('Pincode', (ctx) => handleAction(ctx, 'pincode'));
bot.hears('IFSC Code', (ctx) => handleAction(ctx, 'ifsc'));
bot.hears('IP Address', (ctx) => handleAction(ctx, 'ip'));
bot.hears('Domain Check', (ctx) => handleAction(ctx, 'domain'));
bot.hears('GitHub Info', (ctx) => handleAction(ctx, 'github'));
bot.hears('TG User To Number', (ctx) => handleAction(ctx, 'tg_user'));
bot.hears('Owner', async (ctx) => {
  await ctx.reply(`Owner: @famous_haseeb1\nID: ${OWNER_ID}`);
});

// ─── LAUNCH ───────────────────────────────────────────────────
bot.launch()
  .then(() => console.log('🚀 HASEEB Info Bot is running...'))
  .catch((err) => console.error('Launch error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
