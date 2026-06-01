const { Sequelize } = require('../db.js');
const { Email } = require('../models/models.js');

class TempEmail {
  static Create = async (req, res, next) => {
    try {
      const { accessKey } = req.body;

      if (!accessKey) {
        return res.status(400).json({
          success: false,
          message: "Параметр accessKey є обов'язковим"
        });
      }

      const domain = '@mail-tmp.xyz';
      let uniqueEmail = '';
      let isOccupied = true;

      // Цикл для залізобетонної перевірки унікальності імейлу в базі даних
      while (isOccupied) {
        // Генеруємо випадковий рядок з 8 символів 
        const randomString = Math.random().toString(36).substring(2, 10);
        uniqueEmail = `${randomString}${domain}`;

        // Перевіряємо, чи немає такого імейлу базі
        const existingEmail = await Email.findOne({ where: { email: uniqueEmail } });
        if (!existingEmail) {
          isOccupied = false;
        }
      }

      // Розраховуємо час видалення: поточний момент + 5 хвилин
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 5);

      // Створюємо запис у таблиці Email
      const newEmailRecord = await Email.create({
        email: uniqueEmail,
        accessKey: accessKey,
        type: 'disposable',
        timeDelete: expirationTime,
        userId: null, // Для анонімної тимчасової пошти юзер не потрібен
        isForwardingEnabled: false,
        note: 'Автоматично згенерована тимчасова скринька'
      });

      // Повертаємо створену пошту та час її експірації на фронтенд
      return res.status(201).json({
        success: true,
        email: newEmailRecord.email,
        timeDelete: newEmailRecord.timeDelete,
        type: newEmailRecord.type
      });

    } catch (err) {
      console.error('Помилка створення тимчасової пошти:', err);
      return res.status(500).json({
        success: false,
        message: `Помилка створення тимчасової пошти: ${err.message}`
      });
    }
  }
  static GetLetters=async(req,res,next)=>{
    try{
        const {accessKey}=req.query;
        const result=await Email.findAll({where:{accessKey}});
        return res.json({data:result});
    }catch(err){
        console.log("Помилка отримання листів", err);
        return res.status(500).json({
            success: false,
            message: `Помилка отримання листів: ${err.message}`
        });
    }
  }
}

module.exports = TempEmail;