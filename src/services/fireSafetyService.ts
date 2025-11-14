import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  FireExtinguisher, 
  FireEquipment, 
  FireSafetyStats, 
  EquipmentStatus,
  ExtinguisherType, // ДОБАВЛЕНО
  FireEquipmentType // ДОБАВЛЕНО
} from '../types';

const STORAGE_KEYS = {
  FIRE_EXTINGUISHERS: 'fire_inspection_extinguishers',
  FIRE_EQUIPMENT: 'fire_inspection_equipment',
};

class FireSafetyService {
  // ===== ОГНЕТУШИТЕЛИ =====

  // Получение всех огнетушителей
  async getFireExtinguishers(): Promise<FireExtinguisher[]> {
    try {
      const extinguishersJson = await AsyncStorage.getItem(STORAGE_KEYS.FIRE_EXTINGUISHERS);
      if (extinguishersJson) {
        return JSON.parse(extinguishersJson);
      }

      // Создаем тестовые данные
      const sampleExtinguishers: FireExtinguisher[] = [
        {
          id: '1',
          inventoryNumber: 'ОГН-2024-001',
          type: 'powder',
          capacity: 5,
          location: 'Холл 1 этаж, возле лифта',
          objectId: '1',
          lastServiceDate: '2024-01-15',
          nextServiceDate: '2024-07-15',
          status: 'active',
          manufacturer: 'Ярпожинвест',
          manufactureDate: '2023-06-10',
          comments: 'В отличном состоянии',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        },
        {
          id: '2',
          inventoryNumber: 'ОГН-2024-002',
          type: 'co2',
          capacity: 3,
          location: 'Серверная, на стене',
          objectId: '1',
          lastServiceDate: '2023-12-20',
          nextServiceDate: '2024-06-20',
          status: 'active',
          manufacturer: 'Брандбург',
          manufactureDate: '2023-05-15',
          comments: 'Требуется замена пломбы',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        },
        {
          id: '3',
          inventoryNumber: 'ОГН-2024-003',
          type: 'powder',
          capacity: 10,
          location: 'Складской комплекс, зона Б',
          objectId: '2',
          lastServiceDate: '2022-11-10',
          nextServiceDate: '2023-11-10',
          status: 'expired',
          manufacturer: 'Пожарный щит',
          manufactureDate: '2022-01-20',
          comments: 'ПРОСРОЧЕН - снять с учета',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        },
      ];

      await this.saveFireExtinguishers(sampleExtinguishers);
      return sampleExtinguishers;
    } catch (error) {
      console.error('Error getting fire extinguishers:', error);
      return [];
    }
  }

  // Получение огнетушителей по объекту
  async getExtinguishersByObject(objectId: string): Promise<FireExtinguisher[]> {
    try {
      const extinguishers = await this.getFireExtinguishers();
      return extinguishers.filter(ext => ext.objectId === objectId);
    } catch (error) {
      console.error('Error getting extinguishers by object:', error);
      return [];
    }
  }

  // Сохранение огнетушителя
  async saveFireExtinguisher(extinguisher: FireExtinguisher): Promise<void> {
    try {
      const extinguishers = await this.getFireExtinguishers();
      const existingIndex = extinguishers.findIndex(ext => ext.id === extinguisher.id);
      
      if (existingIndex >= 0) {
        extinguishers[existingIndex] = {
          ...extinguisher,
          updatedAt: new Date().toISOString(),
        };
      } else {
        extinguishers.push({
          ...extinguisher,
          id: extinguisher.id || Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await this.saveFireExtinguishers(extinguishers);
    } catch (error) {
      console.error('Error saving fire extinguisher:', error);
      throw error;
    }
  }

  // Удаление огнетушителя
  async deleteFireExtinguisher(extinguisherId: string): Promise<void> {
    try {
      const extinguishers = await this.getFireExtinguishers();
      const filteredExtinguishers = extinguishers.filter(ext => ext.id !== extinguisherId);
      await this.saveFireExtinguishers(filteredExtinguishers);
    } catch (error) {
      console.error('Error deleting fire extinguisher:', error);
      throw error;
    }
  }

  // ===== ПОЖАРНОЕ ОБОРУДОВАНИЕ =====

  // Получение всего оборудования
  async getFireEquipment(): Promise<FireEquipment[]> {
    try {
      const equipmentJson = await AsyncStorage.getItem(STORAGE_KEYS.FIRE_EQUIPMENT);
      if (equipmentJson) {
        return JSON.parse(equipmentJson);
      }

      // Создаем тестовые данные
      const sampleEquipment: FireEquipment[] = [
        {
          id: '1',
          type: 'fire_hydrant',
          inventoryNumber: 'ГИД-2024-001',
          location: 'Холл 1 этаж, правая стена',
          objectId: '1',
          lastInspectionDate: '2024-01-10',
          nextInspectionDate: '2024-07-10',
          status: 'active',
          specifications: {
            pressure: 4.5,
            diameter: 50,
          },
          comments: 'Рабочее состояние',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        },
        {
          id: '2',
          type: 'fire_shield',
          location: 'Складская зона, вход',
          objectId: '2',
          lastInspectionDate: '2023-12-15',
          nextInspectionDate: '2024-06-15',
          status: 'active',
          specifications: {
            material: 'металл',
          },
          comments: 'Полный комплект',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        },
        {
          id: '3',
          type: 'fire_hose',
          inventoryNumber: 'РУК-2024-001',
          location: 'Помещение охраны',
          objectId: '1',
          lastInspectionDate: '2022-08-20',
          nextInspectionDate: '2023-08-20',
          status: 'expired',
          specifications: {
            length: 20,
            diameter: 51,
          },
          comments: 'Требуется замена',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        },
      ];

      // ИСПРАВЛЕНО: передаем массив, а не один элемент
      await this.saveFireEquipmentList(sampleEquipment);
      return sampleEquipment;
    } catch (error) {
      console.error('Error getting fire equipment:', error);
      return [];
    }
  }

  // Получение оборудования по объекту
  async getEquipmentByObject(objectId: string): Promise<FireEquipment[]> {
    try {
      const equipment = await this.getFireEquipment();
      return equipment.filter(eq => eq.objectId === objectId);
    } catch (error) {
      console.error('Error getting equipment by object:', error);
      return [];
    }
  }

  // Сохранение оборудования
  async saveFireEquipment(equipment: FireEquipment): Promise<void> {
    try {
      const allEquipment = await this.getFireEquipment();
      const existingIndex = allEquipment.findIndex(eq => eq.id === equipment.id);
      
      if (existingIndex >= 0) {
        allEquipment[existingIndex] = {
          ...equipment,
          updatedAt: new Date().toISOString(),
        };
      } else {
        allEquipment.push({
          ...equipment,
          id: equipment.id || Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await this.saveFireEquipmentList(allEquipment);
    } catch (error) {
      console.error('Error saving fire equipment:', error);
      throw error;
    }
  }

  // Удаление оборудования
  async deleteFireEquipment(equipmentId: string): Promise<void> {
    try {
      const equipment = await this.getFireEquipment();
      const filteredEquipment = equipment.filter(eq => eq.id !== equipmentId);
      await this.saveFireEquipmentList(filteredEquipment);
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

  // ===== ПРИВАТНЫЕ МЕТОДЫ =====

  private async saveFireExtinguishers(extinguishers: FireExtinguisher[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.FIRE_EXTINGUISHERS, JSON.stringify(extinguishers));
  }

  private async saveFireEquipmentList(equipment: FireEquipment[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.FIRE_EQUIPMENT, JSON.stringify(equipment));
  }
}

export default new FireSafetyService();