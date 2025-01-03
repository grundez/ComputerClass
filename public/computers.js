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

        // Обработчик для модального окна
        $('#computerModal').on('show.bs.modal', function (event) {
            const button = $(event.relatedTarget); // Кнопка, которая открывает модальное окно
            const computer = button.data('computer'); // Данные о компьютере
        
            // Загружаем установленное ПО
            const softwareLinks = softwareLinkData.filter(link => link.PK_Computer === computer.PK_Computer);
            const installedSoftware = softwareLinks.map(link => {
                const software = softwareData.find(software => software.PK_Software === link.PK_Software);
                return software ? software.Name : null;
            }).filter(softwareName => softwareName !== null);
        
            const softwareList = installedSoftware.map(software => `<li>${software}</li>`).join('');
        
            const modal = $(this);
            modal.find('#computer-id').text(computer.PK_Computer);
            modal.find('#computer-name').text(computer.Domain_name);
            modal.find('#mac-address').text(computer.MAC_address);
            modal.find('#motherboard').text(computer.Motherboard);
            modal.find('#gpu').text(computer.GPU);
            modal.find('#software-list').html(softwareList);
        
            // Обработчик кнопки для установки ПО
            $('#installSoftwareButton').on('click', async function() {
                const softwareId = $('#softwareSelect').val();  // Получаем выбранное ПО
                const actualVersion = '1.0';  // Пример версии, можно добавить поле для ввода
                const downloadDate = new Date().toISOString();  // Дата установки

                if (softwareId) {
                    const data = {
                        PK_Computer: computer.PK_Computer,
                        PK_Software: softwareId,
                        Actual_version: actualVersion,
                        Download_date: downloadDate
                    };

                    // Логируем отправляемые данные
                    console.log('Отправляемые данные:', data);

                    try {
                        const response = await fetch('/api/install-software', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        });

                        // Проверяем ответ от сервера
                        const responseText = await response.text();
                        console.log('Ответ от сервера:', responseText);

                        if (response.ok) {
                            alert('ПО установлено успешно!');
                            // Закрыть модальное окно
                            $('#computerModal').modal('hide');
                            // Перезагрузить данные или обновить список ПО
                        } else {
                            //alert('Ошибка при установке ПО: ' + responseText);
                        }
                    } catch (error) {
                        //console.error('Ошибка при установке ПО:', error);
                        //alert('Ошибка при установке ПО');
                    }
                } else {
                    alert('Выберите ПО для установки');
                }
            });

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


// Функция для обновления списка ПО и добавления кнопки удаления
function updateSoftwareList(computerId, softwareList) {
    const softwareListElement = document.getElementById('software-list');
    softwareListElement.innerHTML = ''; // Очищаем список перед добавлением новых элементов

    softwareList.forEach(software => {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-computer-id', computerId);
        listItem.setAttribute('data-software-id', software.PK_Software);

        // Формируем содержимое элемента списка
        listItem.innerHTML = `
            ${software.name} (${software.version})
        `;

        // Добавляем элемент в список
        softwareListElement.appendChild(listItem);
    });
}

// Функция для установки ПО
document.getElementById('installSoftwareButton').addEventListener('click', function() {
    const computerId = document.getElementById('computer-id').textContent;
    const softwareId = document.getElementById('softwareSelect').value;
    
    if (softwareId) {
        installSoftware(computerId, softwareId);
    } else {
        alert('Выберите ПО для установки');
    }
});

// Функция для установки ПО
async function installSoftware(computerId, softwareId) {
    try {
        const response = await fetch('/api/install-software', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                PK_Computer: computerId,
                PK_Software: softwareId,
                Actual_version: '1.0', // Установите актуальную версию
                Download_date: new Date().toISOString(),
            }),
        });

        const result = await response.text();

        if (response.ok) {
            alert('ПО успешно установлено!');
        } else {
            alert('Ошибка: ' + result);
        }
    } catch (error) {
        console.error('Ошибка при установке ПО:', error);
        //alert('Ошибка при установке ПО');
    }
}