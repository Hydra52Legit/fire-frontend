import { 
  InspectionObject, 
  ObjectType, 
  FireSafetyClass, 
  ObjectStatus 
} from '../types';
import apiClient from './apiClient';
import API_CONFIG from '../config/api.config';
import authService from './authService';

// Преобразование формата fireSafetyClass между frontend (F1.1) и backend (F1_1)
function normalizeFireSafetyClass(className: string): string {
  return className.replace(/\./g, '_');
}

function denormalizeFireSafetyClass(className: string): FireSafetyClass {
  return className.replace(/_/g, '.') as FireSafetyClass;
}

// Преобразование объекта из формата бэкенда в формат frontend
function transformObjectFromBackend(obj: any): InspectionObject {
  return {
    id: obj.id,
    name: obj.name,
    legalAddress: obj.legalAddress,
    actualAddress: obj.actualAddress,
    coordinates: {
      latitude: obj.latitude,
      longitude: obj.longitude,
    },
    type: obj.type,
    fireSafetyClass: denormalizeFireSafetyClass(obj.fireSafetyClass),
    responsiblePersons: obj.responsiblePersons || [],
    documents: obj.documents || [],
    inspections: obj.inspections || [],
    status: obj.status,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : obj.createdAt.toISOString(),
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : obj.updatedAt.toISOString(),
    createdBy: obj.createdBy || obj.creator?.id || '',
  };
}

// Преобразование объекта из формата frontend в формат бэкенда
async function transformObjectToBackend(obj: Partial<InspectionObject>): Promise<any> {
  const currentUser = await authService.getCurrentUser();
  const result: any = {};

  if (obj.name !== undefined) result.name = obj.name;
  if (obj.legalAddress !== undefined) result.legalAddress = obj.legalAddress;
  if (obj.actualAddress !== undefined) result.actualAddress = obj.actualAddress;
  if (obj.coordinates) {
    result.latitude = obj.coordinates.latitude;
    result.longitude = obj.coordinates.longitude;
  }
  if (obj.type !== undefined) result.type = obj.type;
  if (obj.fireSafetyClass !== undefined) {
    result.fireSafetyClass = normalizeFireSafetyClass(obj.fireSafetyClass);
  }
  if (obj.status !== undefined) result.status = obj.status;
  if (obj.createdBy !== undefined) {
    result.createdBy = obj.createdBy;
  } else if (currentUser) {
    result.createdBy = currentUser.id;
  }

  return result;
}

class ObjectService {
  // Получение всех объектов
  async getObjects(): Promise<InspectionObject[]> {
    try {
      const objects = await apiClient.get<any[]>(API_CONFIG.ENDPOINTS.OBJECTS.LIST);
      return objects.map(transformObjectFromBackend);
    } catch (error) {
      console.error('Error getting objects:', error);
      throw error;
    }
  }

  // Получение объекта по ID
  async getObjectById(id: string): Promise<InspectionObject | null> {
    try {
      const object = await apiClient.get<any>(API_CONFIG.ENDPOINTS.OBJECTS.GET(id));
      return transformObjectFromBackend(object);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error('Error getting object by id:', error);
      throw error;
    }
  }

  // Создание нового объекта
  async createObject(object: Partial<InspectionObject>): Promise<InspectionObject> {
    try {
      const data = await transformObjectToBackend(object);
      const created = await apiClient.post<any>(API_CONFIG.ENDPOINTS.OBJECTS.CREATE, data);
      return transformObjectFromBackend(created);
    } catch (error) {
      console.error('Error creating object:', error);
      throw error;
    }
  }

  // Обновление объекта
  async updateObject(id: string, object: Partial<InspectionObject>): Promise<InspectionObject> {
    try {
      const data = await transformObjectToBackend(object);
      const updated = await apiClient.put<any>(API_CONFIG.ENDPOINTS.OBJECTS.UPDATE(id), data);
      return transformObjectFromBackend(updated);
    } catch (error) {
      console.error('Error updating object:', error);
      throw error;
    }
  }

  // Сохранение объекта (создание или обновление)
  async saveObject(object: InspectionObject): Promise<InspectionObject> {
    try {
      if (object.id) {
        return await this.updateObject(object.id, object);
      } else {
        return await this.createObject(object);
      }
    } catch (error) {
      console.error('Error saving object:', error);
      throw error;
    }
  }

  // Удаление объекта
  async deleteObject(objectId: string): Promise<void> {
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.OBJECTS.DELETE(objectId));
    } catch (error) {
      console.error('Error deleting object:', error);
      throw error;
    }
  }

  // Удаление объекта (архивация) - используем обновление статуса
  async archiveObject(objectId: string): Promise<void> {
    try {
      await this.updateObject(objectId, { status: 'archived' });
    } catch (error) {
      console.error('Error archiving object:', error);
      throw error;
    }
  }

  // Поиск объектов (фильтрация на клиенте, так как бэкенд не поддерживает поиск)
  async searchObjects(query: string, filters?: {
    type?: ObjectType;
    fireSafetyClass?: FireSafetyClass;
    status?: ObjectStatus;
  }): Promise<InspectionObject[]> {
    try {
      const objects = await this.getObjects();
      
      return objects.filter(object => {
        const matchesSearch = !query || 
          object.name.toLowerCase().includes(query.toLowerCase()) ||
          object.legalAddress.toLowerCase().includes(query.toLowerCase()) ||
          object.actualAddress.toLowerCase().includes(query.toLowerCase());
        
        const matchesType = !filters?.type || object.type === filters.type;
        const matchesClass = !filters?.fireSafetyClass || object.fireSafetyClass === filters.fireSafetyClass;
        const matchesStatus = !filters?.status || object.status === filters.status;
        
        return matchesSearch && matchesType && matchesClass && matchesStatus;
      });
    } catch (error) {
      console.error('Error searching objects:', error);
      return [];
    }
  }

  // Получение справочников
  getObjectTypes(): Array<{ label: string; value: ObjectType }> {
    return [
      { label: 'Административное здание', value: 'administrative' },
      { label: 'Торговый центр', value: 'shopping_center' },
      { label: 'Школа', value: 'school' },
      { label: 'Производственный цех', value: 'production' },
      { label: 'Склад', value: 'warehouse' },
      { label: 'Кафе/ресторан', value: 'cafe' },
      { label: 'Больница', value: 'hospital' },
    ];
  }

  getFireSafetyClasses(): Array<{ label: string; value: FireSafetyClass }> {
    return [
      { label: 'Ф1.1', value: 'F1.1' },
      { label: 'Ф1.2', value: 'F1.2' },
      { label: 'Ф1.3', value: 'F1.3' },
      { label: 'Ф2', value: 'F2' },
      { label: 'Ф3', value: 'F3' },
      { label: 'Ф4', value: 'F4' },
      { label: 'Ф5', value: 'F5' },
    ];
  }

  // Полное удаление (без архивации) - то же самое что deleteObject
  async permanentDeleteObject(objectId: string): Promise<void> {
    return this.deleteObject(objectId);
  }
}

export default new ObjectService();