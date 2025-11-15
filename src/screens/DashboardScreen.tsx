import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import FireSafetyService from '../services/fireSafetyService';
import ObjectService from '../services/objectService';
import { FireSafetyStats, InspectionObject, FireExtinguisher, FireEquipment, EquipmentStatus } from '../types';
import { spacing, theme as themeConfig } from '../theme';
import { ScreenHeader } from '../components/layout';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface ExtendedStats extends FireSafetyStats {
  totalObjects: number;
  activeObjects: number;
  objectsRequiringAttention: number;
  equipmentByStatus: {
    active: number;
    maintenance: number;
    expired: number;
    decommissioned: number;
  };
  extinguishersByStatus: {
    active: number;
    maintenance: number;
    expired: number;
    decommissioned: number;
  };
}

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [stats, setStats] = useState<ExtendedStats>({
    totalExtinguishers: 0,
    expiredExtinguishers: 0,
    totalEquipment: 0,
    expiredEquipment: 0,
    upcomingInspections: 0,
    totalObjects: 0,
    activeObjects: 0,
    objectsRequiringAttention: 0,
    equipmentByStatus: {
      active: 0,
      maintenance: 0,
      expired: 0,
      decommissioned: 0,
    },
    extinguishersByStatus: {
      active: 0,
      maintenance: 0,
      expired: 0,
      decommissioned: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Загружаем базовую статистику
      const basicStats = await FireSafetyService.getFireSafetyStats();
      
      // Загружаем объекты
      const objects = await ObjectService.getObjects();
      const activeObjects = objects.filter(obj => obj.status === 'active');
      
      // Загружаем все огнетушители и оборудование
      const extinguishers = await FireSafetyService.getFireExtinguishers();
      const equipment = await FireSafetyService.getFireEquipment();
      
      // Подсчитываем статусы
      const equipmentByStatus = {
        active: equipment.filter(eq => eq.status === 'active').length,
        maintenance: equipment.filter(eq => eq.status === 'maintenance').length,
        expired: equipment.filter(eq => eq.status === 'expired').length,
        decommissioned: equipment.filter(eq => eq.status === 'decommissioned').length,
      };
      
      const extinguishersByStatus = {
        active: extinguishers.filter(ext => ext.status === 'active').length,
        maintenance: extinguishers.filter(ext => ext.status === 'maintenance').length,
        expired: extinguishers.filter(ext => ext.status === 'expired').length,
        decommissioned: extinguishers.filter(ext => ext.status === 'decommissioned').length,
      };
      
      // Объекты, требующие внимания (с просроченным оборудованием)
      const now = new Date();
      const objectsRequiringAttention = objects.filter(obj => {
        // Проверяем, есть ли у объекта просроченное оборудование или огнетушители
        // Это упрощенная проверка - в реальности нужно загружать оборудование для каждого объекта
        return obj.status === 'active';
      }).length;
      
      setStats({
        ...basicStats,
        totalObjects: objects.length,
        activeObjects: activeObjects.length,
        objectsRequiringAttention,
        equipmentByStatus,
        extinguishersByStatus,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, []);

  const getStatusColor = (status: EquipmentStatus) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'maintenance':
        return colors.warning;
      case 'expired':
        return colors.error;
      case 'decommissioned':
        return colors.textTertiary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: EquipmentStatus) => {
    switch (status) {
      case 'active':
        return 'Исправно';
      case 'maintenance':
        return 'На обслуживании';
      case 'expired':
        return 'Просрочено';
      case 'decommissioned':
        return 'Списано';
      default:
        return status;
    }
  };

  const StatCard: React.FC<{
    icon: string;
    title: string;
    value: number | string;
    subtitle?: string;
    color?: string;
    onPress?: () => void;
  }> = ({ icon, title, value, subtitle, color = colors.primary, onPress }) => {
    const CardComponent = onPress ? TouchableOpacity : View;
    return (
      <CardComponent
        style={[
          styles.statCard,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
        )}
      </CardComponent>
    );
  };

  const StatusBar: React.FC<{
    label: string;
    value: number;
    total: number;
    color: string;
  }> = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <View style={styles.statusBarContainer}>
        <View style={styles.statusBarHeader}>
          <Text style={[styles.statusBarLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.statusBarValue, { color: colors.textSecondary }]}>
            {value} / {total}
          </Text>
        </View>
        <View
          style={[
            styles.statusBarBackground,
            { backgroundColor: colors.borderLight },
          ]}
        >
          <View
            style={[
              styles.statusBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Аналитика" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Загрузка данных...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Аналитика и отчеты" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Общая статистика */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Общая статистика</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="business"
              title="Объектов"
              value={stats.totalObjects}
              subtitle={`Активных: ${stats.activeObjects}`}
              color={colors.primary}
              onPress={() => navigation.navigate('ObjectsList')}
            />
            <StatCard
              icon="flame"
              title="Огнетушителей"
              value={stats.totalExtinguishers}
              subtitle={`Просрочено: ${stats.expiredExtinguishers}`}
              color={colors.error}
              onPress={() => navigation.navigate('ExtinguishersList')}
            />
            <StatCard
              icon="construct"
              title="Оборудования"
              value={stats.totalEquipment}
              subtitle={`Просрочено: ${stats.expiredEquipment}`}
              color={colors.warning}
              onPress={() => navigation.navigate('EquipmentList')}
            />
            <StatCard
              icon="calendar"
              title="Проверки"
              value={stats.upcomingInspections}
              subtitle="В ближайшие 30 дней"
              color={colors.info}
            />
          </View>
        </View>

        {/* Статусы огнетушителей */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Статусы огнетушителей</Text>
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
            ]}
          >
            <StatusBar
              label="Исправно"
              value={stats.extinguishersByStatus.active}
              total={stats.totalExtinguishers}
              color={getStatusColor('active')}
            />
            <StatusBar
              label="На обслуживании"
              value={stats.extinguishersByStatus.maintenance}
              total={stats.totalExtinguishers}
              color={getStatusColor('maintenance')}
            />
            <StatusBar
              label="Просрочено"
              value={stats.extinguishersByStatus.expired}
              total={stats.totalExtinguishers}
              color={getStatusColor('expired')}
            />
            <StatusBar
              label="Списано"
              value={stats.extinguishersByStatus.decommissioned}
              total={stats.totalExtinguishers}
              color={getStatusColor('decommissioned')}
            />
          </View>
        </View>

        {/* Статусы оборудования */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Статусы оборудования</Text>
          <View
            style={[
              styles.statusContainer,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
            ]}
          >
            <StatusBar
              label="Исправно"
              value={stats.equipmentByStatus.active}
              total={stats.totalEquipment}
              color={getStatusColor('active')}
            />
            <StatusBar
              label="На обслуживании"
              value={stats.equipmentByStatus.maintenance}
              total={stats.totalEquipment}
              color={getStatusColor('maintenance')}
            />
            <StatusBar
              label="Просрочено"
              value={stats.equipmentByStatus.expired}
              total={stats.totalEquipment}
              color={getStatusColor('expired')}
            />
            <StatusBar
              label="Списано"
              value={stats.equipmentByStatus.decommissioned}
              total={stats.totalEquipment}
              color={getStatusColor('decommissioned')}
            />
          </View>
        </View>

        {/* Быстрые действия */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Быстрые действия</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => navigation.navigate('Reports')}
            >
              <Ionicons name="document-text" size={24} color={colors.textLight} />
              <Text style={[styles.actionButtonText, { color: colors.textLight }]}>Отчеты</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              ]}
              onPress={() => navigation.navigate('FireSafety')}
            >
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Пожарная безопасность
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: 16,
    },
    section: {
      padding: spacing.lg,
      paddingBottom: 0,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -spacing.xs,
    },
    statCard: {
      width: '48%',
      margin: spacing.xs,
      padding: spacing.md,
      borderRadius: themeConfig.borderRadius.md,
      borderWidth: 1,
      alignItems: 'center',
    },
    statIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: spacing.xs,
    },
    statTitle: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
    statSubtitle: {
      fontSize: 12,
      marginTop: spacing.xs / 2,
      textAlign: 'center',
    },
    statusContainer: {
      padding: spacing.md,
      borderRadius: themeConfig.borderRadius.md,
      borderWidth: 1,
    },
    statusBarContainer: {
      marginBottom: spacing.md,
    },
    statusBarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    statusBarLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    statusBarValue: {
      fontSize: 14,
    },
    statusBarBackground: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    statusBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    actionsContainer: {
      gap: spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
      borderRadius: themeConfig.borderRadius.md,
      borderWidth: 1,
      gap: spacing.sm,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

