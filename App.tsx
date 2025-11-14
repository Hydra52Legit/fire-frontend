import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ObjectsScreen from './src/screens/ObjectsScreen';
import PinCodeScreen from './src/screens/PinCodeScreen';
import RegisterScreen from './src/screens/RegisterScreen'; // Добавим экран регистрации

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
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Objects" 
        component={ObjectsScreen}
        options={{
          title: 'Объекты',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

type AuthState = 'unauthorized' | 'needs_pin' | 'authorized';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>('unauthorized');

  // Функция для сброса авторизации (для отладки)
  const resetAuth = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('pinCodeSet');
    await AsyncStorage.removeItem('userPin');
    setAuthState('unauthorized');
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Для отладки - раскомментируйте следующую строку чтобы сбросить авторизацию
        await resetAuth();

        const token = await AsyncStorage.getItem('userToken');
        const pinSet = await AsyncStorage.getItem('pinCodeSet');
        
        console.log('🔐 Auth check:', { 
          hasToken: !!token, 
          pinSet: pinSet,
          authState: 'checking...' 
        });
        
        if (token) {
          if (pinSet === 'true') {
            setAuthState('needs_pin');
          } else {
            setAuthState('authorized');
          }
        } else {
          setAuthState('unauthorized');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthState('unauthorized');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Проверка авторизации...</Text>
      </View>
    );
  }

  console.log('🎯 Current authState:', authState);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authState === 'unauthorized' && (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
        {authState === 'needs_pin' && (
          <Stack.Screen name="PinCode" component={PinCodeScreen} />
        )}
        {authState === 'authorized' && (
          <Stack.Screen name="Tabs" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}