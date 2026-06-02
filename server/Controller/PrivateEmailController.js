const { Email, Letter } = require('../models/models.js');
const { Sequelize } = require('../db.js'); // Переконайся, що шлях до екземпляру sequelize правильний

class PrivateEmailController {
  static create = async (req, res) => {
    try {
      const { customName } = req.body;
      
      if (!customName) {
        return res.status(400).json({ success: false, message: 'Вкажіть назву адреси' });
      }

      const validNameRegex = /^[a-zA-Z0-9.-]+$/;
      if (!validNameRegex.test(customName)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Назва адреси може містити лише латинські літери, цифри, дефіси та крапки' 
        });
      }

      const fullEmail = `${customName.toLowerCase()}@mail-tmp.xyz`;

      const existing = await Email.findOne({ where: { email: fullEmail } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Ця поштова адреса вже зайнята' });
      }

      const newEmail = await Email.create({
        email: fullEmail,
        userId: req.user.id, 
        type: 'reusable',
        timeDelete: null,
        accessKey: 'userLogin'
      });

      return res.status(201).json({ success: true, data: newEmail });
    } catch (err) {
      console.error(`❌ [PrivateEmailController.create ERROR]: ${err.stack || err.message}`);
      return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера при створенні адреси' });
    }
  }

  static getAll = async (req, res) => {
    try {
      const emails = await Email.findAll({
        where: { userId: req.user.id },
        attributes: {
          include: [
            [
              Sequelize.fn('COUNT', Sequelize.col('Letters.id')), 
              'lettersCount'
            ]
          ]
        },
        include: [{
          model: Letter,
          attributes: [] 
        }],
        group: ['Email.id']
      });

      return res.status(200).json({ success: true, data: emails });
    } catch (err) {
      console.error(`❌ [PrivateEmailController.getAll ERROR]: ${err.stack || err.message}`);
      return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера при отриманні списку адрес' });
    }
  }

  static delete = async (req, res) => {
    try {
      const { id } = req.params;

      const deletedRows = await Email.destroy({ 
        where: { 
          id: id, 
          userId: req.user.id 
        } 
      });

      if (deletedRows === 0) {
        return res.status(404).json({ success: false, message: 'Адресу не знайдено або доступ заборонено' });
      }

      return res.status(200).json({ success: true, message: 'Адресу та всі пов’язані листи успішно видалено' });
    } catch (err) {
      console.error(`❌ [PrivateEmailController.delete ERROR]: ${err.stack || err.message}`);
      return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера при видаленні адреси' });
    }
  }

  static getMyLetters = async (req, res, next) => {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Параметр email є обов\'язковим' });
      }

      const targetEmailRecord = await Email.findOne({
        where: {
          email: email.toLowerCase(),
          userId: req.user.id 
        }
      });

      if (!targetEmailRecord) {
        return res.status(403).json({ 
          success: false, 
          message: 'Доступ заборонено: поштова адреса не знайдена або не належить вашому акаунту' 
        });
      }

      const letters = await Letter.findAll({
        where: { emailId: targetEmailRecord.id },
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: letters
      });

    } catch (err) {
      console.error(`❌ [PrivateEmailController.getMyLetters ERROR]: ${err.stack || err.message}`);
      return res.status(500).json({ success: false, message: 'Внутрішня помилка сервера при отриманні листів' });
    }
  }
}

module.exports = PrivateEmailController;