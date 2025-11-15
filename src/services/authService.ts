import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import apiClient from './apiClient';
import API_CONFIG from '../config/api.config';

const STORAGE_KEYS = {
  CURRENT_USER: 'fire_inspection_current_user',
  PIN_CODE_SET: 'fire_inspection_pin_code_set',
  USER_PIN: 'fire_inspection_user_pin',
};

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterResponse {
  token: string;
  user: User;
}

class AuthService {
  // Регистрация нового пользователя
  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    position: string;
    phone?: string;
  }): Promise<User> {
    try {
      // Бэкенд ожидает email и password в заголовках, а остальные данные в теле
      const response = await apiClient.post<RegisterResponse>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        {
          fullName: userData.fullName,
          position: userData.position,
          phone: userData.phone,
        },
        {
          headers: {
            email: userData.email,
            password: userData.password,
          },
        }
      );

      // Сохраняем токен и пользователя
      await apiClient.setToken(response.token);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(response.user));

      return response.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Ошибка при регистрации';
      throw new Error(errorMessage);
    }
  }

  // Вход пользователя
  async login(email: string, password: string): Promise<User> {
    try {
      // Бэкенд использует GET запрос с email и password в заголовках
      const response = await apiClient.get<LoginResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        {
          headers: {
            email,
            password,
          },
        }
      );

      // Сохраняем токен и пользователя
      await apiClient.setToken(response.token);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(response.user));

      return response.user;
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Неверный email или пароль';
      throw new Error(errorMessage);
    }
  }

  // Выход пользователя
  async logout(): Promise<void> {
    try {
      await apiClient.clearToken();
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CURRENT_USER,
        STORAGE_KEYS.PIN_CODE_SET,
        STORAGE_KEYS.USER_PIN,
      ]);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Получение текущего пользователя
  async getCurrentUser(): Promise<User | null> {
    try {
      // Сначала пытаемся получить из локального хранилища
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (userJson) {
        return JSON.parse(userJson);
      }

      // Если нет в локальном хранилище, пытаемся получить с сервера
      try {
        const user = await apiClient.get<User>(API_CONFIG.ENDPOINTS.AUTH.ME);
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        return user;
      } catch (error) {
        // Если не удалось получить с сервера, возвращаем null
        return null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Проверка авторизации
  async checkAuth(): Promise<{ user: User | null; needsPin: boolean }> {
    try {
      try {
        const user = await apiClient.get<User>(API_CONFIG.ENDPOINTS.AUTH.ME);
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        const pinSet = await AsyncStorage.getItem(STORAGE_KEYS.PIN_CODE_SET);
        
        return {
          user,
          needsPin: pinSet === 'true',
        };
      } catch (error: any) {
        // Если токен невалидный (401), очищаем данные
        if (error.status === 401) {
          await this.logout();
          return { user: null, needsPin: false };
        }
        // Если ошибка сети, пытаемся использовать сохраненного пользователя
        const userJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (userJson) {
          const user = JSON.parse(userJson);
          const pinSet = await AsyncStorage.getItem(STORAGE_KEYS.PIN_CODE_SET);
          return {
            user,
            needsPin: pinSet === 'true',
          };
        }
        return { user: null, needsPin: false };
      }
    } catch (error: any) {
      // Не логируем ошибки сети в продакшене
      if (__DEV__) {
        console.error('Auth check error:', error);
      }
      return { user: null, needsPin: false };
    }
  }

  // Установка PIN-кода
  async setPinCode(pin: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PIN, pin);
      await AsyncStorage.setItem(STORAGE_KEYS.PIN_CODE_SET, 'true');
    } catch (error) {
      console.error('Set PIN error:', error);
      throw error;
    }
  }

  // Проверка PIN-кода
  async verifyPinCode(pin: string): Promise<boolean> {
    try {
      const savedPin = await AsyncStorage.getItem(STORAGE_KEYS.USER_PIN);
      return savedPin === pin;
    } catch (error) {
      console.error('Verify PIN error:', error);
      return false;
    }
  }


  // Проверка прав администратора
  isAdmin(user: User): boolean {
    return user.role === 'admin';
  }

  // Проверка прав инспектора
  isInspector(user: User): boolean {
    return user.role === 'inspector' || user.role === 'admin';
  }
}

export default new AuthService();