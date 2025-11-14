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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !fullName || !position) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов');
      return;
    }

    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Ошибка', 'Введите корректный email адрес');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email,
        password,
        fullName,
        position,
        phone: phone || undefined,
      });
      
      // После успешной регистрации автоматически переходим на главный экран через Context
      Alert.alert('Успех', 'Регистрация завершена! Добро пожаловать в систему.');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось зарегистрироваться');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="person-add" size={60} color="#007AFF" />
          <Text style={styles.title}>Регистрация</Text>
          <Text style={styles.subtitle}>Создайте аккаунт для доступа к системе</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="ФИО *"
            placeholderTextColor="#666"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Должность *"
            placeholderTextColor="#666"
            value={position}
            onChangeText={setPosition}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Телефон"
            placeholderTextColor="#666"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <TextInput
            style={styles.input}
            placeholder="Пароль *"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />

          <TextInput
            style={styles.input}
            placeholder="Подтвердите пароль *"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password-new"
          />

          <Text style={styles.requiredText}>* Обязательные поля</Text>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Зарегистрироваться</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Уже есть аккаунт? <Text style={styles.loginLinkBold}>Войти</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Черный фон
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff', // Белый текст
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff', // Белый текст вместо серого
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
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
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: '#666', // Серый для disabled
  },
  buttonText: {
    color: '#000', // Черный текст на кнопке
    fontSize: 18,
    fontWeight: '600',
  },
  requiredText: {
    color: '#fff', // Белый текст
    fontSize: 12,
    marginTop: -10,
    marginBottom: 15,
    textAlign: 'center',
  },
  loginLink: {
    marginTop: 10,
    alignItems: 'center',
    padding: 10,
  },
  loginLinkText: {
    color: '#fff', // Белый текст
    fontSize: 16,
  },
  loginLinkBold: {
    color: '#fff', // Белый текст вместо синего
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});