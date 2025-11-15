import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import NotificationService from './notificationService';
import ReportService from './reportService';
import FireSafetyService from './fireSafetyService';
import ObjectService from './objectService';
import { FireExtinguisher, FireEquipment, InspectionObject } from '../types';

const STORAGE_KEYS = {
  AUTOMATION_SETTINGS: 'automation_settings',
  LAST_REPORT_GENERATION: 'last_report_generation',
  SCHEDULED_NOTIFICATIONS: 'scheduled_notifications',
};

export interface AutomationSettings {
  // Отчеты
  autoGenerateReports: boolean;
  reportSchedule: 'daily' | 'weekly' | 'monthly';
  reportTime: string; // HH:mm формат
  reportTypes: string[]; // Типы отчетов для автоматической генерации
  emailReports: boolean;
  emailRecipients: string[];

  // Уведомления
  autoNotifications: boolean;
  notifyOnExpired: boolean;
  notifyOnUpcoming: boolean;
  notifyOnDecommission: boolean;
  notifyDaysBefore: number[]; // За сколько дней до события уведомлять
}

const DEFAULT_SETTINGS: AutomationSettings = {
  autoGenerateReports: false,
  reportSchedule: 'weekly',
  reportTime: '09:00',
  reportTypes: ['expired_objects'],
  emailReports: false,
  emailRecipients: [],
  autoNotifications: true,
  notifyOnExpired: true,
  notifyOnUpcoming: true,
  notifyOnDecommission: true,
  notifyDaysBefore: [30, 14, 7, 3, 1],
};

