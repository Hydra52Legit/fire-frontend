import { User, UserRole } from '../types';

/**
 * Проверяет, является ли пользователь администратором
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Проверяет, является ли пользователь инспектором или администратором
 */
export const canEdit = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'inspector';
};

/**
 * Проверяет, может ли пользователь удалять (только админ)
 */
export const canDelete = (user: User | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Проверяет, может ли пользователь создавать объекты
 */
export const canCreate = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'inspector';
};

/**
 * Проверяет, может ли пользователь только просматривать
 */
export const isViewer = (user: User | null): boolean => {
  return user?.role === 'viewer';
};

