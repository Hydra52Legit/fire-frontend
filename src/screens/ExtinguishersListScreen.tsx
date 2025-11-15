import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { FireExtinguisher } from '../types';
import FireSafetyService from '../services/fireSafetyService';
import ObjectService from '../services/objectService';
import { useAuth } from '../contexts/AuthContext';

type ExtinguishersListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExtinguishersList'>;

export default function ExtinguishersListScreen() {
  const navigation = useNavigation<ExtinguishersListScreenNavigationProp>();
  const { user } = useAuth();

  const [extinguishers, setExtinguishers] = useState<FireExtinguisher[]>([]);
  const [filteredExtinguishers, setFilteredExtinguishers] = useState<FireExtinguisher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [objects, setObjects] = useState<any[]>([]);

  const loadExtinguishers = async () => {
    try {
      setIsLoading(true);
      const extinguishersData = await FireSafetyService.getFireExtinguishers();
      setExtinguishers(extinguishersData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить огнетушители');
    } finally {
      setIsLoading(false);
    }
  };

  const loadObjects = async () => {
    try {
      const objectsData = await ObjectService.getObjects();
      setObjects(objectsData);
    } catch (error) {
      console.error('Error loading objects:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExtinguishers();
      loadObjects();
    }, [])
  );

  useEffect(() => {
    filterExtinguishers();
  }, [searchQuery, statusFilter, extinguishers]);

  const filterExtinguishers = () => {
    let filtered = extinguishers;

    // Фильтр по поиску
    if (searchQuery.trim()) {
      filtered = filtered.filter(ext =>
        ext.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.objectId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ext => ext.status === statusFilter);
    }

    setFilteredExtinguishers(filtered);
  };

  const handleAddExtinguisher = () => {
    navigation.navigate('AddEditExtinguisher', {});
  };

  const handleEditExtinguisher = (extinguisher: FireExtinguisher) => {
    navigation.navigate('AddEditExtinguisher', { extinguisherId: extinguisher.id });
  };

  const handleDeleteExtinguisher = (extinguisher: FireExtinguisher) => {
    Alert.alert(
      'Удаление огнетушителя',
      `Вы уверены, что хотите удалить огнетушитель ${extinguisher.inventoryNumber}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await FireSafetyService.deleteFireExtinguisher(extinguisher.id);
              await loadExtinguishers();
              Alert.alert('Успех', 'Огнетушитель удален');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить огнетушитель');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'maintenance': return '#007AFF';
      case 'expired': return '#FF3B30';
      case 'decommissioned': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'maintenance': return 'Обслуживание';
      case 'expired': return 'Просрочен';
      case 'decommissioned': return 'Списан';
      default: return status;
    }
  };

  const getExtinguisherTypeText = (type: string) => {
    const typeInfo = FireSafetyService.getExtinguisherTypes().find(t => t.value === type);
    return typeInfo?.label || type;
  };

  const getObjectName = (objectId: string) => {
    const object = objects.find(obj => obj.id === objectId);
    return object?.name || objectId;
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const getDaysUntilExpiry = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка огнетушителей...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Заголовок и действия */}
        <View style={styles.header}>
          <Text style={styles.title}>Огнетушители</Text>
          {user?.role === 'admin' && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddExtinguisher}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Поиск и фильтры */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по инвентарному номеру или месту..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.filtersContainer}>
          <Text style={styles.filtersLabel}>Статус:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersRow}>
              <TouchableOpacity
                style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.filterButtonTextActive]}>
                  Все ({extinguishers.length})
                </Text>
              </TouchableOpacity>
              
              {FireSafetyService.getEquipmentStatuses().map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[styles.filterButton, statusFilter === status.value && styles.filterButtonActive]}
                  onPress={() => setStatusFilter(status.value)}
                >
                  <Text style={[styles.filterButtonText, statusFilter === status.value && styles.filterButtonTextActive]}>
                    {status.label} ({extinguishers.filter(ext => ext.status === status.value).length})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Статистика */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{extinguishers.length}</Text>
            <Text style={styles.statLabel}>Всего</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#34C759' }]}>
              {extinguishers.filter(ext => ext.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Активных</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
              {extinguishers.filter(ext => ext.status === 'expired').length}
            </Text>
            <Text style={styles.statLabel}>Просрочено</Text>
          </View>
        </View>

        {/* Список огнетушителей */}
        <View style={styles.listContainer}>
          {filteredExtinguishers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flame" size={64} color="#E5E5EA" />
              <Text style={styles.emptyStateTitle}>Огнетушители не найдены</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'Попробуйте изменить параметры поиска' 
                  : 'Добавьте первый огнетушитель'
                }
              </Text>
            </View>
          ) : (
            filteredExtinguishers.map((extinguisher) => {
              const daysUntilExpiry = getDaysUntilExpiry(extinguisher.nextServiceDate);
              const isExpiredSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

              return (
                <TouchableOpacity
                  key={extinguisher.id}
                  style={styles.extinguisherCard}
                  onPress={() => handleEditExtinguisher(extinguisher)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.extinguisherInfo}>
                      <Text style={styles.inventoryNumber}>{extinguisher.inventoryNumber}</Text>
                      <Text style={styles.extinguisherType}>
                        {getExtinguisherTypeText(extinguisher.type)} • {extinguisher.capacity} кг
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(extinguisher.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(extinguisher.status)}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={16} color="#666" />
                      <Text style={styles.detailText}>{extinguisher.location}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Ionicons name="business" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        Объект: {getObjectName(extinguisher.objectId)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        След. проверка: {new Date(extinguisher.nextServiceDate).toLocaleDateString('ru-RU')}
                      </Text>
                    </View>
                  </View>

                  {/* Предупреждение о скором истечении срока */}
                  {isExpiredSoon && extinguisher.status === 'active' && (
                    <View style={styles.warningBanner}>
                      <Ionicons name="warning" size={16} color="#FF9500" />
                      <Text style={styles.warningText}>
                        Истекает через {daysUntilExpiry} дней
                      </Text>
                    </View>
                  )}

                  {/* Предупреждение о просрочке */}
                  {isExpired(extinguisher.nextServiceDate) && extinguisher.status !== 'expired' && (
                    <View style={styles.expiredBanner}>
                      <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                      <Text style={styles.expiredText}>
                        ПРОСРОЧЕН! Требуется обслуживание
                      </Text>
                    </View>
                  )}

                  {/* Действия для администратора */}
                  {user?.role === 'admin' && (
                    <View style={styles.actions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEditExtinguisher(extinguisher)}
                      >
                        <Ionicons name="create" size={16} color="#007AFF" />
                        <Text style={styles.actionText}>Редактировать</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteExtinguisher(extinguisher)}
                      >
                        <Ionicons name="trash" size={16} color="#FF3B30" />
                        <Text style={styles.actionText}>Удалить</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
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
  filtersContainer: {
    marginBottom: 16,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  extinguisherCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  extinguisherInfo: {
    flex: 1,
    marginRight: 12,
  },
  inventoryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  extinguisherType: {
    fontSize: 14,
    color: '#666',
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
  cardDetails: {
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8D7DA',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  expiredText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#721C24',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
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
});