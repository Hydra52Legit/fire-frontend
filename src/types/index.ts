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