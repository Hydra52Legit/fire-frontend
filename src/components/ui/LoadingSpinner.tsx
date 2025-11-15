import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface LoadingSpinnerProps {
  message?: string;
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Загрузка...',
  color = colors.primary,
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  text: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
});

