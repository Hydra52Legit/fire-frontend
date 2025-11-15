import ObjectService from './objectService';
import { InspectionObject } from '../types';
import apiClient from './apiClient';
import API_CONFIG from '../config/api.config';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'object' | 'extinguisher' | 'equipment' | 'person';
  metadata?: {
    objectId?: string;
    objectName?: string;
    location?: string;
  };
}

export interface SearchResult {
  objects: InspectionObject[];
  suggestions: SearchSuggestion[];
}

class SearchService {
  private suggestionCache: Map<string, SearchSuggestion[]> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут
  private cacheTimestamps: Map<string, number> = new Map();

  /**
   * Получить подсказки для поискового запроса
   */
  async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `suggestions_${query.toLowerCase()}_${limit}`;
    const cached = this.suggestionCache.get(cacheKey);
    const timestamp = this.cacheTimestamps.get(cacheKey);

    // Проверяем кэш
    if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
      return cached;
    }

    try {
      const suggestions: SearchSuggestion[] = [];

      // Поиск по объектам
      const objects = await ObjectService.getObjects();
      const queryLower = query.toLowerCase();

      // Поиск по названию объекта
      objects
        .filter(obj => 
          obj.name.toLowerCase().includes(queryLower) ||
          obj.legalAddress.toLowerCase().includes(queryLower) ||
          obj.actualAddress.toLowerCase().includes(queryLower)
        )
        .slice(0, limit)
        .forEach(obj => {
          suggestions.push({
            id: `object_${obj.id}`,
            text: obj.name,
            type: 'object',
            metadata: {
              objectId: obj.id,
              objectName: obj.name,
              location: obj.actualAddress || obj.legalAddress,
            },
          });
        });

      // Поиск по ответственным лицам
      objects.forEach(obj => {
        obj.responsiblePersons?.forEach(person => {
          if (person.fullName.toLowerCase().includes(queryLower)) {
            const existing = suggestions.find(s => 
              s.type === 'person' && s.text === person.fullName
            );
            if (!existing) {
              suggestions.push({
                id: `person_${person.id}_${obj.id}`,
                text: person.fullName,
                type: 'person',
                metadata: {
                  objectId: obj.id,
                  objectName: obj.name,
                },
              });
            }
          }
        });
      });

      // Поиск по огнетушителям (инвентарные номера)
      try {
        const allObjects = await ObjectService.getObjects();
        for (const obj of allObjects) {
          try {
            const extinguishers = await apiClient.get<any[]>(
              `${API_CONFIG.ENDPOINTS.EXTINGUISHERS.GET_OBJECT.replace(':objectId', obj.id)}`
            );
            
            extinguishers
              .filter(ext => 
                ext.inventoryNumber?.toLowerCase().includes(queryLower) ||
                ext.location?.toLowerCase().includes(queryLower)
              )
              .slice(0, 3)
              .forEach(ext => {
                suggestions.push({
                  id: `extinguisher_${ext.id}`,
                  text: `Огнетушитель ${ext.inventoryNumber || ext.id}`,
                  type: 'extinguisher',
                  metadata: {
                    objectId: obj.id,
                    objectName: obj.name,
                    location: ext.location,
                  },
                });
              });
          } catch (error) {
            // Игнорируем ошибки для отдельных объектов
          }
        }
      } catch (error) {
        // Игнорируем ошибки при поиске огнетушителей
      }

      // Сортируем по релевантности (точные совпадения в начале)
      const sorted = suggestions.sort((a, b) => {
        const aExact = a.text.toLowerCase().startsWith(queryLower);
        const bExact = b.text.toLowerCase().startsWith(queryLower);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.text.localeCompare(b.text);
      });

      const result = sorted.slice(0, limit);

      // Кэшируем результат
      this.suggestionCache.set(cacheKey, result);
      this.cacheTimestamps.set(cacheKey, Date.now());

      return result;
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  /**
   * Выполнить полнотекстовый поиск
   */
  async search(query: string): Promise<SearchResult> {
    try {
      const suggestions = await this.getSuggestions(query, 20);
      const objects = await ObjectService.searchObjects(query);

      return {
        objects,
        suggestions: suggestions.slice(0, 10),
      };
    } catch (error) {
      console.error('Error performing search:', error);
      return {
        objects: [],
        suggestions: [],
      };
    }
  }

  /**
   * Очистить кэш
   */
  clearCache(): void {
    this.suggestionCache.clear();
    this.cacheTimestamps.clear();
  }
}

export default new SearchService();

