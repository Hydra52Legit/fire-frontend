import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../services/authService';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Выйти', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.navigate('Login');
          }
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Пользователь не найден</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.position}>{user.position}</Text>
        <View style={[styles.roleBadge, 
          user.role === 'admin' ? styles.adminBadge : 
          user.role === 'inspector' ? styles.inspectorBadge : 
          styles.viewerBadge
        ]}>
          <Text style={styles.roleText}>
            {user.role === 'admin' ? 'Администратор' : 
             user.role === 'inspector' ? 'Инспектор' : 'Наблюдатель'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Контактная информация</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={20} color="#666" />
          <Text style={styles.infoText}>{user.email}</Text>
        </View>

        {user.phone && (
          <View style={styles.infoItem}>
            <Ionicons name="call" size={20} color="#666" />
            <Text style={styles.infoText}>{user.phone}</Text>
          </View>
        )}

        <View style={styles.infoItem}>
          <Ionicons name="calendar" size={20} color="#666" />
          <Text style={styles.infoText}>
            В системе с {new Date(user.createdAt).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Статистика</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {user.assignedObjects?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Объектов в работе</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {AuthService.isAdmin(user) ? 'Все' : 'Ограничен'}
            </Text>
            <Text style={styles.statLabel}>Уровень доступа</Text>
          </View>
        </View>
      </View>

      {AuthService.isAdmin(user) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Административные функции</Text>
          
          <TouchableOpacity style={styles.adminButton}>
            <Ionicons name="people" size={20} color="#007AFF" />
            <Text style={styles.adminButtonText}>Управление пользователями</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminButton}>
            <Ionicons name="settings" size={20} color="#007AFF" />
            <Text style={styles.adminButtonText}>Настройки системы</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.adminButton}>
            <Ionicons name="document-text" size={20} color="#007AFF" />
            <Text style={styles.adminButtonText}>Отчеты и статистика</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color="#FF3B30" />
        <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  position: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  adminBadge: {
    backgroundColor: '#FF3B30',
  },
  inspectorBadge: {
    backgroundColor: '#007AFF',
  },
  viewerBadge: {
    backgroundColor: '#34C759',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    color: '#ccc',
    fontSize: 16,
    marginLeft: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  adminButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});