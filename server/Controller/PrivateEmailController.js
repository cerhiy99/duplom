const { Email, Letter } = require('../models/models.js');

class PrivateEmailController {
  // 1. Створення постійної кастомної адреси
  static create = async (req, res) => {
    try {
      const { customName } = req.body;
      
      if (!customName) {
        return res.status(400).json({ success: false, message: 'Вкажіть назву адреси' });
      }

      // Валідація: дозволяємо тільки латинські літери, цифри, дефіси та крапки (кібербезпека)
      const validNameRegex = /^[a-zA-Z0-9.-]+$/;
      if (!validNameRegex.test(customName)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Назва адреси може містити лише латинські літери, цифри, дефіси та крапки' 
        });
      }

      const fullEmail = `${customName.toLowerCase()}@mail-tmp.xyz`;

      // Перевірка на унікальність аліасу в MariaDB
      const existing = await Email.findOne({ where: { email: fullEmail } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Ця поштова адреса вже зайнята' });
      }

      // Створення кастомної адреси без обмеження часу життя (timeDelete: null)
      const newEmail = await Email.create({
        email: fullEmail,
        userId: req.user.id, // Прив'язка до id з розкодованого JWT-токена через IsAuthMiddleware
        type: 'custom',
        timeDelete: null
      });

      return res.status(201).json({ success: true, data: newEmail });
    } catch (err) {
      console.error(`❌ [PrivateEmailController.create ERROR]: ${err.stack || err.message}`);
      return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера при створенні адреси' });
    }
  }

  // 2. Отримання списку адрес поточного користувача
  static getAll = async (req, res) => {
    try {
      const emails = await Email.findAll({ where: { userId: req.user.id } });
      return res.status(200).json({ success: true, data: emails });
    } catch (err) {
      console.error(`❌ [PrivateEmailController.getAll ERROR]: ${err.stack || err.message}`);
      return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера при отриманні списку адрес' });
    }
  }

  // 3. Деактивація та каскадне видалення адреси
  static delete = async (req, res) => {
    try {
      const { id } = req.params;

      // Видаляємо лише якщо аліас належить саме цьому користувачу (захист від атак типу IDOR)
      const deletedRows = await Email.destroy({ 
        where: { 
          id: id, 
          userId: req.user.id 
        } 
      });

      // Якщо жодного рядка не видалено, значить id не існує або він належить чужому юзеру
      if (deletedRows === 0) {
        return res.status(404).json({ success: false, message: 'Адресу не знайдено або доступ заборонено' });
      }

      return res.status(200).json({ success: true, message: 'Адресу та всі пов’язані листи успішно видалено' });
    } catch (err) {
      console.error(`❌ [PrivateEmailController.delete ERROR]: ${err.stack || err.message}`);
      return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера при видаленні адреси' });
    }
  }
}

module.exports = PrivateEmailController;