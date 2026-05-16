import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { dictionariesApi, wordsApi, studyApi, statisticsApi } from '@/utils/api'

/**
 * Pinia store для SVB.
 * Вся робота з даними йде через REST API.
 * localStorage використовується лише для збереження activeDictId між сесіями.
 */
export const useVocabStore = defineStore('vocab', () => {
  // ─── State ─────────────────────────────────────────────────────────────────
  const dicts = ref([])               // [{id, name, emoji?, words:[]}]
  const activeDictId = ref(loadActiveId())
  const words = ref([])               // слова активного словника
  const flashcards = ref([])          // [{word_id, word, translation}]
  const statistics = ref(null)        // {learned_words, reviewed_words, correct_answers_percentage}

  // ─── Getters ───────────────────────────────────────────────────────────────
  const activeDict = computed(
    () => dicts.value.find((d) => d.id === activeDictId.value) ?? dicts.value[0] ?? null,
  )

  const totalDue = computed(() => flashcards.value.length)

  // ─── localStorage для activeDictId ─────────────────────────────────────────
  function loadActiveId() {
    try { return JSON.parse(localStorage.getItem('svb_active_dict')) ?? null }
    catch { return null }
  }

  function saveActiveId(id) {
    try { localStorage.setItem('svb_active_dict', JSON.stringify(id)) }
    catch {}
  }

  // ─── Dictionaries ──────────────────────────────────────────────────────────

  async function fetchDicts() {
    const list = await dictionariesApi.getAll()
    // API повертає {id, name} — зберігаємо емодзі локально якщо вже є
    dicts.value = list.map((d) => {
      const existing = dicts.value.find((e) => e.id === d.id)
      return { emoji: existing?.emoji ?? '📘', ...d }
    })
    // Якщо activeDictId не валідний — беремо перший
    if (!dicts.value.find((d) => d.id === activeDictId.value)) {
      activeDictId.value = dicts.value[0]?.id ?? null
      saveActiveId(activeDictId.value)
    }
  }

  async function createDict(name, emoji = '📘') {
    const created = await dictionariesApi.create(name)
    dicts.value.push({ emoji, ...created })
    setActiveDict(created.id)
    return created.id
  }

  async function updateDict(dictId, name, emoji) {
    await dictionariesApi.update(dictId, name)
    dicts.value = dicts.value.map((d) =>
      d.id === dictId ? { ...d, name, emoji } : d,
    )
  }

  async function deleteDict(dictId) {
    await dictionariesApi.delete(dictId)
    dicts.value = dicts.value.filter((d) => d.id !== dictId)
    if (activeDictId.value === dictId) {
      activeDictId.value = dicts.value[0]?.id ?? null
      saveActiveId(activeDictId.value)
      words.value = []
    }
  }

  function setActiveDict(id) {
    activeDictId.value = id
    saveActiveId(id)
  }

  /**
   * Завантажує кількість слів для кожного словника.
   * Викликається на HomeView щоб показувати правильний лічильник.
   */
  async function fetchAllWordCounts() {
    await Promise.all(
      dicts.value.map(async (d) => {
        try {
          const list = await wordsApi.getAll(d.id)
          // Оновлюємо лише wordCount, решту не чіпаємо
          dicts.value = dicts.value.map((x) =>
            x.id === d.id ? { ...x, wordCount: list.length } : x,
          )
        } catch {
          // Якщо не вдалось — залишаємо 0
        }
      }),
    )
  }

  // ─── Words ──────────────────────────────────────────────────────────────────

  async function fetchWords(dictId) {
    const list = await wordsApi.getAll(dictId)
    // API повертає поле "word", у нас у vue використовується "term" — нормалізуємо
    words.value = list.map(normalizeWord)
  }

  async function addWord(dictId, payload) {
    const created = await wordsApi.create(dictId, denormalizeWord(payload))
    words.value.push(normalizeWord(created))
    // Оновлюємо лічильник у списку словників
    updateDictWordCount(dictId, +1)
  }

  async function updateWord(wordId, payload) {
    const updated = await wordsApi.update(wordId, denormalizeWord(payload))
    words.value = words.value.map((w) =>
      w.id === wordId ? normalizeWord(updated) : w,
    )
  }

  async function deleteWord(wordId) {
    await wordsApi.delete(wordId)
    words.value = words.value.filter((w) => w.id !== wordId)
    if (activeDictId.value) updateDictWordCount(activeDictId.value, -1)
  }

  // ─── Study ──────────────────────────────────────────────────────────────────

  async function fetchFlashcards() {
    flashcards.value = await studyApi.getFlashcards()
  }

  async function submitReview(wordId, grade) {
    // Викликаємо API для відправки оцінки на бекенд
    return await studyApi.submitReview(wordId, grade)
  }

  // ─── Statistics ─────────────────────────────────────────────────────────────

 // 1. Додаємо dictId в дужки
  async function fetchStatistics(dictId) {
    // 2. Передаємо dictId в API
    statistics.value = await statisticsApi.get(dictId)
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * API використовує поле "word", фронтенд — "term".
   * normalizeWord: серверний об'єкт → vue об'єкт
   */
  function normalizeWord(w) {
    return {
      id: w.id,
      term: w.word ?? w.term,
      translation: w.translation,
      example: w.example ?? '',
      notes: w.notes ?? '',
      memory_level: w.memory_level ?? 0,
      next_review_date: w.next_review_date ?? null
    }
  }

  /**
   * denormalizeWord: vue об'єкт → серверний payload
   */
  function denormalizeWord(w) {
    return {
      word: w.term ?? w.word,
      translation: w.translation,
      example: w.example ?? '',
      notes: w.notes ?? '',
    }
  }

  function updateDictWordCount(dictId, delta) {
    dicts.value = dicts.value.map((d) =>
      d.id === dictId ? { ...d, wordCount: (d.wordCount ?? 0) + delta } : d,
    )
  }

  return {
    // state
    dicts,
    activeDictId,
    words,
    flashcards,
    statistics,
    // getters
    activeDict,
    totalDue,
    // dict actions
    fetchDicts,
    fetchAllWordCounts,
    createDict,
    updateDict,
    deleteDict,
    setActiveDict,
    // word actions
    fetchWords,
    addWord,
    updateWord,
    deleteWord,
    // study actions
    fetchFlashcards,
    submitReview,
    // statistics
    fetchStatistics,
  }
})
