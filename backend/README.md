# SVB — Smart Vocabulary Builder (Backend)

Python + FastAPI бекенд для словникового тренажера з алгоритмом інтервальних повторень SM-2. Використовує SQLite як базу даних.

## Запуск проєкту

1. **Створіть та активуйте віртуальне середовище:**
   ```bash
   python -m venv venv
   # Для Windows:
   venv\Scripts\activate
   # Для Linux/macOS:
   source venv/bin/activate

# Встановіть залежності:

Bash
pip install fastapi uvicorn sqlalchemy pydantic

# Запустіть сервер (режим розробки):

Bash
uvicorn main:app --reload
Сервер буде доступний за адресою http://127.0.0.1:8000.
Інтерактивна документація (Swagger UI) автоматично генерується за адресою http://127.0.0.1:8000/docs.

# Структура проєкту
Наразі логіка централізована для швидкодії та зручності розробки:

Plaintext
/
├── main.py             ← Головний файл (Налаштування FastAPI, ORM моделі, Pydantic схеми та API роути)
├── words.db            ← Локальна база даних SQLite (генерується автоматично при першому запуску)
└── README.md           ← Документація проєкту

# API Ендпоінти

Словники

GET,/dictionaries,Отримати список усіх словників
GET,/dictionaries/{id},Отримати конкретний словник
POST,/dictionaries,Створити новий словник
PUT,/dictionaries/{id},Оновити назву/опис словника
DELETE,/dictionaries/{id},Видалити словник (каскадно видаляє всі його слова)

Слова 


GET,/dictionaries/{id}/words,Отримати всі слова конкретного словника
POST,/dictionaries/{id}/words,Додавання нового слова у словник
PUT,/words/{id},Редагувати існуюче слово
DELETE,/words/{id},Видалити слово


# Навчання (SM-2)


GET,/study/flashcards,Отримати слова для повторення на сьогодні (next_review_date <= today)
POST,/study/review,"Відправити оцінку {word_id, grade}. Сервер перераховує memory_level та next_review_date"

# Статистика


GET,/statistics,Загальна статистика по всій базі
GET,/statistics?dictionary_id={id},Статистика відфільтрована за конкретним словником


# Логіка алгоритму SM-2 (Бекенд)


Алгоритм розраховує дату наступного повторення (next_review_date) та рівень запам'ятовування (memory_level) на основі оцінки користувача (від 0 до 3):

Оцінка >= 2 ("Добре" / "Легко"): memory_level збільшується на 1, наступне повторення через 3 дні. Кількість правильних спроб (correct_attempts) зростає.

Оцінка < 2 ("Знову" / "Важко"): memory_level зменшується на 1 (мінімум 0), наступне повторення призначається на завтра.
