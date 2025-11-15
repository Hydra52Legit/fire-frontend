import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FireEquipment } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ActionButton } from '../ui/ActionButton';

interface EquipmentCardProps {
  equipment: FireEquipment;
  onPress: () => void;
  onEdit?: () => void;
  showActions?: boolean;
  getEquipmentTypeText: (type: string) => string;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onPress,
  onEdit,
  showActions = true,
  getEquipmentTypeText,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.equipmentInfo}>
          <Text style={styles.equipmentType}>
            {getEquipmentTypeText(equipment.type)}
          </Text>
          {equipment.inventoryNumber && (
            <Text style={styles.inventoryNumber}>
              {equipment.inventoryNumber}
            </Text>
          )}
        </View>
        <StatusBadge status={equipment.status} />
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>{equipment.location}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            След. проверка:{' '}
            {new Date(equipment.nextInspectionDate).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      </View>

      {showActions && onEdit && (
        <View style={styles.actions}>
          <ActionButton
            icon="create"
            label="Редактировать"
            onPress={onEdit}
            variant="primary"
          />
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
  equipmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  equipmentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  inventoryNumber: {
    fontSize: 14,
    color: '#666',
  },
  cardDetails: {
    gap: 8,
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
    justifyContent: 'flex-end',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
    marginTop: 12,
  },
});

