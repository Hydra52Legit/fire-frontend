import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ObjectsScreen from './src/screens/ObjectsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PinCodeScreen from './src/screens/PinCodeScreen';
import ObjectDetailsScreen from './src/screens/ObjectDetails';
import AddEditObjectScreen from './src/screens/ AddEditObjectScreen'; 
import FireSafetyScreen from './src/screens/FireSafetyScreen'; 


import { RootStackParamList, TabParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Таб-навигатор
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#333',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Карта',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Objects" 
        component={ObjectsScreen}
        options={{
          title: 'Объекты',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  // const { user, isLoading } = useAuth();
  const isLoading = false;
  const user = {
    id: '1',
    email: 'admin@fireinspection.ru',
    fullName: 'Иванов Алексей Петрович',
    position: 'Главный инспектор',
    role: 'admin',
    phone: '+7 (999) 123-45-67',
    assignedObjects: ['1', '2', '3'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right' // Плавная анимация переходов
        }}
      >
        {/* Основные экраны */}
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="ObjectDetails" component={ObjectDetailsScreen} />
        <Stack.Screen name="AddEditObject" component={AddEditObjectScreen} />
        <Stack.Screen name="FireSafety" component={FireSafetyScreen} />
        
        {/* Экран авторизации */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="PinCode" component={PinCodeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}