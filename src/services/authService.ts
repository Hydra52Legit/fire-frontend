import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'fire_inspection_current_user',
  USERS: 'fire_inspection_users',
  USER_TOKEN: 'fire_inspection_user_token',
  PIN_CODE_SET: 'fire_inspection_pin_code_set',
  USER_PIN: 'fire_inspection_user_pin',
};

class AuthService {
  // Регистрация нового пользователя
  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    position: string;
    phone?: string;
    role?: UserRole;
  }): Promise<User> {
    try {
      // Проверяем, нет ли уже пользователя с таким email
      const existingUsers = await this.getUsers();
      const existingUser = existingUsers.find(u => u.email === userData.email);
      
      if (existingUser) {
        throw new Error('Пользователь с таким email уже существует');
      }

      // Создаем нового пользователя
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        fullName: userData.fullName,
        position: userData.position,
        phone: userData.phone,
        role: userData.role || 'inspector', // По умолчанию инспектор
        assignedObjects: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Сохраняем пользователя
      const updatedUsers = [...existingUsers, newUser];
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Вход пользователя
  async login(email: string, password: string): Promise<User> {
    try {
      const users = await this.getUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // В реальном приложении здесь была бы проверка пароля через бекенд
      // Сейчас просто имитируем успешный вход
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, 'demo-token-' + Date.now());
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Выход пользователя
  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_TOKEN,
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
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Проверка авторизации
  async checkAuth(): Promise<{ user: User | null; needsPin: boolean }> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      const user = await this.getCurrentUser();
      const pinSet = await AsyncStorage.getItem(STORAGE_KEYS.PIN_CODE_SET);

      if (token && user) {
        return {
          user,
          needsPin: pinSet === 'true',
        };
      }

      return { user: null, needsPin: false };
    } catch (error) {
      console.error('Auth check error:', error);
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

  // Получение всех пользователей (для админа)
  async getUsers(): Promise<User[]> {
    try {
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (usersJson) {
        return JSON.parse(usersJson);
      }

      // Создаем тестовых пользователей при первом запуске
      const defaultUsers: User[] = [
        {
          id: '1',
          email: 'admin@fireinspection.ru',
          fullName: 'Иванов Алексей Петрович',
          position: 'Главный инспектор',
          role: 'admin',
          phone: '+7 (999) 123-45-67',
          assignedObjects: ['1', '2', '3'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'inspector@fireinspection.ru',
          fullName: 'Петрова Мария Сергеевна',
          position: 'Инспектор',
          role: 'inspector',
          phone: '+7 (999) 765-43-21',
          assignedObjects: ['4'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
      return defaultUsers;
    } catch (error) {
      console.error('Get users error:', error);
      return [];
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