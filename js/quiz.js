// js/quiz.js
// Точка входа: парсинг URL, загрузка данных, инициализация движка и рендерера

import { parseQuizIdFromUrl, getQuizDataUrl } from './config.js';
import { QuizEngine } from './engine.js';
import { QuizRenderer } from './renderer.js';

async function init() {
  // 1. Получаем ID викторины из URL
  const quizId = parseQuizIdFromUrl();
  if (!quizId) {
    window.location.replace('index.html');
    return;
  }

  // Создаем рендерер и показываем загрузку
  const renderer = new QuizRenderer(quizId);
  renderer.showLoading();

  try {
    // 2. Загружаем JSON с вопросами
    const response = await fetch(getQuizDataUrl(quizId));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const quizData = await response.json();

    // Базовая валидация структуры данных
    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error('Invalid structure: "questions" array is missing or empty');
    }

    // 3. Инициализируем движок и связываем с UI
    const engine = new QuizEngine(quizId, quizData);
    renderer.bindEngine(engine);

    // 4. Принудительно отрисовываем начальное состояние
    // (событие 'change' еще не было вызвано, поэтому триггерим рендер вручную)
    renderer._renderState(engine._getState());

  } catch (error) {
    console.error('[Quiz Init] Ошибка загрузки викторины:', error);
    renderer.showError();
  }
}

// Запуск после полной подготовки DOM
document.addEventListener('DOMContentLoaded', init);
