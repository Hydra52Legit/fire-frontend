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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { FireSafetyStats } from '../types';
import FireSafetyService from '../services/fireSafetyService';
import { useAuth } from '../contexts/AuthContext';

type FireSafetyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FireSafety'>;

export default function FireSafetyScreen() {
  const navigation = useNavigation<FireSafetyScreenNavigationProp>();
  const { user } = useAuth();

  const [stats, setStats] = useState<FireSafetyStats>({
    totalExtinguishers: 0,
    expiredExtinguishers: 0,
    totalEquipment: 0,
    expiredEquipment: 0,
    upcomingInspections: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const statsData = await FireSafetyService.getFireSafetyStats();
      setStats(statsData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить статистику');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  // ИСПРАВЛЕНО: Правильное использование навигации с TypeScript
  const handleAddExtinguisher = () => {
    navigation.navigate('AddEditExtinguisher', { extinguisherId: undefined });
  };

  const handleAddEquipment = () => {
    navigation.navigate('AddEditEquipment', { equipmentId: undefined });
  };

  const handleViewExtinguishers = () => {
    navigation.navigate('ExtinguishersList');
  };

  const handleViewEquipment = () => {
    navigation.navigate('EquipmentList');
  };

  const getStatusColor = (count: number, total: number) => {
    if (count === 0) return '#34C759';
    if (count / total < 0.1) return '#FF9500';
    return '#FF3B30';
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.title}>Пожарная безопасность</Text>
        <Text style={styles.subtitle}>Учет средств и оборудования</Text>
      </View>

      {/* Статистика */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Общая статистика</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{stats.totalExtinguishers}</Text>
            <Text style={styles.statLabel}>Всего огнетушителей</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="warning" size={24} color={getStatusColor(stats.expiredExtinguishers, stats.totalExtinguishers || 1)} />
            <Text style={[styles.statNumber, { color: getStatusColor(stats.expiredExtinguishers, stats.totalExtinguishers || 1) }]}>
              {stats.expiredExtinguishers}
            </Text>
            <Text style={styles.statLabel}>Просрочено огнетушителей</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="hardware-chip" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{stats.totalEquipment}</Text>
            <Text style={styles.statLabel}>Единиц оборудования</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={24} color={getStatusColor(stats.expiredEquipment, stats.totalEquipment || 1)} />
            <Text style={[styles.statNumber, { color: getStatusColor(stats.expiredEquipment, stats.totalEquipment || 1) }]}>
              {stats.expiredEquipment}
            </Text>
            <Text style={styles.statLabel}>Просрочено оборудования</Text>
          </View>
        </View>

        <View style={styles.upcomingCard}>
          <Ionicons name="calendar" size={20} color="#FF9500" />
          <View style={styles.upcomingInfo}>
            <Text style={styles.upcomingTitle}>Предстоящие проверки</Text>
            <Text style={styles.upcomingCount}>{stats.upcomingInspections} в ближайшие 30 дней</Text>
          </View>
        </View>
      </View>

      {/* Быстрые действия */}
      {user?.role === 'admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Быстрые действия</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleAddExtinguisher}>
              <View style={[styles.actionIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Добавить огнетушитель</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleAddEquipment}>
              <View style={[styles.actionIcon, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="construct" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Добавить оборудование</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Навигация по разделам */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Разделы учета</Text>

        <TouchableOpacity style={styles.navCard} onPress={handleViewExtinguishers}>
          <View style={styles.navCardLeft}>
            <View style={[styles.navIcon, { backgroundColor: '#FF6B6B' }]}>
              <Ionicons name="flame" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.navTitle}>Огнетушители</Text>
              <Text style={styles.navSubtitle}>
                {stats.totalExtinguishers} единиц • {stats.expiredExtinguishers} просрочено
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={handleViewEquipment}>
          <View style={styles.navCardLeft}>
            <View style={[styles.navIcon, { backgroundColor: '#4ECDC4' }]}>
              <Ionicons name="hardware-chip" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.navTitle}>Пожарное оборудование</Text>
              <Text style={styles.navSubtitle}>
                {stats.totalEquipment} единиц • {stats.expiredEquipment} просрочено
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Уведомления */}
      {(stats.expiredExtinguishers > 0 || stats.expiredEquipment > 0) && (
        <View style={styles.alertSection}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={20} color="#FF3B30" />
            <Text style={styles.alertTitle}>Требуют внимания</Text>
          </View>
          
          {stats.expiredExtinguishers > 0 && (
            <Text style={styles.alertText}>
              • {stats.expiredExtinguishers} огнетушителей просрочены
            </Text>
          )}
          
          {stats.expiredEquipment > 0 && (
            <Text style={styles.alertText}>
              • {stats.expiredEquipment} единиц оборудования просрочены
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  upcomingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 2,
  },
  upcomingCount: {
    fontSize: 12,
    color: '#856404',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'center',
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  navCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  navSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  alertSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F8D7DA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#721C24',
    marginLeft: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#721C24',
    marginBottom: 4,
  },
});