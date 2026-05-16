document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('quiz-list');
    const errorState = document.getElementById('error-state');

    try {
        // 1. Загружаем мета-список викторин
        const response = await fetch('quizzes/quiz-list.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const quizzes = await response.json();

        // Очищаем индикатор загрузки
        listContainer.innerHTML = '';

        // Проверяем, что JSON содержит массив и он не пуст
        if (!Array.isArray(quizzes) || quizzes.length === 0) {
            listContainer.innerHTML = '<p class="loading-state">Викторины пока не добавлены.</p>';
            return;
        }

        // 2. Рендерим карточки
        quizzes.forEach(quiz => {
            const card = document.createElement('a');
            card.className = 'quiz-card';
            // Формируем ссылку с ID викторины
            card.href = `quiz.html?quiz=${encodeURIComponent(quiz.id)}`;

            // Формируем бейджи (количество вопросов, сложность и т.д.)
            const metaBadges = [];
            if (quiz.questionsCount) metaBadges.push(`<span class="badge">${quiz.questionsCount} вопросов</span>`);
            if (quiz.difficulty) metaBadges.push(`<span class="badge">${quiz.difficulty}</span>`);

            card.innerHTML = `
                <h3>${quiz.title}</h3>
                <p>${quiz.description || ''}</p>
                ${metaBadges.length ? `<div class="quiz-meta">${metaBadges.join('')}</div>` : ''}
            `;
            
            listContainer.appendChild(card);
        });

    } catch (error) {
        // 3. Обработка ошибок (нет интернета, битый JSON, 404 и т.д.)
        console.error('Ошибка загрузки списка викторин:', error);
        listContainer.hidden = true;
        errorState.hidden = false;
    }
});
