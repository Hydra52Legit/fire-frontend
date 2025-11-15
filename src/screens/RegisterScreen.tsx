import React, { useState } from 'react';
import {
  View,
  Text,
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
import { useTheme } from '../contexts/ThemeContext';
import { FullNameInput, PhoneInput, ValidatedTextInput } from '../components/forms';
import { spacing, theme as themeConfig } from '../theme';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formValid, setFormValid] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    position: false,
  });
  
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register } = useAuth();
  const { colors } = useTheme();

  const validateEmail = (value: string): string | null => {
    if (!value) {
      return 'Email обязателен для заполнения';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Введите корректный email адрес';
    }
    return null;
  };

  const validatePassword = (value: string): string | null => {
    if (!value) {
      return 'Пароль обязателен для заполнения';
    }
    if (value.length < 6) {
      return 'Пароль должен содержать минимум 6 символов';
    }
    return null;
  };

  const validateConfirmPassword = (value: string): string | null => {
    if (!value) {
      return 'Подтвердите пароль';
    }
    if (value !== password) {
      return 'Пароли не совпадают';
    }
    return null;
  };

  const handleRegister = async () => {
    if (!formValid.fullName || !formValid.email || !formValid.password || !formValid.confirmPassword || !formValid.position) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все обязательные поля корректно');
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

  const styles = createStyles(colors);

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
          <Ionicons name="person-add" size={60} color={colors.primary} />
          <Text style={styles.title}>Регистрация</Text>
          <Text style={styles.subtitle}>Создайте аккаунт для доступа к системе</Text>
        </View>

        <View style={styles.form}>
          <FullNameInput
            value={fullName}
            onChangeText={setFullName}
            onValidationChange={(isValid) => setFormValid(prev => ({ ...prev, fullName: isValid }))}
            required
          />

          <ValidatedTextInput
            label="Должность"
            value={position}
            onChangeText={setPosition}
            placeholder="Введите должность"
            required
            validator={(value) => {
              if (!value.trim()) {
                return 'Должность обязательна для заполнения';
              }
              if (value.length < 2) {
                return 'Должность должна содержать минимум 2 символа';
              }
              return null;
            }}
            onValidationChange={(isValid) => setFormValid(prev => ({ ...prev, position: isValid }))}
            autoCapitalize="words"
          />

          <ValidatedTextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="example@mail.com"
            required
            validator={validateEmail}
            onValidationChange={(isValid) => setFormValid(prev => ({ ...prev, email: isValid }))}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <PhoneInput
            value={phone}
            onChangeText={setPhone}
            onValidationChange={() => {}}
          />

          <ValidatedTextInput
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="Минимум 6 символов"
            required
            secureTextEntry
            validator={validatePassword}
            onValidationChange={(isValid) => {
              setFormValid(prev => ({ ...prev, password: isValid }));
              // Перепроверяем подтверждение пароля при изменении пароля
              if (confirmPassword) {
                const confirmError = validateConfirmPassword(confirmPassword);
                setFormValid(prev => ({ ...prev, confirmPassword: !confirmError }));
              }
            }}
            autoComplete="password-new"
          />

          <ValidatedTextInput
            label="Подтвердите пароль"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Повторите пароль"
            required
            secureTextEntry
            validator={validateConfirmPassword}
            onValidationChange={(isValid) => setFormValid(prev => ({ ...prev, confirmPassword: isValid }))}
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

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: themeConfig.borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: colors.textTertiary,
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
  requiredText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: -10,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  loginLink: {
    marginTop: spacing.sm,
    alignItems: 'center',
    padding: spacing.sm,
  },
  loginLinkText: {
    color: colors.text,
    fontSize: 16,
  },
  loginLinkBold: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});