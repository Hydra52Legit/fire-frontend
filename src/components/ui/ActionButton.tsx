import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, theme } from '../../theme';

interface ActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onPress,
  icon,
  label,
  variant = 'primary',
  disabled = false,
  loading = false,
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'danger':
        return [styles.button, styles.dangerButton];
      case 'secondary':
        return [styles.button, styles.secondaryButton];
      default:
        return [styles.button, styles.primaryButton];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'danger':
        return [styles.text, styles.dangerText];
      case 'secondary':
        return [styles.text, styles.secondaryText];
      default:
        return [styles.text, styles.primaryText];
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return colors.textLight;
      case 'danger':
        return colors.error;
      default:
        return colors.text;
    }
  };

  return (
    <TouchableOpacity
      style={[
        ...getButtonStyle(),
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={getIconColor()}
          size="small"
        />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={16} color={getIconColor()} />}
          <Text style={getTextStyle()}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerButton: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    marginLeft: spacing.xs,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  primaryText: {
    color: colors.textLight,
  },
  secondaryText: {
    color: colors.textSecondary,
  },
  dangerText: {
    color: colors.error,
  },
});

