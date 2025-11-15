import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, theme as themeConfig } from '../../theme';
import SearchService, { SearchSuggestion } from '../../services/searchService';

interface SmartSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  onClear?: () => void;
  showSuggestions?: boolean;
  maxSuggestions?: number;
}

export const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  value,
  onChangeText,
  onSuggestionSelect,
  placeholder = 'Поиск...',
  onClear,
  showSuggestions = true,
  maxSuggestions = 5,
}) => {
  const { colors } = useTheme();
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Очищаем предыдущий таймер
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value || value.length < 2) {
      setSuggestions([]);
      setShowSuggestionsList(false);
      return;
    }

    setIsLoading(true);
    setShowSuggestionsList(false);

    // Debounce для уменьшения количества запросов
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await SearchService.getSuggestions(value, maxSuggestions);
        setSuggestions(results);
        setShowSuggestionsList(showSuggestions && results.length > 0);
      } catch (error) {
        console.error('Error loading suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, showSuggestions, maxSuggestions]);

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    onChangeText(suggestion.text);
    setShowSuggestionsList(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const handleClear = () => {
    onChangeText('');
    setSuggestions([]);
    setShowSuggestionsList(false);
    if (onClear) {
      onClear();
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'object':
        return 'business';
      case 'extinguisher':
        return 'flame';
      case 'equipment':
        return 'construct';
      case 'person':
        return 'person';
      default:
        return 'search';
    }
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'object':
        return colors.primary;
      case 'extinguisher':
        return colors.error;
      case 'equipment':
        return colors.warning;
      case 'person':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: showSuggestionsList ? colors.primary : colors.border,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textPlaceholder}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestionsList(true);
            }
          }}
          onBlur={() => {
            // Задержка для обработки нажатия на suggestion
            setTimeout(() => setShowSuggestionsList(false), 200);
          }}
        />
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        )}
        {value.length > 0 && !isLoading && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestionsList && suggestions.length > 0 && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => handleSuggestionPress(item)}
              >
                <Ionicons
                  name={getSuggestionIcon(item.type)}
                  size={20}
                  color={getSuggestionColor(item.type)}
                  style={styles.suggestionIcon}
                />
                <View style={styles.suggestionContent}>
                  <Text style={[styles.suggestionText, { color: colors.text }]}>
                    {item.text}
                  </Text>
                  {item.metadata?.objectName && (
                    <Text
                      style={[
                        styles.suggestionMetadata,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.metadata.objectName}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: themeConfig.borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  loader: {
    marginLeft: spacing.sm,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    borderRadius: themeConfig.borderRadius.md,
    borderWidth: 1,
    maxHeight: 300,
    ...themeConfig.shadows.lg,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    marginRight: spacing.sm,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionMetadata: {
    fontSize: 12,
    marginTop: spacing.xs / 2,
  },
});

