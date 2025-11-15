import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, theme } from '../../theme';

interface PhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  showError?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

// Формат: +7 (XXX) XXX-XX-XX
const formatPhoneNumber = (text: string): string => {
  // Удаляем все нецифровые символы
  const numbers = text.replace(/\D/g, '');
  
  // Если начинается с 8, заменяем на 7
  let formatted = numbers.startsWith('8') ? '7' + numbers.slice(1) : numbers;
  
  // Если не начинается с 7, добавляем 7
  if (formatted && !formatted.startsWith('7')) {
    formatted = '7' + formatted;
  }
  
  // Ограничиваем длину (11 цифр: 7 + 10)
  formatted = formatted.slice(0, 11);
  
  // Форматируем
  if (formatted.length === 0) {
    return '';
  } else if (formatted.length <= 1) {
    return `+${formatted}`;
  } else if (formatted.length <= 4) {
    return `+${formatted.slice(0, 1)} (${formatted.slice(1)}`;
  } else if (formatted.length <= 7) {
    return `+${formatted.slice(0, 1)} (${formatted.slice(1, 4)}) ${formatted.slice(4)}`;
  } else if (formatted.length <= 9) {
    return `+${formatted.slice(0, 1)} (${formatted.slice(1, 4)}) ${formatted.slice(4, 7)}-${formatted.slice(7)}`;
  } else {
    return `+${formatted.slice(0, 1)} (${formatted.slice(1, 4)}) ${formatted.slice(4, 7)}-${formatted.slice(7, 9)}-${formatted.slice(9, 11)}`;
  }
};

const validatePhone = (phone: string): string | null => {
  if (!phone) {
    return null; // Необязательное поле
  }
  
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length < 11) {
    return 'Номер телефона должен содержать 11 цифр';
  }
  
  if (!numbers.startsWith('7')) {
    return 'Номер должен начинаться с +7';
  }
  
  return null;
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value = '',
  onChangeText,
  error: externalError,
  showError = true,
  onValidationChange,
  ...props
}) => {
  const { colors } = useTheme();
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  const handleChangeText = (text: string) => {
    const formatted = formatPhoneNumber(text);
    
    if (onChangeText) {
      onChangeText(formatted);
    }
    
    if (!isTouched) {
      setIsTouched(true);
    }
    
    // Валидация
    const validationError = validatePhone(formatted);
    setInternalError(validationError);
    
    if (onValidationChange) {
      onValidationChange(!validationError);
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    const validationError = validatePhone(value);
    setInternalError(validationError);
    if (onValidationChange) {
      onValidationChange(!validationError);
    }
  };

  const displayError = (externalError || internalError) && showError && isTouched;
  const errorMessage = externalError || internalError;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {props.required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      <TextInput
        {...props}
        value={value}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
        keyboardType="phone-pad"
        autoComplete="tel"
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: displayError ? colors.error : colors.border,
            color: colors.text,
          },
          displayError && styles.inputError,
        ]}
        placeholderTextColor={colors.textPlaceholder}
        placeholder={props.placeholder || '+7 (XXX) XXX-XX-XX'}
      />
      {displayError && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errorMessage}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

