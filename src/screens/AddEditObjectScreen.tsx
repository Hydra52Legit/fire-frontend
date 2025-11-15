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
  Switch,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { InspectionObject, ObjectType, FireSafetyClass } from '../types';
import ObjectService from '../services/objectService';
import { useAuth } from '../contexts/AuthContext';
import { canEdit, canCreate } from '../utils/permissions';

type AddEditObjectScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEditObject'>;

export default function AddEditObjectScreen() {
  const navigation = useNavigation<AddEditObjectScreenNavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  
  // Безопасная деструктуризация route.params
  const routeParams = route.params as { 
    objectId?: string;
    coordinates?: { latitude: number; longitude: number };
  } | undefined;
  
  const objectId = routeParams?.objectId;
  const initialCoordinates = routeParams?.coordinates;

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Основные поля объекта
  const [name, setName] = useState('');
  const [legalAddress, setLegalAddress] = useState('');
  const [actualAddress, setActualAddress] = useState('');
  const [type, setType] = useState<ObjectType>('administrative');
  const [fireSafetyClass, setFireSafetyClass] = useState<FireSafetyClass>('F1.1');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }>({
    latitude: initialCoordinates?.latitude ?? 53.630,
    longitude: initialCoordinates?.longitude ?? 55.950,
  });

  // Ответственное лицо
  const [responsibleId, setResponsibleId] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsiblePosition, setResponsiblePosition] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [email, setEmail] = useState('');

  // Дополнительные настройки
  const [useSameAddress, setUseSameAddress] = useState(true);

  useEffect(() => {
    if (objectId) {
      setIsEditing(true);
      loadObject();
    } else {
      setIsEditing(false);
    }
  }, [objectId]);

  useEffect(() => {
    // Проверка прав доступа
    if (isEditing && !canEdit(user)) {
      Alert.alert('Доступ запрещен', 'У вас нет прав для редактирования объектов');
      navigation.goBack();
      return;
    }
    if (!isEditing && !canCreate(user)) {
      Alert.alert('Доступ запрещен', 'У вас нет прав для создания объектов');
      navigation.goBack();
      return;
    }
  }, [isEditing, user]);

  useEffect(() => {
    if (useSameAddress) {
      setActualAddress(legalAddress);
    }
  }, [legalAddress, useSameAddress]);

  // Обновляем координаты если они были переданы из MapPicker
  useFocusEffect(
    React.useCallback(() => {
      const params = route.params as { coordinates?: { latitude: number; longitude: number } } | undefined;
      if (params?.coordinates) {
        setCoordinates(params.coordinates);
      }
    }, [route.params])
  );

  const loadObject = async () => {
    if (!objectId) return;

    try {
      setIsLoading(true);
      const object = await ObjectService.getObjectById(objectId);
      
      if (object) {
        setName(object.name);
        setLegalAddress(object.legalAddress);
        setActualAddress(object.actualAddress);
        setType(object.type);
        setFireSafetyClass(object.fireSafetyClass);
        setCoordinates(object.coordinates);

        // Загружаем текущего ответственного
        const currentResponsible = object.responsiblePersons.find(rp => rp.isCurrent);
        if (currentResponsible) {
          setResponsibleId(currentResponsible.id);
          setResponsibleName(currentResponsible.fullName);
          setResponsiblePosition(currentResponsible.position);
          setWorkPhone(currentResponsible.workPhone || '');
          setMobilePhone(currentResponsible.mobilePhone || '');
          setEmail(currentResponsible.email || '');
        }
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные объекта');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите наименование объекта');
      return false;
    }
    if (!legalAddress.trim()) {
      Alert.alert('Ошибка', 'Введите юридический адрес');
      return false;
    }
    if (!actualAddress.trim()) {
      Alert.alert('Ошибка', 'Введите фактический адрес');
      return false;
    }
    if (!responsibleName.trim()) {
      Alert.alert('Ошибка', 'Введите ФИО ответственного лица');
      return false;
    }
    if (!responsiblePosition.trim()) {
      Alert.alert('Ошибка', 'Введите должность ответственного лица');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const objectData: Omit<InspectionObject, "id"> & { id?: string } = {
        id: objectId,
        name: name.trim(),
        legalAddress: legalAddress.trim(),
        actualAddress: actualAddress.trim(),
        createdBy: user?.id || '',
        coordinates: coordinates || { latitude: 53.630, longitude: 55.950 },
        type,
        fireSafetyClass,
        responsiblePersons: [
          {
            id: responsibleId.trim(),
            fullName: responsibleName.trim(),
            position: responsiblePosition.trim(),
            workPhone: workPhone.trim() || undefined,
            mobilePhone: mobilePhone.trim() || undefined,
            email: email.trim() || undefined,
            assignedDate: new Date().toISOString(),
            isCurrent: true,
          },
        ],
        documents: [],
        inspections: [],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // createdBy устанавливается на бэкенде из токена
      };

      await ObjectService.saveObject(objectData);

      Alert.alert(
        'Успех',
        isEditing ? 'Объект успешно обновлен' : 'Объект успешно создан',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить объект');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOnMap = () => {
    // TODO: Реализовать навигацию на экран выбора координат на карте
    // Временная заглушка для отображения фронта - функция будет реализована позже
    Alert.alert('Выбор на карте', 'Функция выбора координат на карте будет реализована позже');
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
          {isEditing ? 'Редактирование объекта' : 'Добавление объекта'}
        </Text>
      </View>

      {/* Основная информация */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Основная информация</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Наименование объекта *</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите наименование"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Тип объекта *</Text>
          <View style={styles.pickerContainer}>
            {ObjectService.getObjectTypes().map((objType) => (
              <TouchableOpacity
                key={objType.value}
                style={[
                  styles.pickerOption,
                  type === objType.value && styles.pickerOptionSelected,
                ]}
                onPress={() => setType(objType.value)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    type === objType.value && styles.pickerOptionTextSelected,
                  ]}
                >
                  {objType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Класс пожарной опасности *</Text>
          <View style={styles.pickerContainer}>
            {ObjectService.getFireSafetyClasses().map((safetyClass) => (
              <TouchableOpacity
                key={safetyClass.value}
                style={[
                  styles.pickerOption,
                  fireSafetyClass === safetyClass.value && styles.pickerOptionSelected,
                ]}
                onPress={() => setFireSafetyClass(safetyClass.value)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    fireSafetyClass === safetyClass.value && styles.pickerOptionTextSelected,
                  ]}
                >
                  {safetyClass.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Адреса */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Адреса</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Юридический адрес *</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите юридический адрес"
            value={legalAddress}
            onChangeText={setLegalAddress}
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Совпадает с юридическим</Text>
          <Switch
            value={useSameAddress}
            onValueChange={setUseSameAddress}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={useSameAddress ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Фактический адрес *</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите фактический адрес"
            value={actualAddress}
            onChangeText={setActualAddress}
            placeholderTextColor="#999"
            multiline
            editable={!useSameAddress}
          />
        </View>

        <View style={styles.coordinatesDisplay}>
          <Text style={styles.coordinatesLabel}>Координаты:</Text>
          <Text style={styles.coordinatesText}>
            {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
          </Text>
        </View>

        <TouchableOpacity style={styles.mapButton} onPress={handleSelectOnMap}>
          <Ionicons name="map" size={20} color="#000" />
          <Text style={styles.mapButtonText}>Выбрать на карте</Text>
        </TouchableOpacity>
      </View>

      {/* Ответственное лицо */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ответственное лицо</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ФИО *</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите ФИО ответственного"
            value={responsibleName}
            onChangeText={setResponsibleName}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Должность *</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите должность"
            value={responsiblePosition}
            onChangeText={setResponsiblePosition}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Рабочий телефон</Text>
          <TextInput
            style={styles.input}
            placeholder="+7 (XXX) XXX-XX-XX"
            value={workPhone}
            onChangeText={setWorkPhone}
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Мобильный телефон</Text>
          <TextInput
            style={styles.input}
            placeholder="+7 (XXX) XXX-XX-XX"
            value={mobilePhone}
            onChangeText={setMobilePhone}
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
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
                {isEditing ? 'Сохранить изменения' : 'Создать объект'}
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
    </ScrollView>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_HEIGHT < 700;

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
    fontSize: isSmallScreen ? 14 : 16,
    color: '#666',
  },
  header: {
    padding: isSmallScreen ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  title: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  section: {
    padding: isSmallScreen ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  inputGroup: {
    marginBottom: isSmallScreen ? 12 : 16,
  },
  label: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: isSmallScreen ? 6 : 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: isSmallScreen ? 10 : 12,
    fontSize: isSmallScreen ? 15 : 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#000000',
  },
  coordinatesDisplay: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  coordinatesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 16,
  },
  mapButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  actions: {
    padding: isSmallScreen ? 12 : 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: isSmallScreen ? 14 : 16,
    borderRadius: 8,
    marginBottom: isSmallScreen ? 10 : 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    padding: isSmallScreen ? 14 : 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
  },
});