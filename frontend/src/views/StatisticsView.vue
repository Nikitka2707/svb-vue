<script setup>
import { computed, onMounted, watch } from 'vue'
import { useVocabStore } from '@/stores/vocab'
import { useAsync } from '@/composables/useAsync'
import ErrorBanner from '@/components/ErrorBanner.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const store = useVocabStore()
const dict = computed(() => store.activeDict)

const { loading, error, execute, clearError } = useAsync()

/// Перезавантажуємо статистику при зміні словника
watch(() => dict.value?.id, (id) => {
  if (id) execute(() => store.fetchStatistics(id)) // ✅ ДОДАЛИ id
}, { immediate: true })

const stats = computed(() => store.statistics)
</script>

<template>
  <div class="page">
    <template v-if="dict">
      <div class="page-header">
        <h1 class="page-title">{{ dict.emoji ?? '📘' }} Статистика</h1>
        <p class="page-sub">{{ dict.name }}</p>
      </div>

      <ErrorBanner :message="error" @close="clearError" />

      <LoadingSpinner v-if="loading && !stats" />

      <template v-else-if="stats">
        <!-- Stat cards -->
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-lbl">Вивчено слів</div>
            <div class="stat-val" style="color: var(--green)">
              {{ stats.learned_words ?? 0 }}
            </div>
            <div class="stat-sub">всього</div>
          </div>

          <div class="stat-card">
            <div class="stat-lbl">Переглянуто</div>
            <div class="stat-val" style="color: var(--accent2)">
              {{ stats.reviewed_words ?? 0 }}
            </div>
            <div class="stat-sub">повторень</div>
          </div>

          <div class="stat-card">
            <div class="stat-lbl">Точність</div>
            <div
              class="stat-val"
              :style="{
                color:
                  (stats.correct_answers_percentage ?? 0) >= 80
                    ? 'var(--green)'
                    : (stats.correct_answers_percentage ?? 0) >= 50
                    ? 'var(--amber)'
                    : 'var(--red)',
              }"
            >
              {{ stats.correct_answers_percentage?.toFixed(1) ?? 0 }}%
            </div>
            <div class="stat-sub">правильних</div>
          </div>
        </div>

        <!-- Progress bar для точності -->
        <div class="card" style="margin-bottom: 14px">
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 13px">
            Загальний прогрес
          </div>

          <div style="margin-bottom: 12px">
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 5px">
              <span style="color: var(--text2)">Точність відповідей</span>
              <span style="font-weight: 500">{{ stats.correct_answers_percentage?.toFixed(1) ?? 0 }}%</span>
            </div>
            <div class="prog">
              <div
                class="prog-f"
                :style="{
                  width: `${stats.correct_answers_percentage ?? 0}%`,
                  background:
                    (stats.correct_answers_percentage ?? 0) >= 80
                      ? 'var(--green)'
                      : (stats.correct_answers_percentage ?? 0) >= 50
                      ? 'var(--amber)'
                      : 'var(--red)',
                }"
              />
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 5px">
              <span style="color: var(--text2)">Слова вивчено</span>
              <span style="font-weight: 500">{{ stats.learned_words ?? 0 }} / {{ store.words.length }}</span>
            </div>
            <div class="prog">
              <div
                class="prog-f"
                :style="{
                  width: store.words.length > 0
                    ? `${Math.min(100, ((stats.learned_words ?? 0) / store.words.length) * 100)}%`
                    : '0%',
                  background: 'var(--accent)',
                }"
              />
            </div>
          </div>
        </div>

        <!-- Підсказка -->
        <div class="card" style="background: var(--bg3)">
          <div style="font-size: 13px; color: var(--text2); line-height: 1.8">
            <div style="font-weight: 600; color: var(--text); margin-bottom: 8px">💡 Алгоритм SM-2</div>
            Інтервальне повторення автоматично планує картки на основі ваших оцінок.
            Чим вища оцінка — тим довший інтервал до наступного повторення.
          </div>
        </div>
      </template>

      <!-- Немає даних -->
      <div v-else class="empty">
        <div style="font-size: 38px">📊</div>
        <h3>Поки що немає даних</h3>
        <p>Почніть тренуватись у розділі Flashcards, щоб з'явилась статистика.</p>
      </div>
    </template>

    <div v-else class="empty">
      <h3>Виберіть словник</h3>
    </div>
  </div>
</template>
