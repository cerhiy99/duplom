const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Users } = require('../models/models.js'); // Перевір правильність шляху до моделей

const generateJwtToken = (id, email) => {
  const secret = process.env.JWT_SECRET;
  
  return jwt.sign(
    { id, email },
    secret,
    { expiresIn: '24h' } 
  );
};

class UserController {
  static Register = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Будь ласка, вкажіть email та пароль'
        });
      }

      const candidate = await Users.findOne({ where: { email: email.toLowerCase() } });
      if (candidate) {
        return res.status(409).json({
          success: false,
          message: 'Користувач із такою електронною поштою вже зареєстрований'
        });
      }

      const hashPassword = await bcrypt.hash(password, 10);

      const newUser = await Users.create({
        email: email.toLowerCase(),
        password: hashPassword
      });

      const token = generateJwtToken(newUser.id, newUser.email);

      return res.status(201).json({
        success: true,
        message: 'Акаунт успішно створено',
        token
      });

    } catch (err) {
      console.error('❌ Помилка реєстрації:', err);
      return res.status(500).json({
        success: false,
        message: 'Внутрішня помилка сервера при реєстрації користувача'
      });
    }
  }

  static Login = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // 1. Перевірка наявності даних
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Будь ласка, вкажіть email та пароль'
        });
      }

      const user = await Users.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Невірний email або пароль'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Невірний email або пароль'
        });
      }

      const token = generateJwtToken(user.id, user.email);

      return res.status(200).json({
        success: true,
        message: 'Успішний вхід у систему захисту',
        token
      });

    } catch (err) {
      console.error('❌ Помилка авторизації:', err);
      return res.status(500).json({
        success: false,
        message: 'Внутрішня помилка сервера при спробі входу'
      });
    }
  }
}

module.exports = UserController;