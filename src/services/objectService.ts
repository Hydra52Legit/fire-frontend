import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  InspectionObject, 
  ObjectType, 
  FireSafetyClass, 
  ObjectStatus 
} from '../types';

const STORAGE_KEYS = {
  OBJECTS: 'fire_inspection_objects',
};

class ObjectService {
  // Получение всех объектов
  async getObjects(): Promise<InspectionObject[]> {
    try {
      const objectsJson = await AsyncStorage.getItem(STORAGE_KEYS.OBJECTS);
      if (objectsJson) {
        return JSON.parse(objectsJson);
      }

      // Создаем тестовые данные при первом запуске
      const sampleObjects: InspectionObject[] = [
        {
          id: '1',
          name: 'Бизнес-центр "Нева"',
          legalAddress: 'г. Стерлитамак, ул. Худайбердина, 1',
          actualAddress: 'г. Стерлитамак, ул. Худайбердина, 1',
          coordinates: {
            latitude: 53.6325,
            longitude: 55.9503,
          },
          type: 'administrative',
          fireSafetyClass: 'F1.1',
          responsiblePersons: [
            {
              id: '1',
              fullName: 'Иванов Алексей Петрович',
              position: 'Директор',
              workPhone: '+7 (3473) 123-45-67',
              mobilePhone: '+7 (999) 123-45-67',
              email: 'ivanov@neva.ru',
              assignedDate: '2023-01-15',
              isCurrent: true,
            },
          ],
          documents: [
            {
              id: '1',
              type: 'evacuation_plan',
              name: 'План эвакуации 1 этаж',
              fileUri: 'documents/evacuation_1.pdf',
              uploadDate: '2024-01-10',
              expirationDate: '2025-01-10',
              version: 1,
              fileSize: 2048,
            },
          ],
          inspections: [
            {
              id: '1',
              date: '2024-01-15',
              inspector: 'Петрова М.С.',
              result: 'passed',
              comments: 'Все требования соблюдены',
              nextInspectionDate: '2024-07-15',
            },
          ],
          status: 'active',
          createdAt: '2023-01-15',
          updatedAt: '2024-01-15',
          createdBy: 'admin',
        },
        {
          id: '2',
          name: 'Торговый центр "Европа"',
          legalAddress: 'г. Стерлитамак, пр. Ленина, 47',
          actualAddress: 'г. Стерлитамак, пр. Ленина, 47',
          coordinates: {
            latitude: 53.6302,
            longitude: 55.9498,
          },
          type: 'shopping_center',
          fireSafetyClass: 'F3',
          responsiblePersons: [
            {
              id: '2',
              fullName: 'Смирнова Ольга Владимировна',
              position: 'Управляющая',
              workPhone: '+7 (3473) 234-56-78',
              mobilePhone: '+7 (999) 234-56-78',
              email: 'smirnova@europa.ru',
              assignedDate: '2023-02-20',
              isCurrent: true,
            },
          ],
          documents: [],
          inspections: [
            {
              id: '2',
              date: '2024-01-10',
              inspector: 'Иванов А.П.',
              result: 'requires_improvement',
              comments: 'Требуется заменить огнетушители в секторе Б',
              violations: ['Просрочены огнетушители'],
              nextInspectionDate: '2024-04-10',
            },
          ],
          status: 'active',
          createdAt: '2023-02-20',
          updatedAt: '2024-01-10',
          createdBy: 'admin',
        },
      ];

      await this.saveObjects(sampleObjects);
      return sampleObjects;
    } catch (error) {
      console.error('Error getting objects:', error);
      return [];
    }
  }

  // Получение объекта по ID
  async getObjectById(id: string): Promise<InspectionObject | null> {
    try {
      const objects = await this.getObjects();
      return objects.find(obj => obj.id === id) || null;
    } catch (error) {
      console.error('Error getting object by id:', error);
      return null;
    }
  }

  // Сохранение объекта
  async saveObject(object: InspectionObject): Promise<void> {
    try {
      const objects = await this.getObjects();
      const existingIndex = objects.findIndex(o => o.id === object.id);
      
      if (existingIndex >= 0) {
        // Обновление существующего объекта
        objects[existingIndex] = {
          ...object,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Добавление нового объекта
        objects.push({
          ...object,
          id: object.id || Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      await this.saveObjects(objects);
    } catch (error) {
      console.error('Error saving object:', error);
      throw error;
    }
  }

  // Удаление объекта (архивация)
  async archiveObject(objectId: string): Promise<void> {
    try {
      const objects = await this.getObjects();
      const objectIndex = objects.findIndex(o => o.id === objectId);
      
      if (objectIndex >= 0) {
        objects[objectIndex] = {
          ...objects[objectIndex],
          status: 'archived',
          updatedAt: new Date().toISOString(),
        };
        
        await this.saveObjects(objects);
      }
    } catch (error) {
      console.error('Error archiving object:', error);
      throw error;
    }
  }

  // Поиск объектов
  async searchObjects(query: string, filters?: {
    type?: ObjectType;
    fireSafetyClass?: FireSafetyClass;
    status?: ObjectStatus;
  }): Promise<InspectionObject[]> {
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

  // Приватный метод для сохранения всех объектов
  private async saveObjects(objects: InspectionObject[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.OBJECTS, JSON.stringify(objects));
  }
  // Удаление объекта
async deleteObject(objectId: string): Promise<void> {
  try {
    const objects = await this.getObjects();
    const filteredObjects = objects.filter(obj => obj.id !== objectId);
    await this.saveObjects(filteredObjects);
  } catch (error) {
    console.error('Error deleting object:', error);
    throw error;
  }
}

// Полное удаление (без архивации)
async permanentDeleteObject(objectId: string): Promise<void> {
  try {
    const objects = await this.getObjects();
    const filteredObjects = objects.filter(obj => obj.id !== objectId);
    await this.saveObjects(filteredObjects);
  } catch (error) {
    console.error('Error permanently deleting object:', error);
    throw error;
  }
}
}

export default new ObjectService();