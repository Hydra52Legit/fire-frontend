export type ObjectType = 
  | 'administrative'    // Административное здание
  | 'shopping_center'   // Торговый центр  
  | 'school'           // Школа
  | 'production'       // Производственный цех
  | 'warehouse'        // Склад
  | 'cafe'             // Кафе/ресторан
  | 'hospital';        // Больница

export type FireSafetyClass = 'F1.1' | 'F1.2' | 'F1.3' | 'F2' | 'F3' | 'F4' | 'F5';

export type DocumentType = 
  | 'evacuation_plan'     // Схемы эвакуации
  | 'fire_safety_plan'    // Планы противопожарных систем
  | 'safety_declaration'  // Декларация пожарной безопасности
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'inspector' | 'viewer';
  fullName: string;
}