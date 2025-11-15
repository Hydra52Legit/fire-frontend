import { InspectionObject, User } from '../types';
import objectService from './objectService';
import authService from './authService';

class DataService {
  // Объекты - используем objectService, который работает с API
  async getObjects(): Promise<InspectionObject[]> {
    try {
      return await objectService.getObjects();
    } catch (error) {
      console.error('Error getting objects:', error);
      return [];
    }
  }

  async saveObject(object: InspectionObject): Promise<void> {
    try {
      await objectService.saveObject(object);
    } catch (error) {
      console.error('Error saving object:', error);
      throw error;
    }
  }

  async deleteObject(objectId: string): Promise<void> {
    try {
      await objectService.deleteObject(objectId);
    } catch (error) {
      console.error('Error deleting object:', error);
      throw error;
    }
  }

  // Пользователи - используем authService
  async getCurrentUser(): Promise<User | null> {
    try {
      return await authService.getCurrentUser();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async setCurrentUser(user: User): Promise<void> {
    // Это не нужно, так как пользователь управляется через authService
    // Оставляем для обратной совместимости, но не делаем ничего
    console.warn('setCurrentUser is deprecated, use authService instead');
  }

  // Поиск и фильтрация - используем objectService
  async searchObjects(query: string, filters?: {
    type?: string;
    fireSafetyClass?: string;
    responsiblePerson?: string;
  }): Promise<InspectionObject[]> {
    try {
      // Преобразуем фильтры в формат objectService
      const objectFilters = filters ? {
        type: filters.type as any,
        fireSafetyClass: filters.fireSafetyClass as any,
      } : undefined;
      
      const objects = await objectService.searchObjects(query, objectFilters);
      
      // Дополнительная фильтрация по ответственному лицу (если указан)
      if (filters?.responsiblePerson) {
        return objects.filter(object => 
          object.responsiblePersons.some(rp => 
            rp.fullName.toLowerCase().includes(filters.responsiblePerson!.toLowerCase())
          )
        );
      }
      
      return objects;
    } catch (error) {
      console.error('Error searching objects:', error);
      return [];
    }
  }
}

export default new DataService();