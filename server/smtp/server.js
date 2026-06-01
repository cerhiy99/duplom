const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const path = require('path');
const fs = require('fs');

// Імпортуємо моделі з твого файлу моделей (перевір правильність шляху до моделей)
const { Email, Letter, Attachment } = require('../models/models.js');

// Проста функція-санітайзер контенту для диплома (Кібербезпека)
function sanitizeEmailContent(htmlContent) {
  if (!htmlContent) return '';
  
  // 1. Вирізаємо приховані трекінгові пікселі (img з підозрілими src або прозорі 1x1)
  // Для диплома це демонстрація захисту від витоку IP-адреси
  let cleanHtml = htmlContent.replace(/<img[^>]*src=["']http[^"']*(track|pixel|open|log)[^"']*["'][^>]*>/gi, '');
  
  // 2. Жорстко вирізаємо будь-які теги <script>, щоб запобігти XSS-атакам усередині пошти
  cleanHtml = cleanHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  return cleanHtml;
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
        const safeHtml = sanitizeEmailContent(rawHtml);

        // Створюємо запис у таблиці 'Letter'
        const newLetter = await Letter.create({
          subject: parsed.subject || '(Без теми)',
          from: parsed.from?.text || 'Unknown Sender',
          message: safeHtml,
          emailId: session.emailId // Передаємо ID, який зберегли на етапі валідації
        });

        // Крок 3: Обробка вкладених файлів (Attachments), якщо вони є
        if (parsed.attachments && parsed.attachments.length > 0) {
          // Створюємо папку для завантажень, якщо її ще немає
          const uploadDir = path.join(__dirname, '../uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

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