export type RootStackParamList = {
  // Аутентификация
  Login: undefined;
  Register: undefined;
  PinCode: undefined;
  
  // Основные экраны
  Home: undefined;
  
  Profile: undefined;
  Reports: undefined;
  Tabs: undefined;
  
  // Объекты
  ObjectsList: undefined;
  AddEditObject: { objectId?: string; coordinates?: { latitude: number; longitude: number } };
  ObjectDetails: { objectId: string };
  MapPicker: { 
    initialCoordinates?: { latitude: number; longitude: number };
    onSelect?: (coordinates: { latitude: number; longitude: number }) => void;
  };
  
  // Огнетушители
  ExtinguishersList: undefined;
  AddEditExtinguisher: { extinguisherId?: string };
  
  // Оборудование
  EquipmentList: undefined;
  AddEditEquipment: { equipmentId?: string };
  
  // Пожарная безопасность
  FireSafety: { objectId: string };

  // Настройки уведомлений
  NotificationSettings: undefined;
  CreateInspection: undefined;
  
};

export type TabParamList = {
  Home: undefined;
  Objects: undefined;
  Profile: undefined;
};