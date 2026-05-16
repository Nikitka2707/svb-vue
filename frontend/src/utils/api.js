/**
 * SVB API Service
 * Централізований HTTP-клієнт для роботи з REST API.
 * Базовий URL береться зі змінної середовища VITE_API_URL,
 * або за замовчуванням — /api (проксі через Vite у dev).
 */

const BASE_URL = "https://943c520773bcb4ae-93-170-46-125.serveousercontent.com"

// ─── HTTP клієнт ─────────────────────────────────────────────────────────────

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }

  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, options)

  // 204 No Content — повертаємо null
  if (response.status === 204) return null

  const data = await response.json()

    if (!response.ok) {
    let message = data?.detail ?? data?.message ?? `HTTP ${response.status}`;
    
    // 🔥 Якщо FastAPI віддав масив помилок (422), перетворюємо його на текст
    if (Array.isArray(message)) {
      message = JSON.stringify(message)
    }
    
    throw new ApiError(message, response.status, data)
  }

  return data
}

const get = (path) => request('GET', path)
const post = (path, body) => request('POST', path, body)
const put = (path, body) => request('PUT', path, body)
const del = (path) => request('DELETE', path)

// ─── Клас помилки ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// ─── Dictionaries ─────────────────────────────────────────────────────────────

export const dictionariesApi = {
  /**
   * GET /api/dictionaries
   * @returns {Promise<Array<{id: number, name: string}>>}
   */
  getAll() {
    return get('/dictionaries')
  },

  /**
   * POST /api/dictionaries
   * @param {string} name
   * @returns {Promise<{id: number, name: string}>}
   */
  create(name) {
    return post('/dictionaries', { name })
  },

  /**
   * PUT /api/dictionaries/:id  (якщо бекенд підтримує)
   * @param {number} id
   * @param {string} name
   * @returns {Promise<{id: number, name: string}>}
   */
  update(id, name) {
    return put(`/dictionaries/${id}`, { name })
  },

  /**
   * DELETE /api/dictionaries/:id  (якщо бекенд підтримує)
   * @param {number} id
   * @returns {Promise<null>}
   */
  delete(id) {
    return del(`/dictionaries/${id}`)
  },
}

// ─── Words ────────────────────────────────────────────────────────────────────

export const wordsApi = {
  /**
   * GET /api/dictionaries/:dictId/words
   * @param {number} dictId
   * @returns {Promise<Array<{id, word, translation, example, notes}>>}
   */
  getAll(dictId) {
    return get(`/dictionaries/${dictId}/words`)
  },

  /**
   * POST /api/dictionaries/:dictId/words
   * @param {number} dictId
   * @param {{ word, translation, example, notes }} payload
   * @returns {Promise<{id, word, translation, example, notes}>}
   */
  create(dictId, payload) {
    return post(`/dictionaries/${dictId}/words`, payload)
  },

  /**
   * PUT /api/words/:wordId
   * @param {number} wordId
   * @param {{ word, translation, example, notes }} payload
   * @returns {Promise<{id, word, translation, example, notes}>}
   */
  update(wordId, payload) {
    return put(`/words/${wordId}`, payload)
  },

  /**
   * DELETE /api/words/:wordId
   * @param {number} wordId
   * @returns {Promise<null>}
   */
  delete(wordId) {
    return del(`/words/${wordId}`)
  },
}

// ─── Study / Flashcards ───────────────────────────────────────────────────────

export const studyApi = {
  /**
   * GET /api/study/flashcards
   * Повертає слова, заплановані на сьогодні алгоритмом SM-2.
   * @returns {Promise<Array<{word_id, word, translation}>>}
   */
  getFlashcards() {
    return get('/study/flashcards')
  },

  /**
   * POST /api/study/review
   * Відправляє оцінку користувача — бекенд перераховує SM-2.
   * @param {number} wordId
   * @param {0|1|2|3} grade  0=забув, 1=важко, 2=добре, 3=легко
   * @returns {Promise<any>}
   */
  submitReview(wordId, grade) {
    // Якщо wordId прилетів як об'єкт, дістаємо з нього .id, інакше беремо як є
    const actualId = typeof wordId === 'object' ? wordId.id : wordId;
    
    return post('/study/review', {
      word_id: Number(actualId),
      grade: Number(grade),
    })
  },
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export const statisticsApi = {
  get(dictId) {
    if (dictId) {
      // Використовуй зворотні апострофи (клавіша над Tab)
      return get(`/statistics?dictionary_id=${dictId}`)
    }
    return get('/statistics')
  }
}
