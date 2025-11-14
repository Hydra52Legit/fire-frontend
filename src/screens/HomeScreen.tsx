import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { RootStackParamList } from '../types/navigation';
import { InspectionObject, FireSafetyStats } from '../types';
import DataService from '../services/dataService';
import FireSafetyService from '../services/fireSafetyService';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const ASPECT_RATIO = width / height;

// Координаты центра Стерлитамака
const STERLITAMAK_REGION: Region = {
  latitude: 53.630,
  longitude: 55.950,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0922 * ASPECT_RATIO,
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  
  const [searchVisible, setSearchVisible] = useState(false);
  const [modulesModalVisible, setModulesModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [objects, setObjects] = useState<InspectionObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<InspectionObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<InspectionObject | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(STERLITAMAK_REGION);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<FireSafetyStats>({
    totalExtinguishers: 0,
    expiredExtinguishers: 0,
    totalEquipment: 0,
    expiredEquipment: 0,
    upcomingInspections: 0,
  });

  useEffect(() => {
    loadObjects();
    loadStats();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    filterObjects();
  }, [searchQuery, objects]);

  const loadObjects = async () => {
    try {
      setIsLoading(true);
      const objectsData = await DataService.getObjects();
      setObjects(objectsData);
      setFilteredObjects(objectsData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить объекты');
      console.error('Error loading objects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await FireSafetyService.getFireSafetyStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        // Центрируем карту на пользователе с небольшим зумом
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0422,
          longitudeDelta: 0.0422 * ASPECT_RATIO,
        });
      }
    } catch (error) {
      console.error('Location permission error:', error);
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

  const handleMarkerPress = (object: InspectionObject) => {
    setSelectedObject(object);
    Alert.alert(
      object.name,
      `📍 Адрес: ${object.actualAddress}\n🏢 Тип: ${getObjectTypeLabel(object.type)}\n🛡️ Класс опасности: ${object.fireSafetyClass}\n📊 Проверок: ${object.inspections.length}`,
      [
        { text: 'Закрыть', style: 'cancel' },
        { 
          text: 'Пожарная безопасность', 
          onPress: () => {
            navigation.navigate('FireSafety', { objectId: object.id });
          }
        }
      ]
    );
  };

  const handleObjectSelect = (object: InspectionObject) => {
    setMapRegion({
      ...mapRegion,
      latitude: object.coordinates.latitude,
      longitude: object.coordinates.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005 * ASPECT_RATIO,
    });
    setSearchVisible(false);
    setSearchQuery('');
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

    if (hasExpiredDocuments || hasFailedInspections) return '#FF3B30'; // Красный - проблемы
    if (object.inspections.length === 0) return '#FF9500'; // Оранжевый - нет проверок
    return '#34C759'; // Зеленый - все в порядке
  };

  const getStatusIcon = (object: InspectionObject) => {
    const hasExpiredDocuments = object.documents.some(doc => 
      doc.expirationDate && new Date(doc.expirationDate) < new Date()
    );
    
    if (hasExpiredDocuments) return 'warning';
    return 'business';
  };

  const MODULES = [
    {
      id: 'objects',
      title: 'Реестр объектов',
      description: 'Учет всех проверяемых объектов',
      icon: 'business',
      screen: 'ObjectsList',
      adminOnly: false,
      color: '#45B7D1'
    },
    {
      id: 'extinguishers',
      title: 'Огнетушители',
      description: 'Инвентаризация средств пожаротушения',
      icon: 'flame',
      screen: 'ExtinguishersList',
      adminOnly: false,
      color: '#FF6B6B'
    },
    {
      id: 'equipment',
      title: 'Пожарное оборудование',
      description: 'Учет пожарного оборудования',
      icon: 'hardware-chip',
      screen: 'EquipmentList',
      adminOnly: false,
      color: '#4ECDC4'
    },
    {
      id: 'safety',
      title: 'Пожарная безопасность',
      description: 'Общая статистика и мониторинг',
      icon: 'shield-checkmark',
      screen: 'FireSafety',
      adminOnly: false,
      color: '#FFD166'
    },
    {
      id: 'reports',
      title: 'Отчеты',
      description: 'Аналитика и отчетность',
      icon: 'document-text',
      screen: 'Reports',
      adminOnly: true,
      color: '#9B5DE5'
    },
    {
      id: 'notifications',
      title: 'Уведомления',
      description: 'Настройка оповещений',
      icon: 'notifications',
      screen: 'NotificationSettings',
      adminOnly: false,
      color: '#00BBF9'
    },
    {
      id: 'add_object',
      title: 'Добавление объектов',
      description: 'Доступно администраторам',
      icon: 'add-circle',
      screen: 'AddEditObject',
      adminOnly: true,
      color: '#06D6A0'
    },
  ];

  const handleModulePress = (module: any) => {
    setModulesModalVisible(false);
    
    if (module.screen === 'FireSafety') {
      // Для FireSafety можно передать первый объект или сделать выбор
      const firstObject = objects[0];
      if (firstObject) {
        navigation.navigate('FireSafety', { objectId: firstObject.id });
      } else {
        Alert.alert('Информация', 'Нет объектов для отображения');
      }
    } else if (module.screen) {
      navigation.navigate(module.screen as any);
    }
  };

  const centerOnUser = async () => {
    if (userLocation) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0422,
        longitudeDelta: 0.0422 * ASPECT_RATIO,
      });
    } else {
      await requestLocationPermission();
    }
  };

  // Быстрая статистика для главного экрана
  const QuickStats = () => (
    <View style={styles.quickStats}>
      <Text style={styles.quickStatsTitle}>Быстрая статистика</Text>
      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('ExtinguishersList')}
        >
          <Ionicons name="flame" size={24} color="#FF6B6B" />
          <Text style={styles.statNumber}>{stats.totalExtinguishers}</Text>
          <Text style={styles.statLabel}>Огнетушители</Text>
          {stats.expiredExtinguishers > 0 && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>{stats.expiredExtinguishers}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('EquipmentList')}
        >
          <Ionicons name="hardware-chip" size={24} color="#4ECDC4" />
          <Text style={styles.statNumber}>{stats.totalEquipment}</Text>
          <Text style={styles.statLabel}>Оборудование</Text>
          {stats.expiredEquipment > 0 && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>{stats.expiredEquipment}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('ObjectsList')}
        >
          <Ionicons name="business" size={24} color="#45B7D1" />
          <Text style={styles.statNumber}>{objects.length}</Text>
          <Text style={styles.statLabel}>Объекты</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Карта */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        customMapStyle={mapStyle}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        toolbarEnabled={false}
      >
        {filteredObjects.map((obj) => (
          <Marker
            key={obj.id}
            coordinate={obj.coordinates}
            title={obj.name}
            description={obj.actualAddress}
            onPress={() => handleMarkerPress(obj)}
          >
            <View style={[styles.marker, { backgroundColor: getStatusColor(obj) }]}>
              <Ionicons name={getStatusIcon(obj) as any} size={16} color="#000" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Панель управления */}
      <View style={styles.controlsContainer}>
        {/* Поисковая панель */}
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={() => setSearchVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color="#666" />
            <Text style={styles.searchButtonText}>Поиск объектов...</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modulesButton}
            onPress={() => setModulesModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="apps" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Быстрая статистика */}
        <QuickStats />

        {/* Кнопка центрирования на пользователе */}
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={centerOnUser}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Модальное окно поиска */}
      <Modal
        visible={searchVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.searchModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Поиск объектов</Text>
              <TouchableOpacity 
                onPress={() => setSearchVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Введите название объекта или адрес..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#666"
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView 
              style={styles.searchResults}
              showsVerticalScrollIndicator={false}
            >
              {filteredObjects.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={48} color="#E5E5EA" />
                  <Text style={styles.emptyStateText}>
                    {searchQuery ? 'Объекты не найдены' : 'Нет объектов для отображения'}
                  </Text>
                </View>
              ) : (
                filteredObjects.map((obj) => (
                  <TouchableOpacity 
                    key={obj.id} 
                    style={styles.searchResultItem}
                    onPress={() => handleObjectSelect(obj)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.objectStatus, { backgroundColor: getStatusColor(obj) }]} />
                    <Ionicons name="business" size={20} color="#000" style={styles.objectIcon} />
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName} numberOfLines={1}>{obj.name}</Text>
                      <Text style={styles.searchResultAddress} numberOfLines={1}>{obj.actualAddress}</Text>
                      <Text style={styles.searchResultType}>{getObjectTypeLabel(obj.type)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Модальное окно модулей */}
      <Modal
        visible={modulesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModulesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modulesModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Модули системы</Text>
              <TouchableOpacity 
                onPress={() => setModulesModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modulesList}
              showsVerticalScrollIndicator={false}
            >
              {MODULES.map((module) => {
                // Показываем только доступные модули для роли пользователя
                if (module.adminOnly && user?.role !== 'admin') {
                  return null;
                }
                
                return (
                  <TouchableOpacity
                    key={module.id}
                    style={styles.moduleItem}
                    onPress={() => handleModulePress(module)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.moduleIcon, { backgroundColor: module.color + '20' }]}>
                      <Ionicons name={module.icon as any} size={24} color={module.color} />
                    </View>
                    <View style={styles.moduleInfo}>
                      <Text style={styles.moduleTitle}>{module.title}</Text>
                      <Text style={styles.moduleDescription}>{module.description}</Text>
                      {module.adminOnly && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Только для администраторов</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Темный стиль для карты
const mapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: isSmallScreen ? 12 : 14,
    borderRadius: 25,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    marginLeft: 10,
    color: '#666',
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '500',
  },
  modulesButton: {
    backgroundColor: '#fff',
    width: isSmallScreen ? 44 : 48,
    height: isSmallScreen ? 44 : 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationButton: {
    backgroundColor: '#fff',
    width: isSmallScreen ? 44 : 48,
    height: isSmallScreen ? 44 : 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickStatsTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    position: 'relative',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  warningBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * (isSmallScreen ? 0.75 : 0.8),
  },
  searchModal: {
    maxHeight: height * (isSmallScreen ? 0.7 : 0.75),
  },
  modulesModal: {
    maxHeight: height * (isSmallScreen ? 0.65 : 0.7),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: isSmallScreen ? 16 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    margin: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: isSmallScreen ? 12 : 14,
    fontSize: isSmallScreen ? 15 : 16,
    color: '#000',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 12 : 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  objectStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  objectIcon: {
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
    marginRight: 8,
  },
  searchResultName: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#666',
    marginBottom: 2,
  },
  searchResultType: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#999',
    fontWeight: '500',
  },
  modulesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 14 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  moduleIcon: {
    width: isSmallScreen ? 44 : 48,
    height: isSmallScreen ? 44 : 48,
    borderRadius: isSmallScreen ? 22 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: isSmallScreen ? 16 : 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#666',
    lineHeight: isSmallScreen ? 18 : 20,
  },
  adminBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '500',
  },
  marker: {
    width: isSmallScreen ? 28 : 32,
    height: isSmallScreen ? 28 : 32,
    borderRadius: isSmallScreen ? 14 : 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});