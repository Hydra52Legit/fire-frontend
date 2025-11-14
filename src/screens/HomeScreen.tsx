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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DataService from '../services/dataService';
import { InspectionObject } from '../types';

const { width, height } = Dimensions.get('window');

// Координаты центра Стерлитамака
const STERLITAMAK_REGION: Region = {
  latitude: 53.630,
  longitude: 55.950,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function HomeScreen() {
  const [searchVisible, setSearchVisible] = useState(false);
  const [modulesModalVisible, setModulesModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [objects, setObjects] = useState<InspectionObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<InspectionObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<InspectionObject | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(STERLITAMAK_REGION);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadObjects();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    filterObjects();
  }, [searchQuery, objects]);

  const loadObjects = async () => {
    const objectsData = await DataService.getObjects();
    setObjects(objectsData);
    setFilteredObjects(objectsData);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
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
      `Адрес: ${object.actualAddress}\nТип: ${getObjectTypeLabel(object.type)}\nКласс опасности: ${object.fireSafetyClass}`,
      [
        { text: 'Закрыть', style: 'cancel' },
        { text: 'Подробнее', onPress: () => {/* Навигация к деталям */} }
      ]
    );
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
    // Логика определения цвета маркера на основе статуса проверок
    const hasExpiredDocuments = object.documents.some(doc => 
      doc.expirationDate && new Date(doc.expirationDate) < new Date()
    );
    
    return hasExpiredDocuments ? '#ff0000' : '#00ff00';
  };

  const MODULES = [
    {
      id: 1,
      title: 'Реестр объектов',
      icon: 'business',
      description: 'Учет всех проверяемых объектов',
      onPress: () => {/* Навигация к реестру */},
    },
    {
      id: 2,
      title: 'Учет огнетушителей',
      icon: 'flame',
      description: 'Инвентаризация средств пожаротушения',
      onPress: () => Alert.alert('В разработке', 'Модуль учета огнетушителей'),
    },
    {
      id: 3,
      title: 'Модуль проверок',
      icon: 'document-text',
      description: 'Плановые и внеплановые проверки',
      onPress: () => Alert.alert('В разработке', 'Модуль проверок'),
    },
    {
      id: 4,
      title: 'Добавление объектов',
      icon: 'add-circle',
      description: 'Доступно администраторам',
      adminOnly: true,
      onPress: () => {/* Навигация к добавлению объекта */},
    },
  ];

  return (
    <View style={styles.container}>
      {/* Карта */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        customMapStyle={mapStyle}
        showsUserLocation={true}
        showsMyLocationButton={true}
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
              <Ionicons name="business" size={16} color="#000" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Поисковая панель */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchButton} onPress={() => setSearchVisible(true)}>
          <Ionicons name="search" size={20} color="#000" />
          <Text style={styles.searchButtonText}>Поиск объектов...</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.modulesButton}
          onPress={() => setModulesModalVisible(true)}
        >
          <Ionicons name="apps" size={20} color="#000" />
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Поиск объектов</Text>
              <TouchableOpacity onPress={() => setSearchVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Введите название объекта или адрес..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#666"
            />
            
            <ScrollView style={styles.searchResults}>
              {filteredObjects.map((obj) => (
                <TouchableOpacity 
                  key={obj.id} 
                  style={styles.searchResultItem}
                  onPress={() => {
                    setMapRegion({
                      ...mapRegion,
                      latitude: obj.coordinates.latitude,
                      longitude: obj.coordinates.longitude,
                    });
                    setSearchVisible(false);
                  }}
                >
                  <Ionicons name="business" size={20} color="#000" />
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{obj.name}</Text>
                    <Text style={styles.searchResultAddress}>{obj.actualAddress}</Text>
                    <Text style={styles.searchResultType}>{getObjectTypeLabel(obj.type)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Модули системы</Text>
              <TouchableOpacity onPress={() => setModulesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modulesList}>
              {MODULES.map((module) => (
                <TouchableOpacity
                  key={module.id}
                  style={styles.moduleItem}
                  onPress={module.onPress}
                >
                  <View style={styles.moduleIcon}>
                    <Ionicons name={module.icon as any} size={24} color="#000" />
                  </View>
                  <View style={styles.moduleInfo}>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <Text style={styles.moduleDescription}>{module.description}</Text>
                    {module.adminOnly && (
                      <Text style={styles.adminBadge}>Только для администраторов</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Черно-белый стиль для карты
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
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 10,
  },
  searchButtonText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 16,
  },
  modulesButton: {
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    color: '#000',
  },
  modulesList: {
    padding: 20,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#666',
  },
  adminBadge: {
    fontSize: 12,
    color: '#ff0000',
    marginTop: 4,
  },
  searchResults: {
    maxHeight: 400,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 15,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  searchResultType: {
    fontSize: 12,
    color: '#999',
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
});