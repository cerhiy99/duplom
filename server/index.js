require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fileUpload = require('express-fileupload');

const sequelize = require('./db.js');
require('./models/models.js'); // Ініціалізація зв'язків моделей
const router = require('./routes/index.js');
const smtpServer = require('./smtp/server.js'); // Шлях до файлу твого SMTP-сервера, який ми розбирали

const app = express();
const PORT = process.env.PORT || 4444;

// --- НАЛАШТУВАННЯ БЕЗПЕКИ ТА ПРОКСІ ---
// Дозволяє Express коректно зчитувати реальні IP користувачів за Nginx-проксі
app.set('trust proxy', true); 

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(fileUpload({}));

app.use('/api', router); 

//повренення раніше проксійованих картинок.
app.use('/api/mail-images', express.static(path.join(__dirname, 'public')));

// --- МІДЛВАР ОБРОБКИ ПОМИЛОК (Кібербезпека) ---
// Захищає сервер від падіння та не зливає зловмисникам внутрішню структуру коду
app.use((err, req, res, next) => {
  console.error(`[SERVER ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Внутрішня помилка сервера безпеки' 
      : err.message
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