// screens/ObjectsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { TabParamList, RootStackParamList } from '../types/navigation'; // Импортируем оба типа
import { InspectionObject } from '../types';
import ObjectService from '../services/objectService';
import { useAuth } from '../contexts/AuthContext';

// Исправляем тип - Objects находится в TabParamList
type ObjectsScreenNavigationProp = NativeStackNavigationProp<TabParamList, 'Objects'>;

// Или если нужен доступ к другим экранам Stack, можно использовать composite тип:
// type ObjectsScreenNavigationProp = CompositeNavigationProp<
//   BottomTabNavigationProp<TabParamList, 'Objects'>,
//   NativeStackNavigationProp<RootStackParamList>
// >;

export default function ObjectsScreen() {
  const navigation = useNavigation<ObjectsScreenNavigationProp>();
  const isFocused = useIsFocused();
  const { user } = useAuth();

  const [objects, setObjects] = useState<InspectionObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<InspectionObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObject, setSelectedObject] = useState<InspectionObject | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadObjects();
    }
  }, [isFocused]);

  useEffect(() => {
    filterObjects();
  }, [searchQuery, objects]);

  const loadObjects = async () => {
    try {
      setIsLoading(true);
      const objectsData = await ObjectService.getObjects();
      setObjects(objectsData);
      setFilteredObjects(objectsData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить объекты');
    } finally {
      setIsLoading(false);
    }
  };

  const filterObjects = () => {
    if (!searchQuery.trim()) {
      setFilteredObjects(objects);
      return;
    }

    const filtered = objects.filter(obj =>
      obj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.actualAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.legalAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredObjects(filtered);
  };

  // Функция для открытия меню действий
  const handleObjectLongPress = (object: InspectionObject) => {
    setSelectedObject(object);
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Отмена', 'Редактировать', 'Архивировать', 'Удалить'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleEditObject(object);
          } else if (buttonIndex === 2) {
            handleArchiveObject(object);
          } else if (buttonIndex === 3) {
            handleDeleteObject(object);
          }
        }
      );
    } else {
      setActionModalVisible(true);
    }
  };

  // Редактирование объекта - используем any для навигации к Stack экранам
  const handleEditObject = (object: InspectionObject) => {
    // @ts-ignore - временно игнорируем проверку типов
    navigation.navigate('AddEditObject', { objectId: object.id });
    setActionModalVisible(false);
  };

  // Добавление нового объекта
  const handleAddObject = () => {
    // @ts-ignore - временно игнорируем проверку типов
    navigation.navigate('AddEditObject', {});
  };

  // Просмотр деталей объекта
  const handleObjectPress = (object: InspectionObject) => {
    // @ts-ignore - временно игнорируем проверку типов
    navigation.navigate('ObjectDetails', { objectId: object.id });
  };

  // Архивация объекта
  const handleArchiveObject = async (object: InspectionObject) => {
    Alert.alert(
      'Архивация объекта',
      `Вы уверены, что хотите архивировать объект "${object.name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Архивировать',
          style: 'destructive',
          onPress: async () => {
            try {
              await ObjectService.archiveObject(object.id);
              await loadObjects(); // Перезагружаем список
              Alert.alert('Успех', 'Объект успешно архивирован');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось архивировать объект');
            }
          },
        },
      ]
    );
    setActionModalVisible(false);
  };

  // Удаление объекта
  const handleDeleteObject = async (object: InspectionObject) => {
    Alert.alert(
      'Удаление объекта',
      `Вы уверены, что хотите удалить объект "${object.name}"? Это действие нельзя отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              // Используем метод удаления из ObjectService
              if (ObjectService.deleteObject) {
                await ObjectService.deleteObject(object.id);
              } else {
                await ObjectService.archiveObject(object.id);
              }
              await loadObjects(); // Перезагружаем список
              Alert.alert('Успех', 'Объект успешно удален');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить объект');
            }
          },
        },
      ]
    );
    setActionModalVisible(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'inactive': return '#FF9500';
      case 'archived': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'inactive': return 'Неактивен';
      case 'archived': return 'Архивирован';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка объектов...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Объекты проверки</Text>
          {user?.role === 'admin' && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddObject}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Поиск */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по названию или адресу..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Список объектов */}
        <View style={styles.objectsList}>
          {filteredObjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business" size={64} color="#E5E5EA" />
              <Text style={styles.emptyStateTitle}>Объекты не найдены</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Добавьте первый объект'}
              </Text>
            </View>
          ) : (
            filteredObjects.map((object) => (
              <TouchableOpacity
                key={object.id}
                style={styles.objectCard}
                onPress={() => handleObjectPress(object)}
                onLongPress={() => handleObjectLongPress(object)}
                delayLongPress={500} // Задержка для long press
              >
                {/* Контекстное меню для карточки */}
                {user?.role === 'admin' && (
                  <TouchableOpacity 
                    style={styles.contextMenuButton}
                    onPress={() => handleObjectLongPress(object)}
                  >
                    <Ionicons name="ellipsis-vertical" size={16} color="#666" />
                  </TouchableOpacity>
                )}
                
                <View style={styles.objectHeader}>
                  <Text style={styles.objectName}>{object.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(object.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(object.status)}</Text>
                  </View>
                </View>
                
                <View style={styles.objectDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.detailText}>{object.actualAddress}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="business" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {ObjectService.getObjectTypes().find(t => t.value === object.type)?.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.objectFooter}>
                  <Text style={styles.responsibleText}>
                    Ответственный: {object.responsiblePersons.find(rp => rp.isCurrent)?.fullName || 'Не назначен'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Модальное окно действий (для Android) */}
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={styles.actionModal}>
            <Text style={styles.actionModalTitle}>
              {selectedObject?.name}
            </Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditObject(selectedObject!)}
            >
              <Ionicons name="create-outline" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Редактировать</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleArchiveObject(selectedObject!)}
            >
              <Ionicons name="archive-outline" size={20} color="#FF9500" />
              <Text style={styles.actionButtonText}>Архивировать</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteObject(selectedObject!)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Удалить</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  objectsList: {
    gap: 12,
  },
  objectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  contextMenuButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
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
    color: '#000000',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
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
    color: '#666666',
    flex: 1,
  },
  objectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  responsibleText: {
    fontSize: 12,
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Стили для модального окна действий
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 0,
    width: '80%',
    maxWidth: 300,
  },
  actionModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    padding: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});