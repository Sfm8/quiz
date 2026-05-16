// js/storage.js
// Безопасное сохранение и загрузка результатов викторин

import { STORAGE_KEYS } from './config.js';

/**
 * Сохраняет результат последней попытки для указанной викторины.
 * @param {string} quizId - ID викторины
 * @param {Object} result - Объект результата { date, score, total, answers, timeSpentSec }
 * @returns {boolean} true если сохранение прошло успешно
 */
export function saveQuizResult(quizId, result) {
  try {
    const key = `${STORAGE_KEYS.PREFIX}${quizId}`;
    localStorage.setItem(key, JSON.stringify(result));
    return true;
  } catch (error) {
    console.warn('[Storage] Не удалось сохранить результат:', error);
    return false;
  }
}

/**
 * Загружает результат последней попытки.
 * @param {string} quizId - ID викторины
 * @returns {Object|null} Объект результата или null, если данных нет или произошла ошибка
 */
export function loadQuizResult(quizId) {
  try {
    const key = `${STORAGE_KEYS.PREFIX}${quizId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('[Storage] Не удалось загрузить результат:', error);
    return null;
  }
}

/**
 * Очищает сохранённый результат для конкретной викторины.
 * @param {string} quizId - ID викторины
 */
export function clearQuizResult(quizId) {
  try {
    const key = `${STORAGE_KEYS.PREFIX}${quizId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('[Storage] Не удалось очистить результат:', error);
  }
}
