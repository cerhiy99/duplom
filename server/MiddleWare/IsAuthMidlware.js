const jwt = require('jsonwebtoken');
const { Users } = require('../models/models.js'); // Шлях до твоїх моделей

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Доступ заборонено: відсутній токен авторизації'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Доступ заборонено: невірний формат токена'
      });
    }

    const secret = process.env.JWT_SECRET;
    let decodedPayload;
    
    try {
      decodedPayload = jwt.verify(token, secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Термін дії сесії закінчився. Будь ласка, увійдіть знову'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Невалідний токен доступу'
      });
    }

    const user = await Users.findByPk(decodedPayload.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Користувача, якому належить цей токен, більше не існує в системі'
      });
    }

    const passwordChangedAtSeconds = Math.floor(new Date(user.passwordUpdate).getTime() / 1000);
    
    if (decodedPayload.iat < passwordChangedAtSeconds) {
      return res.status(401).json({
        success: false,
        message: 'Пароль було змінено. Будь ласка, авторизуйтесь заново'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next(); 

  } catch (err) {
    console.error('⚠️ [Advanced Auth Middleware Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Внутрішня помилка сервера при валідації сесії'
    });
  }
};