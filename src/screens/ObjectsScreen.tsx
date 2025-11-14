// src/screens/ObjectsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ObjectsScreen() {
  

  const objects = [
    {
      id: 1,
      name: 'Бизнес-центр "Нева"',
      address: 'ул. Примерная, 123',
      type: 'Офисное здание',
      status: 'Проверен',
      lastInspection: '2024-01-15',
      nextInspection: '2024-07-15',
    },
    {
      id: 2,
      name: 'Торговый центр "Европа"',
      address: 'пр. Главный, 456',
      type: 'Торговый центр',
      status: 'В процессе',
      lastInspection: '2024-01-10',
      nextInspection: '2024-04-10',
    },
    {
      id: 3,
      name: 'Кафе "Весна"',
      address: 'ул. Центральная, 78',
      type: 'Общепит',
      status: 'Требует внимания',
      lastInspection: '2023-12-20',
      nextInspection: '2024-03-20',
    },
    {
      id: 4,
      name: 'Школа №15',
      address: 'ул. Школьная, 90',
      type: 'Образование',
      status: 'Проверен',
      lastInspection: '2024-01-05',
      nextInspection: '2024-07-05',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Проверен': return '#00ff00'; // Зеленый
      case 'В процессе': return '#ffff00'; // Желтый
      case 'Требует внимания': return '#ff0000'; // Красный
      case 'Просрочен': return '#ff0000'; // Красный
      default: return '#666666'; // Серый
    }
  };

  const getStatusTextColor = (status: string) => {
    return '#000000'; // Черный текст для всех статусов
  };

  const handleObjectPress = (object: any) => {
    Alert.alert(
      object.name,
      `Адрес: ${object.address}\nТип: ${object.type}\nСтатус: ${object.status}\nПоследняя проверка: ${object.lastInspection}\nСледующая проверка: ${object.nextInspection}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Объекты проверки</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => Alert.alert('Добавить объект', 'Функция в разработке')}
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.objectsList}>
          {objects.map((object) => (
            <TouchableOpacity
              key={object.id}
              style={styles.objectCard}
              onPress={() => handleObjectPress(object)}
            >
              <View style={styles.objectHeader}>
                <Text style={styles.objectName}>{object.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(object.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusTextColor(object.status) }]}>
                    {object.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.objectDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color="#fff" />
                  <Text style={styles.detailText}>{object.address}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={16} color="#fff" />
                  <Text style={styles.detailText}>{object.type}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color="#fff" />
                  <Text style={styles.detailText}>
                    След. проверка: {object.nextInspection}
                  </Text>
                </View>
              </View>

              <View style={styles.objectActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="eye" size={18} color="#fff" />
                  <Text style={styles.actionText}>Просмотр</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="create" size={18} color="#fff" />
                  <Text style={styles.actionText}>Редактировать</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="clipboard" size={18} color="#fff" />
                  <Text style={styles.actionText}>Проверить</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Черный фон
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff', // Белый текст
  },
  addButton: {
    backgroundColor: '#fff', // Белый фон
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  objectsList: {
    gap: 12,
  },
  objectCard: {
    backgroundColor: '#1a1a1a', // Темно-серый фон карточек
    borderRadius: 12,
    padding: 16,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#333', // Темно-серая граница
  },
  objectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  objectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff', // Белый текст
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  objectDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ccc', // Светло-серый текст
    flex: 1,
  },
  objectActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#333', // Темно-серая граница
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#ccc', // Светло-серый текст
  },
});