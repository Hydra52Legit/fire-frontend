// screens/ObjectDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { InspectionObject, Inspection, ResponsiblePerson } from '../types';
import ObjectService from '../services/objectService';
import { useAuth } from '../contexts/AuthContext';
import { canEdit } from '../utils/permissions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700;

type ObjectDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ObjectDetails'>;

export default function ObjectDetailsScreen() {
  const navigation = useNavigation<ObjectDetailsScreenNavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  const { objectId } = route.params as { objectId: string };

  const [object, setObject] = useState<InspectionObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadObjectDetails();
  }, [objectId]);

  const loadObjectDetails = async () => {
    try {
      setIsLoading(true);
      const objectsData = await ObjectService.getObjects();
      const foundObject = objectsData.find(obj => obj.id === objectId);
      setObject(foundObject || null);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные объекта');
      console.error('Error loading object details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditObject = () => {
    if (object) {
      navigation.navigate('AddEditObject', { objectId: object.id });
    }
  };

  const handleFireSafety = () => {
    if (object) {
      navigation.navigate('FireSafety', { objectId: object.id });
    }
  };

  const handleCallPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSendEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
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

  const getInspectionResultColor = (result: string) => {
    switch (result) {
      case 'passed': return '#34C759';
      case 'failed': return '#FF3B30';
      case 'requires_improvement': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getInspectionResultText = (result: string) => {
    switch (result) {
      case 'passed': return 'Пройдена';
      case 'failed': return 'Не пройдена';
      case 'requires_improvement': return 'Требует улучшений';
      default: return result;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка данных...</Text>
      </View>
    );
  }

  if (!object) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={isSmallScreen ? 50 : 64} color="#FF3B30" />
        <Text style={styles.errorText}>Объект не найден</Text>
        <TouchableOpacity style={styles.returnButton} onPress={() => navigation.goBack()}>
          <Text style={styles.returnButtonText}>Вернуться назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentResponsible = object.responsiblePersons.find(rp => rp.isCurrent);

  return (
    <View style={styles.container}>
      {/* Кнопка назад в шапке контента */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>Детали объекта</Text>
        {canEdit(user) && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditObject}
          >
            <Ionicons name="create-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Основная информация */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.objectName} numberOfLines={2}>{object.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(object.status) }]}>
              <Text style={styles.statusText}>{getStatusText(object.status)}</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="business" size={18} color="#666" />
              <Text style={styles.infoLabel}>Тип:</Text>
              <Text style={styles.infoValue}>
                {ObjectService.getObjectTypes().find(t => t.value === object.type)?.label}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color="#666" />
              <Text style={styles.infoLabel}>Факт. адрес:</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{object.actualAddress}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="document" size={18} color="#666" />
              <Text style={styles.infoLabel}>Юр. адрес:</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{object.legalAddress}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={18} color="#666" />
              <Text style={styles.infoLabel}>Класс ПБ:</Text>
              <Text style={styles.infoValue}>{object.fireSafetyClass}</Text>
            </View>
          </View>
        </View>

        {/* Ответственные лица */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ответственные лица</Text>
          {currentResponsible ? (
            <View style={styles.responsibleInfo}>
              <View style={styles.responsibleRow}>
                <Ionicons name="person" size={18} color="#666" />
                <View style={styles.responsibleDetails}>
                  <Text style={styles.responsibleName}>{currentResponsible.fullName}</Text>
                  <Text style={styles.responsiblePosition}>{currentResponsible.position}</Text>
                </View>
              </View>
              
              <View style={styles.contactsContainer}>
                {currentResponsible.workPhone && (
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => handleCallPhone(currentResponsible.workPhone!)}
                  >
                    <Ionicons name="call" size={16} color="#007AFF" />
                    <Text style={styles.contactText}>{currentResponsible.workPhone}</Text>
                  </TouchableOpacity>
                )}
                
                {currentResponsible.mobilePhone && (
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => handleCallPhone(currentResponsible.mobilePhone!)}
                  >
                    <Ionicons name="phone-portrait" size={16} color="#007AFF" />
                    <Text style={styles.contactText}>{currentResponsible.mobilePhone}</Text>
                  </TouchableOpacity>
                )}
                
                {currentResponsible.email && (
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => handleSendEmail(currentResponsible.email!)}
                  >
                    <Ionicons name="mail" size={16} color="#007AFF" />
                    <Text style={styles.contactText}>{currentResponsible.email}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>Ответственный не назначен</Text>
          )}
        </View>

        {/* Пожарная безопасность */}
        <TouchableOpacity style={[styles.card, styles.clickableCard]} onPress={handleFireSafety}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Пожарная безопасность</Text>
              <Text style={styles.cardSubtitle}>Документы и требования</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
          <View style={styles.fireSafetyInfo}>
            <View style={styles.fireSafetyItem}>
              <Text style={styles.fireSafetyLabel}>Класс</Text>
              <Text style={styles.fireSafetyValue}>{object.fireSafetyClass}</Text>
            </View>
            <View style={styles.fireSafetyItem}>
              <Text style={styles.fireSafetyLabel}>Документы</Text>
              <Text style={styles.fireSafetyValue}>{object.documents.length}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Статистика проверок */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Статистика проверок</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{object.inspections.length}</Text>
              <Text style={styles.statLabel}>Всего</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statPassed]}>
                {object.inspections.filter(i => i.result === 'passed').length}
              </Text>
              <Text style={styles.statLabel}>Пройдено</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statFailed]}>
                {object.inspections.filter(i => i.result === 'failed').length}
              </Text>
              <Text style={styles.statLabel}>Не пройдено</Text>
            </View>
          </View>
        </View>

        {/* Последние проверки */}
        {object.inspections.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Последние проверки</Text>
              <Text style={styles.seeAllText}>Все {object.inspections.length}</Text>
            </View>
            {object.inspections.slice(0, 3).map((inspection) => (
              <TouchableOpacity
                key={inspection.id}
                style={styles.inspectionItem}
                onPress={() => {/* можно добавить навигацию к деталям проверки */}}
              >
                <View style={styles.inspectionHeader}>
                  <View style={styles.inspectionInfo}>
                    <Text style={styles.inspectionDate}>
                      {formatDate(inspection.date)}
                    </Text>
                    <Text style={styles.inspectionInspector}>
                      {inspection.inspector}
                    </Text>
                  </View>
                  <View style={[
                    styles.inspectionStatus,
                    { backgroundColor: getInspectionResultColor(inspection.result) }
                  ]}>
                    <Text style={styles.inspectionStatusText}>
                      {getInspectionResultText(inspection.result)}
                    </Text>
                  </View>
                </View>
                {inspection.comments && (
                  <Text style={styles.inspectionComments} numberOfLines={2}>
                    {inspection.comments}
                  </Text>
                )}
                <Text style={styles.nextInspection}>
                  Следующая: {formatDate(inspection.nextInspectionDate)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Отступ снизу */}
        <View style={styles.bottomSpacer} />
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: isSmallScreen ? 16 : 18,
    color: '#000000',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: isSmallScreen ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButtonText: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24, // Компенсируем стрелку для центрирования
  },
  editButton: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: isSmallScreen ? 16 : 20,
    paddingBottom: isSmallScreen ? 20 : 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isSmallScreen ? 14 : 16,
    marginBottom: isSmallScreen ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  clickableCard: {
    shadowColor: '#007AFF',
    shadowOpacity: 0.1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  objectName: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    marginRight: 12,
    lineHeight: isSmallScreen ? 22 : 24,
  },
  statusBadge: {
    paddingHorizontal: isSmallScreen ? 8 : 10,
    paddingVertical: isSmallScreen ? 4 : 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#000000',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  infoSection: {
    gap: isSmallScreen ? 10 : 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoLabel: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#666',
    width: 70,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#000000',
    flex: 1,
    fontWeight: '500',
    lineHeight: isSmallScreen ? 18 : 20,
  },
  responsibleInfo: {
    gap: isSmallScreen ? 12 : 14,
  },
  responsibleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  responsibleDetails: {
    flex: 1,
  },
  responsibleName: {
    fontSize: isSmallScreen ? 15 : 16,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 2,
  },
  responsiblePosition: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#666',
  },
  contactsContainer: {
    gap: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  contactText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  noDataText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  fireSafetyInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  fireSafetyItem: {
    alignItems: 'center',
  },
  fireSafetyLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  fireSafetyValue: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
    color: '#000000',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    padding: isSmallScreen ? 8 : 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  statNumber: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statPassed: {
    color: '#34C759',
  },
  statFailed: {
    color: '#FF3B30',
  },
  statLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  inspectionItem: {
    backgroundColor: '#F8F8F8',
    padding: isSmallScreen ? 12 : 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  inspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  inspectionInfo: {
    flex: 1,
    marginRight: 8,
  },
  inspectionDate: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  inspectionInspector: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#666',
  },
  inspectionStatus: {
    paddingHorizontal: isSmallScreen ? 8 : 10,
    paddingVertical: isSmallScreen ? 4 : 6,
    borderRadius: 8,
  },
  inspectionStatusText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '600',
  },
  inspectionComments: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: isSmallScreen ? 16 : 18,
  },
  nextInspection: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#999',
    fontWeight: '500',
  },
  returnButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: isSmallScreen ? 24 : 32,
    paddingVertical: isSmallScreen ? 12 : 14,
    borderRadius: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: isSmallScreen ? 20 : 30,
  },
});