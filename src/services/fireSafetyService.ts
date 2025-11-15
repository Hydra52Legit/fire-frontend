import { 
  FireExtinguisher, 
  FireEquipment, 
  FireSafetyStats, 
  EquipmentStatus,
  ExtinguisherType,
  FireEquipmentType
} from '../types';
import apiClient from './apiClient';
import API_CONFIG from '../config/api.config';

// Преобразование огнетушителя из формата бэкенда в формат frontend
function transformExtinguisherFromBackend(obj: any): FireExtinguisher {
  return {
    id: obj.id,
    inventoryNumber: obj.inventoryNumber,
    type: obj.type,
    capacity: obj.capacity,
    location: obj.location,
    objectId: obj.objectId,
    lastServiceDate: typeof obj.lastServiceDate === 'string' 
      ? obj.lastServiceDate 
      : new Date(obj.lastServiceDate).toISOString().split('T')[0],
    nextServiceDate: typeof obj.nextServiceDate === 'string'
      ? obj.nextServiceDate
      : new Date(obj.nextServiceDate).toISOString().split('T')[0],
    status: obj.status,
    manufacturer: obj.manufacturer,
    manufactureDate: obj.manufactureDate 
      ? (typeof obj.manufactureDate === 'string'
          ? obj.manufactureDate
          : new Date(obj.manufactureDate).toISOString().split('T')[0])
      : undefined,
    comments: obj.comments,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : obj.createdAt.toISOString(),
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : obj.updatedAt.toISOString(),
  };
}

// Преобразование огнетушителя из формата frontend в формат бэкенда
function transformExtinguisherToBackend(obj: Partial<FireExtinguisher>): any {
  const result: any = {};

  if (obj.objectId !== undefined) result.objectId = obj.objectId;
  if (obj.inventoryNumber !== undefined) result.inventoryNumber = obj.inventoryNumber;
  if (obj.type !== undefined) result.type = obj.type;
  if (obj.capacity !== undefined) result.capacity = obj.capacity;
  if (obj.location !== undefined) result.location = obj.location;
  if (obj.lastServiceDate !== undefined) {
    result.lastServiceDate = new Date(obj.lastServiceDate);
  }
  if (obj.nextServiceDate !== undefined) {
    result.nextServiceDate = new Date(obj.nextServiceDate);
  }
  if (obj.status !== undefined) result.status = obj.status;
  if (obj.manufacturer !== undefined) result.manufacturer = obj.manufacturer;
  if (obj.manufactureDate !== undefined) {
    result.manufactureDate = new Date(obj.manufactureDate);
  }
  if (obj.comments !== undefined) result.comments = obj.comments;

  return result;
}

// Преобразование оборудования из формата бэкенда в формат frontend
function transformEquipmentFromBackend(obj: any): FireEquipment {
  return {
    id: obj.id,
    type: obj.type,
    inventoryNumber: obj.inventoryNumber,
    location: obj.location,
    objectId: obj.objectId,
    lastInspectionDate: typeof obj.lastInspectionDate === 'string'
      ? obj.lastInspectionDate
      : new Date(obj.lastInspectionDate).toISOString().split('T')[0],
    nextInspectionDate: typeof obj.nextInspectionDate === 'string'
      ? obj.nextInspectionDate
      : new Date(obj.nextInspectionDate).toISOString().split('T')[0],
    status: obj.status,
    specifications: {
      pressure: obj.pressure,
      diameter: obj.diameter,
      length: obj.length,
      material: obj.material,
    },
    comments: obj.comments,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : obj.createdAt.toISOString(),
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : obj.updatedAt.toISOString(),
  };
}

// Преобразование оборудования из формата frontend в формат бэкенда
function transformEquipmentToBackend(obj: Partial<FireEquipment>): any {
  const result: any = {};

  if (obj.objectId !== undefined) result.objectId = obj.objectId;
  if (obj.type !== undefined) result.type = obj.type;
  if (obj.inventoryNumber !== undefined) result.inventoryNumber = obj.inventoryNumber;
  if (obj.location !== undefined) result.location = obj.location;
  if (obj.lastInspectionDate !== undefined) {
    result.lastInspectionDate = new Date(obj.lastInspectionDate);
  }
  if (obj.nextInspectionDate !== undefined) {
    result.nextInspectionDate = new Date(obj.nextInspectionDate);
  }
  if (obj.status !== undefined) result.status = obj.status;
  if (obj.specifications) {
    if (obj.specifications.pressure !== undefined) result.pressure = obj.specifications.pressure;
    if (obj.specifications.diameter !== undefined) result.diameter = obj.specifications.diameter;
    if (obj.specifications.length !== undefined) result.length = obj.specifications.length;
    if (obj.specifications.material !== undefined) result.material = obj.specifications.material;
  }
  if (obj.comments !== undefined) result.comments = obj.comments;

  return result;
}

