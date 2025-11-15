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
import ObjectsListScreen from './src/screens/ObjectsListScreen';
import ObjectDetailsScreen from './src/screens/ObjectDetails';
import AddEditObjectScreen from './src/screens/AddEditObjectScreen'; 
import FireSafetyScreen from './src/screens/FireSafetyScreen';
import { NotificationProvider } from './src/contexts/NotificationContext';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import CreateInspectionScreen from './src/screens/CreateInspectionScreen';
import ReportsScreen from './src/screens/ReportScreen';

import ExtinguishersListScreen from './src/screens/ExtinguishersListScreen';
import AddEditExtinguisherScreen from './src/screens/AddEditinguisherScreen';

import EquipmentListScreen from './src/screens/EquipmentListScreen';
import AddEditEquipmentScreen from './src/screens/AddEditEquipmentScreen';

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
  const { user, isLoading } = useAuth();
  
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
          animation: 'slide_from_right'
        }}
      >
        {user ? (
          // Пользователь авторизован - показываем основные экраны
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="ObjectDetails" component={ObjectDetailsScreen} />
            <Stack.Screen name="ObjectsList" component={ObjectsListScreen} />
            <Stack.Screen name="AddEditObject" component={AddEditObjectScreen} />
            <Stack.Screen name="FireSafety" component={FireSafetyScreen} />
            <Stack.Screen name="ExtinguishersList" component={ExtinguishersListScreen} />
            <Stack.Screen name="AddEditExtinguisher" component={AddEditExtinguisherScreen} />
            <Stack.Screen name="EquipmentList" component={EquipmentListScreen} />
            <Stack.Screen name="AddEditEquipment" component={AddEditEquipmentScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="PinCode" component={PinCodeScreen} />
          </>
        ) : (
          // Пользователь не авторизован - показываем экраны авторизации
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}