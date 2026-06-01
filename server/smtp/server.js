const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');

// Імпортуємо моделі з твого файлу моделей (перевір правильність шляху до моделей)
const { Email, Letter, Attachment } = require('../models/models.js');

// функція-санітайзер контенту
async function sanitizeEmailContent(htmlContent) {
  if (!htmlContent) return '';

  // Завантажуємо HTML-контент у Cheerio для роботи з DOM
  const $ = cheerio.load(htmlContent);

  // 1. ПОВНЕ ВИЛУЧЕННЯ НЕБЕЗПЕЧНИХ ТЕГІВ (XSS та Embed-вразливості)
  // Вирізаємо скрипти, фрейми та об'єкти інтеграції стороннього контенту
  $('script, iframe, object, embed, applet, link[rel="import"]').remove();

  // 2. ОЧИЩЕННЯ ШКІДЛИВИХ АТРИБУТІВ (Захист від ін'єкцій у валідні теги)
  // Видаляємо inline-події (onclick, onerror, onload, onmouseover тощо) з абсолютно всіх тегів
  $('*').each((index, element) => {
    const attribs = element.attribs;
    for (const attr in attribs) {
      if (attr.startsWith('on')) {
        $(element).removeAttr(attr);
      }
    }
    // Видаляємо посилання з протоколом javascript: (наприклад, <a href="javascript:... ">)
    if (attribs.href && attribs.href.trim().toLowerCase().startsWith('javascript:')) {
      $(element).removeAttr('href');
    }
  });

  // 3. АНОНІМІЗАЦІЯ ТА ПРОКСІЮВАННЯ ЗОБРАЖЕНЬ (Захист від витоку IP через трекери)
  const images = $('img').toArray();
  
  for (const img of images) {
    const $img = $(img);
    const src = $img.attr('src');

    if (src && src.startsWith('http')) {
      // Перевіряємо за твоїм регулярним виразом, чи це не явний трекер
      if (/(track|pixel|open|log)/i.test(src)) {
        $img.remove(); // Якщо це піксель стеження — видаляємо його повністю
        continue;
      }

      try {
        // Скачуємо зображення
        const response = await axios.get(src, { 
          responseType: 'arraybuffer',
          timeout: 4000 // 4 секунди на скачування
        });

        // Визначаємо розширення файлу з контент-тайпу (або за замовчуванням png)
        const contentType = response.headers['content-type'] || 'image/png';
        const ext = contentType.split('/')[1] || 'png';

        // Генеруємо унікальну назву для картинки
        const imgName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        
        // Шлях для збереження в папку public твого Express-сервера, щоб роздавати статично
        const publicUploadDir = path.join(__dirname, '../public');
        

        // Записуємо картинку на диск
        fs.writeFileSync(path.join(publicUploadDir, imgName), response.data);

        // Замінюємо зовнішнє посилання (src) на наше локальне безпечне
        // Користувач завантажить її з нашого сервера, не розкриваючи свій IP стороннім ресурсам
        $img.attr('src', `https://mail-tmp.xyz/api/mail-images/${imgName}`);
        
        // На випадок, якщо там був прописаний onerror для атаки
        $img.attr('onerror', "this.style.display='none';");

      } catch (downloadError) {
        console.error(`[MailShield] Не вдалося завантажити картинку: ${src}`);
        // Якщо картинку не вдалося скачати (404 або таймаут), видаляємо бітий тег або ставимо заглушку
        $img.attr('src', 'https://mail-tmp.xyz/api/mail-images/default.png');
      }
    }
  }

  return $.html();
}

const server = new SMTPServer({
  logger: true,
  debug: true,
  secure: false, // Для порту 25 потік починається як plain text (інші сервери роблять STARTTLS автоматично)
  disabledCommands: ['AUTH'], // Нам не потрібна авторизація відправників, ми працюємо як відкритий шлюз на прийом
  size: 15 * 1024 * 1024, // Ліміт на розмір листа (наприклад, 15 МБ), захист від DoS-атак великими файлами

  // Крок 1: Перевірка одержувача (валідація аліасу на льоту)
  onRcptTo(address, session, callback) {
    const targetEmail = address.address.toLowerCase();

    // Шукаємо, чи є такий тимчасовий або постійний імейл у нашій базі даних 'duplom'
    Email.findOne({ where: { email: targetEmail } })
      .then(foundEmail => {
        if (!foundEmail) {
          // Якщо аліасу немає або час вийшов, відсікаємо з'єднання кодом 550 (User not found)
          return callback(new Error('Requested mail address does not exist or expired'));
        }
        
        // Зберігаємо ID пошти в сесію, щоб не робити повторний запит на етапі збереження тіла
        session.emailId = foundEmail.id;
        callback(); // Дозволяємо передачу листа далі
      })
      .catch(err => {
        console.error('SMTP RCPT TO Error:', err);
        callback(new Error('Internal database verification error'));
      });
  },

  // Крок 2: Обробка та збереження тіла листа, очищення контенту й робота з файлами
  onData(stream, session, callback) {
    simpleParser(stream, async (err, parsed) => {
      if (err) {
        console.error('MIME Parsing Error:', err);
        return callback(err);
      }

      try {
        // Отримуємо сирий текст або HTML листа
        const rawHtml = parsed.html || parsed.textAsHtml || parsed.text || '';
        
        // Запускаємо логіку очищення від трекерів та скриптів
        const safeHtml = await sanitizeEmailContent(rawHtml);

        // Створюємо запис у таблиці 'Letter'
        const newLetter = await Letter.create({
          subject: parsed.subject || '(Без теми)',
          from: parsed.from?.text || 'Unknown Sender',
          message: safeHtml,
          emailId: session.emailId // Передаємо ID, який зберегли на етапі валідації
        });

        // Крок 3: Обробка вкладених файлів (Attachments), якщо вони є
        if (parsed.attachments && parsed.attachments.length > 0) {
          const uploadDir = path.join(__dirname, '../uploads');
         

          for (const file of parsed.attachments) {
            // Генеруємо безпечне унікальне ім'я файлу на диску VPS для уникнення колізій
            const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${file.filename}`;
            const fullFilePath = path.join(uploadDir, uniqueFileName);

            // Записуємо буфер файлу на диск
            fs.writeFileSync(fullFilePath, file.content);

            // Фіксуємо метадані файлу в MariaDB через модель Attachment
            await Attachment.create({
              fileName: file.filename,
              filePath: uniqueFileName, // в базу пишемо відносний шлях або ім'я
              size: file.size,
              letterId: newLetter.id
            });
          }
        }

        console.log(`🛡️ [MailShield] Отримано та захищено лист від: ${parsed.from?.text} для emailId: ${session.emailId}`);
        callback(); // Повертаємо серверу статус успішного приймання (250 OK)
        
      } catch (dbError) {
        console.error('SMTP Save Error:', dbError);
        callback(new Error('Error saving incoming email to secure storage'));
      }
    });
  }
});

// Експортуємо об'єкт сервера, щоб його запустив Express у головному файлі index.js
module.exports = server;