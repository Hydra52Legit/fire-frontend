import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-outline',
  title,
  message,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color="#E5E5EA" />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

