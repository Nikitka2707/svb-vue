# SVB — Smart Vocabulary Builder

Vue 3 + Vite + Pinia фронтенд для словникового тренажера з алгоритмом SM-2.

## Запуск

```bash
npm install
cp .env.example .env
npm run dev
```

## Структура проєкту

```
src/
├── composables/
│   └── useAsync.js         ← хелпер для loading/error стану
├── utils/
│   ├── api.js              ← HTTP-клієнт (fetch-обгортки)
│   ├── sm2.js              ← алгоритм SM-2 (для локального wordLevel)
│   └── storage.js          ← localStorage (тільки для activeDictId)
├── stores/
│   └── vocab.js            ← Pinia store — вся логіка через API
├── components/
│   ├── AppSidebar.vue
│   ├── AppModal.vue
│   ├── DictModal.vue
│   ├── WordModal.vue
│   ├── ErrorBanner.vue     ← показ API помилок
│   ├── LoadingSpinner.vue  ← індикатор завантаження
│   └── Icon.vue
└── views/
    ├── HomeView.vue        ← GET /api/dictionaries
    ├── DictionaryView.vue  ← GET/POST/PUT/DELETE /api/words
    ├── StudyView.vue       ← GET /api/study/flashcards + POST /api/study/review
    └── StatisticsView.vue  ← GET /api/statistics
```

## API ендпоінти

### Словники
| Метод  | URL                    | Опис                   |
|--------|------------------------|------------------------|
| GET    | /api/dictionaries      | Список словників       |
| POST   | /api/dictionaries      | Створити словник       |
| PUT    | /api/dictionaries/:id  | Оновити назву          |
| DELETE | /api/dictionaries/:id  | Видалити словник       |

### Слова
| Метод  | URL                              | Опис              |
|--------|----------------------------------|-------------------|
| GET    | /api/dictionaries/:id/words      | Слова словника    |
| POST   | /api/dictionaries/:id/words      | Додати слово      |
| PUT    | /api/words/:id                   | Оновити слово     |
| DELETE | /api/words/:id                   | Видалити слово    |

### Навчання
| Метод  | URL                   | Опис                        |
|--------|-----------------------|-----------------------------|
| GET    | /api/study/flashcards | Картки на сьогодні (SM-2)   |
| POST   | /api/study/review     | Відправити оцінку `{word_id, grade}` |

### Статистика
| Метод  | URL             | Опис                   |
|--------|-----------------|------------------------|
| GET    | /api/statistics | Метрики прогресу       |

## Налаштування проксі (dev)

У `vite.config.js` всі запити `/api/*` проксюються на `http://localhost:8000`.
Змініть `target` на адресу вашого бекенду.

```js
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
},
```

## Змінні середовища

| Змінна          | Опис                         | За замовчуванням |
|-----------------|------------------------------|------------------|
| `VITE_API_URL`  | Базовий URL для API запитів  | `/api`           |