class FireSafetyService {
  // ===== ОГНЕТУШИТЕЛИ =====

  // Получение огнетушителей по объекту (бэкенд поддерживает только получение по объекту)
  async getExtinguishersByObject(objectId: string): Promise<FireExtinguisher[]> {
    try {
      const extinguishers = await apiClient.get<any[]>(
        API_CONFIG.ENDPOINTS.EXTINGUISHERS.GET_BY_OBJECT(objectId)
      );
      return extinguishers.map(transformExtinguisherFromBackend);
    } catch (error) {
      console.error('Error getting extinguishers by object:', error);
      return [];
    }
  }

  // Получение всех огнетушителей (получаем по всем объектам)
  // ВАЖНО: Это неэффективно, лучше использовать getExtinguishersByObject
  async getFireExtinguishers(): Promise<FireExtinguisher[]> {
    try {
      // Получаем все объекты и затем все огнетушители для каждого объекта
      // Это не оптимально, но бэкенд не имеет эндпоинта для получения всех огнетушителей
      const objectService = (await import('./objectService')).default;
      const objects = await objectService.getObjects();
      const allExtinguishers: FireExtinguisher[] = [];

      for (const obj of objects) {
        const extinguishers = await this.getExtinguishersByObject(obj.id);
        allExtinguishers.push(...extinguishers);
      }

      return allExtinguishers;
    } catch (error) {
      console.error('Error getting fire extinguishers:', error);
      return [];
    }
  }

  // Получение огнетушителя по ID
  async getExtinguisherById(id: string): Promise<FireExtinguisher | null> {
    try {
      const extinguisher = await apiClient.get<any>(API_CONFIG.ENDPOINTS.EXTINGUISHERS.GET(id));
      return transformExtinguisherFromBackend(extinguisher);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error('Error getting extinguisher by id:', error);
      throw error;
    }
  }

  // Создание огнетушителя
  async createExtinguisher(extinguisher: Partial<FireExtinguisher>): Promise<FireExtinguisher> {
    try {
      const data = transformExtinguisherToBackend(extinguisher);
      const created = await apiClient.post<any>(API_CONFIG.ENDPOINTS.EXTINGUISHERS.CREATE, data);
      return transformExtinguisherFromBackend(created);
    } catch (error) {
      console.error('Error creating fire extinguisher:', error);
      throw error;
    }
  }

  // Обновление огнетушителя
  async updateExtinguisher(id: string, extinguisher: Partial<FireExtinguisher>): Promise<FireExtinguisher> {
    try {
      const data = transformExtinguisherToBackend(extinguisher);
      const updated = await apiClient.put<any>(API_CONFIG.ENDPOINTS.EXTINGUISHERS.UPDATE(id), data);
      return transformExtinguisherFromBackend(updated);
    } catch (error) {
      console.error('Error updating fire extinguisher:', error);
      throw error;
    }
  }

  // Сохранение огнетушителя (создание или обновление)
  async saveFireExtinguisher(extinguisher: FireExtinguisher): Promise<FireExtinguisher> {
    try {
      if (extinguisher.id) {
        return await this.updateExtinguisher(extinguisher.id, extinguisher);
      } else {
        return await this.createExtinguisher(extinguisher);
      }
    } catch (error) {
      console.error('Error saving fire extinguisher:', error);
      throw error;
    }
  }

