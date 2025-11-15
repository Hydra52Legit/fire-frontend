// src/services/reportService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ReportType, 
  ViolationType, 
  Violation, 
  InspectionReport, 
  ReportData,
  InspectionObject,
  FireExtinguisher,
  FireEquipment
} from '../types';
import DataService from './dataService';
import FireSafetyService from './fireSafetyService';

// TODO: После реализации API для inspections и violations в бэкенде, заменить AsyncStorage на API вызовы
// Временное решение для отображения фронта - данные хранятся локально
const STORAGE_KEYS = {
  VIOLATIONS: 'fire_inspection_violations',
  INSPECTION_REPORTS: 'fire_inspection_reports',
  GENERATED_REPORTS: 'fire_inspection_generated_reports',
};

class ReportService {
  // ===== НАРУШЕНИЯ =====
  // TODO: Интегрировать с API /api/inspections/violations после реализации в бэкенде
  // Временное решение - данные хранятся локально в AsyncStorage

  async getViolations(): Promise<Violation[]> {
    try {
      const violationsJson = await AsyncStorage.getItem(STORAGE_KEYS.VIOLATIONS);
      if (violationsJson) {
        return JSON.parse(violationsJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting violations:', error);
      return [];
    }
  }

  async saveViolation(violation: Violation): Promise<void> {
    try {
      const violations = await this.getViolations();
      const existingIndex = violations.findIndex(v => v.id === violation.id);
      
      if (existingIndex >= 0) {
        violations[existingIndex] = violation;
      } else {
        violations.push({
          ...violation,
          id: violation.id || Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await AsyncStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(violations));
    } catch (error) {
      console.error('Error saving violation:', error);
      throw error;
    }
  }

  // ===== АКТЫ ПРОВЕРОК =====
  // TODO: Интегрировать с API /api/inspections после реализации в бэкенде
  // Временное решение - данные хранятся локально в AsyncStorage

  async getInspectionReports(): Promise<InspectionReport[]> {
    try {
      const reportsJson = await AsyncStorage.getItem(STORAGE_KEYS.INSPECTION_REPORTS);
      if (reportsJson) {
        return JSON.parse(reportsJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting inspection reports:', error);
      return [];
    }
  }

  async saveInspectionReport(report: InspectionReport): Promise<void> {
    try {
      const reports = await this.getInspectionReports();
      const existingIndex = reports.findIndex(r => r.id === report.id);
      
      if (existingIndex >= 0) {
        reports[existingIndex] = report;
      } else {
        reports.push({
          ...report,
          id: report.id || Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await AsyncStorage.setItem(STORAGE_KEYS.INSPECTION_REPORTS, JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving inspection report:', error);
      throw error;
    }
  }

  // ===== ГЕНЕРАЦИЯ ОТЧЕТОВ =====

  async generateExpiredObjectsReport(): Promise<ReportData> {
    const objects = await DataService.getObjects();
    const extinguishers = await FireSafetyService.getFireExtinguishers();
    const equipment = await FireSafetyService.getFireEquipment();

    const now = new Date();
    
    const expiredObjects = objects.filter(obj => {
      const hasExpiredDocuments = obj.documents.some(doc => 
        doc.expirationDate && new Date(doc.expirationDate) < now
      );
      
      const hasExpiredExtinguishers = extinguishers.some(ext => 
        ext.objectId === obj.id && new Date(ext.nextServiceDate) < now
      );
      
      const hasExpiredEquipment = equipment.some(eq => 
        eq.objectId === obj.id && new Date(eq.nextInspectionDate) < now
      );

      return hasExpiredDocuments || hasExpiredExtinguishers || hasExpiredEquipment;
    });

    const report: ReportData = {
      id: `expired_objects_${Date.now()}`,
      type: 'expired_objects',
      title: 'Реестр объектов с истекшими сроками',
      description: `Сформирован ${new Date().toLocaleDateString('ru-RU')}`,
      generatedAt: new Date().toISOString(),
      data: {
        totalObjects: objects.length,
        expiredObjects: expiredObjects.length,
        objects: expiredObjects.map(obj => ({
          id: obj.id,
          name: obj.name,
          address: obj.actualAddress,
          expiredDocuments: obj.documents.filter(doc => 
            doc.expirationDate && new Date(doc.expirationDate) < now
          ).length,
          expiredExtinguishers: extinguishers.filter(ext => 
            ext.objectId === obj.id && new Date(ext.nextServiceDate) < now
          ).length,
          expiredEquipment: equipment.filter(eq => 
            eq.objectId === obj.id && new Date(eq.nextInspectionDate) < now
          ).length,
        }))
      }
    };

    await this.saveGeneratedReport(report);
    return report;
  }

  async generateViolationsStatsReport(): Promise<ReportData> {
    const violations = await this.getViolations();
    const objects = await DataService.getObjects();

    const stats = {
      totalViolations: violations.length,
      byType: {} as Record<ViolationType, number>,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
      },
      byStatus: {
        active: 0,
        fixed: 0,
        in_progress: 0,
      },
      byObject: {} as Record<string, number>,
    };

    violations.forEach(violation => {
      // Статистика по типам
      stats.byType[violation.type] = (stats.byType[violation.type] || 0) + 1;
      
      // Статистика по серьезности
      stats.bySeverity[violation.severity]++;
      
      // Статистика по статусу
      stats.byStatus[violation.status]++;
      
      // Статистика по объектам
      stats.byObject[violation.objectId] = (stats.byObject[violation.objectId] || 0) + 1;
    });

    const report: ReportData = {
      id: `violations_stats_${Date.now()}`,
      type: 'violations_stats',
      title: 'Статистика по нарушениям',
      description: `Сформирован ${new Date().toLocaleDateString('ru-RU')}`,
      generatedAt: new Date().toISOString(),
      data: stats
    };

    await this.saveGeneratedReport(report);
    return report;
  }

  async generateInspectionAct(objectId: string, inspectionData: any): Promise<ReportData> {
    const object = (await DataService.getObjects()).find(obj => obj.id === objectId);
    const extinguishers = await FireSafetyService.getExtinguishersByObject(objectId);
    const equipment = await FireSafetyService.getEquipmentByObject(objectId);

    const report: ReportData = {
      id: `inspection_act_${objectId}_${Date.now()}`,
      type: 'inspection_act',
      title: `Акт проверки объекта "${object?.name}"`,
      description: `Сформирован ${new Date().toLocaleDateString('ru-RU')}`,
      generatedAt: new Date().toISOString(),
      data: {
        object,
        inspectionData,
        extinguishers,
        equipment,
        summary: {
          totalExtinguishers: extinguishers.length,
          expiredExtinguishers: extinguishers.filter(ext => 
            new Date(ext.nextServiceDate) < new Date()
          ).length,
          totalEquipment: equipment.length,
          expiredEquipment: equipment.filter(eq => 
            new Date(eq.nextInspectionDate) < new Date()
          ).length,
        }
      }
    };

    await this.saveGeneratedReport(report);
    return report;
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
  // TODO: После реализации API для отчетов в бэкенде, заменить AsyncStorage на API вызовы
  // Временное решение - сгенерированные отчеты хранятся локально

  async getGeneratedReports(): Promise<ReportData[]> {
    try {
      const reportsJson = await AsyncStorage.getItem(STORAGE_KEYS.GENERATED_REPORTS);
      if (reportsJson) {
        return JSON.parse(reportsJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting generated reports:', error);
      return [];
    }
  }

  private async saveGeneratedReport(report: ReportData): Promise<void> {
    try {
      const reports = await this.getGeneratedReports();
      reports.unshift(report); // Добавляем в начало
      await AsyncStorage.setItem(STORAGE_KEYS.GENERATED_REPORTS, JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving generated report:', error);
      throw error;
    }
  }

  // Получение типов нарушений
  getViolationTypes(): { value: ViolationType; label: string }[] {
    return [
      { value: 'fire_safety', label: 'Нарушение пожарной безопасности' },
      { value: 'equipment_expired', label: 'Просроченное оборудование' },
      { value: 'documentation', label: 'Документация' },
      { value: 'evacuation', label: 'Эвакуационные пути' },
      { value: 'other', label: 'Иные нарушения' },
    ];
  }

  // Получение уровней серьезности
  getSeverityLevels(): { value: 'low' | 'medium' | 'high'; label: string }[] {
    return [
      { value: 'low', label: 'Низкая' },
      { value: 'medium', label: 'Средняя' },
      { value: 'high', label: 'Высокая' },
    ];
  }
}

export default new ReportService();