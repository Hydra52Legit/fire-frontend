import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types/navigation';
import { InspectionObject } from '../types';
import DataService from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { SearchInput, EmptyState, LoadingSpinner, ScreenHeader, ObjectCard } from '../components';

type ObjectsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ObjectsList'>;

export default function ObjectsListScreen() {
  const navigation = useNavigation<ObjectsListScreenNavigationProp>();
  const { user } = useAuth();

  const [objects, setObjects] = useState<InspectionObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<InspectionObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadObjects = async () => {
    try {
      setIsLoading(true);
      const objectsData = await DataService.getObjects();
      setObjects(objectsData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить объекты');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadObjects();
    }, [])
  );

  useEffect(() => {
    filterObjects();
  }, [searchQuery, objects]);

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

  const handleAddObject = () => {
    navigation.navigate('AddEditObject', {});
  };

  const handleEditObject = (object: InspectionObject) => {
    navigation.navigate('AddEditObject', { objectId: object.id });
  };

  const handleViewDetails = (object: InspectionObject) => {
    navigation.navigate('ObjectDetails', { objectId: object.id });
  };

  const handleFireSafety = (object: InspectionObject) => {
    navigation.navigate('FireSafety', { objectId: object.id });
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

  if (isLoading) {
    return <LoadingSpinner message="Загрузка объектов..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ScreenHeader
          title="Объекты"
          showAddButton={user?.role === 'admin'}
          onAddPress={handleAddObject}
        />

        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Поиск объектов..."
          onClear={() => setSearchQuery('')}
        />

        <View style={styles.listContainer}>
          {filteredObjects.length === 0 ? (
            <EmptyState
              icon="business"
              title="Объекты не найдены"
              message={
                searchQuery
                  ? 'Попробуйте изменить параметры поиска'
                  : 'Добавьте первый объект'
              }
            />
          ) : (
            filteredObjects.map((object) => (
              <ObjectCard
                key={object.id}
                object={object}
                onPress={() => handleViewDetails(object)}
                onFireSafety={() => handleFireSafety(object)}
                onEdit={user?.role === 'admin' ? () => handleEditObject(object) : undefined}
                getObjectTypeLabel={getObjectTypeLabel}
              />
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    gap: 12,
  },
});