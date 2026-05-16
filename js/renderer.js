// js/renderer.js
// Управление DOM: отрисовка вопросов, изображений, навигации и экрана результатов

import { getQuizImageUrl } from './config.js';

export class QuizRenderer {
  constructor(quizId) {
    this.quizId = quizId;
    this.elements = this._cacheElements();
    this.preloadImg = null;
    this.engine = null;
  }

  // Кешируем ссылки на DOM-элементы для быстрой работы
  _cacheElements() {
    return {
      title: document.getElementById('quiz-title'),
      progressBar: document.getElementById('quiz-progress'),
      progressFill: document.getElementById('progress-fill'),
      progressText: document.getElementById('progress-text'),
      loading: document.getElementById('loading-state'),
      error: document.getElementById('error-state'),
      quizContainer: document.getElementById('quiz-container'),
      imageWrapper: document.getElementById('image-wrapper'),
      questionImage: document.getElementById('question-image'),
      questionText: document.getElementById('question-text'),
      optionsList: document.getElementById('options-list'),
      btnPrev: document.getElementById('btn-prev'),
      btnNext: document.getElementById('btn-next'),
      resultsContainer: document.getElementById('results-container'),
      scoreSummary: document.getElementById('score-summary'),
      reviewList: document.getElementById('review-list'),
      btnRestart: document.getElementById('btn-restart'),
    };
  }

  // Связываем рендерер с движком
  bindEngine(engine) {
    this.engine = engine;
    engine.on('change', (state) => this._renderState(state));
    engine.on('finish', (result) => this._showResults(result));

    this.elements.btnNext.addEventListener('click', () => engine.goNext());
    this.elements.btnPrev.addEventListener('click', () => engine.goPrev());
    this.elements.btnRestart.addEventListener('click', () => {
      this.elements.resultsContainer.hidden = true;
      this.elements.quizContainer.hidden = false;
      engine.restart();
    });
  }

  showLoading() { this.elements.loading.hidden = false; }
  showError() {
    this.elements.loading.hidden = true;
    this.elements.error.hidden = false;
  }

  // Переключение видимости основных блоков
  _showState(name) {
    this.elements.loading.hidden = true;
    this.elements.error.hidden = true;
    this.elements.quizContainer.hidden = true;
    this.elements.resultsContainer.hidden = true;
    this.elements.progressBar.hidden = true;

    if (name === 'quiz') {
      this.elements.quizContainer.hidden = false;
      this.elements.progressBar.hidden = false;
    } else if (name === 'results') {
      this.elements.resultsContainer.hidden = false;
    }
  }

  // Отрисовка текущего состояния викторины
  _renderState(state) {
    this._showState('quiz');
    this.elements.title.textContent = state.title;
    this._updateProgress(state.progress, state.totalQuestions);
    this.elements.questionText.textContent = state.currentQuestion.text;
    
    this._renderImage(state.currentQuestion.image, state.currentIndex, state.totalQuestions);
    this._renderOptions(state);

    // Логика кнопок навигации
    this.elements.btnPrev.hidden = !state.canGoPrev;
    this.elements.btnNext.textContent = (state.currentIndex === state.totalQuestions - 1 && !state.isFinished) ? 'Завершить' : 'Далее';
    
    // В строгом режиме кнопка "Далее" активна только после ответа
    const isStrictMode = !state.settings.allowBackNavigation;
    this.elements.btnNext.disabled = state.isFinished || (isStrictMode && !state.isAnswered);
  }

  _updateProgress(current, total) {
    const percent = (current / total) * 100;
    this.elements.progressFill.style.width = `${percent}%`;
    this.elements.progressText.textContent = `${current} / ${total}`;
  }

  // Динамическая подгрузка текущего изображения + предзагрузка следующего
  _renderImage(imagePath, currentIndex, total) {
    if (imagePath) {
      this.elements.imageWrapper.hidden = false;
      this.elements.questionImage.src = getQuizImageUrl(this.quizId, imagePath);

      // Предзагрузка следующего (если есть)
      if (currentIndex < total - 1) {
        const nextQuestion = this.engine.questions[currentIndex + 1];
        if (nextQuestion?.image) {
          this.preloadImg = new Image();
          this.preloadImg.src = getQuizImageUrl(this.quizId, nextQuestion.image);
        }
      }
    } else {
      this.elements.imageWrapper.hidden = true;
    }
  }

  // Генерация кнопок вариантов ответа
  _renderOptions(state) {
    const { currentQuestion, selectedAnswer, settings, isFinished } = state;
    this.elements.optionsList.innerHTML = '';

    currentQuestion.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
