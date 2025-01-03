const express = require('express');
const path = require('path'); // Модуль для работы с путями
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const db = require('./db'); // Подключение к базе данных

const app = express();
app.use(express.json());





////////////////////////////////////////////////////////////////////////
app.get('/api/users', (req, res) => {
    db.query('SELECT * FROM "User" INNER JOIN "Account" ON "User"."PK_User" = "Account"."PK_User"', (err, result) => {
        if (err) {
            console.error('Ошибка при запросе к базе данных:', err);
            res.status(500).send('Ошибка базы данных');
        } else {
            res.json(result.rows);  // Отправляем данные как JSON
        }
    });
});

app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Убедись, что Passport правильно настроен (сериализация/десериализация)
passport.serializeUser((user, done) => {
    done(null, user.id); // Пример: сохраняем только id пользователя
});

passport.deserializeUser((id, done) => {
    // Восстанавливаем пользователя из базы данных по его ID
    getUserById(id).then(user => done(null, user)).catch(done);
});
////////////////////////////////////////////////////////////////////

// Настроим парсинг JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настроим статическую папку для обслуживания файлов
app.use(express.static(path.join(__dirname, 'public')));

// Настроим статическую папку для отдачи клиентских файлов
app.use(express.static(path.join(__dirname, 'routes')));


// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html')); // Отправляем форму логина 
});

// Маршрут для отображения компьютеров (без защиты)
app.get('/computers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'computers.html'));  // Отправляем файл computers.html
});

// Отчеты
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html')); // Отправляем форму логина 
});

// Отчеты
app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html')); // Отправляем форму логина 
});

// Управление
app.get('/management', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'management.html')); // Отправляем форму логина 
});

// Управление
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html')); // Отправляем форму логина 
});

app.get('/api/computer-software/:PK_Computer', (req, res) => {
    const { PK_Computer } = req.params;

    const query = `
        SELECT * FROM "Computer_Software"
        WHERE "PK_Computer" = $1;
    `;

    db.query(query, [PK_Computer], (err, result) => {
        if (err) {
            console.error('Ошибка при получении данных:', err);
            return res.status(500).send('Ошибка базы данных');
        }

        res.status(200).json(result.rows);  // Отправляем актуальные данные
    });
});


