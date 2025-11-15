import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import AuthService from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  setPinCode: (pin: string) => Promise<void>;
  verifyPinCode: (pin: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user: currentUser } = await AuthService.checkAuth();
      setUser(currentUser);
    } catch (error: any) {
      // Не логируем ошибки сети в продакшене
      if (__DEV__) {
        console.error('Auth check error:', error);
      }
      // Если ошибка сети или таймаут, не очищаем пользователя из локального хранилища
      if (error?.status === 0 || error?.status === 408) {
        // Пытаемся использовать сохраненного пользователя
        const savedUser = await AuthService.getCurrentUser();
        if (savedUser) {
          setUser(savedUser);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userData = await AuthService.login(email, password);
      setUser(userData);
      // После успешного входа проверяем, нужен ли PIN-код
      const { needsPin } = await AuthService.checkAuth();
      // Если нужен PIN, можно добавить навигацию на экран PIN-кода
      // Пока оставляем как есть - пользователь попадает на главный экран
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const newUser = await AuthService.register(userData);
      setUser(newUser);
      // После регистрации пользователь автоматически авторизован
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const setPinCode = async (pin: string) => {
    await AuthService.setPinCode(pin);
  };

  const verifyPinCode = async (pin: string): Promise<boolean> => {
    return await AuthService.verifyPinCode(pin);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      setPinCode,
      verifyPinCode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};