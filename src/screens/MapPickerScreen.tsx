import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { RootStackParamList } from '../types/navigation';
import { Platform } from 'react-native';

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

type MapPickerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MapPicker'>;

export default function MapPickerScreen() {
  const navigation = useNavigation<MapPickerScreenNavigationProp>();
  const route = useRoute();
  const { initialCoordinates } = route.params as { initialCoordinates?: { latitude: number; longitude: number } };

  const [region, setRegion] = useState<Region>(initialCoordinates ? {
    latitude: initialCoordinates.latitude,
    longitude: initialCoordinates.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01 * ASPECT_RATIO,
  } : STERLITAMAK_REGION);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number }>(
    initialCoordinates || { latitude: 53.630, longitude: 55.950 }
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedCoordinates({ latitude, longitude });
    setRegion({
      ...region,
      latitude,
      longitude,
    });
  };

  const handleMyLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Разрешение на доступ к местоположению не предоставлено');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setSelectedCoordinates({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01 * ASPECT_RATIO,
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить текущее местоположение');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    // Обновляем координаты если они были переданы при навигации
    if (initialCoordinates) {
      setSelectedCoordinates(initialCoordinates);
      setRegion({
        latitude: initialCoordinates.latitude,
        longitude: initialCoordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01 * ASPECT_RATIO,
      });
    }
  }, [initialCoordinates]);

  const handleConfirm = () => {
    // Возвращаем координаты обратно на экран редактирования через navigation params
    navigation.navigate('AddEditObject' as any, {
      coordinates: selectedCoordinates,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Выбор местоположения</Text>
        <View style={styles.placeholder} />
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={selectedCoordinates}
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedCoordinates({ latitude, longitude });
          }}
        />
      </MapView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleMyLocation}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Ionicons name="locate" size={24} color="#000" />
          )}
        </TouchableOpacity>

        <View style={styles.coordinatesInfo}>
          <Text style={styles.coordinatesLabel}>Координаты:</Text>
          <Text style={styles.coordinatesText}>
            {selectedCoordinates.latitude.toFixed(6)}, {selectedCoordinates.longitude.toFixed(6)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Выбрать</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: isSmallScreen ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  map: {
    flex: 1,
  },
  controls: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  locationButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#F8F8F8',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  coordinatesInfo: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  coordinatesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  confirmButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

