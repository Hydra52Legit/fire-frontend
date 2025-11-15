// src/screens/CreateInspectionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList } from '../types/navigation';
import { InspectionObject, Violation, ViolationType } from '../types'; // Убрал ViolationSeverity
import DataService from '../services/dataService';
import ReportService from '../services/reportService';
import { useAuth } from '../contexts/AuthContext';

type CreateInspectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateInspection'>;

export default function CreateInspectionScreen() {
  const navigation = useNavigation<CreateInspectionScreenNavigationProp>();
  const route = useRoute();
  const { objectId } = route.params as { objectId: string };
  const { user } = useAuth();

  const [object, setObject] = useState<InspectionObject | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadObject();
  }, [objectId]);

  const loadObject = async () => {
    try {
      const objects = await DataService.getObjects();
      const foundObject = objects.find(obj => obj.id === objectId);
      setObject(foundObject || null);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить объект');
    }
  };

  const addViolation = () => {
    const newViolation: Violation = {
      id: Date.now().toString(),
      type: 'fire_safety',
      description: '',
      objectId,
      severity: 'medium',
      status: 'active',
      detectedDate: new Date().toISOString(),
      inspector: user?.fullName || 'Инспектор',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setViolations([...violations, newViolation]);
  };

  const updateViolation = (id: string, field: keyof Violation, value: any) => {
    setViolations(violations.map(violation =>
      violation.id === id ? { 
        ...violation, 
        [field]: value,
        updatedAt: new Date().toISOString()
      } : violation
    ));
  };

  const removeViolation = (id: string) => {
    setViolations(violations.filter(violation => violation.id !== id));
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Разрешение на использование камеры не предоставлено');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setPhotos([...photos, ...newPhotos]);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать фото');
    }
  };

  const saveInspection = async () => {
    if (violations.length === 0) {
      Alert.alert('Внимание', 'Добавьте хотя бы одно нарушение');
      return;
    }

    setIsLoading(true);
    try {
      // Сохраняем нарушения
      for (const violation of violations) {
        if (violation.description.trim()) {
          await ReportService.saveViolation(violation);
        }
      }

      // Создаем акт проверки
      const validViolations = violations.filter(v => v.description.trim());
      const inspectionReport = await ReportService.generateInspectionAct(objectId, {
        violations: validViolations,
        photos,
        comments,
        recommendations,
        inspector: user?.fullName || 'Инспектор',
      });

      Alert.alert(
        'Успех',
        'Акт проверки успешно создан',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving inspection:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить акт проверки');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: Violation['severity']) => {
    switch (severity) {
      case 'low': return '#34C759';
      case 'medium': return '#FF9500';
      case 'high': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getSeverityLabel = (severity: Violation['severity']) => {
    switch (severity) {
      case 'low': return 'Низкая';
      case 'medium': return 'Средняя';
      case 'high': return 'Высокая';
      default: return 'Не указана';
    }
  };

  const getTypeLabel = (type: ViolationType) => {
    switch (type) {
      case 'fire_safety': return 'Пожарная безопасность';
      case 'equipment_expired': return 'Просроченное оборудование';
      case 'documentation': return 'Документация';
      case 'evacuation': return 'Эвакуационные пути';
      case 'other': return 'Иные нарушения';
      default: return 'Другое';
    }
  };
  
  if (!object) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Загрузка...</Text>
      </View>
    );
  }
  

  return (
    <ScrollView style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.title}>Акт проверки</Text>
        <Text style={styles.subtitle}>{object.name}</Text>
        <Text style={styles.address}>{object.actualAddress}</Text>
      </View>

      {/* Фотофиксация */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Фотофиксация</Text>
        <View style={styles.photosContainer}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity 
                style={styles.deletePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.photoButtonsContainer}>
            <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color="#007AFF" />
              <Text style={styles.addPhotoText}>Сделать фото</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickPhoto}>
              <Ionicons name="image" size={24} color="#007AFF" />
              <Text style={styles.addPhotoText}>Выбрать из галереи</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Нарушения */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Выявленные нарушения</Text>
          <TouchableOpacity style={styles.addButton} onPress={addViolation}>
            <Ionicons name="add" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Добавить</Text>
          </TouchableOpacity>
        </View>

        {violations.length === 0 ? (
          <Text style={styles.emptyText}>Нарушения не добавлены</Text>
        ) : (
          violations.map((violation, index) => (
            <View key={violation.id} style={styles.violationCard}>
              <View style={styles.violationHeader}>
                <Text style={styles.violationNumber}>Нарушение {index + 1}</Text>
                <TouchableOpacity onPress={() => removeViolation(violation.id)}>
                  <Ionicons name="trash" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="Описание нарушения..."
                value={violation.description}
                onChangeText={(text) => updateViolation(violation.id, 'description', text)}
                multiline
              />

              <View style={styles.violationControls}>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Тип нарушения:</Text>
                  <View style={styles.segmentedControl}>
                    {(['fire_safety', 'equipment_expired', 'documentation', 'evacuation', 'other'] as ViolationType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.segment,
                          violation.type === type && styles.segmentActive
                        ]}
                        onPress={() => updateViolation(violation.id, 'type', type)}
                      >
                        <Text style={[
                          styles.segmentText,
                          violation.type === type && styles.segmentTextActive
                        ]}>
                          {getTypeLabel(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Серьезность:</Text>
                  <View style={styles.severityContainer}>
                    {(['low', 'medium', 'high'] as Violation['severity'][]).map((severity) => (
                      <TouchableOpacity
                        key={severity}
                        style={[
                          styles.severityButton,
                          { backgroundColor: getSeverityColor(severity) },
                          violation.severity === severity && styles.severityButtonActive
                        ]}
                        onPress={() => updateViolation(violation.id, 'severity', severity)}
                      >
                        <Text style={styles.severityButtonText}>
                          {getSeverityLabel(severity)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Комментарии и рекомендации */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Комментарии и рекомендации</Text>
        
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Комментарии по проверке..."
          value={comments}
          onChangeText={setComments}
          multiline
          numberOfLines={4}
        />

        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Рекомендации по устранению нарушений..."
          value={recommendations}
          onChangeText={setRecommendations}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Кнопка сохранения */}
      <TouchableOpacity 
        style={[
          styles.saveButton, 
          isLoading && styles.saveButtonDisabled
        ]} 
        onPress={saveInspection}
        disabled={isLoading || violations.length === 0}
      >
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Сохранение...' : 'Сохранить акт проверки'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Стили остаются такими же...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addButtonText: {
    marginLeft: 4,
    color: '#007AFF',
    fontWeight: '500',
  },
  photosContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
  },
  addPhotoButton: {
    flex: 1,
    height: 80,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    marginTop: 4,
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
  },
  violationCard: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  violationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  violationNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  violationControls: {
    gap: 12,
  },
  pickerContainer: {
    gap: 8,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  severityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    opacity: 0.6,
  },
  severityButtonActive: {
    opacity: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  severityButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});