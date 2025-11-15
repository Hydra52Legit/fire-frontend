import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { useNotification } from '../contexts/NotificationContext';
import { NotificationPreference } from '../services/notificationService';
import { colors, spacing, typography, theme } from '../theme';

type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NotificationSettings'>;

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NotificationSettingsScreenNavigationProp>();
  const { preferences, updatePreferences, scheduleAllNotifications, cancelAllNotifications, isInitialized, availabilityInfo } = useNotification();
  
  const [localPreferences, setLocalPreferences] = useState<NotificationPreference>(preferences);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleSave = async () => {
    try {
      await updatePreferences(localPreferences);
      Alert.alert('Успех', 'Настройки уведомлений сохранены');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  };

  const toggleDaysBefore = (days: number) => {
    setLocalPreferences(prev => ({
      ...prev,
      daysBefore: prev.daysBefore.includes(days)
        ? prev.daysBefore.filter(d => d !== days)
        : [...prev.daysBefore, days].sort((a, b) => b - a),
    }));
  };

  const getAvailabilityMessage = () => {
    if (availabilityInfo.isExpoGo) {
      return 'Push-уведомления недоступны в Expo Go. Используйте development build для полной функциональности. Настройки будут сохранены и применятся при использовании development build.';
    }
    if (availabilityInfo.isEmulator) {
      return 'Уведомления работают только на реальных устройствах. Настройки будут сохранены.';
    }
    if (!isInitialized) {
      return 'Уведомления временно недоступны. Настройки будут сохранены.';
    }
    return null;
  };

  const availabilityMessage = getAvailabilityMessage();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Настройки уведомлений</Text>
        <Text style={styles.subtitle}>Управление push-уведомлениями системы</Text>
      </View>

      {/* Информационное сообщение о доступности */}
      {availabilityMessage && (
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text style={styles.infoText}>{availabilityMessage}</Text>
        </View>
      )}

      {/* Основные настройки */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Основные настройки</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Push-уведомления</Text>
            <Text style={styles.settingDescription}>Получать уведомления на устройство</Text>
          </View>
          <Switch
            value={localPreferences.pushEnabled}
            onValueChange={(value) => setLocalPreferences(prev => ({ ...prev, pushEnabled: value }))}
            disabled={!isInitialized}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Мгновенные оповещения</Text>
            <Text style={styles.settingDescription}>Уведомления о просроченных средствах</Text>
          </View>
          <Switch
            value={localPreferences.immediateAlerts}
            onValueChange={(value) => setLocalPreferences(prev => ({ ...prev, immediateAlerts: value }))}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Ежедневный отчет</Text>
            <Text style={styles.settingDescription}>Сводка по состоянию системы</Text>
          </View>
          <Switch
            value={localPreferences.dailySummary}
            onValueChange={(value) => setLocalPreferences(prev => ({ ...prev, dailySummary: value }))}
          />
        </View>
      </View>

      {/* Напоминания */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Напоминания за</Text>
        <Text style={styles.sectionDescription}>Выберите за сколько дней уведомлять об истечении сроков</Text>
        
        <View style={styles.daysGrid}>
          {[30, 14, 7, 3, 1].map((days) => (
            <TouchableOpacity
              key={days}
              style={[
                styles.dayButton,
                localPreferences.daysBefore.includes(days) && styles.dayButtonSelected,
              ]}
              onPress={() => toggleDaysBefore(days)}
            >
              <Text style={[
                styles.dayButtonText,
                localPreferences.daysBefore.includes(days) && styles.dayButtonTextSelected,
              ]}>
                {days} {days === 1 ? 'день' : days <= 4 ? 'дня' : 'дней'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Действия */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Действия</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, !isInitialized && styles.actionButtonDisabled]} 
          onPress={scheduleAllNotifications}
          disabled={!isInitialized}
        >
          <Ionicons name="notifications" size={20} color={isInitialized ? colors.primary : colors.textTertiary} />
          <Text style={[styles.actionButtonText, !isInitialized && styles.actionButtonTextDisabled]}>
            Запланировать все уведомления
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, !isInitialized && styles.actionButtonDisabled]} 
          onPress={cancelAllNotifications}
          disabled={!isInitialized}
        >
          <Ionicons name="notifications-off" size={20} color={isInitialized ? colors.error : colors.textTertiary} />
          <Text style={[styles.actionButtonText, !isInitialized && styles.actionButtonTextDisabled]}>
            Отменить все уведомления
          </Text>
        </TouchableOpacity>
      </View>

      {/* Кнопка сохранения */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Сохранить настройки</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.infoLight,
    padding: spacing.md,
    margin: spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.info,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  settingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  dayButtonTextSelected: {
    color: colors.textLight,
    fontWeight: typography.weights.semibold,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  actionButtonTextDisabled: {
    color: colors.textTertiary,
  },
  footer: {
    padding: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.textLight,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});