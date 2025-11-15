# Интеграция Frontend с Backend

Этот документ описывает интеграцию fire-frontend с fire/backend.

## Что было сделано

1. **Создан API клиент** (`src/services/apiClient.ts`)
   - Поддержка JWT токенов через заголовок Authorization
   - Автоматическая обработка ошибок
   - Таймауты запросов
   - Сохранение токенов в AsyncStorage

2. **Создана конфигурация API** (`src/config/api.config.ts`)
   - Настройка базового URL для разных платформ
   - Определение всех эндпоинтов API

3. **Обновлены сервисы:**
   - `authService.ts` - аутентификация через API
   - `objectService.ts` - работа с объектами через API
   - `fireSafetyService.ts` - работа с огнетушителями через API

4. **Обновлен бэкенд:**
   - `auth.controller.ts` - теперь возвращает токен в ответе (для мобильных клиентов)

## Настройка

### 1. Настройка URL бэкенда

Отредактируйте файл `src/config/api.config.ts` и укажите правильный URL вашего бэкенда:

- **Для Android эмулятора**: `http://10.0.2.2:3001/api`
- **Для iOS симулятора**: `http://localhost:3001/api`
- **Для физического устройства**: `http://<ваш-ip-адрес>:3001/api`
- **Для продакшена**: `https://your-production-api.com/api`

### 2. Запуск бэкенда

Убедитесь, что бэкенд запущен на порту 3001:

```bash
cd fire/backend
pnpm install
pnpm run start:dev
```

### 3. Настройка переменных окружения бэкенда

Убедитесь, что в бэкенде настроены необходимые переменные окружения (см. `fire/backend/src/services/env.service.ts`):

- `CLIENT_URL` - URL клиентского приложения
- `SESSION_SECRET` - секрет для сессий
- `HASH_KEY` - ключ для хеширования
- `DATABASE_URL` - URL базы данных

### 4. CORS настройка

Бэкенд настроен на CORS с поддержкой credentials. Убедитесь, что `CLIENT_URL` в бэкенде соответствует вашему клиенту.

## Использование

### Аутентификация

```typescript
import authService from './services/authService';

// Регистрация
const user = await authService.register({
  email: 'user@example.com',
  password: 'password123',
  fullName: 'Иван Иванов',
  position: 'Инспектор',
  phone: '+7 (999) 123-45-67',
});

// Вход
const user = await authService.login('user@example.com', 'password123');

// Выход
await authService.logout();

// Получение текущего пользователя
const user = await authService.getCurrentUser();
```

### Работа с объектами

```typescript
import objectService from './services/objectService';

// Получение всех объектов
const objects = await objectService.getObjects();

// Получение объекта по ID
const object = await objectService.getObjectById('123');

// Создание объекта
const newObject = await objectService.createObject({
  name: 'Новый объект',
  legalAddress: 'Адрес',
  actualAddress: 'Адрес',
  coordinates: { latitude: 53.6325, longitude: 55.9503 },
  type: 'administrative',
  fireSafetyClass: 'F1.1',
});

// Обновление объекта
const updated = await objectService.updateObject('123', {
  name: 'Обновленное название',
});

// Удаление объекта
await objectService.deleteObject('123');
```

### Работа с огнетушителями

```typescript
import fireSafetyService from './services/fireSafetyService';

// Получение огнетушителей по объекту
const extinguishers = await fireSafetyService.getExtinguishersByObject('object-id');

// Создание огнетушителя
const extinguisher = await fireSafetyService.createExtinguisher({
  objectId: 'object-id',
  inventoryNumber: 'ОГН-2024-001',
  type: 'powder',
  capacity: 5,
  location: 'Холл 1 этаж',
  lastServiceDate: '2024-01-15',
  nextServiceDate: '2024-07-15',
  status: 'active',
});

// Обновление огнетушителя
const updated = await fireSafetyService.updateExtinguisher('ext-id', {
  status: 'expired',
});

// Удаление огнетушителя
await fireSafetyService.deleteFireExtinguisher('ext-id');
```

## Особенности

1. **Формат fireSafetyClass**: Frontend использует формат `F1.1`, а бэкенд - `F1_1`. Преобразование выполняется автоматически.

2. **Токены**: Токены сохраняются в AsyncStorage и автоматически добавляются в заголовок Authorization при каждом запросе.

3. **Обработка ошибок**: Все ошибки API обрабатываются и выбрасываются с понятными сообщениями.

4. **Fire Equipment**: Пожарное оборудование (не огнетушители) пока хранится локально, так как в бэкенде нет соответствующих эндпоинтов.

## Отладка

Если возникают проблемы с подключением:

1. Проверьте, что бэкенд запущен и доступен
2. Проверьте URL в `api.config.ts`
3. Проверьте логи в консоли приложения
4. Убедитесь, что токен сохраняется после логина
5. Проверьте CORS настройки на бэкенде

## Следующие шаги

- Добавить эндпоинты для Fire Equipment в бэкенд
- Добавить поддержку загрузки файлов (документы)
- Добавить поддержку уведомлений через API
- Оптимизировать получение всех огнетушителей (добавить эндпоинт в бэкенд)

