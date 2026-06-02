const { Email, Letter } = require('../models/models.js');

class PrivateEmailController {
  static create = async (req, res) => {
    try {
      const { customName } = req.body;
      if (!customName) return res.status(400).json({ success: false, message: 'Вкажіть назву адреси' });

      const fullEmail = `${customName.toLowerCase()}@mail-tmp.xyz`;

      // Перевірка на унікальність
      const existing = await Email.findOne({ where: { email: fullEmail } });
      if (existing) return res.status(409).json({ success: false, message: 'Ця адреса вже зайнята' });

      const newEmail = await Email.create({
        email: fullEmail,
        userId: req.user.id, 
        type: 'custom',
        timeDelete: null
      });

      return res.status(201).json({ success: true, data: newEmail });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static getAll = async (req, res) => {
    try {
      const emails = await Email.findAll({ where: { userId: req.user.id } });
      return res.status(200).json({ success: true, data: emails });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static delete = async (req, res) => {
    try {
      const { id } = req.params;
      await Email.destroy({ where: { id, userId: req.user.id } });
      return res.status(200).json({ success: true, message: 'Адресу видалено' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = PrivateEmailController;