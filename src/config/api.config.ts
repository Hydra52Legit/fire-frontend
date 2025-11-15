// Конфигурация API
// Для разработки используйте локальный адрес вашего бэкенда
// Для Android эмулятора: http://10.0.2.2:3001
// Для iOS симулятора: http://localhost:3001
// Для физического устройства: http://<ваш-ip-адрес>:3001

// Определяем базовый URL в зависимости от платформы
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (__DEV__) {
    return 'http://100.71.147.94:8080/api'; // Ваш локальный IP адрес
  } else {
    return 'https://your-production-api.com/api';
  }
};

const API_CONFIG = {
  // Базовый URL API бэкенда
  BASE_URL: getBaseUrl(),
  
  // Таймаут запросов (в миллисекундах) - увеличен для медленных соединений
  TIMEOUT: 60000, // 60 секунд
  
  // Пути к эндпоинтам
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth',
      REGISTER: '/auth',
      ME: '/auth/@me',
    },
    OBJECTS: {
      LIST: '/objects',
      GET: (id: string) => `/objects/${id}`,
      CREATE: '/objects',
      UPDATE: (id: string) => `/objects/${id}`,
      DELETE: (id: string) => `/objects/${id}`,
    },
    EXTINGUISHERS: {
      LIST: '/extinguishers',
      GET: (id: string) => `/extinguishers/${id}`,
      GET_BY_OBJECT: (objectId: string) => `/extinguishers/objects/${objectId}`,
      GET_OBJECT: '/extinguishers/objects/:objectId',
      CREATE: '/extinguishers',
      UPDATE: (id: string) => `/extinguishers/${id}`,
      DELETE: (id: string) => `/extinguishers/${id}`,
    },
    EQUIPMENT: {
      LIST: '/equipment',
      GET: (id: string) => `/equipment/${id}`,
      GET_BY_OBJECT: (objectId: string) => `/equipment/objects/${objectId}`,
      CREATE: '/equipment',
      UPDATE: (id: string) => `/equipment/${id}`,
      DELETE: (id: string) => `/equipment/${id}`,
    },
    NOTIFICATIONS: {
      REGISTER_TOKEN: '/notifications/register-token',
      UNREGISTER_TOKEN: '/notifications/unregister-token',
      SEND: '/notifications/send',
    },
  },
} as const;

export default API_CONFIG;