app.get('/api/most_active_computer', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                "PK_Computer",
                SUM(EXTRACT(EPOCH FROM "Session_time") / 3600) AS "TotalSessionTime"  -- Преобразуем время в часы
            FROM 
                "Account_Computer"
            WHERE
                "Session_date" >= CURRENT_DATE - INTERVAL '7 days'  -- Берем только за последнюю неделю
            GROUP BY 
                "PK_Computer"
            ORDER BY 
                "TotalSessionTime" DESC
            LIMIT 1;
        `);
        res.json(result.rows);
        //console.log(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении данных о самом активном компьютере' });
    }
});


app.post('/api/install-software', (req, res) => {
    console.log('Запрос получен на /api/install-software');
    const { PK_Computer, PK_Software, Actual_version, Download_date } = req.body;
    console.log('Полученные данные:', req.body);

    const insertQuery = `
        INSERT INTO "Computer_Software" ("PK_Computer", "Actual_version", "Download_date", "PK_Software")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("PK_Computer", "PK_Software") DO NOTHING;
    `;

    db.query(insertQuery, [PK_Computer, Actual_version, Download_date, PK_Software], (err, result) => {
        if (err) {
            console.error('Ошибка при добавлении записи:', err);
            res.status(500).send('Ошибка базы данных');
        } else {
            if (result.rowCount === 0) {
                console.log('Запись уже существует');
                res.status(409).send('Запись уже существует');
            } else {
                console.log('Запись добавлена успешно');
                res.status(200).send('ПО установлено успешно');
            }
        }
    });

})

app.delete('/api/remove-software', (req, res) => {
    const { PK_Computer, PK_Software } = req.body;

    const query = `
        DELETE FROM "Computer_Software"
        WHERE "PK_Computer" = $1 AND "PK_Software" = $2;
    `;
    
    db.query(query, [PK_Computer, PK_Software], (err, result) => {  // Используем db.query
        if (err) {
            console.error('Ошибка при удалении ПО:', err);
            return res.status(500).send('Ошибка базы данных');
        }

        res.status(200).send('ПО удалено успешно');
    });
});

// Маршрут для получения списка ролей (без защиты)
app.get('/api/roles', (req, res) => {
    db.query('SELECT * FROM "Role"', (err, result) => {
        if (err) {
            console.error('Ошибка при запросе к базе данных:', err);
            res.status(500).send('Ошибка базы данных');
        } else {
            res.json(result.rows);  // Отправляем данные как JSON
        }
    });
});

// Маршрут для получения списка компьютеров (без защиты)
app.get('/api/computers', (req, res) => {
    db.query('SELECT * FROM "Computer" ORDER BY "PK_Computer" ASC', (err, result) => {
        if (err) {
            console.error('Ошибка при запросе к базе данных:', err);
            res.status(500).send('Ошибка базы данных');
        } else {
            res.json(result.rows);  // Отправляем данные как JSON
        }
    });
});


// Маршрут для получения статусов компьютеров
app.get('/api/status', (req, res) => {
    db.query('SELECT "PK_State", "State" FROM "PC_Status"', (err, result) => {
        if (err) {
            console.error('Ошибка при запросе к базе данных:', err);
            res.status(500).send('Ошибка базы данных');
        } else {
            res.json(result.rows);  // Отправляем данные как JSON
        }
    });
});


// Маршрут для получения статусов компьютеров
app.get('/api/software', (req, res) => {
    db.query('SELECT * FROM "Software"', (err, result) => {
        if (err) {
            console.error('Ошибка при запросе к базе данных:', err);
            res.status(500).send('Ошибка базы данных');
        } else {
            res.json(result.rows);  // Отправляем данные как JSON
        }
    });
});

// Маршрут для получения статусов компьютеров
app.get('/api/computer_software', (req, res) => {
    db.query('SELECT * FROM "Computer_Software"', (err, result) => {
        if (err) {
            console.error('Ошибка при запросе к базе данных:', err);
            res.status(500).send('Ошибка базы данных');
        } else {
            res.json(result.rows);  // Отправляем данные как JSON
        }
    });
});

  // Функция для регистрации пользователя
const registerUser = async (username, password, first_name, last_name, gender, dob, phone) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query('SELECT * FROM "Account" WHERE "Login" = $1', [username]);
    if (result.rows.length > 0) {
        throw new Error('Пользователь с таким логином уже существует');
    }

    const userResult = await db.query(
        'INSERT INTO "User" ("First_name", "Second_name", "Gender", "Birthdate", "Phone") VALUES ($1, $2, $3, $4, $5) RETURNING "PK_User"',
        [first_name, last_name, gender, dob, phone]
    );
    const PK_User = userResult.rows[0].PK_User;

    await db.query(
        'INSERT INTO "Account" ("Login", "Password", "PK_User") VALUES ($1, $2, $3)',
        [username, hashedPassword, PK_User]
    );
};

// Функция для входа пользователя
const loginUser = async (username, password) => {
  const result = await db.query('SELECT * FROM "Account" WHERE "Login" = $1', [username]);
  if (result.rows.length === 0) {
      throw new Error('Неверный логин или пароль');
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.Password);
  if (!isPasswordValid) {
      throw new Error('Неверный логин или пароль');
  }

  const userDetails = await db.query('SELECT * FROM "User" WHERE "PK_User" = $1', [user.PK_User]);

  return userDetails.rows[0]; // Возвращаем информацию о пользователе без токена
};

// Маршрут для регистрации
app.post('/register', async (req, res) => {
    const { username, password, first_name, last_name, gender, dob, phone, role } = req.body;

    try {
        await registerUser(username, password, first_name, last_name, gender, dob, phone);
        res.status(201).json({ message: 'Регистрация успешна' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await loginUser(username, password);
      req.session.user = user;
      res.json({ user }); // Просто возвращаем информацию о пользователе, без токена
  } catch (err) {
      console.error('Ошибка при входе:', err);
      res.status(401).json({ error: err.message });  // Возвращаем статус 401 (Unauthorized) для неверных данных
  }
});

// Маршрут для получения личного кабинета пользователя
app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

// Маршрут для получения данных о текущем пользователе и его активности
app.get('/api/account', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const userId = req.session.user.PK_User;  // Получаем ID пользователя из сессии

    try {
        // Получение данных пользователя
        const userResult = await db.query(
            `SELECT "First_name", "Second_name", 
                    CASE "Gender" 
                        WHEN 'М' THEN 'Мужской' 
                        WHEN 'Ж' THEN 'Женский' 
                        ELSE 'Не указан' 
                    END AS "Gender",
                    to_char("Birthdate", 'YYYY-MM-DD') AS "Birthdate",
                    COALESCE("Phone", 'Не указан') AS "Phone"
             FROM "User"
             WHERE "PK_User" = $1`,
            [userId]
        );

        // Получение активности пользователя
        const activityResult = await db.query(
            `SELECT ac."Session_time", c."Domain_name" 
             FROM "Account_Computer" ac 
             JOIN "Computer" c ON ac."PK_Computer" = c."PK_Computer"
             WHERE ac."PK_Account" = (
                 SELECT "PK_Account" FROM "Account" WHERE "PK_User" = $1
             )
             AND ac."Session_time" >= date_trunc('month', CURRENT_DATE) -- Начало текущего месяца
             ORDER BY ac."Session_time" ASC`,
            [userId]
        );

        // Получение роли пользователя
        const roleResult = await db.query(
            `SELECT r."Name" 
             FROM "Role" r
             JOIN "Account_Role" ar ON r."PK_Role" = ar."PK_Role"
             JOIN "Account" a ON a."PK_Account" = ar."PK_Account"
             WHERE a."PK_User" = $1`,
            [userId]
        );

        // Получение последних 5 логов пользователя
        const logsResult = await db.query(
            `SELECT "Action", "Action_date", "Action_time", "IP_address"
             FROM "Logs"
             WHERE "PK_Computer" IN (
                 SELECT "PK_Computer" FROM "Account_Computer" WHERE "PK_Account" = (
                     SELECT "PK_Account" FROM "Account" WHERE "PK_User" = $1
                 )
             )
             ORDER BY "Action_date" DESC, "Action_time" DESC
             LIMIT 5`,
            [userId]
        );

        res.json({
            user: userResult.rows[0],
            role: roleResult.rows[0].Name,
            activity: activityResult.rows,
            logs: logsResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка получения данных' });
    }
});

// Маршрут для генерации отчёта
app.post('/api/reports/:id/generate', async (req, res) => {
    const reportId = req.params.id;
    const newDate = new Date().toISOString().split('T')[0]; // Текущая дата
    // Логика генерации отчёта
    try {
        await db.query('UPDATE reports SET date = $1 WHERE id = $2', [newDate, reportId]);
        res.json({ date: newDate });
    } catch (err) {
        console.error('Ошибка генерации отчёта:', err);
        res.status(500).json({ error: 'Ошибка генерации отчёта' });
    }
});

/////////////////////////////////////////////////////////////////

app.get('/header.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'header.html'));
});

const requireAuth = (req, res, next) => {
    if (!req.session.user) {  // Если сессия не существует, пользователь не авторизован
        return res.redirect('/login.html');  // Перенаправляем на страницу входа
    }
    next();  
};

app.get('/account', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

app.get('/computers', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'computers.html'));
});

app.get('/report', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

app.get('/management', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

app.post('/login.html', passport.authenticate('local', {
    successRedirect: '/main',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/main', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка выхода' });
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка очистки сессии' });
            }
            res.clearCookie('connect.sid');  // Убедитесь, что удаляется cookie сессии
            res.redirect('/login.html');  // Перенаправляем на страницу логина
        });
    });
});

app.post('/add_user', async (req, res) => {
    const { name, surname, gender, login, password, phone, dob } = req.body;

    try {
        if (!name || !surname || !login || !phone || !dob || !gender || !password) {
            return res.status(400).json({ success: false, message: 'Все поля обязательны для заполнения.' });
        }

        // Начинаем транзакцию
        await db.query('BEGIN');

        // Вставка данных в таблицу User
        const userResult = await db.query(
            'INSERT INTO "User" ("First_name", "Second_name", "Gender", "Phone", "Birthdate") VALUES ($1, $2, $3, $4, $5) RETURNING "PK_User"',
            [name, surname, gender, phone, dob]
        );

        const userId = userResult.rows[0].PK_User; // Получаем id только что вставленного пользователя

        // Вставка данных в таблицу Account
        const accountResult = await db.query(
            'INSERT INTO "Account" ("Login", "Password", "PK_User") VALUES ($1, $2, $3)',
            [login, password, userId]
        );

        // Завершаем транзакцию
        await db.query('COMMIT');

        res.status(201).json({ message: 'Пользователь успешно добавлен' });
    } catch (error) {
        // В случае ошибки откатываем транзакцию
        await db.query('ROLLBACK');
        console.error('Ошибка при добавлении пользователя:', error);
        res.status(500).json({ success: false, message: 'Ошибка при добавлении пользователя.' });
    }
});

// Метод для удаления пользователя
app.delete('/delete_user', (req, res) => {
    const { login } = req.body;
    if (!login) {
        return res.status(400).json({ success: false, message: 'Логин не передан' });
    }

    // Транзакция для удаления аккаунта и пользователя
    const deleteQueryAccountRole = 'DELETE FROM "Account_Role" WHERE "PK_Account" = (SELECT "PK_Account" FROM "Account" WHERE "Login" = $1)';
    const deleteQueryAccount = 'DELETE FROM "Account" WHERE "Login" = $1 RETURNING "PK_User"';
    const deleteQueryUser = 'DELETE FROM "User" WHERE "PK_User" = $1';

    // Начало транзакции
    db.query('BEGIN')
        .then(() => {
            // Удаляем все записи в Account_Role, которые ссылаются на аккаунт
            return db.query(deleteQueryAccountRole, [login]);
        })
        .then(() => {
            // Затем удаляем аккаунт и получаем PK_User
            return db.query(deleteQueryAccount, [login]);
        })
        .then(result => {
            if (result.rowCount === 0) {
                throw new Error('Аккаунт не найден');
            }
            const pkUser = result.rows[0].PK_User;

            // Затем удаляем пользователя, связанного с аккаунтом
            return db.query(deleteQueryUser, [pkUser]);
        })
        .then(() => {
            // Завершаем транзакцию
            return db.query('COMMIT');
        })
        .then(() => {
            res.status(200).json({ success: true, message: 'Аккаунт и пользователь успешно удалены' });
        })
        .catch(err => {
            // В случае ошибки откатываем транзакцию
            db.query('ROLLBACK')
                .then(() => {
                    console.error('Ошибка при удалении аккаунта и пользователя:', err);
                    res.status(500).json({ success: false, message: 'Ошибка при удалении аккаунта и пользователя' });
                });
        });
});

////////////////////////////////////////////////////////////////////////
// Запуск сервера
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
