// js/renderer.js V4 (ИСПРАВЛЕНА ОШИБКА КЛИКОВ)
console.log('[Renderer] V4 Loaded');

import { getQuizImageUrl } from './config.js';

export class QuizRenderer {
  constructor(quizId) {
    this.quizId = quizId;
    this.elements = this._cacheElements();
    this.preloadImg = null;
    this.engine = null;
  }

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
      btnRestart: document.getElementById('btn-restart')
    };
  }

  bindEngine(engine) {
    var self = this;
    this.engine = engine;
    
    engine.on('change', function(state) { self._renderState(state); });
    engine.on('finish', function(result) { self._showResults(result); });

    this.elements.btnNext.addEventListener('click', function() { engine.goNext(); });
    this.elements.btnPrev.addEventListener('click', function() { engine.goPrev(); });
    this.elements.btnRestart.addEventListener('click', function() {
      self.elements.resultsContainer.hidden = true;
      self.elements.quizContainer.hidden = false;
      engine.restart();
    });
  }

  showLoading() { this.elements.loading.hidden = false; }
  
  showError() {
    this.elements.loading.hidden = true;
    this.elements.error.hidden = false;
  }

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

  _renderState(state) {
    console.log('[Renderer] State updated:', state.currentIndex, 'Answered:', state.isAnswered);
    this._showState('quiz');
    this.elements.title.textContent = state.title;
    this._updateProgress(state.progress, state.totalQuestions);
    this.elements.questionText.textContent = state.currentQuestion.text;
    
    this._renderImage(state.currentQuestion.image, state.currentIndex, state.totalQuestions);
    this._renderOptions(state);

    this.elements.btnPrev.hidden = !state.canGoPrev;
    
    if (state.currentIndex === state.totalQuestions - 1 && !state.isFinished) {
      this.elements.btnNext.textContent = 'Завершить';
    } else {
      this.elements.btnNext.textContent = 'Далее';
    }
    
    var isStrictMode = !state.settings.allowBackNavigation;
    this.elements.btnNext.disabled = state.isFinished || (isStrictMode && !state.isAnswered);
  }

  _updateProgress(current, total) {
    var percent = (current / total) * 100;
    this.elements.progressFill.style.width = percent + '%';
    this.elements.progressText.textContent = current + ' / ' + total;
  }

  _renderImage(imagePath, currentIndex, total) {
    if (imagePath) {
      this.elements.imageWrapper.hidden = false;
      this.elements.questionImage.src = getQuizImageUrl(this.quizId, imagePath);

      if (currentIndex < total - 1) {
        var nextQuestion = this.engine.questions[currentIndex + 1];
        if (nextQuestion && nextQuestion.image) {
          this.preloadImg = new Image();
          this.preloadImg.src = getQuizImageUrl(this.quizId, nextQuestion.image);
        }
      }
    } else {
      this.elements.imageWrapper.hidden = true;
    }
  }

  _renderOptions(state) {
    var self = this;
    var currentQuestion = state.currentQuestion;
    var selectedAnswer = state.selectedAnswer;
    var settings = state.settings;
    var isFinished = state.isFinished;
    
    this.elements.optionsList.innerHTML = '';

    currentQuestion.options.forEach(function(opt, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.setAttribute('aria-pressed', selectedAnswer === idx);

      if (selectedAnswer !== null) {
        if (!settings.allowBackNavigation) {
          if (idx === currentQuestion.correct) btn.classList.add('correct');
          else if (idx === selectedAnswer) btn.classList.add('incorrect');
        } else {
          if (idx === selectedAnswer) btn.classList.add('selected');
        }
      }

      btn.disabled = isFinished || (!settings.allowBackNavigation && selectedAnswer !== null);
      
      btn.addEventListener('click', function() {
        console.log('[Renderer] Button clicked, index:', idx);
        self.engine.selectAnswer(idx);
      });
      this.elements.optionsList.appendChild(btn);
    }.bind(this));
  }

  _showResults(result) {
    this._showState('results');
    this.elements.scoreSummary.textContent = 'Ваш результат: ' + result.score + ' из ' + result.total;
    this.elements.reviewList.innerHTML = '';

    var self = this;
    var reviewData = this.engine.getReviewData();
    reviewData.forEach(function(item) {
      var el = document.createElement('div');
      var statusClass = item.isCorrect ? 'correct' : 'incorrect';
      var icon = item.isCorrect ? '✅' : '❌';
      
      var html = '<span class="review-icon">' + icon + '</span>';
      html += '<div class="review-text">';
      html += '<strong>' + item.text + '</strong>';
      html += '<span class="user-answer">Ваш ответ: ' + (item.selected !== null ? item.options[item.selected] : 'Не выбран') + '</span>';
      
      if (!item.isCorrect) {
        html += '<br><span class="correct-answer">Правильный: ' + item.options[item.correct] + '</span>';
      }
      if (item.explanation) {
        html += '<p style="margin-top:0.3rem; color:#6b7280; font-size:0.9em;">' + item.explanation + '</p>';
      }
      html += '</div>';
      
      el.className = 'review-item ' + statusClass;
      el.innerHTML = html;
      self.elements.reviewList.appendChild(el);
    });
  }
}
