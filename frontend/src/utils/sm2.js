/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0 = again, 1 = hard, 2 = good, 3 = easy
 */
export function sm2(card, quality) {
  let { easeFactor = 2.5, interval = 1, repetitions = 0 } = card

  if (quality < 1) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions += 1
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02),
  )

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return {
    easeFactor: +easeFactor.toFixed(2),
    interval,
    repetitions,
    nextReview: nextReview.toISOString(),
    lastReview: new Date().toISOString(),
  }
}

export function isDue(card) {
  // Змінюємо nextReview на next_review_date, як приходить з сервера
  const date = card.next_review_date || card.nextReview; 
  if (!date) return true;
  return new Date(date) <= new Date();
}

export function wordLevel(word) {
  // Використовуємо поле memory_level, яке приходить з бекенду
  const level = word.memory_level || 0;

  if (level === 0) return 'new'
  if (level === 1) return 'learning'
  if (level < 4) return 'review'
  return 'mastered'
}

export const LEVEL_LABELS = {
  new: 'Нове',
  learning: 'Вчу',
  review: 'Повторення',
  mastered: 'Вивчено',
}
