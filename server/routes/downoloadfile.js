const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { Attachment, Letter, Email } = require('../models/models.js');

// безпечнe скачування вкладень
router.get('/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const { accessKey } = req.query; // Отримуємо ключ сесії з query-параметрів (?accessKey=...)

    if (!accessKey) {
      return res.status(400).json({ success: false, message: "Відсутній accessKey сесії" });
    }

    // 1. Шукаємо файл у базі даних та підтягуємо всю логіку зв'язків
    const attachment = await Attachment.findOne({
      where: { id: attachmentId },
      include: [{
        model: Letter,
        include: [{ model: Email }]
      }]
    });

    if (!attachment) {
      return res.status(404).json({ success: false, message: "Файл не знайдено в базі даних" });
    }

    // Перевіряємо, чи цей файл належить саме тій пошті, яку читає користувач
    const fileOwnerKey = attachment.Letter?.Email?.accessKey;
    if (fileOwnerKey !== accessKey) {
      return res.status(403).json({ success: false, message: "Доступ заборонено: невірний accessKey сесії" });
    }

    // 3. Формуємо повний шлях до файлу в закритій папці uploads
    const fullFilePath = path.join(__dirname, '../uploads', attachment.filePath);

    // Перевіряємо, чи фізично файл є на диску
    if (!fs.existsSync(fullFilePath)) {
      return res.status(404).json({ success: false, message: "Файл фізично відсутній на сервері" });
    }

    // 4. Віддаємо файл користувачу з його оригінальним ім'ям (яке було в листі)
    // Метод res.download автоматично виставить потрібні заголовки Content-Disposition
    return res.download(fullFilePath, attachment.fileName);

  } catch (error) {
    console.error('Помилка скачування файлу:', error);
    return res.status(500).json({ success: false, message: "Внутрішня помилка сервера при завантаженні" });
  }
});

module.exports = router;