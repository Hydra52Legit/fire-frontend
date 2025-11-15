export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';

// Единая тема приложения
export const theme = {
  colors: require('./colors').colors,
  spacing: require('./spacing').spacing,
  typography: require('./typography').typography,
  
  // Радиусы скругления
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Тени
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

