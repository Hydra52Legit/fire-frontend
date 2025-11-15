import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  text?: string;
  color?: string;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
    case 'passed':
    case 'В порядке':
      return '#34C759';
    case 'maintenance':
    case 'in_progress':
    case 'requires_improvement':
      return '#007AFF';
    case 'expired':
    case 'failed':
    case 'Проблемы':
      return '#FF3B30';
    case 'decommissioned':
    case 'cancelled':
    case 'Нет проверок':
      return '#8E8E93';
    default:
      return '#8E8E93';
  }
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'Активен',
    maintenance: 'Обслуживание',
    expired: 'Просрочен',
    decommissioned: 'Списан',
    passed: 'Пройдено',
    failed: 'Не пройдено',
    requires_improvement: 'Требует улучшений',
    in_progress: 'В процессе',
    cancelled: 'Отменено',
  };
  return statusMap[status] || status;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  color,
}) => {
  const badgeColor = color || getStatusColor(status);
  const badgeText = text || getStatusText(status);

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
      <Text style={styles.text}>{badgeText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

