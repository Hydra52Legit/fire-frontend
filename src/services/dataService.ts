import AsyncStorage from '@react-native-async-storage/async-storage';
import { InspectionObject, User, ResponsiblePerson, Document } from '../types';

const STORAGE_KEYS = {
  OBJECTS: 'fire_inspection_objects',
  USERS: 'fire_inspection_users',
  CURRENT_USER: 'fire_inspection_current_user',
};

class DataService {
  // Объекты
  async getObjects(): Promise<InspectionObject[]> {
    try {
      const objectsJson = await AsyncStorage.getItem(STORAGE_KEYS.OBJECTS);
      return objectsJson ? JSON.parse(objectsJson) : [];
    } catch (error) {
      console.error('Error getting objects:', error);
      return [];
    }
  }

  async saveObject(object: InspectionObject): Promise<void> {
    try {
      const objects = await this.getObjects();
      const existingIndex = objects.findIndex(o => o.id === object.id);
      
      if (existingIndex >= 0) {
        objects[existingIndex] = object;
      } else {
        objects.push(object);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.OBJECTS, JSON.stringify(objects));
    } catch (error) {
      console.error('Error saving object:', error);
      throw error;
    }
  }

  async deleteObject(objectId: string): Promise<void> {
    try {
      const objects = await this.getObjects();
      const filteredObjects = objects.filter(o => o.id !== objectId);
      await AsyncStorage.setItem(STORAGE_KEYS.OBJECTS, JSON.stringify(filteredObjects));
    } catch (error) {
      console.error('Error deleting object:', error);
      throw error;
    }
  }

  // Пользователи
  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async setCurrentUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting current user:', error);
      throw error;
    }
  }

  // Поиск и фильтрация
  async searchObjects(query: string, filters?: {
    type?: string;
    fireSafetyClass?: string;
    responsiblePerson?: string;
  }): Promise<InspectionObject[]> {
    const objects = await this.getObjects();
    
    return objects.filter(object => {
      // Поиск по названию и адресу
      const matchesSearch = !query || 
        object.name.toLowerCase().includes(query.toLowerCase()) ||
        object.legalAddress.toLowerCase().includes(query.toLowerCase()) ||
        object.actualAddress.toLowerCase().includes(query.toLowerCase());
      
      // Фильтрация по типу
      const matchesType = !filters?.type || object.type === filters.type;
      
      // Фильтрация по классу пожарной опасности
      const matchesClass = !filters?.fireSafetyClass || object.fireSafetyClass === filters.fireSafetyClass;
      
      // Фильтрация по ответственному лицу
      const matchesResponsible = !filters?.responsiblePerson || 
        object.responsiblePersons.some(rp => 
          rp.fullName.toLowerCase().includes(filters.responsiblePerson!.toLowerCase())
        );
      
      return matchesSearch && matchesType && matchesClass && matchesResponsible;
    });
  }
}

export default new DataService();