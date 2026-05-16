from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Date, ForeignKey, func
from sqlalchemy.orm import sessionmaker, Session, declarative_base, relationship
from pydantic import BaseModel
from datetime import date, timedelta
from typing import List, Optional

# ==========================================
# 1. НАЛАШТУВАННЯ БАЗИ ДАНИХ
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./words.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Таблиця Словників ---
class DictionaryDB(Base):
    __tablename__ = "dictionaries"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    words = relationship("WordDB", back_populates="dictionary", cascade="all, delete-orphan")

# --- Таблиця Слів ---
class WordDB(Base):
    __tablename__ = "words"
    id = Column(Integer, primary_key=True, index=True)
    dictionary_id = Column(Integer, ForeignKey("dictionaries.id"))
    word = Column(String, index=True) 
    translation = Column(String)
    example = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    next_review_date = Column(Date, default=date.today)
    memory_level = Column(Integer, default=0)
    
    # Поля для статистики
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    
    dictionary = relationship("DictionaryDB", back_populates="words")

# Створення таблиць
Base.metadata.create_all(bind=engine)

# ==========================================
# 2. НАЛАШТУВАННЯ FASTAPI
# ==========================================
app = FastAPI(title="SVB API Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 3. СХЕМИ ДАНИХ (Pydantic)
# ==========================================
class DictionaryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DictionaryResponse(DictionaryCreate):
    id: int
    class Config:
        from_attributes = True

class WordCreate(BaseModel):
    word: str
    translation: str
    example: Optional[str] = None
    notes: Optional[str] = None

class WordUpdate(BaseModel):
    word: Optional[str] = None
    translation: Optional[str] = None
    example: Optional[str] = None
    notes: Optional[str] = None

class WordResponse(WordCreate):
    id: int
    dictionary_id: int
    next_review_date: date
    memory_level: int
    class Config:
        from_attributes = True

class ReviewAction(BaseModel):
    word_id: int
    grade: int

class StatisticsResponse(BaseModel):
    learned_words: int
    reviewed_words: int
    correct_answers_percentage: int
    total_words: int

# ==========================================
# 4. ЕНДПОІНТИ (API Routes)
# ==========================================

# --- СЛОВНИКИ ---

@app.get("/dictionaries", response_model=List[DictionaryResponse])
@app.get("/dictionaries/", response_model=List[DictionaryResponse], include_in_schema=False)
def get_dictionaries(db: Session = Depends(get_db)):
    return db.query(DictionaryDB).all()

@app.get("/dictionaries/{dict_id}", response_model=DictionaryResponse)
def get_dictionary(dict_id: int, db: Session = Depends(get_db)):
    db_dict = db.query(DictionaryDB).filter(DictionaryDB.id == dict_id).first()
    if not db_dict:
        raise HTTPException(status_code=404, detail="Dictionary not found")
    return db_dict

@app.post("/dictionaries", response_model=DictionaryResponse)
def create_dictionary(dict_in: DictionaryCreate, db: Session = Depends(get_db)):
    db_dict = DictionaryDB(name=dict_in.name, description=dict_in.description)
    db.add(db_dict)
    db.commit()
    db.refresh(db_dict)
    return db_dict

@app.put("/dictionaries/{dict_id}", response_model=DictionaryResponse)
def update_dictionary(dict_id: int, dict_in: DictionaryCreate, db: Session = Depends(get_db)):
    db_dict = db.query(DictionaryDB).filter(DictionaryDB.id == dict_id).first()
    if not db_dict:
        raise HTTPException(status_code=404, detail="Dictionary not found")
    db_dict.name = dict_in.name
    db_dict.description = dict_in.description
    db.commit()
    db.refresh(db_dict)
    return db_dict

@app.delete("/dictionaries/{dict_id}")
def delete_dictionary(dict_id: int, db: Session = Depends(get_db)):
    db_dict = db.query(DictionaryDB).filter(DictionaryDB.id == dict_id).first()
    if not db_dict:
        raise HTTPException(status_code=404, detail="Dictionary not found")
    db.delete(db_dict)
    db.commit()
    return Response(status_code=204)

# --- СЛОВА ---

@app.get("/dictionaries/{dict_id}/words", response_model=List[WordResponse])
def get_words_for_dictionary(dict_id: int, db: Session = Depends(get_db)):
    return db.query(WordDB).filter(WordDB.dictionary_id == dict_id).all()

@app.post("/dictionaries/{dict_id}/words", response_model=WordResponse)
def create_word(dict_id: int, word_in: WordCreate, db: Session = Depends(get_db)):
    db_word = WordDB(**word_in.model_dump(), dictionary_id=dict_id)
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word

@app.put("/words/{word_id}", response_model=WordResponse)
def update_word(word_id: int, word_in: WordUpdate, db: Session = Depends(get_db)):
    db_word = db.query(WordDB).filter(WordDB.id == word_id).first()
    if not db_word:
        raise HTTPException(status_code=404, detail="Word not found")
    
    update_data = word_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_word, key, value)
        
    db.commit()
    db.refresh(db_word)
    return db_word

