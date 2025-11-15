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
import ObjectService from '../services/objectService';
import FireSafetyService from '../services/fireSafetyService';
import { InspectionObject } from '../types';
import { spacing, theme as themeConfig } from '../theme';
import { ScreenHeader } from '../components/layout';

type AdminPanelScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminPanel'>;

export default function AdminPanelScreen() {
  const navigation = useNavigation<AdminPanelScreenNavigationProp>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [stats, setStats] = useState({
    totalObjects: 0,
    totalExtinguishers: 0,
    totalEquipment: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const objects = await ObjectService.getObjects();
      const extinguishers = await FireSafetyService.getFireExtinguishers();
      const equipment = await FireSafetyService.getFireEquipment();

      setStats({
        totalObjects: objects.length,
        totalExtinguishers: extinguishers.length,
        totalEquipment: equipment.length,
        totalUsers: 0, // TODO: Получить из API когда будет реализовано
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'admin') {
        loadStats();
      }
    }, [user])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, []);

  const AdminCard: React.FC<{
    icon: string;
    title: string;
    value: string | number;
    onPress?: () => void;
    color?: string;
  }> = ({ icon, title, value, onPress, color = colors.primary }) => {
    const CardComponent = onPress ? TouchableOpacity : View;
    return (
      <CardComponent
        style={[
          styles.adminCard,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={[styles.adminCardIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={32} color={color} />
        </View>
        <Text style={[styles.adminCardValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.adminCardTitle, { color: colors.textSecondary }]}>{title}</Text>
      </CardComponent>
    );
  };

  const AdminAction: React.FC<{
    icon: string;
    title: string;
    description?: string;
    onPress: () => void;
    color?: string;
  }> = ({ icon, title, description, onPress, color = colors.primary }) => (
    <TouchableOpacity
      style={[
        styles.adminAction,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.adminActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.adminActionContent}>
        <Text style={[styles.adminActionTitle, { color: colors.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.adminActionDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  const styles = createStyles(colors);

  if (user?.role !== 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Панель администратора" />
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Доступ запрещен
          </Text>
          <Text style={[styles.errorDescription, { color: colors.textSecondary }]}>
            Эта страница доступна только администраторам
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Панель администратора" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Панель администратора" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Статистика */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Общая статистика</Text>
          <View style={styles.statsGrid}>
            <AdminCard
              icon="business"
              title="Объектов"
              value={stats.totalObjects}
              onPress={() => navigation.navigate('ObjectsList' as any)}
              color={colors.primary}
            />
            <AdminCard
              icon="flame"
              title="Огнетушителей"
              value={stats.totalExtinguishers}
              onPress={() => navigation.navigate('ExtinguishersList' as any)}
              color={colors.error}
            />
            <AdminCard
              icon="construct"
              title="Оборудования"
              value={stats.totalEquipment}
              onPress={() => navigation.navigate('EquipmentList' as any)}
              color={colors.warning}
            />
            <AdminCard
              icon="people"
              title="Пользователей"
              value={stats.totalUsers}
              color={colors.success}
            />
          </View>
        </View>

        {/* Управление */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Управление</Text>
          
          <AdminAction
            icon="analytics"
            title="Аналитика и отчеты"
            description="Просмотр статистики и генерация отчетов"
            onPress={() => navigation.navigate('Dashboard' as any)}
            color={colors.primary}
          />
          
          <AdminAction
            icon="document-text"
            title="Отчеты"
            description="Управление и генерация отчетов"
            onPress={() => navigation.navigate('Reports' as any)}
            color={colors.info}
          />
          
          <AdminAction
            icon="settings"
            title="Настройки автоматизации"
            description="Настройка автоматических отчетов и уведомлений"
            onPress={() => navigation.navigate('AutomationSettings' as any)}
            color={colors.warning}
          />
        </View>

        {/* Система */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Система</Text>
          
          <AdminAction
            icon="people"
            title="Управление пользователями"
            description="Добавление, редактирование и удаление пользователей"
            onPress={() => {
              // TODO: Реализовать экран управления пользователями
              console.log('User management - to be implemented');
            }}
            color={colors.success}
          />
          
          <AdminAction
            icon="server"
            title="Настройки системы"
            description="Конфигурация системы и параметры"
            onPress={() => {
              // TODO: Реализовать экран настроек системы
              console.log('System settings - to be implemented');
            }}
            color={colors.textSecondary}
          />
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    errorText: {
      fontSize: 20,
      fontWeight: '600',
      marginTop: spacing.md,
    },
    errorDescription: {
      fontSize: 16,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    section: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
    adminCard: {
      width: '48%',
      margin: spacing.xs,
      padding: spacing.md,
      borderRadius: themeConfig.borderRadius.md,
      borderWidth: 1,
      alignItems: 'center',
    },
    adminCardIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    adminCardValue: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: spacing.xs / 2,
    },
    adminCardTitle: {
      fontSize: 14,
      textAlign: 'center',
    },
    adminAction: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: themeConfig.borderRadius.md,
      borderWidth: 1,
      marginBottom: spacing.sm,
    },
    adminActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    adminActionContent: {
      flex: 1,
    },
    adminActionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: spacing.xs / 2,
    },
    adminActionDescription: {
      fontSize: 14,
    },
  });

