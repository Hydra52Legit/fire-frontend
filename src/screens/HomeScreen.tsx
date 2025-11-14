import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { TabParamList } from '../types/navigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<TabParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const stats = [
    { label: 'Всего объектов', value: '12', icon: 'business', color: '#007AFF' },
    { label: 'Проверки сегодня', value: '3', icon: 'document-text', color: '#34C759' },
    { label: 'Задачи', value: '5', icon: 'flag', color: '#FF9500' },
    { label: 'Предписания', value: '2', icon: 'warning', color: '#FF3B30' },
  ];

  const quickActions = [
    {
      title: 'Добавить объект',
      icon: 'add-circle',
      color: '#007AFF',
      onPress: () => Alert.alert('Добавить объект', 'Функция в разработке'),
    },
    {
      title: 'Новая проверка',
      icon: 'clipboard',
      color: '#34C759',
      onPress: () => Alert.alert('Новая проверка', 'Функция в разработке'),
    },
    {
      title: 'Отчёты',
      icon: 'bar-chart',
      color: '#FF9500',
      onPress: () => Alert.alert('Отчёты', 'Функция в разработке'),
    },
    {
      title: 'Настройки',
      icon: 'settings',
      color: '#8E8E93',
      onPress: () => Alert.alert('Настройки', 'Функция в разработке'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.welcome}>Добро пожаловать!</Text>
      
      {/* Статистика */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Статистика</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Быстрые действия */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Быстрые действия</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <Ionicons name={action.icon as any} size={32} color={action.color} />
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Последние активности */}
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Последние активности</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.activityText}>Проверка объекта "БЦ Нева" завершена</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="time" size={20} color="#FF9500" />
            <Text style={styles.activityText}>Назначена проверка ТЦ "Европа"</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="warning" size={20} color="#FF3B30" />
            <Text style={styles.activityText}>Истекает срок предписания для "Кафе Весна"</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  statsContainer: {
    marginBottom: 25,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 25,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  activityContainer: {
    marginBottom: 25,
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});