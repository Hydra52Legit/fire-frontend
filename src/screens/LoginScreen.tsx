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
import { useTheme } from '../contexts/ThemeContext';
import { ValidatedTextInput } from '../components/forms';
import { spacing, theme as themeConfig } from '../theme';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // После успешного логина автоматически переходим на Tabs через Context
      // TODO: PIN-код временно отключен для упрощения - будет реализован позже
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось войти в систему. Проверьте email и пароль.');
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
      <View style={styles.content}>
        <Ionicons name="shield-checkmark" size={80} color={colors.primary} style={styles.logo} />
        <Text style={styles.title}>Пожарная Инспекция</Text>
        <Text style={styles.subtitle}>Вход в систему</Text>

        <ValidatedTextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="example@mail.com"
          required
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          validator={(value) => {
            if (!value) return 'Email обязателен для заполнения';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) return 'Введите корректный email адрес';
            return null;
          }}
        />

        <ValidatedTextInput
          label="Пароль"
          value={password}
          onChangeText={setPassword}
          placeholder="Введите пароль"
          required
          secureTextEntry
          autoComplete="password"
          validator={(value) => {
            if (!value) return 'Пароль обязателен для заполнения';
            return null;
          }}
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
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.textSecondary,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: themeConfig.borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
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
  registerLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  registerLinkText: {
    color: colors.text,
    fontSize: 16,
  },
  registerLinkBold: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});