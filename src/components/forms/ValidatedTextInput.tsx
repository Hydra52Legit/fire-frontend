import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, theme } from '../../theme';

interface ValidatedTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  showError?: boolean;
  validator?: (value: string) => string | null;
  onValidationChange?: (isValid: boolean) => void;
}

export const ValidatedTextInput: React.FC<ValidatedTextInputProps> = ({
  label,
  error: externalError,
  showError = true,
  validator,
  onValidationChange,
  value = '',
  onChangeText,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    if (validator && isTouched && value) {
      const validationError = validator(value);
      setInternalError(validationError);
      if (onValidationChange) {
        onValidationChange(!validationError);
      }
    } else if (isTouched && !value && props.required) {
      setInternalError('Это поле обязательно для заполнения');
      if (onValidationChange) {
        onValidationChange(false);
      }
    } else {
      setInternalError(null);
      if (onValidationChange && isTouched) {
        onValidationChange(!externalError && !internalError);
      }
    }
  }, [value, isTouched, validator, externalError]);

  const handleChangeText = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }
    if (!isTouched) {
      setIsTouched(true);
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
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
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: displayError ? colors.error : colors.border,
            color: colors.text,
          },
          displayError && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textPlaceholder}
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

