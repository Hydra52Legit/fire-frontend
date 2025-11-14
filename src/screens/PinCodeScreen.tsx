import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types/navigation';

type PinCodeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PinCode'>;

export default function PinCodeScreen() {
  const [pin, setPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const navigation = useNavigation<PinCodeScreenNavigationProp>();

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    const savedPin = await AsyncStorage.getItem('userPin');
    setIsSettingPin(!savedPin);
    if (!savedPin) {
      setStep('enter');
    }
  };

  const handleNumberPress = (number: string) => {
    if (pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (isSettingPin && step === 'enter') {
          setStep('confirm');
          setConfirmPin('');
        } else {
          handlePinComplete(newPin);
        }
      }
    }
  };

  const handlePinComplete = async (completedPin: string) => {
    if (isSettingPin) {
      if (step === 'confirm') {
        if (completedPin === pin) {
          await AsyncStorage.setItem('userPin', completedPin);
          await AsyncStorage.setItem('pinCodeSet', 'true');
          Alert.alert('Успех', 'PIN-код установлен');
          navigation.navigate('Tabs');
        } else {
          Alert.alert('Ошибка', 'PIN-коды не совпадают');
          setStep('enter');
          setPin('');
          setConfirmPin('');
        }
      }
    } else {
      // Проверка существующего PIN-кода
      const savedPin = await AsyncStorage.getItem('userPin');
      if (completedPin === savedPin) {
        navigation.navigate('Tabs');
      } else {
        Alert.alert('Ошибка', 'Неверный PIN-код');
        setPin('');
      }
    }
  };

  const handleDelete = () => {
    if (step === 'confirm' && confirmPin.length > 0) {
      setConfirmPin(confirmPin.slice(0, -1));
    } else if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const getDisplayPin = () => {
    return step === 'confirm' ? confirmPin : pin;
  };

  const getTitle = () => {
    if (isSettingPin) {
      return step === 'enter' ? 'Установите PIN-код' : 'Подтвердите PIN-код';
    }
    return 'Введите PIN-код';
  };

  const getSubtitle = () => {
    if (isSettingPin) {
      return step === 'enter' ? 'Придумайте 4-значный код' : 'Повторите PIN-код для подтверждения';
    }
    return 'Для доступа к приложению';
  };

  // Обновляем confirmPin при вводе в режиме подтверждения
  React.useEffect(() => {
    if (step === 'confirm' && pin.length === 4) {
      const newConfirmPin = pin;
      setConfirmPin(newConfirmPin);
      if (newConfirmPin.length === 4) {
        handlePinComplete(newConfirmPin);
      }
    }
  }, [step, pin]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="lock-closed" size={50} color="#fff" />
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>
      </View>

      <View style={styles.pinDisplay}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < getDisplayPin().length ? styles.pinDotFilled : styles.pinDotEmpty,
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((number) => (
            <TouchableOpacity
              key={number}
              style={styles.keypadButton}
              onPress={() => handleNumberPress(number)}
            >
              <Text style={styles.keypadText}>{number}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((number) => (
            <TouchableOpacity
              key={number}
              style={styles.keypadButton}
              onPress={() => handleNumberPress(number)}
            >
              <Text style={styles.keypadText}>{number}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((number) => (
            <TouchableOpacity
              key={number}
              style={styles.keypadButton}
              onPress={() => handleNumberPress(number)}
            >
              <Text style={styles.keypadText}>{number}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.keypadRow}>
          <View style={styles.keypadButton} />
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={() => handleNumberPress('0')}
          >
            <Text style={styles.keypadText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={handleDelete}
          >
            <Ionicons name="backspace" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isSettingPin && step === 'confirm' && (
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={() => {
            setStep('enter');
            setPin('');
            setConfirmPin('');
          }}
        >
          <Text style={styles.resetButtonText}>Начать заново</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 50,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  pinDotEmpty: {
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#666',
  },
  pinDotFilled: {
    backgroundColor: '#fff',
  },
  keypad: {
    marginTop: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  keypadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  resetButton: {
    marginTop: 30,
    padding: 15,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});