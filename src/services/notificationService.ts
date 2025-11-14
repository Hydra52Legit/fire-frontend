import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FireSafetyService from './fireSafetyService';
import ObjectService from './objectService';
import { FireExtinguisher, FireEquipment, InspectionObject } from '../types';

// Типы уведомлений
export type NotificationType = 
  | 'extinguisher_expiry'      // Истечение срока огнетушителя
  | 'equipment_expiry'         // Истечение срока оборудования
  | 'object_inspection'        // Проверка объекта
  | 'daily_summary'            // Ежедневный отчет
  | 'immediate_alert';         // Срочное уведомление

export interface NotificationPreference {
  pushEnabled: boolean;
  emailEnabled: boolean;
  daysBefore: number[]; // За сколько дней уведомлять (30, 14, 3, 1)
  immediateAlerts: boolean;
  dailySummary: boolean;
}

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  date: Date;
  data?: any;
}

// Настройки уведомлений по умолчанию
const DEFAULT_PREFERENCES: NotificationPreference = {
  pushEnabled: true,
  emailEnabled: false,
  daysBefore: [30, 14, 7, 3, 1],
  immediateAlerts: true,
  dailySummary: true,
};

class NotificationService {
  private isInitialized = false;

  // Инициализация сервиса уведомлений
  async initialize(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Уведомления работают только на реальных устройствах');
        return false;
      }

