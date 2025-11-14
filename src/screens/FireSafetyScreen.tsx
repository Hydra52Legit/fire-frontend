// src/screens/FireSafetyScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function FireSafetyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { objectId } = route.params as { objectId: string };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backButtonText}>Пожарная безопасность</Text>
      </TouchableOpacity>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Пожарная безопасность объекта</Text>
        <Text style={styles.objectId}>ID объекта: {objectId}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Документы</Text>
          <Text style={styles.placeholder}>Список документов будет здесь</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Требования</Text>
          <Text style={styles.placeholder}>Требования пожарной безопасности</Text>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  objectId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});