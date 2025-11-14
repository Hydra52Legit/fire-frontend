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

type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NotificationSettings'>;

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NotificationSettingsScreenNavigationProp>();
  const { preferences, updatePreferences, scheduleAllNotifications, cancelAllNotifications, isInitialized } = useNotification();
  
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

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Уведомления не доступны на этом устройстве
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Настройки уведомлений</Text>
        <Text style={styles.subtitle}>Управление push-уведомлениями системы</Text>
      </View>

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
        
        <TouchableOpacity style={styles.actionButton} onPress={scheduleAllNotifications}>
          <Ionicons name="notifications" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Запланировать все уведомления</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={cancelAllNotifications}>
          <Ionicons name="notifications-off" size={20} color="#FF3B30" />
          <Text style={styles.actionButtonText}>Отменить все уведомления</Text>
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
    backgroundColor: '#FFFFFF',
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dayButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    color: '#FF3B30',
    fontSize: 16,
    marginTop: 20,
  },
});