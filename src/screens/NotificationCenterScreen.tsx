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
import { FireExtinguisher, FireEquipment, InspectionObject } from '../types';
import { spacing, theme as themeConfig } from '../theme';
import { ScreenHeader } from '../components/layout';

type NotificationCenterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'NotificationCenter'
>;

export interface NotificationTask {
  id: string;
  type: 'inspection' | 'expired' | 'upcoming' | 'decommission';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  objectId?: string;
  objectName?: string;
  itemId?: string;
  itemType?: 'extinguisher' | 'equipment';
  dueDate?: Date;
  createdAt: Date;
}

export default function NotificationCenterScreen() {
  const navigation = useNavigation<NotificationCenterScreenNavigationProp>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [tasks, setTasks] = useState<NotificationTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  const loadTasks = async () => {
    try {
      setIsLoading(true);

      const allTasks: NotificationTask[] = [];
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Загружаем объекты
      const objects = await ObjectService.getObjects();

      // Загружаем все огнетушители и оборудование
      const extinguishers = await FireSafetyService.getFireExtinguishers();
      const equipment = await FireSafetyService.getFireEquipment();

      // Создаем задачи для просроченных огнетушителей
      extinguishers.forEach((ext) => {
        const nextServiceDate = new Date(ext.nextServiceDate);
        if (nextServiceDate < now && ext.status !== 'decommissioned') {
          const object = objects.find((obj) => obj.id === ext.objectId);
          allTasks.push({
            id: `expired_ext_${ext.id}`,
            type: 'expired',
            title: 'Просрочен огнетушитель',
            description: `Огнетушитель ${ext.inventoryNumber || ext.id} требует обслуживания`,
            priority: 'high',
            status: 'pending',
            objectId: ext.objectId,
            objectName: object?.name,
            itemId: ext.id,
            itemType: 'extinguisher',
            dueDate: nextServiceDate,
            createdAt: new Date(ext.updatedAt),
          });
        } else if (
          nextServiceDate <= thirtyDaysFromNow &&
          nextServiceDate >= now &&
          ext.status === 'active'
        ) {
          const object = objects.find((obj) => obj.id === ext.objectId);
          allTasks.push({
            id: `upcoming_ext_${ext.id}`,
            type: 'upcoming',
            title: 'Требуется проверка огнетушителя',
            description: `Огнетушитель ${ext.inventoryNumber || ext.id} требует проверки`,
            priority: nextServiceDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000 ? 'high' : 'medium',
            status: 'pending',
            objectId: ext.objectId,
            objectName: object?.name,
            itemId: ext.id,
            itemType: 'extinguisher',
            dueDate: nextServiceDate,
            createdAt: new Date(ext.updatedAt),
          });
        }
      });

      // Создаем задачи для просроченного оборудования
      equipment.forEach((eq) => {
        const nextInspectionDate = new Date(eq.nextInspectionDate);
        if (nextInspectionDate < now && eq.status !== 'decommissioned') {
          const object = objects.find((obj) => obj.id === eq.objectId);
          allTasks.push({
            id: `expired_eq_${eq.id}`,
            type: 'expired',
            title: 'Просрочено оборудование',
            description: `Оборудование ${eq.inventoryNumber || eq.id} требует проверки`,
            priority: 'high',
            status: 'pending',
            objectId: eq.objectId,
            objectName: object?.name,
            itemId: eq.id,
            itemType: 'equipment',
            dueDate: nextInspectionDate,
            createdAt: new Date(eq.updatedAt),
          });
        } else if (
          nextInspectionDate <= thirtyDaysFromNow &&
          nextInspectionDate >= now &&
          eq.status === 'active'
        ) {
          const object = objects.find((obj) => obj.id === eq.objectId);
          allTasks.push({
            id: `upcoming_eq_${eq.id}`,
            type: 'upcoming',
            title: 'Требуется проверка оборудования',
            description: `Оборудование ${eq.inventoryNumber || eq.id} требует проверки`,
            priority: nextInspectionDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000 ? 'high' : 'medium',
            status: 'pending',
            objectId: eq.objectId,
            objectName: object?.name,
            itemId: eq.id,
            itemType: 'equipment',
            dueDate: nextInspectionDate,
            createdAt: new Date(eq.updatedAt),
          });
        }

        // Задачи на списание для неисправного оборудования
        if (eq.status === 'expired' && user?.role === 'admin') {
          const object = objects.find((obj) => obj.id === eq.objectId);
          allTasks.push({
            id: `decommission_eq_${eq.id}`,
            type: 'decommission',
            title: 'Требуется списание оборудования',
            description: `Оборудование ${eq.inventoryNumber || eq.id} неисправно и требует списания`,
            priority: 'medium',
            status: 'pending',
            objectId: eq.objectId,
            objectName: object?.name,
            itemId: eq.id,
            itemType: 'equipment',
            createdAt: new Date(eq.updatedAt),
          });
        }
      });

      // Сортируем задачи по приоритету и дате
      allTasks.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [user])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, []);

  const getPriorityColor = (priority: NotificationTask['priority']) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };

  const getTypeIcon = (type: NotificationTask['type']) => {
    switch (type) {
      case 'expired':
        return 'warning';
      case 'upcoming':
        return 'calendar';
      case 'inspection':
        return 'clipboard';
      case 'decommission':
        return 'trash';
      default:
        return 'notifications';
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === 'pending') return task.status === 'pending';
    if (activeTab === 'completed') return task.status === 'completed';
    return true;
  });

  const handleTaskPress = (task: NotificationTask) => {
    if (task.objectId) {
      navigation.navigate('ObjectDetails', { objectId: task.objectId });
    }
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Центр уведомлений" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Загрузка задач...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Центр уведомлений" />
      
      {/* Табы */}
      <View style={[styles.tabs, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'all' ? colors.primary : colors.textSecondary },
            ]}
          >
            Все ({tasks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'pending' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'pending' ? colors.primary : colors.textSecondary },
            ]}
          >
            Ожидают ({tasks.filter((t) => t.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'completed' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'completed' ? colors.primary : colors.textSecondary },
            ]}
          >
            Выполнено ({tasks.filter((t) => t.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'pending'
                ? 'Нет ожидающих задач'
                : activeTab === 'completed'
                ? 'Нет выполненных задач'
                : 'Нет задач'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderLeftColor: getPriorityColor(task.priority),
                },
              ]}
              onPress={() => handleTaskPress(task)}
            >
              <View style={styles.taskHeader}>
                <View style={styles.taskIconContainer}>
                  <Ionicons
                    name={getTypeIcon(task.type) as any}
                    size={24}
                    color={getPriorityColor(task.priority)}
                  />
                </View>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                  <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>
                    {task.description}
                  </Text>
                  {task.objectName && (
                    <Text style={[styles.taskObject, { color: colors.textTertiary }]}>
                      {task.objectName}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(task.priority) + '20' },
                  ]}
                >
                  <Text
                    style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}
                  >
                    {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </Text>
                </View>
              </View>
              {task.dueDate && (
                <View style={styles.taskFooter}>
                  <Ionicons name="time" size={16} color={colors.textTertiary} />
                  <Text style={[styles.taskDate, { color: colors.textTertiary }]}>
                    {task.dueDate.toLocaleDateString('ru-RU')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
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
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
    },
    emptyText: {
      fontSize: 16,
      marginTop: spacing.md,
    },
    taskCard: {
      margin: spacing.md,
      padding: spacing.md,
      borderRadius: themeConfig.borderRadius.md,
      borderLeftWidth: 4,
    },
    taskHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    taskIconContainer: {
      marginRight: spacing.sm,
    },
    taskContent: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: spacing.xs / 2,
    },
    taskDescription: {
      fontSize: 14,
      marginBottom: spacing.xs / 2,
    },
    taskObject: {
      fontSize: 12,
    },
    priorityBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
      borderRadius: themeConfig.borderRadius.sm,
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '600',
    },
    taskFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      gap: spacing.xs / 2,
    },
    taskDate: {
      fontSize: 12,
    },
  });