@app.delete("/words/{word_id}")
def delete_word(word_id: int, db: Session = Depends(get_db)):
    db_word = db.query(WordDB).filter(WordDB.id == word_id).first()
    if not db_word:
        raise HTTPException(status_code=404, detail="Word not found")
    db.delete(db_word)
    db.commit()
    return Response(status_code=204)

# --- НАВЧАННЯ ТА SM-2 ---

@app.get("/study/flashcards", response_model=List[WordResponse])
def get_flashcards(db: Session = Depends(get_db)):
    today = date.today()
    return db.query(WordDB).filter(WordDB.next_review_date <= today).all()

# БУЛО:
# @app.post("/study/review")

# СТАЛО (обов'язково додай response_model):
@app.post("/study/review", response_model=WordResponse)
def review_word(action: ReviewAction, db: Session = Depends(get_db)):
    db_word = db.query(WordDB).filter(WordDB.id == action.word_id).first()
    if not db_word:
        raise HTTPException(status_code=404, detail="Word not found")
    
    db_word.total_attempts += 1
    
    # Логіка оцінки (grade: 0=again, 1=hard, 2=good, 3=easy)
    if action.grade >= 2:
        db_word.next_review_date = date.today() + timedelta(days=3)
        db_word.memory_level += 1
        db_word.correct_attempts += 1
    else:
        db_word.next_review_date = date.today() + timedelta(days=1)
        db_word.memory_level = max(0, db_word.memory_level - 1)
        
    db.commit()
    db.refresh(db_word)
    
    # Тепер FastAPI завдяки response_model перетворить цей db_word у правильний JSON!
    return db_word

# --- СТАТИСТИКА ---

@app.get("/statistics", response_model=StatisticsResponse)
def get_statistics(dictionary_id: Optional[int] = None, db: Session = Depends(get_db)):
    # 1. Створюємо базовий запит
    query = db.query(WordDB)
    
    # 2. ЯКЩО ФРОНТЕНД ПЕРЕДАВ ID СЛОВНИКА — ФІЛЬТРУЄМО ТІЛЬКИ ЙОГО СЛОВА!
    if dictionary_id:
        query = query.filter(WordDB.dictionary_id == dictionary_id)
        
    # 3. Рахуємо слова тільки з відфільтрованого списку
    learned = query.filter(WordDB.memory_level >= 1).count()
    reviewed = query.filter(WordDB.memory_level > 0).count()
    total = query.count()
    
    # 4. Рахуємо точність також тільки для цього словника
    stats_query = db.query(
        func.sum(WordDB.total_attempts).label("total_att"),
        func.sum(WordDB.correct_attempts).label("correct_att")
    )
    
    if dictionary_id:
        stats_query = stats_query.filter(WordDB.dictionary_id == dictionary_id)
        
    stats_res = stats_query.first()
    total_att = stats_res.total_att or 0
    correct_att = stats_res.correct_att or 0
    
    percentage = 0
    if total_att > 0:
        percentage = round((correct_att / total_att) * 100)
        
    return {
        "learned_words": learned,
        "reviewed_words": reviewed,
        "correct_answers_percentage": percentage,
        "total_words": total
    }