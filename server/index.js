require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const path = require('path');

const sequelize = require('./db.js');
require('./models/models.js'); // Ініціалізація зв'язків моделей
const router = require('./routes/index.js');
const smtpServer = require('./smtp/server.js');

const app = express();
const PORT = process.env.PORT || 4444;

// --- НАЛАШТУВАННЯ БЕЗПЕКИ ТА ПРОКСІ ---
app.set('trust proxy', true); 

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, 
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://mail-tmp.xyz", "http://localhost:3000"], 
    },
  },
}));

app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// КРИТИЧНО ВАЖЛИВО: читання JSON, який шле Axios/Fetch
app.use(express.json()); 
app.use(fileUpload({}));

// Роздача статичних картинок пошти з папки public
app.use('/api/mail-images', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path, stat) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Основний роутер для API
app.use('/api', router);

// --- МІДЛВАР ОБРОБКИ ПОМИЛОК (Кібербезпека) ---
app.use((err, req, res, next) => {
  // Цей лог залізобетонно виведе реальну причину 500 помилки в термінал VPS!
  console.error(`[SERVER ERROR] ${err.stack || err.message}`);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Внутрішня помилка сервера безпеки' 
      : err.message // В дев-режимі покаже помилку на фронтенді
  });
});

// --- ЗАПУСК СИСТЕМИ ---
const start = async () => {
  try {
    // 1. Авторизація та синхронізація з MariaDB
    await sequelize.authenticate();
    console.log('🛡️ Підключення до MariaDB встановлено успішно.');
    
    // В дев-режимі можна залишити звичайний sync(), для продакшену краще без alter/force
    await sequelize.sync(); 
    console.log('🛡️ Моделі бази даних успішно синхронізовані.');

    // 2. Запуск кастомного SMTP-сервера на порту 25
    smtpServer.listen(25, '0.0.0.0', () => {
      console.log('🛡️ Поштовий шлюз (MailShield SMTP) запущено на порту 25');
    });

    app.listen(PORT, () => {
      console.log('Сервер запущено на порту: ' + PORT);
    });

  } catch (error) {
    console.error('❌ Помилка під час запуску поштового комплексу:', error);
    process.exit(1);
  }
};

start();