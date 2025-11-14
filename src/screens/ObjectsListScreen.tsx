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
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { InspectionObject } from '../types';
import DataService from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';

type ObjectsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ObjectsList'>;

export default function ObjectsListScreen() {
  const navigation = useNavigation<ObjectsListScreenNavigationProp>();
  const isFocused = useIsFocused();
  const { user } = useAuth();

  const [objects, setObjects] = useState<InspectionObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<InspectionObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      const objectsData = await DataService.getObjects();
      setObjects(objectsData);
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

  const handleAddObject = () => {
    navigation.navigate('AddEditObject', {});
  };

  const handleEditObject = (object: InspectionObject) => {
    navigation.navigate('AddEditObject', { objectId: object.id });
  };

  const handleViewDetails = (object: InspectionObject) => {
    navigation.navigate('ObjectDetails', { objectId: object.id });
  };

  const handleFireSafety = (object: InspectionObject) => {
    navigation.navigate('FireSafety', { objectId: object.id });
  };

  const getObjectTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      administrative: 'Административное здание',
      shopping_center: 'Торговый центр',
      school: 'Школа',
      production: 'Производственный цех',
      warehouse: 'Склад',
      cafe: 'Кафе/ресторан',
      hospital: 'Больница'
    };
    return typeLabels[type] || type;
  };

  const getStatusColor = (object: InspectionObject) => {
    const hasExpiredDocuments = object.documents.some(doc => 
      doc.expirationDate && new Date(doc.expirationDate) < new Date()
    );
    
    const hasFailedInspections = object.inspections.some(insp => 
      insp.result === 'failed'
    );

    if (hasExpiredDocuments || hasFailedInspections) return '#FF3B30';
    if (object.inspections.length === 0) return '#FF9500';
    return '#34C759';
  };

  const getStatusText = (object: InspectionObject) => {
    const hasExpiredDocuments = object.documents.some(doc => 
      doc.expirationDate && new Date(doc.expirationDate) < new Date()
    );
    
    if (hasExpiredDocuments) return 'Проблемы';
    if (object.inspections.length === 0) return 'Нет проверок';
    return 'В порядке';
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
        {/* Заголовок и действия */}
        <View style={styles.header}>
          <Text style={styles.title}>Объекты</Text>
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
            placeholder="Поиск объектов..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Список объектов */}
        <View style={styles.listContainer}>
          {filteredObjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business" size={64} color="#E5E5EA" />
              <Text style={styles.emptyStateTitle}>Объекты не найдены</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Попробуйте изменить параметры поиска' : 'Добавьте первый объект'}
              </Text>
            </View>
          ) : (
            filteredObjects.map((object) => (
              <TouchableOpacity
                key={object.id}
                style={styles.objectCard}
                onPress={() => handleViewDetails(object)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.objectInfo}>
                    <Text style={styles.objectName}>{object.name}</Text>
                    <Text style={styles.objectType}>
                      {getObjectTypeLabel(object.type)} • {object.fireSafetyClass}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(object) }]}>
                    <Text style={styles.statusText}>{getStatusText(object)}</Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.detailText}>{object.actualAddress}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      Документы: {object.documents.length} • Проверок: {object.inspections.length}
                    </Text>
                  </View>
                </View>

                {/* Действия */}
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleFireSafety(object)}
                  >
                    <Ionicons name="shield-checkmark" size={16} color="#007AFF" />
                    <Text style={styles.actionText}>Пожарная безопасность</Text>
                  </TouchableOpacity>
                  
                  {user?.role === 'admin' && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEditObject(object)}
                    >
                      <Ionicons name="create" size={16} color="#666" />
                      <Text style={styles.actionText}>Редактировать</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))
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
  listContainer: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  objectInfo: {
    flex: 1,
    marginRight: 12,
  },
  objectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  objectType: {
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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