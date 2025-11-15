import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AutomationService, { AutomationSettings } from '../services/automationService';
import { spacing, theme as themeConfig } from '../theme';
import { ScreenHeader } from '../components/layout';

type AutomationSettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AutomationSettings'
>;

export default function AutomationSettingsScreen() {
  const navigation = useNavigation<AutomationSettingsScreenNavigationProp>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const loadedSettings = await AutomationService.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить настройки');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      await AutomationService.saveSettings(settings);
      await AutomationService.startAutomation();
      Alert.alert('Успех', 'Настройки автоматизации сохранены');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof AutomationSettings>(
    key: K,
    value: AutomationSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const styles = createStyles(colors);

  if (isLoading || !settings) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Настройки автоматизации" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Настройки автоматизации" />
      <ScrollView style={styles.scrollView}>
        {/* Уведомления */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Уведомления</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Автоматические уведомления
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Автоматически отправлять уведомления о проверках и списаниях
              </Text>
            </View>
            <Switch
              value={settings.autoNotifications}
              onValueChange={(value) => updateSetting('autoNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={settings.autoNotifications ? colors.primary : colors.textTertiary}
            />
          </View>

          {settings.autoNotifications && (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Уведомлять о просроченных
                  </Text>
                </View>
                <Switch
                  value={settings.notifyOnExpired}
                  onValueChange={(value) => updateSetting('notifyOnExpired', value)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={settings.notifyOnExpired ? colors.primary : colors.textTertiary}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Уведомлять о приближающихся сроках
                  </Text>
                </View>
                <Switch
                  value={settings.notifyOnUpcoming}
                  onValueChange={(value) => updateSetting('notifyOnUpcoming', value)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={settings.notifyOnUpcoming ? colors.primary : colors.textTertiary}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Уведомлять о списании
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Только для администраторов
                  </Text>
                </View>
                <Switch
                  value={settings.notifyOnDecommission}
                  onValueChange={(value) => updateSetting('notifyOnDecommission', value)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={settings.notifyOnDecommission ? colors.primary : colors.textTertiary}
                  disabled={user?.role !== 'admin'}
                />
              </View>
            </>
          )}
        </View>

        {/* Отчеты */}
        {user?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Автоматические отчеты</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Автоматическая генерация отчетов
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Генерировать отчеты по расписанию
                </Text>
              </View>
              <Switch
                value={settings.autoGenerateReports}
                onValueChange={(value) => updateSetting('autoGenerateReports', value)}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={settings.autoGenerateReports ? colors.primary : colors.textTertiary}
              />
            </View>

            {settings.autoGenerateReports && (
              <>
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Расписание</Text>
                  <View style={styles.pickerContainer}>
                    {(['daily', 'weekly', 'monthly'] as const).map((schedule) => (
                      <TouchableOpacity
                        key={schedule}
                        style={[
                          styles.pickerOption,
                          settings.reportSchedule === schedule && {
                            backgroundColor: colors.primary,
                          },
                        ]}
                        onPress={() => updateSetting('reportSchedule', schedule)}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            {
                              color:
                                settings.reportSchedule === schedule
                                  ? colors.textLight
                                  : colors.text,
                            },
                          ]}
                        >
                          {schedule === 'daily'
                            ? 'Ежедневно'
                            : schedule === 'weekly'
                            ? 'Еженедельно'
                            : 'Ежемесячно'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Кнопка сохранения */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={colors.textLight} />
              <Text style={[styles.saveButtonText, { color: colors.textLight }]}>
                Сохранить настройки
              </Text>
            </>
          )}
        </TouchableOpacity>
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
    section: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    settingInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: spacing.xs / 2,
    },
    settingDescription: {
      fontSize: 14,
    },
    pickerContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    pickerOption: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: themeConfig.borderRadius.md,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerOptionText: {
      fontSize: 14,
      fontWeight: '500',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: themeConfig.borderRadius.md,
      gap: spacing.sm,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

