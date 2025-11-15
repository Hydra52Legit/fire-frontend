import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InspectionObject } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ActionButton } from '../ui/ActionButton';

interface ObjectCardProps {
  object: InspectionObject;
  onPress: () => void;
  onFireSafety?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
  getObjectTypeLabel: (type: string) => string;
}

export const ObjectCard: React.FC<ObjectCardProps> = ({
  object,
  onPress,
  onFireSafety,
  onEdit,
  showActions = true,
  getObjectTypeLabel,
}) => {
  const getStatusColor = (obj: InspectionObject) => {
    const hasExpiredDocuments = obj.documents.some(
      (doc) => doc.expirationDate && new Date(doc.expirationDate) < new Date()
    );
    const hasFailedInspections = obj.inspections.some(
      (insp) => insp.result === 'failed'
    );

    if (hasExpiredDocuments || hasFailedInspections) return '#FF3B30';
    if (obj.inspections.length === 0) return '#FF9500';
    return '#34C759';
  };

  const getStatusText = (obj: InspectionObject) => {
    const hasExpiredDocuments = obj.documents.some(
      (doc) => doc.expirationDate && new Date(doc.expirationDate) < new Date()
    );

    if (hasExpiredDocuments) return 'Проблемы';
    if (obj.inspections.length === 0) return 'Нет проверок';
    return 'В порядке';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.objectInfo}>
          <Text style={styles.objectName}>{object.name}</Text>
          <Text style={styles.objectType}>
            {getObjectTypeLabel(object.type)} • {object.fireSafetyClass}
          </Text>
        </View>
        <StatusBadge
          status={getStatusText(object)}
          color={getStatusColor(object)}
        />
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>{object.actualAddress}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="document-text" size={16} color="#666" />
          <Text style={styles.detailText}>
            Документы: {object.documents.length} • Проверок:{' '}
            {object.inspections.length}
          </Text>
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {onFireSafety && (
            <ActionButton
              icon="shield-checkmark"
              label="Пожарная безопасность"
              onPress={onFireSafety}
              variant="primary"
            />
          )}
          {onEdit && (
            <ActionButton
              icon="create"
              label="Редактировать"
              onPress={onEdit}
              variant="secondary"
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
  objectInfo: {
    flex: 1,
    marginRight: 12,
  },
  objectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  objectType: {
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
});

