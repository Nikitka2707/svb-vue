<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useVocabStore } from '@/stores/vocab'
import { useAsync } from '@/composables/useAsync'
import Icon from '@/components/Icon.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const store = useVocabStore()
const dict = computed(() => store.activeDict)

// Локальна черга для сесії
const sessionQueue = ref([])
const idx = ref(0)
const revealed = ref(false)
const results = ref([])   // [{correct: bool}]
const done = ref(false)

const { loading, error, execute, clearError } = useAsync()
const reviewAsync = useAsync()

async function initSession() {
  await execute(() => store.fetchFlashcards())
  // Копіюємо у локальну чергу (щоб не мутувати store під час сесії)
  sessionQueue.value = [...store.flashcards].sort(() => Math.random() - 0.5)
  idx.value = 0
  revealed.value = false
  results.value = []
  done.value = false
}

// Завантаження при зміні словника або при першому монтуванні
watch(() => dict.value?.id, initSession, { immediate: true })

const current = computed(() => sessionQueue.value[idx.value])
const total = computed(() => sessionQueue.value.length)
const progress = computed(() => (total.value > 0 ? (idx.value / total.value) * 100 : 0))
const correctCount = computed(() => results.value.filter((r) => r.correct).length)
const accuracy = computed(() =>
  total.value > 0 ? Math.round((correctCount.value / total.value) * 100) : 0,
)

async function rate(grade) {
  if (!current.value) return
  const isCorrect = grade >= 2

  // Шукаємо або word_id, або просто id
  const idToSend = current.value.word_id || current.value.id
  await reviewAsync.execute(() => store.submitReview(idToSend, grade))
  if (reviewAsync.error.value) return

  // Виконуємо запит
  const result = await reviewAsync.execute(() => store.submitReview(idToSend, grade))
  
  // ОСЬ ЦЕЙ РЯДОК ДОДАЙ:
  console.log('Відповідь від сервера після оцінки:', result)

  results.value.push({ correct: isCorrect })

  if (idx.value + 1 >= total.value) {
    done.value = true
  } else {
    idx.value++
    revealed.value = false
  }
}
</script>

<template>
  <div class="page">
    <template v-if="dict">
      <div class="page-header">
        <h1 class="page-title">{{ dict.emoji ?? '📘' }} Flashcards</h1>
        <p class="page-sub">
          {{ dict.name }}
          <template v-if="!done && total > 0"> · {{ idx + 1 }}/{{ total }}</template>
        </p>
      </div>

      <ErrorBanner :message="error || reviewAsync.error.value" @close="clearError(); reviewAsync.clearError()" />

      <!-- Loading -->
      <LoadingSpinner v-if="loading" text="Завантаження карток..." />

      <!-- Немає карток -->
      <div v-else-if="total === 0 && !done" class="empty">
        <div style="font-size: 38px">🎉</div>
        <h3>Все повторено!</h3>
        <p>Немає слів для повторення. Поверніться пізніше або додайте нові.</p>
      </div>

      <!-- Сесія завершена -->
      <div v-else-if="done" class="sdone">
        <div style="font-size: 42px; margin-bottom: 9px">🏆</div>
        <h2>Сесію завершено!</h2>
        <div class="big-n" style="margin: 16px 0 5px">{{ accuracy }}%</div>
        <p style="color: var(--text2); margin-bottom: 22px">
          {{ correctCount }} з {{ total }} правильно · {{ dict.name }}
        </p>
        <button class="btn btn-primary" @click="initSession">Ще раз</button>
      </div>

      <!-- Flashcard -->
      <template v-else>
        <div class="prog" style="margin-bottom: 22px">
          <div class="prog-f" :style="{ width: `${progress}%` }" />
        </div>

        <div class="flashcard" @click="revealed = !revealed">
          <!-- Лицьова сторона -->
          <template v-if="!revealed">
            <div class="fc-side-label">Слово</div>
            <div class="fc-term">{{ current.word }}</div>
            <div class="fc-hint">
              натисніть, щоб відкрити <Icon name="flip" :size="11" />
            </div>
          </template>

          <!-- Зворотна сторона -->
          <template v-else>
            <div class="fc-side-label">Переклад</div>
            <div class="fc-term" style="font-size: 25px">{{ current.word }}</div>
            <div class="fc-trans">{{ current.translation }}</div>
            <div class="fc-hint">оцініть відповідь</div>
          </template>
        </div>

        <!-- Кнопки оцінки -->
        <div v-if="revealed" class="rbtns">
          <button
            class="rbtn again"
            :disabled="reviewAsync.loading.value"
            @click="rate(0)"
          >
            <div>Знову</div>
            <div class="rbtn-sub">Не пам'ятаю</div>
          </button>
          <button
            class="rbtn hard"
            :disabled="reviewAsync.loading.value"
            @click="rate(1)"
          >
            <div>Важко</div>
            <div class="rbtn-sub">Майже</div>
          </button>
          <button
            class="rbtn good"
            :disabled="reviewAsync.loading.value"
            @click="rate(2)"
          >
            <div>Добре</div>
            <div class="rbtn-sub">Пам'ятав</div>
          </button>
          <button
            class="rbtn easy"
            :disabled="reviewAsync.loading.value"
            @click="rate(3)"
          >
            <div>Легко</div>
            <div class="rbtn-sub">Відразу!</div>
          </button>
        </div>
      </template>
    </template>

    <div v-else class="empty">
      <h3>Виберіть словник</h3>
    </div>
  </div>
</template>
