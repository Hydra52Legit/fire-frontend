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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types/navigation';
import { FireExtinguisher, ExtinguisherType, EquipmentStatus } from '../types';
import FireSafetyService from '../services/fireSafetyService';
import ObjectService from '../services/objectService';

type AddEditExtinguisherScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEditExtinguisher'>;

export default function AddEditExtinguisherScreen() {
  const navigation = useNavigation<AddEditExtinguisherScreenNavigationProp>();
  const route = useRoute();
  const { extinguisherId } = route.params as { extinguisherId?: string };

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Основные поля
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [type, setType] = useState<ExtinguisherType>('powder');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [objectId, setObjectId] = useState('');
  const [status, setStatus] = useState<EquipmentStatus>('active');
  
  // Даты
  const [lastServiceDate, setLastServiceDate] = useState(new Date());
  const [nextServiceDate, setNextServiceDate] = useState(new Date());
  const [showLastServiceDatePicker, setShowLastServiceDatePicker] = useState(false);
  const [showNextServiceDatePicker, setShowNextServiceDatePicker] = useState(false);
  
  // Дополнительные поля
  const [manufacturer, setManufacturer] = useState('');
  const [manufactureDate, setManufactureDate] = useState(new Date());
  const [showManufactureDatePicker, setShowManufactureDatePicker] = useState(false);
  const [comments, setComments] = useState('');

  // Списки объектов
  const [objects, setObjects] = useState<any[]>([]);

  useEffect(() => {
    if (extinguisherId) {
      setIsEditing(true);
      loadExtinguisher();
    }
    loadObjects();
  }, [extinguisherId]);

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

  const loadExtinguisher = async () => {
    if (!extinguisherId) return;

    try {
      setIsLoading(true);
      const extinguishers = await FireSafetyService.getFireExtinguishers();
      const extinguisher = extinguishers.find(ext => ext.id === extinguisherId);
      
      if (extinguisher) {
        setInventoryNumber(extinguisher.inventoryNumber);
        setType(extinguisher.type);
        setCapacity(extinguisher.capacity.toString());
        setLocation(extinguisher.location);
        setObjectId(extinguisher.objectId);
        setStatus(extinguisher.status);
        setLastServiceDate(new Date(extinguisher.lastServiceDate));
        setNextServiceDate(new Date(extinguisher.nextServiceDate));
        setManufacturer(extinguisher.manufacturer || '');
        setManufactureDate(extinguisher.manufactureDate ? new Date(extinguisher.manufactureDate) : new Date());
        setComments(extinguisher.comments || '');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные огнетушителя');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!inventoryNumber.trim()) {
      Alert.alert('Ошибка', 'Введите инвентарный номер');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Ошибка', 'Введите место установки');
      return false;
    }
    if (!objectId) {
      Alert.alert('Ошибка', 'Выберите объект');
      return false;
    }
    if (!capacity || isNaN(parseFloat(capacity)) || parseFloat(capacity) <= 0) {
      Alert.alert('Ошибка', 'Введите корректную вместимость');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const extinguisherData: Partial<FireExtinguisher> & { id?: string } = {
        ...(extinguisherId && { id: extinguisherId }),
        inventoryNumber: inventoryNumber.trim(),
        type,
        capacity: parseFloat(capacity),
        location: location.trim(),
        objectId,
        lastServiceDate: lastServiceDate.toISOString().split('T')[0],
        nextServiceDate: nextServiceDate.toISOString().split('T')[0],
        status,
        manufacturer: manufacturer.trim() || undefined,
        manufactureDate: manufactureDate.toISOString().split('T')[0] || undefined,
        comments: comments.trim() || undefined,
        // createdAt и updatedAt не нужны при создании - бэкенд установит их автоматически
      };

      await FireSafetyService.saveFireExtinguisher(extinguisherData);

      Alert.alert(
        'Успех',
        isEditing ? 'Огнетушитель успешно обновлен' : 'Огнетушитель успешно создан',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить огнетушитель');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU');
  };

  const handleLastServiceDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowLastServiceDatePicker(false);
    if (selectedDate) {
      setLastServiceDate(selectedDate);
    }
  };

  const handleNextServiceDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowNextServiceDatePicker(false);
    if (selectedDate) {
      setNextServiceDate(selectedDate);
    }
  };

  const handleManufactureDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowManufactureDatePicker(false);
    if (selectedDate) {
      setManufactureDate(selectedDate);
    }
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
          {isEditing ? 'Редактирование огнетушителя' : 'Добавление огнетушителя'}
        </Text>
      </View>

      {/* Основная информация */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Основная информация</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Инвентарный номер *</Text>
          <TextInput
            style={styles.input}
            placeholder="ОГН-2024-001"
            value={inventoryNumber}
            onChangeText={setInventoryNumber}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Тип огнетушителя *</Text>
          <View style={styles.pickerContainer}>
            {FireSafetyService.getExtinguisherTypes().map((extType) => (
              <TouchableOpacity
                key={extType.value}
                style={[
                  styles.pickerOption,
                  type === extType.value && styles.pickerOptionSelected,
                ]}
                onPress={() => setType(extType.value)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    type === extType.value && styles.pickerOptionTextSelected,
                  ]}
                >
                  {extType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Вместимость (кг/л) *</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            value={capacity}
            onChangeText={setCapacity}
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Место установки *</Text>
          <TextInput
            style={styles.input}
            placeholder="Холл 1 этаж, возле лифта"
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

      {/* Даты обслуживания */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Даты обслуживания</Text>

        <View style={styles.dateInputGroup}>
          <Text style={styles.label}>Дата последней проверки *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowLastServiceDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(lastServiceDate)}</Text>
            <Ionicons name="calendar" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.dateInputGroup}>
          <Text style={styles.label}>Дата следующей проверки *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowNextServiceDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(nextServiceDate)}</Text>
            <Ionicons name="calendar" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Дополнительная информация */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Дополнительная информация</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Производитель</Text>
          <TextInput
            style={styles.input}
            placeholder="Название производителя"
            value={manufacturer}
            onChangeText={setManufacturer}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.dateInputGroup}>
          <Text style={styles.label}>Дата изготовления</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowManufactureDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDate(manufactureDate)}</Text>
            <Ionicons name="calendar" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Комментарии</Text>
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
                {isEditing ? 'Сохранить изменения' : 'Добавить огнетушитель'}
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
      {showLastServiceDatePicker && (
        <DateTimePicker
          value={lastServiceDate}
          mode="date"
          display="default"
          onChange={handleLastServiceDateChange}
        />
      )}

      {showNextServiceDatePicker && (
        <DateTimePicker
          value={nextServiceDate}
          mode="date"
          display="default"
          onChange={handleNextServiceDateChange}
        />
      )}

      {showManufactureDatePicker && (
        <DateTimePicker
          value={manufactureDate}
          mode="date"
          display="default"
          onChange={handleManufactureDateChange}
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