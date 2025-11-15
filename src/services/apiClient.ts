import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/api.config';

const STORAGE_KEYS = {
  TOKEN: 'api_token',
  USER: 'current_user',
};

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 секунда

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    // Отладочная информация только в dev режиме
    if (__DEV__) {
      console.log('API Client initialized with base URL:', this.baseURL);
    }
  }

  // Получение токена из хранилища
  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Сохранение токена
  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  }

  // Удаление токена
  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  // Основной метод для выполнения запросов с retry логикой
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const token = await this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Добавляем токен в заголовки, если он есть
    // Бэкенд поддерживает Bearer токены в заголовке Authorization
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const fullUrl = `${this.baseURL}${endpoint}`;
    
    // Логируем только в dev режиме и только первый запрос (не retry)
    if (__DEV__ && retryCount === 0) {
      console.log(`[API] ${options.method || 'GET'} ${fullUrl}`);
    }
    
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'include', // Для поддержки cookies
      });

      clearTimeout(timeoutId);

      // Обработка различных статусов ответа
      if (!response.ok) {
        let errorMessage = 'Произошла ошибка';
        let errorData = null;

        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        const error: ApiError = {
          message: errorMessage,
          status: response.status,
          data: errorData,
        };

        // Если получили 401, очищаем токен
        if (response.status === 401) {
          await this.clearToken();
        }

        // Не повторяем запросы для клиентских ошибок (4xx), кроме 408 (timeout)
        if (response.status >= 400 && response.status < 500 && response.status !== 408) {
          throw error;
        }

        // Для 408 и 5xx ошибок - повторяем запрос
        if (retryCount < this.MAX_RETRIES && (response.status === 408 || response.status >= 500)) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1)));
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        throw error;
      }

      // Токен будет сохранен вручную при логине/регистрации из тела ответа

      // Если ответ пустой, возвращаем пустой объект
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        // Retry для timeout ошибок
        if (retryCount < this.MAX_RETRIES) {
          if (__DEV__) {
            console.log(`[API] Timeout, retrying... (${retryCount + 1}/${this.MAX_RETRIES})`);
          }
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1)));
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        
        if (__DEV__) {
          console.error(`[API] Timeout for ${fullUrl} after ${this.MAX_RETRIES} retries`);
        }
        throw {
          message: `Превышено время ожидания ответа от сервера. Проверьте подключение к интернету.`,
          status: 408,
        } as ApiError;
      }

      if (error.status) {
        // Retry для сетевых ошибок (status 0)
        if (error.status === 0 && retryCount < this.MAX_RETRIES) {
          if (__DEV__) {
            console.log(`[API] Network error, retrying... (${retryCount + 1}/${this.MAX_RETRIES})`);
          }
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1)));
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        throw error; // Это уже наш ApiError
      }

      // Retry для других сетевых ошибок
      if (retryCount < this.MAX_RETRIES) {
        if (__DEV__) {
          console.log(`[API] Error, retrying... (${retryCount + 1}/${this.MAX_RETRIES}):`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (retryCount + 1)));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      if (__DEV__) {
        console.error(`[API] Network error for ${fullUrl}:`, error.message);
      }
      throw {
        message: error.message || `Ошибка сети. Проверьте подключение к интернету и доступность сервера.`,
        status: 0,
      } as ApiError;
    }
  }

  // GET запрос
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  // POST запрос
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT запрос
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH запрос
  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE запрос
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export default new ApiClient();

