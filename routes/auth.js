/*

КОД ПРЕДПОЛАГАЛ ИСПОЛЬЗОВАНИЯ ТОКЕНА ДЛЯ ОТПРАВКИ/ПРИЕМА ЗАПРОСОВ

*/

const jwt = require('jsonwebtoken');

// Middleware для проверки авторизации
const verifyToken = (req, res, next) => {
  // Получаем токен из заголовков
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Токен не предоставлен' });
  }

  // Проверка и декодирование токена
  jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Неверный токен' });
    }
    
    // Сохраняем данные о пользователе в объекте запроса
    req.user = decoded;
    next();
  });
};

// Экспортируем middleware
module.exports = { verifyToken };
