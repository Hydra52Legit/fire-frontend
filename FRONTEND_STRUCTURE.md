# Новая структура фронтенда

## 📁 Структура папок

```
FireInspectionApp/
├── src/
│   ├── components/              # Переиспользуемые компоненты
│   │   ├── ui/                  # Базовые UI компоненты
│   │   │   ├── SearchInput.tsx  # Компонент поиска
│   │   │   ├── StatusBadge.tsx  # Бейдж статуса
│   │   │   ├── EmptyState.tsx   # Пустое состояние
│   │   │   ├── LoadingSpinner.tsx # Индикатор загрузки
│   │   │   ├── ActionButton.tsx # Кнопка действия
│   │   │   └── index.ts         # Экспорты
│   │   ├── cards/               # Компоненты карточек
│   │   │   ├── ObjectCard.tsx   # Карточка объекта
│   │   │   ├── ExtinguisherCard.tsx # Карточка огнетушителя
│   │   │   ├── EquipmentCard.tsx # Карточка оборудования
│   │   │   └── index.ts         # Экспорты
│   │   ├── layout/              # Компоненты макета
│   │   │   ├── ScreenHeader.tsx # Заголовок экрана
│   │   │   └── index.ts         # Экспорты
│   │   └── index.ts             # Главный экспорт всех компонентов
│   │
│   ├── screens/                 # Экраны приложения
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ObjectsListScreen.tsx ✅ Обновлен
│   │   ├── ObjectDetails.tsx
│   │   ├── AddEditObjectScreen.tsx
│   │   ├── ExtinguishersListScreen.tsx
│   │   ├── EquipmentListScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── ...
│   │
│   ├── services/                # Сервисы для работы с API
│   │   ├── apiClient.ts
│   │   ├── authService.ts
│   │   ├── objectService.ts
│   │   ├── fireSafetyService.ts
│   │   └── ...
│   │
│   ├── contexts/                # React Context провайдеры
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── types/                   # TypeScript типы
│   │   ├── index.ts
│   │   └── navigation.ts
│   │
│   ├── utils/                   # Утилиты
│   │   └── permissions.ts
│   │
│   └── config/                  # Конфигурация
│       └── api.config.ts
│
└── SECURITY_AND_QUALITY_REPORT.md # Отчет о безопасности
```

## ✅ Созданные компоненты

### UI компоненты (`components/ui/`)

1. **SearchInput** - Компонент поиска с иконкой и кнопкой очистки
2. **StatusBadge** - Бейдж статуса с автоматическим определением цвета
3. **EmptyState** - Компонент пустого состояния с иконкой и текстом
4. **LoadingSpinner** - Индикатор загрузки с текстом
5. **ActionButton** - Кнопка действия с вариантами (primary, secondary, danger)

### Компоненты карточек (`components/cards/`)

1. **ObjectCard** - Карточка объекта с информацией и действиями
2. **ExtinguisherCard** - Карточка огнетушителя с предупреждениями
3. **EquipmentCard** - Карточка оборудования

### Компоненты макета (`components/layout/`)

1. **ScreenHeader** - Заголовок экрана с кнопкой добавления

## 📝 Использование компонентов

### Пример использования в экране:

```typescript
import { 
  SearchInput, 
  EmptyState, 
  LoadingSpinner, 
  ScreenHeader, 
  ObjectCard 
} from '../components';

// В компоненте:
<ScreenHeader 
  title="Объекты" 
  showAddButton={user?.role === 'admin'}
  onAddPress={handleAdd}
/>

<SearchInput
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Поиск..."
  onClear={() => setSearchQuery('')}
/>

{isLoading ? (
  <LoadingSpinner message="Загрузка..." />
) : items.length === 0 ? (
  <EmptyState 
    icon="business" 
    title="Нет данных" 
    message="Добавьте первый элемент"
  />
) : (
  items.map(item => (
    <ObjectCard 
      key={item.id}
      object={item}
      onPress={() => handlePress(item)}
      onEdit={() => handleEdit(item)}
    />
  ))
)}
```

## 🔄 Обновленные экраны

- ✅ `ObjectsListScreen.tsx` - Обновлен для использования новых компонентов

## 📋 Требуется обновить

Следующие экраны должны быть обновлены аналогично:

- [ ] `ExtinguishersListScreen.tsx`
- [ ] `EquipmentListScreen.tsx`
- [ ] `HomeScreen.tsx` (частично)
- [ ] Другие экраны со списками

## 🎯 Преимущества новой структуры

1. **Переиспользование кода** - Компоненты используются в нескольких местах
2. **Единообразие** - Все экраны выглядят одинаково
3. **Легкость поддержки** - Изменения в одном месте применяются везде
4. **Читаемость** - Код экранов стал короче и понятнее
5. **Типизация** - Все компоненты типизированы TypeScript

## 📦 Импорты

Все компоненты можно импортировать из одного места:

```typescript
import { 
  SearchInput, 
  StatusBadge, 
  EmptyState, 
  LoadingSpinner, 
  ActionButton,
  ObjectCard,
  ExtinguisherCard,
  EquipmentCard,
  ScreenHeader
} from '../components';
```

