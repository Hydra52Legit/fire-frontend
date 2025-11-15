// src/screens/ReportsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { Violation, ReportData } from '../types';
import ReportService from '../services/reportService';
import { useAuth } from '../contexts/AuthContext';

type ReportsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reports'>;

export default function ReportsScreen() {
  const navigation = useNavigation<ReportsScreenNavigationProp>();
  const { user } = useAuth();

  const [violations, setViolations] = useState<Violation[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'violations' | 'reports'>('violations');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [violationsData, reportsData] = await Promise.all([
        ReportService.getViolations(),
        ReportService.getGeneratedReports(),
      ]);
      setViolations(violationsData);
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  const generateExpiredObjectsReport = async () => {
    try {
      setIsLoading(true);
      const report = await ReportService.generateExpiredObjectsReport();
      await loadData();
      Alert.alert('Успех', 'Отчет успешно сгенерирован');
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Ошибка', 'Не удалось сгенерировать отчет');
    } finally {
      setIsLoading(false);
    }
  };

  const generateViolationsStatsReport = async () => {
    try {
      setIsLoading(true);
      const report = await ReportService.generateViolationsStatsReport();
      await loadData();
      Alert.alert('Успех', 'Отчет успешно сгенерирован');
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Ошибка', 'Не удалось сгенерировать отчет');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: Violation['severity']) => {
    switch (severity) {
      case 'low': return '#34C759';
      case 'medium': return '#FF9500';
      case 'high': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getSeverityLabel = (severity: Violation['severity']) => {
    switch (severity) {
      case 'low': return 'Низкая';
      case 'medium': return 'Средняя';
      case 'high': return 'Высокая';
      default: return 'Не указана';
    }
  };

  const getStatusColor = (status: Violation['status']) => {
    switch (status) {
      case 'active': return '#FF3B30';
      case 'in_progress': return '#FF9500';
      case 'fixed': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getStatusLabel = (status: Violation['status']) => {
    switch (status) {
      case 'active': return 'Активно';
      case 'in_progress': return 'В работе';
      case 'fixed': return 'Исправлено';
      default: return 'Неизвестно';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка данных...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Отчеты и нарушения</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Табы */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'violations' && styles.activeTab]}
          onPress={() => setActiveTab('violations')}
        >
          <Text style={[styles.tabText, activeTab === 'violations' && styles.activeTabText]}>
            Нарушения ({violations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            Отчеты ({reports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Контент */}
      <ScrollView style={styles.content}>
        {activeTab === 'violations' ? (
          <View>
            {violations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text" size={64} color="#E5E5EA" />
                <Text style={styles.emptyStateTitle}>Нарушения не найдены</Text>
                <Text style={styles.emptyStateText}>
                  Нарушения будут отображаться здесь после создания актов проверки
                </Text>
              </View>
            ) : (
              violations.map((violation) => (
                <View key={violation.id} style={styles.violationCard}>
                  <View style={styles.violationHeader}>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(violation.severity) }]}>
                      <Text style={styles.severityText}>{getSeverityLabel(violation.severity)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(violation.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(violation.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.violationType}>{ReportService.getViolationTypes().find(t => t.value === violation.type)?.label || violation.type}</Text>
                  <Text style={styles.violationDescription}>{violation.description}</Text>
                  <Text style={styles.violationDate}>
                    Обнаружено: {new Date(violation.detectedDate).toLocaleDateString('ru-RU')}
                  </Text>
                  {violation.inspector && (
                    <Text style={styles.violationInspector}>Инспектор: {violation.inspector}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        ) : (
          <View>
            {/* Кнопки генерации отчетов */}
            <View style={styles.reportActions}>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateExpiredObjectsReport}
              >
                <Ionicons name="document" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>Отчет по просроченным</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateViolationsStatsReport}
              >
                <Ionicons name="stats-chart" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>Статистика нарушений</Text>
              </TouchableOpacity>
            </View>

            {reports.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text" size={64} color="#E5E5EA" />
                <Text style={styles.emptyStateTitle}>Отчеты не найдены</Text>
                <Text style={styles.emptyStateText}>
                  Сгенерируйте отчет, используя кнопки выше
                </Text>
              </View>
            ) : (
              reports.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                  <View style={styles.reportHeader}>
                    <Ionicons name="document-text" size={24} color="#007AFF" />
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <Text style={styles.reportDescription}>{report.description}</Text>
                      <Text style={styles.reportDate}>
                        {new Date(report.generatedAt).toLocaleDateString('ru-RU')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  violationCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  violationType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  violationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  violationDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  violationInspector: {
    fontSize: 12,
    color: '#999',
  },
  reportActions: {
    marginBottom: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reportCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
});

