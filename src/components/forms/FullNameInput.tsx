import React from 'react';
import { ValidatedTextInput } from './ValidatedTextInput';

interface FullNameInputProps {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  showError?: boolean;
  required?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
}

// Валидация ФИО: только кириллические буквы, пробелы и дефисы
const validateFullName = (value: string): string | null => {
  if (!value.trim()) {
    return 'ФИО обязательно для заполнения';
  }
  
  // Проверка на кириллические буквы, пробелы и дефисы
  const cyrillicRegex = /^[А-ЯЁа-яё\s\-]+$/;
  if (!cyrillicRegex.test(value)) {
    return 'ФИО должно содержать только кириллические буквы, пробелы и дефисы';
  }
  
  // Проверка на минимум 2 слова (имя и фамилия)
  const words = value.trim().split(/\s+/).filter(word => word.length > 0);
  if (words.length < 2) {
    return 'Введите имя и фамилию (например: Иванов Иван)';
  }
  
  // Проверка на длину каждого слова (минимум 2 символа)
  if (words.some(word => word.length < 2)) {
    return 'Каждое слово должно содержать минимум 2 символа';
  }
  
  // Проверка на максимальную длину
  if (value.length > 100) {
    return 'ФИО не должно превышать 100 символов';
  }
  
  return null;
};

export const FullNameInput: React.FC<FullNameInputProps> = ({
  label = 'ФИО',
  value = '',
  onChangeText,
  error,
  showError = true,
  required = true,
  onValidationChange,
  placeholder = 'Например: Иванов Иван Иванович',
  ...props
}) => {
  return (
    <ValidatedTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      error={error}
      showError={showError}
      validator={validateFullName}
      onValidationChange={onValidationChange}
      required={required}
      placeholder={placeholder}
      autoCapitalize="words"
      {...props}
    />
  );
};