class AutomationService {
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Загрузить настройки автоматизации
   */
  async getSettings(): Promise<AutomationSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.AUTOMATION_SETTINGS);
      if (settingsJson) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading automation settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Сохранить настройки автоматизации
   */
  async saveSettings(settings: Partial<AutomationSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.AUTOMATION_SETTINGS, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving automation settings:', error);
      throw error;
    }
  }

  /**
   * Запустить автоматизацию
   */
  async startAutomation(): Promise<void> {
    const settings = await this.getSettings();

    if (settings.autoNotifications) {
      await this.scheduleNotifications();
    }

    if (settings.autoGenerateReports) {
      await this.scheduleReports(settings);
    }

    // Проверяем состояние оборудования каждые 6 часов
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      await this.checkAndNotify();
    }, 6 * 60 * 60 * 1000); // 6 часов

    // Первая проверка сразу
    await this.checkAndNotify();
  }

  /**
   * Остановить автоматизацию
   */
  stopAutomation(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Проверить состояние оборудования и отправить уведомления
   */
  async checkAndNotify(): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.autoNotifications) {
        return;
      }

      const now = new Date();
      const extinguishers = await FireSafetyService.getFireExtinguishers();
      const equipment = await FireSafetyService.getFireEquipment();
      const objects = await ObjectService.getObjects();

      // Проверяем огнетушители
      for (const ext of extinguishers) {
        const nextServiceDate = new Date(ext.nextServiceDate);
        const daysUntil = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Просроченные
        if (settings.notifyOnExpired && nextServiceDate < now && ext.status !== 'decommissioned') {
          await this.sendExpiredNotification('extinguisher', ext, objects);
        }

        // Приближающиеся сроки
        if (
          settings.notifyOnUpcoming &&
          nextServiceDate >= now &&
          settings.notifyDaysBefore.includes(daysUntil) &&
          ext.status === 'active'
        ) {
          await this.sendUpcomingNotification('extinguisher', ext, objects, daysUntil);
        }
      }

      // Проверяем оборудование
      for (const eq of equipment) {
        const nextInspectionDate = new Date(eq.nextInspectionDate);
        const daysUntil = Math.ceil(
          (nextInspectionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Просроченные
        if (settings.notifyOnExpired && nextInspectionDate < now && eq.status !== 'decommissioned') {
          await this.sendExpiredNotification('equipment', eq, objects);
        }

        // Приближающиеся сроки
        if (
          settings.notifyOnUpcoming &&
          nextInspectionDate >= now &&
          settings.notifyDaysBefore.includes(daysUntil) &&
          eq.status === 'active'
        ) {
          await this.sendUpcomingNotification('equipment', eq, objects, daysUntil);
        }

        // Требует списания (только для администраторов)
        if (settings.notifyOnDecommission && eq.status === 'expired') {
          await this.sendDecommissionNotification(eq, objects);
        }
      }
    } catch (error) {
      console.error('Error checking and notifying:', error);
    }
  }

  /**
   * Отправить уведомление о просроченном элементе
   */
  private async sendExpiredNotification(
    type: 'extinguisher' | 'equipment',
    item: FireExtinguisher | FireEquipment,
    objects: InspectionObject[]
  ): Promise<void> {
    try {
      const object = objects.find((obj) => obj.id === item.objectId);
      const itemName = type === 'extinguisher' ? 'Огнетушитель' : 'Оборудование';
      const itemId = (item as any).inventoryNumber || item.id;

      const title = `Просрочен ${itemName.toLowerCase()}`;
      const body = `${itemName} ${itemId} на объекте "${object?.name || 'Неизвестно'}" требует немедленного внимания`;

      // Отправляем через локальные уведомления
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'expired',
            itemType: type,
            itemId: item.id,
            objectId: item.objectId,
          },
        },
        trigger: null, // Немедленно
      });
    } catch (error) {
      console.error('Error sending expired notification:', error);
    }
  }

  /**
   * Отправить уведомление о приближающемся сроке
   */
  private async sendUpcomingNotification(
    type: 'extinguisher' | 'equipment',
    item: FireExtinguisher | FireEquipment,
    objects: InspectionObject[],
    daysUntil: number
  ): Promise<void> {
    try {
      const object = objects.find((obj) => obj.id === item.objectId);
      const itemName = type === 'extinguisher' ? 'Огнетушитель' : 'Оборудование';
      const itemId = (item as any).inventoryNumber || item.id;

      const title = `Требуется проверка ${itemName.toLowerCase()}`;
      const body = `${itemName} ${itemId} на объекте "${object?.name || 'Неизвестно'}" требует проверки через ${daysUntil} ${this.getDaysText(daysUntil)}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'upcoming',
            itemType: type,
            itemId: item.id,
            objectId: item.objectId,
            daysUntil,
          },
        },
        trigger: null, // Немедленно
      });
    } catch (error) {
      console.error('Error sending upcoming notification:', error);
    }
  }

  /**
   * Отправить уведомление о необходимости списания
   */
  private async sendDecommissionNotification(
    equipment: FireEquipment,
    objects: InspectionObject[]
  ): Promise<void> {
    try {
      const object = objects.find((obj) => obj.id === equipment.objectId);
      const itemId = equipment.inventoryNumber || equipment.id;

      const title = 'Требуется списание оборудования';
      const body = `Оборудование ${itemId} на объекте "${object?.name || 'Неизвестно'}" неисправно и требует списания`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'decommission',
            itemType: 'equipment',
            itemId: equipment.id,
            objectId: equipment.objectId,
          },
        },
        trigger: null, // Немедленно
      });
    } catch (error) {
      console.error('Error sending decommission notification:', error);
    }
  }

  /**
   * Запланировать уведомления
   */
  private async scheduleNotifications(): Promise<void> {
    // Уведомления планируются через checkAndNotify
    // Этот метод можно расширить для более сложной логики
  }

  /**
   * Запланировать генерацию отчетов
   */
  private async scheduleReports(settings: AutomationSettings): Promise<void> {
    // В мобильном приложении сложно реализовать точное расписание
    // Поэтому отчеты генерируются при открытии экрана Reports
    // Для полноценной автоматизации нужен бэкенд-сервис
  }

  /**
   * Автоматически сгенерировать отчеты по расписанию
   */
  async generateScheduledReports(): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.autoGenerateReports) {
        return;
      }

      const lastGeneration = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REPORT_GENERATION);
      const now = new Date();
      let shouldGenerate = false;

      if (!lastGeneration) {
        shouldGenerate = true;
      } else {
        const lastDate = new Date(lastGeneration);
        const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (settings.reportSchedule) {
          case 'daily':
            shouldGenerate = daysSince >= 1;
            break;
          case 'weekly':
            shouldGenerate = daysSince >= 7;
            break;
          case 'monthly':
            shouldGenerate = daysSince >= 30;
            break;
        }
      }

      if (shouldGenerate) {
        for (const reportType of settings.reportTypes) {
          try {
            switch (reportType) {
              case 'expired_objects':
                await ReportService.generateExpiredObjectsReport();
                break;
              case 'violations_stats':
                await ReportService.generateViolationsStatsReport();
                break;
            }
          } catch (error) {
            console.error(`Error generating report ${reportType}:`, error);
          }
        }

        await AsyncStorage.setItem(STORAGE_KEYS.LAST_REPORT_GENERATION, now.toISOString());
      }
    } catch (error) {
      console.error('Error generating scheduled reports:', error);
    }
  }

  /**
   * Получить правильное склонение для слова "день"
   */
  private getDaysText(days: number): string {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  }
}

export default new AutomationService();

