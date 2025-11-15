import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FireExtinguisher } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ActionButton } from '../ui/ActionButton';

interface ExtinguisherCardProps {
  extinguisher: FireExtinguisher;
  objectName?: string;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  getExtinguisherTypeText: (type: string) => string;
}

export const ExtinguisherCard: React.FC<ExtinguisherCardProps> = ({
  extinguisher,
  objectName,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
  getExtinguisherTypeText,
}) => {
  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const getDaysUntilExpiry = (dateString: string) => {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilExpiry = getDaysUntilExpiry(extinguisher.nextServiceDate);
  const isExpiredSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpiredNow = isExpired(extinguisher.nextServiceDate);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.extinguisherInfo}>
          <Text style={styles.inventoryNumber}>
            {extinguisher.inventoryNumber}
          </Text>
          <Text style={styles.extinguisherType}>
            {getExtinguisherTypeText(extinguisher.type)} • {extinguisher.capacity}{' '}
            кг
          </Text>
        </View>
        <StatusBadge status={extinguisher.status} />
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>{extinguisher.location}</Text>
        </View>

        {objectName && (
          <View style={styles.detailRow}>
            <Ionicons name="business" size={16} color="#666" />
            <Text style={styles.detailText}>Объект: {objectName}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            След. проверка:{' '}
            {new Date(extinguisher.nextServiceDate).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      </View>

      {isExpiredSoon && extinguisher.status === 'active' && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={16} color="#FF9500" />
          <Text style={styles.warningText}>
            Истекает через {daysUntilExpiry} дней
          </Text>
        </View>
      )}

      {isExpiredNow && extinguisher.status !== 'expired' && (
        <View style={styles.expiredBanner}>
          <Ionicons name="alert-circle" size={16} color="#FF3B30" />
          <Text style={styles.expiredText}>
            ПРОСРОЧЕН! Требуется обслуживание
          </Text>
        </View>
      )}

      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <ActionButton
              icon="create"
              label="Редактировать"
              onPress={onEdit}
              variant="primary"
            />
          )}
          {onDelete && (
            <ActionButton
              icon="trash"
              label="Удалить"
              onPress={onDelete}
              variant="danger"
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  extinguisherInfo: {
    flex: 1,
    marginRight: 12,
  },
  inventoryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  extinguisherType: {
    fontSize: 14,
    color: '#666',
  },
  cardDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8D7DA',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  expiredText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#721C24',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
});

