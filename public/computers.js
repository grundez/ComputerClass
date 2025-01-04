async function loadComputers() {
    try {
        // Загружаем данные о компьютерах
        const response = await fetch('/api/computers');
        const data = await response.json(); // Получаем данные о компьютерах

        // Загружаем статусы компьютеров
        const statuses = await fetch('/api/status');
        const statusData = await statuses.json(); // Получаем статусы из таблицы PC_Status

        // Загружаем связь между компьютерами и ПО
        const softwareLinkResponse = await fetch('/api/computer_software');
        const softwareLinkData = await softwareLinkResponse.json(); // Получаем связи между компьютерами и ПО

        // Загружаем список ПО
        const softwareResponse = await fetch('/api/software');
        const softwareData = await softwareResponse.json(); // Получаем данные о ПО

        const container = document.querySelector('#computers-container');

        // Процесс отображения данных о компьютерах
        data.forEach(computer => {
            const card = document.createElement('div');
            card.classList.add('col-md-4', 'mb-4');

            // Найдем соответствующий статус для каждого компьютера по PK_Computer
            const matchingStatus = statusData.find(status => status.PK_State === computer.PK_State);
            const statusText = matchingStatus ? matchingStatus.State : 'Неизвестен';

            // Определяем класс для статуса и иконки
            let statusClass = '';
            let statusIndicatorClass = '';
            let statusColorClass = '';
            let repairIcon = '';

            if (statusText === 'Работает') {
                statusClass = 'status-online';
                statusIndicatorClass = 'online';
                statusColorClass = 'status-online';
            } else if (statusText === 'Выключен') {
                statusClass = 'status-offline';
                statusIndicatorClass = 'offline';
                statusColorClass = 'status-offline';
            } else if (statusText === 'В ремонте') {
                statusClass = 'status-repairing';
                statusColorClass = 'repairing';
                statusIndicatorClass = 'status-repairing'; // Можно добавить иконку для "В ремонте"
                repairIcon = '<i class="fas fa-tools repair-icon"></i>';
            }

            card.innerHTML = `
                <div class="card computer-card" data-toggle="modal" data-target="#computerModal" data-computer='${JSON.stringify(computer)}'>
                    <div class="card-body">
                        <h5 class="card-title">${computer.Domain_name}</h5>
                        <p class="card-text">
                            <span class="status-indicator ${statusIndicatorClass}"></span>
                            <span class="${statusColorClass}">${statusText}</span>
                            ${repairIcon}
                        </p>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Обработчик для кнопки "Посмотреть логи"
        $('#viewLogsButton').on('click', async function () {
            const computerId = $('#computer-id').text(); // Получаем ID компьютера из модального окна

            // Загружаем логи для этого компьютера
            const logs = await fetchLogs(computerId);
            
            // Преобразуем логи в строки таблицы
            const logsList = logs.map(log => `
                <tr>
                    <td>${log.Action_date}</td>
                    <td>${log.Action_time}</td>
                    <td>${log.IP_address}</td>
                    <td>${log.Action}</td>
                </tr>
            `).join('');

            // Открываем модальное окно с логами
            $('#logsModal').modal('show');
            
            // Добавляем данные о логах в модальное окно
            $('#logsModal').find('#logs-list').html(logsList);
        });

        // Функция для получения логов с сервера
        async function fetchLogs(computerId) {
            try {
                const response = await fetch(`/api/computers/${computerId}/logs`);
                if (!response.ok) {
                    throw new Error('Не удалось получить логи');
                }
                const logs = await response.json();
                return logs;
            } catch (error) {
                console.error('Ошибка при получении логов:', error);
                return []; // Возвращаем пустой массив в случае ошибки
            }
        }


        // Обработчик для модального окна с информацией о ПО
        $('#computerModal').on('show.bs.modal', async function (event) {
            const button = $(event.relatedTarget); // Кнопка, которая открывает модальное окно
            const computer = button.data('computer'); // Данные о компьютере
            
            // Загружаем установленное ПО
            await updateSoftwareList(computer.PK_Computer);

            const modal = $(this);
            modal.find('#computer-id').text(computer.PK_Computer);
            modal.find('#computer-name').text(computer.Domain_name);
            modal.find('#mac-address').text(computer.MAC_address);
            modal.find('#motherboard').text(computer.Motherboard);
            modal.find('#gpu').text(computer.GPU);
        });
        

    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// Загружаем компьютеры при загрузке страницы
window.onload = loadComputers;

// Функция для загрузки списка ПО с сервера
async function loadSoftware() {
    try {
        const response = await fetch('/api/software');
        const softwareData = await response.json();  // Получаем список ПО

        const selectSoftwareElement = document.getElementById('softwareSelect');
        selectSoftwareElement.innerHTML = '<option value="">Выберите ПО</option>'; // Очистить и добавить первую опцию

        softwareData.forEach(software => {
            const option = document.createElement('option');
            option.value = software.PK_Software;
            option.textContent = software.Name;
            selectSoftwareElement.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка при загрузке ПО:', error);
    }
}

// Загружаем ПО при открытии страницы
window.onload = function() {
    loadComputers();
    loadSoftware();
};


async function updateSoftwareList(computerId) {
    try {
        const response = await fetch(`/api/computers/${computerId}/software`);

        // Если сервер возвращает 404, обрабатываем как частный случай
        if (response.status === 404) {
            const softwareListElement = document.getElementById('software-list');
            softwareListElement.innerHTML = '<li>ПО для этого компьютера не установлено</li>';
            return; // Прерываем выполнение функции
        }

        if (!response.ok) {
            throw new Error(`Ошибка сети: ${response.statusText}`);
        }
        const softwareData = await response.json();

        const softwareListElement = document.getElementById('software-list');
        softwareListElement.innerHTML = ''; // Очищаем содержимое списка

        if (!softwareData || softwareData.length === 0) {
            softwareListElement.innerHTML = '<li>Нет установленного ПО</li>';
            return;
        }

        softwareData.forEach(software => {
            const listItem = document.createElement('li');
            listItem.textContent = `${software.Name} (версия: ${software.Actual_version})`;
            softwareListElement.appendChild(listItem);
        });

        console.log('Список ПО успешно обновлен:', softwareData);

    } catch (error) {
        console.error('Ошибка при обновлении списка ПО:', error);
        alert(`Ошибка: ${error.message}`);
    }
}










document.getElementById('installSoftwareButton').addEventListener('click', async function () {
    const computerId = document.getElementById('computer-id').textContent;
    const softwareId = document.getElementById('softwareSelect').value;
    if (!softwareId) {
        alert('Выберите ПО для установки!');
        return;
    }

    try {
        const response = await fetch('/api/install-software', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                PK_Computer: computerId,
                PK_Software: softwareId,
                Actual_version: '1.0',
                Download_date: new Date().toISOString(),
            }),
        });
        const responseBody = await response.text(); // Получите тело ответа
        
        if (response.ok) {
            showNotification('ПО успешно установлено!', 'success');
            await updateSoftwareList(computerId); // Обновляем список ПО
        } else {
            const errorMessage = await response.text();
            showNotification(`Ошибка установки ПО: ${errorMessage}`, 'danger');
        }
    } catch (error) {
        console.error('Ошибка при установке ПО:', error);
        showNotification('Ошибка установки ПО', 'danger');
    }
    
});


document.getElementById('removeSoftwareButton').addEventListener('click', async function () {
    const computerId = document.getElementById('computer-id').textContent;
    const softwareId = document.getElementById('softwareSelect').value;

    if (!softwareId) {
        alert('Выберите ПО для удаления');
        return;
    }

    try {
        const response = await fetch('/api/remove-software', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ PK_Computer: computerId, PK_Software: softwareId }),
        });

        if (response.ok) {
            showNotification('ПО успешно удалено!', 'success');
            await updateSoftwareList(computerId); // Обновляем список ПО
        } else {
            const errorMessage = await response.text();
            showNotification(`Ошибка удаления ПО: ${errorMessage}`, 'danger');
        }
    } catch (error) {
        console.error('Ошибка при удалении ПО:', error);
        showNotification('Ошибка удаления ПО', 'danger');
    }
});





function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
    const notification = document.createElement('div');

    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    notificationContainer.appendChild(notification);

    // Автоматическое скрытие уведомления через 5 секунд
    setTimeout(() => {
        if (notificationContainer.contains(notification)) {
            notification.remove();
        }
    }, 5000);
}

function createNotificationContainer() {
    const existingContainer = document.getElementById('notification-container');
    if (existingContainer) return existingContainer;

    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1050';
    document.body.appendChild(container);
    return container;
}


