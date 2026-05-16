// js/engine.js
// Ядро викторины: управление состоянием, навигация, логика ответов и подсчёт результата

import { saveQuizResult } from './storage.js';
import { mergeSettings } from './config.js';

export class QuizEngine {
  constructor(quizId, quizData) {
    this.quizId = quizId;
    this.rawData = quizData;
    this.settings = mergeSettings({ allowBackNavigation: false, shuffleQuestions: false }, quizData.settings);
    this.title = quizData.title;
    this.description = quizData.description;

    // Копируем вопросы, чтобы не мутировать исходные данные
    this.questions = [...quizData.questions];
    if (this.settings.shuffleQuestions) {
      this._shuffleQuestions();
    }

    this.currentIndex = 0;
    this.answers = new Array(this.questions.length).fill(null);
    this.isLocked = new Array(this.questions.length).fill(false);
    this.score = 0;
    this.startTime = Date.now();
    this.isFinished = false;

    this._onChangeCallbacks = [];
    this._onFinishCallbacks = [];
  }

  // Подписка на события изменения состояния и завершения
  on(event, callback) {
    if (event === 'change') this._onChangeCallbacks.push(callback);
    if (event === 'finish') this._onFinishCallbacks.push(callback);
  }

  _emitChange() {
    const state = this._getState();
    this._onChangeCallbacks.forEach(cb => cb(state));
  }

  _getState() {
    const currentQ = this.questions[this.currentIndex];
    return {
      title: this.title,
      description: this.description,
      settings: this.settings,
      currentIndex: this.currentIndex,
      totalQuestions: this.questions.length,
      currentQuestion: currentQ,
      selectedAnswer: this.answers[this.currentIndex],
      isLocked: this.isLocked[this.currentIndex],
      canGoPrev: this.settings.allowBackNavigation && this.currentIndex > 0,
      canGoNext: !this.isFinished && (this.currentIndex < this.questions.length - 1 || this.answers[this.currentIndex] !== null),
      progress: this.currentIndex + 1,
      timeElapsed: Math.floor((Date.now() - this.startTime) / 1000),
      isFinished: this.isFinished,
      isAnswered: this.answers[this.currentIndex] !== null
    };
  }

  selectAnswer(optionIndex) {
    if (this.isFinished || this.isLocked[this.currentIndex]) return;

    this.answers[this.currentIndex] = optionIndex;

    // В строгом режиме (без возврата) ответ фиксируется сразу
    if (!this.settings.allowBackNavigation) {
      this.isLocked[this.currentIndex] = true;
    }
    this._emitChange();
  }

  goNext() {
    if (this.isFinished) return;
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this._emitChange();
    } else {
      this.finish();
    }
  }

  goPrev() {
    if (this.settings.allowBackNavigation && this.currentIndex > 0) {
      this.currentIndex--;
      this._emitChange();
    }
  }

  finish() {
    if (this.isFinished) return;
    this.isFinished = true;

    // Подсчёт баллов
    this.score = 0;
    this.questions.forEach((q, i) => {
      if (this.answers[i] === q.correct) this.score++;
    });

    const result = {
      date: new Date().toISOString(),
      score: this.score,
      total: this.questions.length,
      answers: [...this.answers],
      timeSpentSec: Math.floor((Date.now() - this.startTime) / 1000)
    };

    // Сохраняем последнюю попытку
    saveQuizResult(this.quizId, result);
    this._emitChange();
    this._onFinishCallbacks.forEach(cb => cb(result));
  }

  restart() {
    this.currentIndex = 0;
    this.answers.fill(null);
    this.isLocked.fill(false);
    this.score = 0;
    this.startTime = Date.now();
    this.isFinished = false;
    if (this.settings.shuffleQuestions) this._shuffleQuestions();
    this._emitChange();
  }

  // Данные для экрана разбора результатов
  getReviewData() {
    return this.questions.map((q, i) => ({
      id: i,
      text: q.text,
      selected: this.answers[i],
      correct: q.correct,
      isCorrect: this.answers[i] === q.correct,
      options: q.options,
      explanation: q.explanation
    }));
  }

  // Вспомогательный метод: перемешивание вопросов (Fisher-Yates)
  _shuffleQuestions() {
    for (let i = this.questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
    }
  }
}
