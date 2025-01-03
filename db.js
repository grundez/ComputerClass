const { Pool } = require('pg');

// Настройка подключения к базе данных PostgreSQL
const pool = new Pool({
  user: 'postgres',        // Ваш пользователь базы данных
  host: 'localhost',           // Хост базы данных
  database: 'postgres',    // Имя базы данных
  password: '12345',// Ваш пароль
  port: 5432,                  // Порт (по умолчанию для PostgreSQL — 5432)
});

// Функция для выполнения запросов к базе данных
const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
};
