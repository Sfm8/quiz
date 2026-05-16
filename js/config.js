// js/config.js
// Централизованные настройки, пути и утилиты приложения

export const PATHS = {
  QUIZ_LIST: 'quizzes/quiz-list.json',
  QUIZ_BASE_DIR: 'quizzes/',
};

export const STORAGE_KEYS = {
  PREFIX: 'quiz_last_',
};

export const DEFAULT_SETTINGS = {
  allowBackNavigation: false, // false: строгий режим (сразу фидбек, только вперёд)
                              // true: свободная навигация (фидбек только в конце)
  shuffleQuestions: false,
  title: 'Викторина',
  description: ''
};

// Формирует путь к файлу вопросов конкретной викторины
export function getQuizDataUrl(quizId) {
  return `${PATHS.QUIZ_BASE_DIR}${quizId}/data.json`;
}

// Формирует абсолютный путь к изображению относительно корня сайта
export function getQuizImageUrl(quizId, relPath) {
  return `${PATHS.QUIZ_BASE_DIR}${quizId}/${relPath}`;
}

// Извлекает ID викторины из URL-параметра ?quiz=...
export function parseQuizIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('quiz');
}

// Объединяет настройки по умолчанию с кастомными из data.json
export function mergeSettings(defaults, custom = {}) {
  return { ...defaults, ...custom };
}
