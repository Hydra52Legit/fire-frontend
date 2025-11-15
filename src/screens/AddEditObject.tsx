// screens/AddEditObjectScreen.tsx
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
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { InspectionObject } from '../types';
import ObjectService from '../services/objectService';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700;

type AddEditObjectScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEditObject'>;

export default function AddEditObjectScreen() {
  const navigation = useNavigation<AddEditObjectScreenNavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  
  const { objectId } = route.params as { objectId?: string };
  const isEditMode = !!objectId;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Основные поля формы
  const [formData, setFormData] = useState({
    name: '',
    legalAddress: '',
    actualAddress: '',
    type: '' as InspectionObject['type'],
    fireSafetyClass: '' as InspectionObject['fireSafetyClass'],
    coordinates: {
      latitude: 53.6333,
      longitude: 55.9500,
    },
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEditMode && objectId) {
      loadObjectData();
    }
  }, [isEditMode, objectId]);

  const loadObjectData = async () => {
    try {
      setIsLoading(true);
      if (objectId) {
        const object = await ObjectService.getObjectById(objectId);
        if (object) {
          setFormData({
            name: object.name,
            legalAddress: object.legalAddress,
            actualAddress: object.actualAddress,
            type: object.type,
            fireSafetyClass: object.fireSafetyClass,
            coordinates: object.coordinates,
          });
        }
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные объекта');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Наименование обязательно';
    }

    if (!formData.legalAddress.trim()) {
      newErrors.legalAddress = 'Юридический адрес обязателен';
    }

    if (!formData.actualAddress.trim()) {
      newErrors.actualAddress = 'Фактический адрес обязателен';
    }

    if (!formData.type) {
      newErrors.type = 'Тип объекта обязателен';
    }

    if (!formData.fireSafetyClass) {
      newErrors.fireSafetyClass = 'Класс пожарной опасности обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    try {
      setIsSaving(true);

      const objectData: InspectionObject = {
        id: objectId || Date.now().toString(),
        name: formData.name.trim(),
        legalAddress: formData.legalAddress.trim(),
        actualAddress: formData.actualAddress.trim(),
        type: formData.type,
        fireSafetyClass: formData.fireSafetyClass,
        coordinates: formData.coordinates,
        responsiblePersons: [],
        documents: [],
        inspections: [],
        status: 'active',
        createdAt: isEditMode ? new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // createdBy устанавливается на бэкенде из токена
      };

      await ObjectService.saveObject(objectData);
      
      Alert.alert(
        'Успех', 
        `Объект ${isEditMode ? 'обновлен' : 'создан'} успешно`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving object:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить объект');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressCopy = () => {
    if (formData.legalAddress.trim() && !formData.actualAddress.trim()) {
      setFormData(prev => ({
        ...prev,
        actualAddress: prev.legalAddress
      }));
    }
  };

  const handleMapSelection = () => {
    // TODO: Реализовать навигацию на экран выбора координат на карте
    // Временная заглушка для отображения фронта - функция будет реализована позже
    Alert.alert('Выбор на карте', 'Функция выбора координат на карте будет реализована позже');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка данных...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Кнопка назад в шапке контента */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>
            {isEditMode ? 'Редактирование объекта' : 'Новый объект'}
          </Text>
        </TouchableOpacity>

        {/* Основная информация */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Основная информация</Text>
          
          {/* Наименование */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Наименование объекта <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Введите наименование объекта"
              value={formData.name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, name: text }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              maxLength={100}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Юридический адрес */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Юридический адрес <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput, errors.legalAddress && styles.inputError]}
              placeholder="Введите юридический адрес"
              value={formData.legalAddress}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, legalAddress: text }));
                if (errors.legalAddress) setErrors(prev => ({ ...prev, legalAddress: '' }));
              }}
              multiline
              textAlignVertical="top"
            />
            {errors.legalAddress && <Text style={styles.errorText}>{errors.legalAddress}</Text>}
          </View>

          {/* Фактический адрес */}
          <View style={styles.inputGroup}>
            <View style={styles.addressHeader}>
              <Text style={styles.label}>
                Фактический адрес <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity onPress={handleAddressCopy} style={styles.copyButton}>
                <Ionicons name="copy" size={14} color="#007AFF" />
                <Text style={styles.copyButtonText}>Скопировать</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.multilineInput, errors.actualAddress && styles.inputError]}
              placeholder="Введите фактический адрес"
              value={formData.actualAddress}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, actualAddress: text }));
                if (errors.actualAddress) setErrors(prev => ({ ...prev, actualAddress: '' }));
              }}
              multiline
              textAlignVertical="top"
            />
            {errors.actualAddress && <Text style={styles.errorText}>{errors.actualAddress}</Text>}
          </View>
        </View>

        {/* Тип объекта и класс пожарной опасности */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Классификация</Text>
          
          {/* Тип объекта */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Тип объекта <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.pickerContainer, errors.type && styles.inputError]}>
              {ObjectService.getObjectTypes().map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.optionButton,
                    formData.type === type.value && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, type: type.value }));
                    if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    formData.type === type.value && styles.optionTextSelected
                  ]} numberOfLines={1}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
          </View>

          {/* Класс пожарной опасности */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Класс пожарной опасности <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.pickerContainer, errors.fireSafetyClass && styles.inputError]}>
              {ObjectService.getFireSafetyClasses().map((safetyClass) => (
                <TouchableOpacity
                  key={safetyClass.value}
                  style={[
                    styles.optionButton,
                    formData.fireSafetyClass === safetyClass.value && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, fireSafetyClass: safetyClass.value }));
                    if (errors.fireSafetyClass) setErrors(prev => ({ ...prev, fireSafetyClass: '' }));
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    formData.fireSafetyClass === safetyClass.value && styles.optionTextSelected
                  ]}>
                    {safetyClass.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.fireSafetyClass && <Text style={styles.errorText}>{errors.fireSafetyClass}</Text>}
          </View>
        </View>

        {/* Координаты */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Координаты на карте</Text>
          
          <View style={styles.coordinatesContainer}>
            <View style={styles.coordinateInput}>
              <Text style={styles.label}>Широта</Text>
              <TextInput
                style={styles.input}
                placeholder="53.6333"
                value={formData.coordinates.latitude.toString()}
                onChangeText={(text) => {
                  const latitude = parseFloat(text);
                  if (!isNaN(latitude)) {
                    setFormData(prev => ({
                      ...prev,
                      coordinates: { ...prev.coordinates, latitude }
                    }));
                  }
                }}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            
            <View style={styles.coordinateInput}>
              <Text style={styles.label}>Долгота</Text>
              <TextInput
                style={styles.input}
                placeholder="55.9500"
                value={formData.coordinates.longitude.toString()}
                onChangeText={(text) => {
                  const longitude = parseFloat(text);
                  if (!isNaN(longitude)) {
                    setFormData(prev => ({
                      ...prev,
                      coordinates: { ...prev.coordinates, longitude }
                    }));
                  }
                }}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          
          <TouchableOpacity style={styles.mapButton} onPress={handleMapSelection}>
            <Ionicons name="map" size={18} color="#007AFF" />
            <Text style={styles.mapButtonText}>Выбрать на карте</Text>
          </TouchableOpacity>
        </View>

        {/* Кнопка сохранения */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Обновить объект' : 'Создать объект'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Отступ снизу для клавиатуры */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: isSmallScreen ? 16 : 24,
    paddingBottom: isSmallScreen ? 20 : 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 20 : 24,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  section: {
    marginBottom: isSmallScreen ? 20 : 24,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 17 : 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: isSmallScreen ? 14 : 16,
  },
  inputGroup: {
    marginBottom: isSmallScreen ? 14 : 16,
  },
  label: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 6,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: isSmallScreen ? 10 : 12,
    fontSize: isSmallScreen ? 15 : 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
    minHeight: isSmallScreen ? 44 : 48,
  },
  multilineInput: {
    minHeight: isSmallScreen ? 80 : 100,
    paddingTop: isSmallScreen ? 10 : 12,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 4,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  copyButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 8 : 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    minWidth: isSmallScreen ? 70 : 80,
    flex: 1,
    maxWidth: '48%',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: isSmallScreen ? 12 : 14,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
  },
  mapButtonText: {
    color: '#007AFF',
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: isSmallScreen ? 16 : 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    padding: isSmallScreen ? 14 : 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
    shadowColor: '#999',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 16 : 17,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: isSmallScreen ? 20 : 30,
  },
});