  // Удаление огнетушителя
  async deleteFireExtinguisher(extinguisherId: string): Promise<void> {
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.EXTINGUISHERS.DELETE(extinguisherId));
    } catch (error) {
      console.error('Error deleting fire extinguisher:', error);
      throw error;
    }
  }

  // ===== ПОЖАРНОЕ ОБОРУДОВАНИЕ =====

  // Получение оборудования по объекту (бэкенд поддерживает только получение по объекту)
  async getEquipmentByObject(objectId: string): Promise<FireEquipment[]> {
    try {
      const equipment = await apiClient.get<any[]>(
        API_CONFIG.ENDPOINTS.EQUIPMENT.GET_BY_OBJECT(objectId)
      );
      return equipment.map(transformEquipmentFromBackend);
    } catch (error) {
      console.error('Error getting equipment by object:', error);
      return [];
    }
  }

  // Получение всего оборудования (получаем по всем объектам)
  // ВАЖНО: Это неэффективно, лучше использовать getEquipmentByObject
  async getFireEquipment(): Promise<FireEquipment[]> {
    try {
      // Получаем все объекты и затем все оборудование для каждого объекта
      const objectService = (await import('./objectService')).default;
      const objects = await objectService.getObjects();
      const allEquipment: FireEquipment[] = [];

      for (const obj of objects) {
        const equipment = await this.getEquipmentByObject(obj.id);
        allEquipment.push(...equipment);
      }

      return allEquipment;
    } catch (error) {
      console.error('Error getting fire equipment:', error);
      return [];
    }
  }

  // Получение оборудования по ID
  async getEquipmentById(id: string): Promise<FireEquipment | null> {
    try {
      const equipment = await apiClient.get<any>(API_CONFIG.ENDPOINTS.EQUIPMENT.GET(id));
      return transformEquipmentFromBackend(equipment);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error('Error getting equipment by id:', error);
      throw error;
    }
  }

  // Создание оборудования
  async createEquipment(equipment: Partial<FireEquipment>): Promise<FireEquipment> {
    try {
      const data = transformEquipmentToBackend(equipment);
      const created = await apiClient.post<any>(API_CONFIG.ENDPOINTS.EQUIPMENT.CREATE, data);
      return transformEquipmentFromBackend(created);
    } catch (error) {
      console.error('Error creating fire equipment:', error);
      throw error;
    }
  }

  // Обновление оборудования
  async updateEquipment(id: string, equipment: Partial<FireEquipment>): Promise<FireEquipment> {
    try {
      const data = transformEquipmentToBackend(equipment);
      const updated = await apiClient.put<any>(API_CONFIG.ENDPOINTS.EQUIPMENT.UPDATE(id), data);
      return transformEquipmentFromBackend(updated);
    } catch (error) {
      console.error('Error updating fire equipment:', error);
      throw error;
    }
  }

  // Сохранение оборудования (создание или обновление)
  async saveFireEquipment(equipment: FireEquipment): Promise<FireEquipment> {
    try {
      if (equipment.id) {
        return await this.updateEquipment(equipment.id, equipment);
      } else {
        return await this.createEquipment(equipment);
      }
    } catch (error) {
      console.error('Error saving fire equipment:', error);
      throw error;
    }
  }

  // Удаление оборудования
  async deleteFireEquipment(equipmentId: string): Promise<void> {
    try {
      await apiClient.delete(API_CONFIG.ENDPOINTS.EQUIPMENT.DELETE(equipmentId));
    } catch (error) {
      console.error('Error deleting fire equipment:', error);
      throw error;
    }
  }

  // ===== СТАТИСТИКА =====

  // Получение статистики
  async getFireSafetyStats(objectId?: string): Promise<FireSafetyStats> {
    try {
      const extinguishers = objectId 
        ? await this.getExtinguishersByObject(objectId)
        : await this.getFireExtinguishers();
      
      const equipment = objectId
        ? await this.getEquipmentByObject(objectId)
        : await this.getFireEquipment();

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      return {
        totalExtinguishers: extinguishers.length,
        expiredExtinguishers: extinguishers.filter(ext => 
          new Date(ext.nextServiceDate) < now
        ).length,
        totalEquipment: equipment.length,
        expiredEquipment: equipment.filter(eq =>
          new Date(eq.nextInspectionDate) < now
        ).length,
        upcomingInspections: [
          ...extinguishers.filter(ext =>
            new Date(ext.nextServiceDate) <= thirtyDaysFromNow &&
            new Date(ext.nextServiceDate) >= now
          ),
          ...equipment.filter(eq =>
            new Date(eq.nextInspectionDate) <= thirtyDaysFromNow &&
            new Date(eq.nextInspectionDate) >= now
          )
        ].length,
      };
    } catch (error) {
      console.error('Error getting fire safety stats:', error);
      return {
        totalExtinguishers: 0,
        expiredExtinguishers: 0,
        totalEquipment: 0,
        expiredEquipment: 0,
        upcomingInspections: 0,
      };
    }
  }

  // ===== СПРАВОЧНИКИ =====

  getExtinguisherTypes(): { value: ExtinguisherType; label: string }[] {
    return [
      { value: 'powder', label: 'Порошковый (ОП)' },
      { value: 'co2', label: 'Углекислотный (ОУ)' },
      { value: 'water', label: 'Водный (ОВ)' },
      { value: 'foam', label: 'Пенный (ОХП)' },
      { value: 'air_emulsion', label: 'Воздушно-эмульсионный' },
    ];
  }

  getEquipmentTypes(): { value: FireEquipmentType; label: string }[] {
    return [
      { value: 'fire_hydrant', label: 'Пожарный кран (ПК)' },
      { value: 'fire_hose', label: 'Пожарный гидрант' },
      { value: 'fire_shield', label: 'Пожарный щит' },
      { value: 'fire_alarm', label: 'Пожарная сигнализация' },
      { value: 'sprinkler', label: 'Спринклерная система' },
    ];
  }

  getEquipmentStatuses(): { value: EquipmentStatus; label: string }[] {
    return [
      { value: 'active', label: 'Активен' },
      { value: 'maintenance', label: 'На обслуживании' },
      { value: 'expired', label: 'Просрочен' },
      { value: 'decommissioned', label: 'Списан' },
    ];
  }

}

export default new FireSafetyService();