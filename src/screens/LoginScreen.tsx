import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // После успешного логина автоматически переходим на Tabs через Context
      // PIN-код временно отключен для упрощения
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось войти в систему. Проверьте email и пароль.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Ionicons name="shield-checkmark" size={80} color="#007AFF" style={styles.logo} />
        <Text style={styles.title}>Пожарная Инспекция</Text>
        <Text style={styles.subtitle}>Вход в систему</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Войти</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerLinkText}>
            Нет аккаунта? <Text style={styles.registerLinkBold}>Зарегистрироваться</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.demoText}>
          Для демо используйте: admin@fireinspection.ru / любой пароль
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Черный фон
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#fff', // Белый текст
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#fff', // Белый текст вместо серого
  },
  input: {
    backgroundColor: '#000', // Черный фон полей
    borderWidth: 1,
    borderColor: '#fff', // Белые границы
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#fff', // Белый текст в полях
  },
  button: {
    backgroundColor: '#fff', // Белый фон кнопки
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#666', // Серый для disabled состояния
  },
  buttonText: {
    color: '#000', // Черный текст на кнопке
    fontSize: 18,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#fff', // Белый текст
    fontSize: 16,
  },
  registerLinkBold: {
    color: '#fff', // Белый текст вместо синего
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  demoText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#fff', // Белый текст
    fontSize: 14,
  },
});