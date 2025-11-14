import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types/navigation';
import { FireEquipment, FireEquipmentType, EquipmentStatus } from '../types';
import FireSafetyService from '../services/fireSafetyService';
import ObjectService from '../services/objectService';

type AddEditEquipmentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEditEquipment'>;

// Интерфейс для спецификаций в форме (все поля как строки)
interface EquipmentSpecificationsForm {
  pressure: string;
  diameter: string;
  length: string;
  material: string;
}

export default function AddEditEquipmentScreen() {
  const navigation = useNavigation<AddEditEquipmentScreenNavigationProp>();
  const route = useRoute();
  const { equipmentId } = route.params as { equipmentId?: string };

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [type, setType] = useState<FireEquipmentType>('fire_hydrant');
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [location, setLocation] = useState('');
  const [objectId, setObjectId] = useState('');
  const [lastInspectionDate, setLastInspectionDate] = useState(new Date());
  const [nextInspectionDate, setNextInspectionDate] = useState(new Date());
  const [status, setStatus] = useState<EquipmentStatus>('active');
  // ИСПРАВЛЕНО: Используем строки для формы
  const [specifications, setSpecifications] = useState<EquipmentSpecificationsForm>({
    pressure: '',
    diameter: '',
    length: '',
    material: '',
  });
  const [comments, setComments] = useState('');

  const [showLastInspectionDatePicker, setShowLastInspectionDatePicker] = useState(false);
  const [showNextInspectionDatePicker, setShowNextInspectionDatePicker] = useState(false);
  const [objects, setObjects] = useState<any[]>([]);

  useEffect(() => {
    if (equipmentId) {
      setIsEditing(true);
      loadEquipment();
    }
    loadObjects();
  }, [equipmentId]);

  const loadObjects = async () => {
    try {
      const objectsData = await ObjectService.getObjects();
      setObjects(objectsData);
      if (objectsData.length > 0 && !objectId) {
        setObjectId(objectsData[0].id);
      }
    } catch (error) {
      console.error('Error loading objects:', error);
    }
  };

  const loadEquipment = async () => {
    if (!equipmentId) return;

    try {
      setIsLoading(true);
      const equipmentList = await FireSafetyService.getFireEquipment();
      const equipmentItem = equipmentList.find(eq => eq.id === equipmentId);
      
      if (equipmentItem) {
        setType(equipmentItem.type);
        setInventoryNumber(equipmentItem.inventoryNumber || '');
        setLocation(equipmentItem.location);
        setObjectId(equipmentItem.objectId);
        setLastInspectionDate(new Date(equipmentItem.lastInspectionDate));
        setNextInspectionDate(new Date(equipmentItem.nextInspectionDate));
        setStatus(equipmentItem.status);
        // ИСПРАВЛЕНО: Преобразуем числа в строки для формы
        setSpecifications({
          pressure: equipmentItem.specifications?.pressure?.toString() || '',
          diameter: equipmentItem.specifications?.diameter?.toString() || '',
          length: equipmentItem.specifications?.length?.toString() || '',
          material: equipmentItem.specifications?.material || '',
        });
        setComments(equipmentItem.comments || '');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные оборудования');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!location.trim()) {
      Alert.alert('Ошибка', 'Введите место установки');
      return;
    }
    if (!objectId) {
      Alert.alert('Ошибка', 'Выберите объект');
      return;
    }

    try {
      setIsLoading(true);

      // ИСПРАВЛЕНО: Преобразуем строки обратно в числа для сохранения
      const equipmentData: FireEquipment = {
        id: equipmentId || Date.now().toString(),
        type,
        inventoryNumber: inventoryNumber.trim() || undefined,
        location: location.trim(),
        objectId,
        lastInspectionDate: lastInspectionDate.toISOString().split('T')[0],
        nextInspectionDate: nextInspectionDate.toISOString().split('T')[0],
        status,
        specifications: {
          pressure: specifications.pressure ? parseFloat(specifications.pressure) : undefined,
          diameter: specifications.diameter ? parseFloat(specifications.diameter) : undefined,
          length: specifications.length ? parseFloat(specifications.length) : undefined,
          material: specifications.material || undefined,
        },
        comments: comments.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await FireSafetyService.saveFireEquipment(equipmentData);

      Alert.alert(
        'Успех',
        isEditing ? 'Оборудование успешно обновлено' : 'Оборудование успешно создано',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить оборудование');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU');
  };

  if (isLoading && isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Редактирование оборудования' : 'Добавление оборудования'}
        </Text>
      </View>

      {/* Основная информация */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Основная информация</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Тип оборудования *</Text>
          <View style={styles.pickerContainer}>
            {FireSafetyService.getEquipmentTypes().map((equipType) => (
              <TouchableOpacity
                key={equipType.value}
                style={[
                  styles.pickerOption,
                  type === equipType.value && styles.pickerOptionSelected,
                ]}
                onPress={() => setType(equipType.value)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    type === equipType.value && styles.pickerOptionTextSelected,
                  ]}
                >
                  {equipType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Инвентарный номер</Text>
          <TextInput
            style={styles.input}
            placeholder="ГИД-2024-001"
            value={inventoryNumber}
            onChangeText={setInventoryNumber}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Место установки *</Text>
          <TextInput
            style={styles.input}
            placeholder="Холл 1 этаж, правая стена"
            value={location}
            onChangeText={setLocation}
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Объект *</Text>
          <View style={styles.pickerContainer}>
            {objects.map((object) => (
              <TouchableOpacity
                key={object.id}
                style={[
                  styles.pickerOption,
                  objectId === object.id && styles.pickerOptionSelected,
                ]}
                onPress={() => setObjectId(object.id)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    objectId === object.id && styles.pickerOptionTextSelected,
                  ]}
                >
                  {object.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Статус</Text>
          <View style={styles.pickerContainer}>
            {FireSafetyService.getEquipmentStatuses().map((statusItem) => (
              <TouchableOpacity
                key={statusItem.value}
                style={[
                  styles.pickerOption,
                  status === statusItem.value && styles.pickerOptionSelected,
                ]}
                onPress={() => setStatus(statusItem.value)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    status === statusItem.value && styles.pickerOptionTextSelected,
                  ]}
                >
                  {statusItem.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Даты проверок */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Даты проверок</Text>

        <View style={styles.dateInputGroup}>
          <Text style={styles.label}>Дата последней проверки *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowLastInspectionDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(lastInspectionDate)}</Text>
            <Ionicons name="calendar" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.dateInputGroup}>
          <Text style={styles.label}>Дата следующей проверки *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowNextInspectionDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(nextInspectionDate)}</Text>
            <Ionicons name="calendar" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Характеристики */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Характеристики</Text>

        <View style={styles.specsGrid}>
          <View style={styles.specInput}>
            <Text style={styles.label}>Давление (бар)</Text>
            <TextInput
              style={styles.input}
              placeholder="4.5"
              value={specifications.pressure}
              onChangeText={(text) => setSpecifications(prev => ({ ...prev, pressure: text }))}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.specInput}>
            <Text style={styles.label}>Диаметр (мм)</Text>
            <TextInput
              style={styles.input}
              placeholder="50"
              value={specifications.diameter}
              onChangeText={(text) => setSpecifications(prev => ({ ...prev, diameter: text }))}
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.specInput}>
            <Text style={styles.label}>Длина (м)</Text>
            <TextInput
              style={styles.input}
              placeholder="20"
              value={specifications.length}
              onChangeText={(text) => setSpecifications(prev => ({ ...prev, length: text }))}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.specInput}>
            <Text style={styles.label}>Материал</Text>
            <TextInput
              style={styles.input}
              placeholder="металл"
              value={specifications.material}
              onChangeText={(text) => setSpecifications(prev => ({ ...prev, material: text }))}
              placeholderTextColor="#999"
            />
          </View>
        </View>
      </View>

      {/* Комментарии */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Комментарии</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Дополнительная информация..."
          value={comments}
          onChangeText={setComments}
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Кнопки действий */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Сохранить изменения' : 'Добавить оборудование'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Отмена</Text>
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      {showLastInspectionDatePicker && (
        <DateTimePicker
          value={lastInspectionDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowLastInspectionDatePicker(false);
            if (selectedDate) {
              setLastInspectionDate(selectedDate);
            }
          }}
        />
      )}

      {showNextInspectionDatePicker && (
        <DateTimePicker
          value={nextInspectionDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowNextInspectionDatePicker(false);
            if (selectedDate) {
              setNextInspectionDate(selectedDate);
            }
          }}
        />
      )}
    </ScrollView>
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  pickerOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pickerOptionText: {
    fontSize: 12,
    color: '#000000',
  },
  pickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateInputGroup: {
    marginBottom: 16,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 16,
    color: '#000000',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specInput: {
    flex: 1,
    minWidth: '45%',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});