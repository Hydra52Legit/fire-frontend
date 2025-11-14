export type ObjectType = 
  | 'administrative'    // Административное здание
  | 'shopping_center'   // Торговый центр  
  | 'school'           // Школа
  | 'production'       // Производственный цех
  | 'warehouse'        // Склад
  | 'cafe'             // Кафе/ресторан
  | 'hospital';        // Больница

export type FireSafetyClass = 'F1.1' | 'F1.2' | 'F1.3' | 'F2' | 'F3' | 'F4' | 'F5';

export type ObjectStatus = 'active' | 'inactive' | 'archived';

export type UserRole = 'admin' | 'inspector' | 'viewer';

export type DocumentType = 
  | 'evacuation_plan'     // Схемы эвакуации
  | 'fire_safety_plan'    // Планы противопожарных систем
  | 'safety_declaration'  // Декларация пожарной безопасности
  | 'inspection_act'      // Акт проверки
  | 'other';              // Иные документы

export interface ResponsiblePerson {
  id: string;
  fullName: string;
  position: string;
  workPhone?: string;
  mobilePhone?: string;
  email?: string;
  assignedDate: string;
  isCurrent: boolean;
}

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  fileUri: string;
  uploadDate: string;
  expirationDate?: string;
  version: number;
  fileSize?: number;
}

export interface Inspection {
  id: string;
  date: string;
  inspector: string;
  result: 'passed' | 'failed' | 'requires_improvement';
  comments?: string;
  violations?: string[];
  nextInspectionDate: string;
}

export interface InspectionObject {
  id: string;
  name: string;
  legalAddress: string;
  actualAddress: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: ObjectType;
  fireSafetyClass: FireSafetyClass;
  responsiblePersons: ResponsiblePerson[];
  documents: Document[];
  inspections: Inspection[];
  status: ObjectStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  position: string;
  role: UserRole;
  phone?: string;
  assignedObjects?: string[]; // ID объектов за которые отвечает
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  needsPin: boolean;
}


// Добавим после существующих типов:

export type ExtinguisherType = 
  | 'powder'        // Порошковый
  | 'co2'           // Углекислотный
  | 'water'         // Водный
  | 'foam'          // Пенный
  | 'air_emulsion'; // Воздушно-эмульсионный

export type FireEquipmentType =
  | 'fire_hydrant'     // Пожарный кран
  | 'fire_hose'        // Пожарный гидрант
  | 'fire_shield'      // Пожарный щит
  | 'fire_alarm'       // Пожарная сигнализация
  | 'sprinkler';       // Спринклерная система

export type EquipmentStatus = 
  | 'active'          // Активен
  | 'maintenance'     // На обслуживании
  | 'expired'         // Просрочен
  | 'decommissioned'; // Списано

export interface FireExtinguisher {
  id: string;
  inventoryNumber: string;     // Инвентарный номер
  type: ExtinguisherType;      // Тип огнетушителя
  capacity: number;            // Вместимость (кг или л)
  location: string;            // Место установки
  objectId: string;            // ID объекта
  lastServiceDate: string;     // Дата последней заправки/проверки
  nextServiceDate: string;     // Дата следующей проверки
  status: EquipmentStatus;     // Статус
  manufacturer?: string;       // Производитель
  manufactureDate?: string;    // Дата изготовления
  comments?: string;           // Комментарии
  createdAt: string;
  updatedAt: string;
}

export interface FireEquipment {
  id: string;
  type: FireEquipmentType;     // Тип оборудования
  inventoryNumber?: string;    // Инвентарный номер (если есть)
  location: string;            // Место установки
  objectId: string;            // ID объекта
  lastInspectionDate: string;  // Дата последней проверки
  nextInspectionDate: string;  // Дата следующей проверки
  status: EquipmentStatus;     // Статус
  specifications?: {           // Характеристики
    pressure?: number;         // Давление (для гидрантов)
    diameter?: number;         // Диаметр (мм)
    length?: number;           // Длина (м)
    material?: string;         // Материал
  };
  comments?: string;           // Комментарии
  createdAt: string;
  updatedAt: string;
}

export interface FireSafetyStats {
  totalExtinguishers: number;
  expiredExtinguishers: number;
  totalEquipment: number;
  expiredEquipment: number;
  upcomingInspections: number;
}