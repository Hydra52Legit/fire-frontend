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
import { FireEquipment } from '../types';
import FireSafetyService from '../services/fireSafetyService';
import { useAuth } from '../contexts/AuthContext';

type EquipmentListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EquipmentList'>;

export default function EquipmentListScreen() {
  const navigation = useNavigation<EquipmentListScreenNavigationProp>();
  const isFocused = useIsFocused();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState<FireEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isFocused) {
      loadEquipment();
    }
  }, [isFocused]);

  const loadEquipment = async () => {
    try {
      setIsLoading(true);
      const equipmentData = await FireSafetyService.getFireEquipment();
      setEquipment(equipmentData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить оборудование');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEquipment = () => {
    navigation.navigate('AddEditEquipment', { equipmentId: undefined });
  };

  const handleEditEquipment = (equipmentItem: FireEquipment) => {
    navigation.navigate('AddEditEquipment', { equipmentId: equipmentItem.id });
  };

  const getEquipmentTypeText = (type: string) => {
    const typeInfo = FireSafetyService.getEquipmentTypes().find(t => t.value === type);
    return typeInfo?.label || type;
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка оборудования...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Заголовок и действия */}
        <View style={styles.header}>
          <Text style={styles.title}>Пожарное оборудование</Text>
          {user?.role === 'admin' && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddEquipment}
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
            placeholder="Поиск по типу или месту..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Список оборудования */}
        <View style={styles.listContainer}>
          {equipment.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="hardware-chip" size={64} color="#E5E5EA" />
              <Text style={styles.emptyStateTitle}>Оборудование не найдено</Text>
              <Text style={styles.emptyStateText}>
                Добавьте первое оборудование
              </Text>
            </View>
          ) : (
            equipment.map((equipmentItem) => (
              <TouchableOpacity
                key={equipmentItem.id}
                style={styles.equipmentCard}
                onPress={() => handleEditEquipment(equipmentItem)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.equipmentInfo}>
                    <Text style={styles.equipmentType}>
                      {getEquipmentTypeText(equipmentItem.type)}
                    </Text>
                    {equipmentItem.inventoryNumber && (
                      <Text style={styles.inventoryNumber}>
                        {equipmentItem.inventoryNumber}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(equipmentItem.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(equipmentItem.status)}</Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.detailText}>{equipmentItem.location}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      След. проверка: {new Date(equipmentItem.nextInspectionDate).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
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
  equipmentCard: {
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
  equipmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  equipmentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  inventoryNumber: {
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