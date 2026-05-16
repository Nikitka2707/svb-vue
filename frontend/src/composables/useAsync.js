/**
 * useAsync — composable для обгортання async-операцій.
 * Надає реактивні стани: loading, error, та допоміжний execute().
 *
 * Використання:
 *   const { loading, error, execute } = useAsync()
 *   await execute(() => someApi.call())
 */

import { ref } from 'vue'

export function useAsync() {
  const loading = ref(false)
  const error = ref(null)

  async function execute(fn) {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (e) {
      error.value = e?.message ?? 'Невідома помилка'
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return { loading, error, execute, clearError }
}