      // Запрашиваем разрешения
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Разрешение на уведомления не получено');
        return false;
      }

      // ИСПРАВЛЕНО: Правильная настройка обработчика уведомлений
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
        handleSuccess: () => {},
        handleError: () => {},
      });

      this.isInitialized = true;
      console.log('Сервис уведомлений инициализирован');
      return true;
    } catch (error) {
      console.error('Ошибка инициализации уведомлений:', error);
      return false;
    }
  }

  // Получение настроек уведомлений
  async getPreferences(): Promise<NotificationPreference> {
    try {
      const preferencesJson = await AsyncStorage.getItem('notification_preferences');
      return preferencesJson ? JSON.parse(preferencesJson) : DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  // Сохранение настроек уведомлений
  async savePreferences(preferences: NotificationPreference): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      throw error;
    }
  }

  // Планирование уведомлений для огнетушителей
  async scheduleExtinguisherNotifications(extinguisher: FireExtinguisher): Promise<void> {
    const preferences = await this.getPreferences();
    if (!preferences.pushEnabled) return;

    const expiryDate = new Date(extinguisher.nextServiceDate);
    const now = new Date();

    // Удаляем старые уведомления для этого огнетушителя
    await this.cancelExtinguisherNotifications(extinguisher.id);

    // Планируем уведомления за указанное количество дней
    for (const daysBefore of preferences.daysBefore) {
      const notificationDate = new Date(expiryDate);
      notificationDate.setDate(notificationDate.getDate() - daysBefore);

      // Планируем только если дата в будущем
      if (notificationDate > now) {
        await this.scheduleNotification({
          id: `extinguisher_${extinguisher.id}_${daysBefore}`,
          type: 'extinguisher_expiry',
          title: `Срок огнетушителя истекает через ${daysBefore} ${this.getDayText(daysBefore)}`,
          body: `Огнетушитель ${extinguisher.inventoryNumber} (${this.getExtinguisherTypeText(extinguisher.type)}) требует обслуживания до ${expiryDate.toLocaleDateString('ru-RU')}`,
          date: notificationDate,
          data: {
            extinguisherId: extinguisher.id,
            objectId: extinguisher.objectId,
            daysBefore,
          },
        });
      }
    }

    // Немедленное уведомление если просрочен
    if (expiryDate < now && preferences.immediateAlerts) {
      await this.scheduleImmediateNotification(
        'Просрочен огнетушитель!',
        `Огнетушитель ${extinguisher.inventoryNumber} требует срочного обслуживания`,
        {
          extinguisherId: extinguisher.id,
          objectId: extinguisher.objectId,
        }
      );
    }
  }

  // Планирование уведомлений для оборудования
  async scheduleEquipmentNotifications(equipment: FireEquipment): Promise<void> {
    const preferences = await this.getPreferences();
    if (!preferences.pushEnabled) return;

    const expiryDate = new Date(equipment.nextInspectionDate);
    const now = new Date();

    // Удаляем старые уведомления для этого оборудования
    await this.cancelEquipmentNotifications(equipment.id);

    // Планируем уведомления за указанное количество дней
    for (const daysBefore of preferences.daysBefore) {
      const notificationDate = new Date(expiryDate);
      notificationDate.setDate(notificationDate.getDate() - daysBefore);

      // Планируем только если дата в будущем
      if (notificationDate > now) {
        await this.scheduleNotification({
          id: `equipment_${equipment.id}_${daysBefore}`,
          type: 'equipment_expiry',
          title: `Срок оборудования истекает через ${daysBefore} ${this.getDayText(daysBefore)}`,
          body: `Оборудование ${equipment.inventoryNumber || this.getEquipmentTypeText(equipment.type)} требует проверки до ${expiryDate.toLocaleDateString('ru-RU')}`,
          date: notificationDate,
          data: {
            equipmentId: equipment.id,
            objectId: equipment.objectId,
            daysBefore,
          },
        });
      }
    }

    // Немедленное уведомление если просрочен
    if (expiryDate < now && preferences.immediateAlerts) {
      await this.scheduleImmediateNotification(
        'Просрочено оборудование!',
        `Оборудование ${equipment.inventoryNumber || this.getEquipmentTypeText(equipment.type)} требует срочной проверки`,
        {
          equipmentId: equipment.id,
          objectId: equipment.objectId,
        }
      );
    }
  }

  // Планирование уведомлений для проверок объектов
  async scheduleObjectInspectionNotifications(object: InspectionObject): Promise<void> {
    const preferences = await this.getPreferences();
    if (!preferences.pushEnabled) return;

    // Находим ближайшую проверку
    const upcomingInspections = object.inspections
      .filter(inspection => new Date(inspection.nextInspectionDate) > new Date())
      .sort((a, b) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());

    if (upcomingInspections.length === 0) return;

    const nextInspection = upcomingInspections[0];
    const inspectionDate = new Date(nextInspection.nextInspectionDate);
    const now = new Date();

    // Удаляем старые уведомления для этого объекта
    await this.cancelObjectNotifications(object.id);

    // Планируем уведомление за 30 дней
    const notificationDate = new Date(inspectionDate);
    notificationDate.setDate(notificationDate.getDate() - 30);

    if (notificationDate > now) {
      await this.scheduleNotification({
        id: `object_${object.id}_inspection`,
        type: 'object_inspection',
        title: 'Предстоящая проверка объекта',
        body: `Объект "${object.name}" требует проверки до ${inspectionDate.toLocaleDateString('ru-RU')}`,
        date: notificationDate,
        data: {
          objectId: object.id,
          inspectionId: nextInspection.id,
        },
      });
    }
  }

  // Ежедневное уведомление с отчетом
  async scheduleDailySummary(): Promise<void> {
    const preferences = await this.getPreferences();
    if (!preferences.pushEnabled || !preferences.dailySummary) return;

    // Планируем на 9:00 утра
    const now = new Date();
    const scheduledTime = new Date(now);
    scheduledTime.setHours(9, 0, 0, 0);
    
    // Если уже прошло 9:00, планируем на завтра
    if (scheduledTime < now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await this.scheduleNotification({
      id: `daily_summary_${scheduledTime.toISOString().split('T')[0]}`,
      type: 'daily_summary',
      title: 'Ежедневный отчет по пожарной безопасности',
      body: 'Проверьте статус огнетушителей и оборудования',
      date: scheduledTime,
    });
  }

  // Планирование всех уведомлений
  async scheduleAllNotifications(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Получаем все данные
      const extinguishers = await FireSafetyService.getFireExtinguishers();
      const equipment = await FireSafetyService.getFireEquipment();
      const objects = await ObjectService.getObjects();

      // Планируем уведомления для каждого элемента
      for (const extinguisher of extinguishers) {
        await this.scheduleExtinguisherNotifications(extinguisher);
      }

      for (const equipmentItem of equipment) {
        await this.scheduleEquipmentNotifications(equipmentItem);
      }

      for (const object of objects) {
        await this.scheduleObjectInspectionNotifications(object);
      }

      // Планируем ежедневный отчет
      await this.scheduleDailySummary();

      console.log('Все уведомления запланированы');
    } catch (error) {
      console.error('Ошибка планирования уведомлений:', error);
    }
  }

  // Отмена уведомлений для огнетушителя
  async cancelExtinguisherNotifications(extinguisherId: string): Promise<void> {
    const preferences = await this.getPreferences();
    for (const daysBefore of preferences.daysBefore) {
      await Notifications.cancelScheduledNotificationAsync(`extinguisher_${extinguisherId}_${daysBefore}`);
    }
  }

  // Отмена уведомлений для оборудования
  async cancelEquipmentNotifications(equipmentId: string): Promise<void> {
    const preferences = await this.getPreferences();
    for (const daysBefore of preferences.daysBefore) {
      await Notifications.cancelScheduledNotificationAsync(`equipment_${equipmentId}_${daysBefore}`);
    }
  }

  // Отмена уведомлений для объекта
  async cancelObjectNotifications(objectId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(`object_${objectId}_inspection`);
  }

  // Отмена всех уведомлений
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Все уведомления отменены');
  }

  // Получение запланированных уведомлений
  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    // ИСПРАВЛЕНО: Добавлен тип для параметра
    return notifications.map((notif: any) => ({
      id: notif.identifier,
      type: notif.content.data?.type as NotificationType || 'immediate_alert',
      title: notif.content.title || '',
      body: notif.content.body || '',
      date: new Date((notif.trigger as any).value * 1000),
      data: notif.content.data,
    }));
  }

  // Вспомогательные методы
  private async scheduleNotification(notification: ScheduledNotification): Promise<void> {
    try {
      // ИСПРАВЛЕНО: Правильный формат триггера
      await Notifications.scheduleNotificationAsync({
        identifier: notification.id,
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            ...notification.data,
            type: notification.type,
          },
          sound: true,
          badge: 1,
        },
        trigger: {
          type: 'date',
          date: notification.date.getTime(),
        } as Notifications.DateTriggerInput,
      });
    } catch (error) {
      console.error('Ошибка планирования уведомления:', error);
    }
  }

  private async scheduleImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            ...data,
            type: 'immediate_alert',
          },
          sound: true,
          badge: 1,
        },
        trigger: null, // Немедленное уведомление
      });
    } catch (error) {
      console.error('Ошибка отправки немедленного уведомления:', error);
    }
  }

  private getDayText(days: number): string {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  }

  private getExtinguisherTypeText(type: string): string {
    const typeInfo = FireSafetyService.getExtinguisherTypes().find(t => t.value === type);
    return typeInfo?.label || type;
  }

  private getEquipmentTypeText(type: string): string {
    const typeInfo = FireSafetyService.getEquipmentTypes().find(t => t.value === type);
    return typeInfo?.label || type;
  }

  // Отправка email уведомлений (заглушка - нужно интегрировать с email сервисом)
  async sendEmailNotification(to: string, subject: string, body: string): Promise<void> {
    // TODO: Интеграция с email сервисом (SendGrid, Mailgun, etc.)
    console.log(`Email отправлен на ${to}: ${subject}`);
    console.log(`Текст: ${body}`);
  }
}

export default new NotificationService();