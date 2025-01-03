let currentPage = 1; // Текущая страница
const usersPerPage = 5; // Количество пользователей на одной странице
let allUsers = []; // Все пользователи


async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        allUsers = await response.json();  // Сохраняем пользователей в массив
        displayUsers(); // Отображаем первую страницу
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// Отображение пользователей на текущей странице
function displayUsers() {
    const container = document.querySelector('#users-container');
    container.innerHTML = ''; // Очищаем контейнер

    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToDisplay = allUsers.slice(startIndex, endIndex);

    usersToDisplay.forEach(user => {
        const formattedDate = user.Birthdate
            ? new Date(user.Birthdate).toISOString().split('T')[0]
            : 'Не указана';
        const phoneText = user.Phone || 'Не указан';

        const card = document.createElement('div');
        card.classList.add('col-md-4', 'mb-4');
        card.innerHTML = `
            <div class="card user-card" data-toggle="modal" data-target="#userModal" data-user='${JSON.stringify(user).replace(/'/g, "&quot;")}'>
                <div class="card-body">
                    <h5 class="card-title">${user.First_name} ${user.Second_name}</h5>
                    <p class="card-text">
                        <strong>Логин:</strong> ${user.Login}<br>
                        <strong>Телефон:</strong> ${phoneText}<br>
                    </p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    $('#userModal').on('show.bs.modal', function (event) {
        const button = $(event.relatedTarget);
        const user = button.data('user');
    
        const formattedDate = user.Birthdate
            ? new Date(user.Birthdate).toISOString().split('T')[0]
            : 'Не указана';
        const phoneText = user.Phone || 'Не указан';
    
        const modal = $(this);
        modal.find('.modal-body').html(`
            <p><strong>ID:</strong> ${user.PK_User}</p>
            <p><strong>Имя:</strong> ${user.First_name}</p>
            <p><strong>Фамилия:</strong> ${user.Second_name}</p>
            <p><strong>Логин:</strong> ${user.Login}</p>
            <p><strong>Телефон:</strong> ${phoneText}</p>
            <p><strong>Дата рождения:</strong> ${formattedDate}</p>
        `);
        modal.find('#delete-user-btn').data('login', user.Login);
    });

    updatePaginationButtons();
}

function updatePaginationButtons() {
    const paginationContainer = document.querySelector('#pagination-container');
    paginationContainer.innerHTML = ''; 

    const totalPages = Math.ceil(allUsers.length / usersPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('btn', 'btn-primary', 'mr-2', 'pagination-btn');
        if (i === currentPage) button.classList.add('active');

        button.addEventListener('click', () => {
            currentPage = i;
            displayUsers();
        });

        paginationContainer.appendChild(button);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('filter-name');
    const surnameInput = document.getElementById('filter-surname');
    const loginInput = document.getElementById('filter-login');
    const phoneInput = document.getElementById('filter-phone');

    if (nameInput) nameInput.addEventListener('input', filterUsers);
    if (surnameInput) surnameInput.addEventListener('input', filterUsers);
    if (loginInput) loginInput.addEventListener('input', filterUsers);
    if (phoneInput) phoneInput.addEventListener('input', filterUsers);

    loadUsers();
});


async function filterUsers() {
    const nameFilter = document.getElementById('filter-name').value.toLowerCase();
    const surnameFilter = document.getElementById('filter-surname').value.toLowerCase();
    const loginFilter = document.getElementById('filter-login').value.toLowerCase();
    const phoneFilter = document.getElementById('filter-phone').value.toLowerCase();

    const users = await fetch('/api/users');
    const data = await users.json();

    // Функция очистки номера телефона от лишних символов
    function cleanPhone(phone) {
        return phone ? phone.replace(/\D/g, '') : ''; 
    }
    

    const filteredUsers = data.filter(user => { 
        let matchesDob = true;

        // Проверка на соответствие каждому полю фильтра
        return (nameFilter === '' || user.First_name.toLowerCase().includes(nameFilter)) &&
               (surnameFilter === '' || user.Second_name.toLowerCase().includes(surnameFilter)) &&
               (loginFilter === '' || user.Login.toLowerCase().includes(loginFilter)) &&
               (phoneFilter === '' || cleanPhone(user.Phone).includes(cleanPhone(phoneFilter))) &&
               matchesDob; 
    });

    // Отображаем отфильтрованные пользователи
    const container = document.querySelector('#users-container');
    container.innerHTML = ''; // Очищаем контейнер

    filteredUsers.forEach(user => {
        const card = document.createElement('div');
        card.classList.add('col-md-4', 'mb-4');
        card.innerHTML = `
            <div class="card user-card" data-toggle="modal" data-target="#userModal" data-user='${JSON.stringify(user)}'>
                <div class="card-body">
                    <h5 class="card-title">${user.First_name} ${user.Second_name}</h5>
                    <p class="card-text">
                        <strong>Логин:</strong> ${user.Login}<br>
                        <strong>Телефон:</strong> ${user.Phone}
                    </p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Обработчик для кнопки сброса
document.getElementById('reset-btn').addEventListener('click', () => {
    // Сбрасываем все фильтры
    document.getElementById('filter-name').value = '';
    document.getElementById('filter-surname').value = '';
    document.getElementById('filter-login').value = '';
    document.getElementById('filter-phone').value = '';
    
    // Загружаем всех пользователей
    loadUsers();
});

// Загружаем пользователей при загрузке страницы
window.onload = loadUsers;

document.getElementById("save-user-btn").addEventListener("click", async () => {
    // Получаем данные из формы
    const name = document.getElementById("user-name").value;
    const surname = document.getElementById("user-surname").value;
    const gender = document.getElementById("user-gender").value;
    const login = document.getElementById("user-login").value;
    const password = document.getElementById("user-password").value;
    const phone = document.getElementById("user-phone").value;
    const dob = document.getElementById("user-dob").value;

    // Пакуем данные в объект
    const userData = {
        name,
        surname,
        gender,
        login,
        password,
        phone,
        dob
    };

    try {
        const response = await fetch('http://localhost:3000/add_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error('Ошибка при добавлении пользователя');
        }
        else{
            alert("Пользователь успешно добавлен!");
        }

        const data = await response.json();
        console.log('Пользователь добавлен:', data);
    } catch (error) {
        console.error('Ошибка:', error);
    }
});


document.getElementById('delete-user-btn').addEventListener('click', async () => {
    const userData = $('#delete-user-btn').data('login');  // Получаем логин из кнопки

    if (!userData) {
        console.log('Логин не найден');
        return;
    }

    fetch('http://localhost:3000/delete_user', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ login: userData })  // Отправляем логин как JSON
    })
    .then(response => response.json())
    .then(data => {
        console.log('Пользователь удален:', data);
        // Дополнительная логика для обновления UI
    })
    .catch(error => {
        console.error('Ошибка:', error);
    });
    
    /*try {
        const response = await fetch(`http://localhost:3000/delete_user`, {
            method: 'DELETE',
            
            body: JSON.stringify(login),
        });

        const data = await response.json();

        if (data.success) {
            alert('Пользователь удален');
            $('#userModal').modal('hide');  // Закрываем модальное окно

            // Обновляем список пользователей
            loadUsers();  // Перезагружаем список пользователей
        } else {
            alert('Ошибка удаления пользователя');
        }
    } catch (err) {
        console.error('Ошибка:', err);
        alert('Ошибка при удалении пользователя');
    }*/
});