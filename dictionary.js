// State management
const state = {
    wordData: null,
    favorites: [],
    history: [],
    quizQuestions: [],
    currentQuizQuestion: 0,
    quizScore: 0,
    wordsLearned: 0,
    dailyGoal: 10
};

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const languageSelect = document.getElementById('language-select');
const fontSizeSlider = document.getElementById('font-size-slider');
const wordOfTheDayButton = document.getElementById('word-of-the-day-button');
const resultContainer = document.getElementById('result-container');
const wordTitle = document.getElementById('word-title');
const wordPhonetic = document.getElementById('word-phonetic');
const playPronunciation = document.getElementById('play-pronunciation');
const addToFavorites = document.getElementById('add-to-favorites');
const tabContent = document.getElementById('tab-content');
const generateQuizButton = document.getElementById('generate-quiz');
const viewHistoryButton = document.getElementById('view-history');
const viewFavoritesButton = document.getElementById('view-favorites');
const quizContainer = document.getElementById('quiz-container');
const quizQuestion = document.getElementById('quiz-question');
const quizOptions = document.getElementById('quiz-options');
const quizProgress = document.getElementById('quiz-progress');
const quizScore = document.getElementById('quiz-score');
const historyContainer = document.getElementById('history-container');
const historyList = document.getElementById('history-list');
const favoritesContainer = document.getElementById('favorites-container');
const favoritesList = document.getElementById('favorites-list');
const wordsLearnedElement = document.getElementById('words-learned');
const dailyGoalElement = document.getElementById('daily-goal');
const progressBar = document.getElementById('progress');
const pronunciationAudio = document.getElementById('pronunciation-audio');
const loadingIndicator = document.getElementById('loading-indicator');

// Event Listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
languageSelect.addEventListener('change', handleLanguageChange);
fontSizeSlider.addEventListener('input', handleFontSizeChange);
wordOfTheDayButton.addEventListener('click', handleWordOfTheDay);
playPronunciation.addEventListener('click', handlePlayPronunciation);
addToFavorites.addEventListener('click', handleAddToFavorites);
generateQuizButton.addEventListener('click', handleGenerateQuiz);
viewHistoryButton.addEventListener('click', handleViewHistory);
viewFavoritesButton.addEventListener('click', handleViewFavorites);

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => handleTabChange(button.dataset.tab));
});

// Functions
async function handleSearch() {
    const word = searchInput.value.trim();
    if (!word) return;

    showLoadingIndicator();

    try {
        const data = await fetchWordData(word);
        updateState({ wordData: data[0] });
        renderWordData();
        addToHistory(word);
        updateWordsLearned();
        scrollToResult();
    } catch (error) {
        console.error('Error fetching word data:', error);
        showError('Word not found or an error occurred.');
    } finally {
        hideLoadingIndicator();
    }
}

function handleLanguageChange() {
    handleSearch();
}

function handleFontSizeChange() {
    document.body.style.fontSize = `${fontSizeSlider.value}px`;
}

async function handleWordOfTheDay() {
    const randomWords = ['serendipity', 'ephemeral', 'eloquent', 'mellifluous', 'ethereal'];
    const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
    searchInput.value = randomWord;
    await handleSearch();
}

function handlePlayPronunciation() {
    const audioUrl = state.wor

dData.phonetics.find(p => p.audio)?.audio;
    if (audioUrl) {
        pronunciationAudio.src = audioUrl;
        pronunciationAudio.play();
    }
}

function handleAddToFavorites() {
    const word = state.wordData.word;
    if (!state.favorites.includes(word)) {
        updateState({ favorites: [...state.favorites, word] });
        localStorage.setItem('favorites', JSON.stringify(state.favorites));
        addToFavorites.classList.add('active');
    } else {
        updateState({ favorites: state.favorites.filter(w => w !== word) });
        localStorage.setItem('favorites', JSON.stringify(state.favorites));
        addToFavorites.classList.remove('active');
    }
}

function handleTabChange(tab) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    renderTabContent(tab);
}

function handleGenerateQuiz() {
    const words = [...new Set([...state.favorites, ...state.history])];
    const questions = words.slice(0, 5).map(word => ({
        word,
        options: [state.wordData.meanings[0].definitions[0].definition, 'Wrong answer 1', 'Wrong answer 2', 'Wrong answer 3'].sort(() => Math.random() - 0.5),
        correctAnswer: state.wordData.meanings[0].definitions[0].definition
    }));
    updateState({ quizQuestions: questions, currentQuizQuestion: 0, quizScore: 0 });
    renderQuiz();
}

function handleViewHistory() {
    historyList.innerHTML = state.history.map(word => `<li><button onclick="searchWord('${word}')">${word}</button></li>`).join('');
    historyContainer.classList.remove('hidden');
    favoritesContainer.classList.add('hidden');
    quizContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');
}

function handleViewFavorites() {
    favoritesList.innerHTML = state.favorites.map(word => `<li><button onclick="searchWord('${word}')">${word}</button></li>`).join('');
    favoritesContainer.classList.remove('hidden');
    historyContainer.classList.add('hidden');
    quizContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');
}

async function fetchWordData(word) {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/${languageSelect.value}/${word}`);
    if (!response.ok) throw new Error('Word not found');
    return response.json();
}

function updateState(newState) {
    Object.assign(state, newState);
}

function renderWordData() {
    resultContainer.classList.remove('hidden');
    resultContainer.classList.add('fadeIn');
    wordTitle.textContent = state.wordData.word;
    wordPhonetic.textContent = state.wordData.phonetic || '';
    addToFavorites.classList.toggle('active', state.favorites.includes(state.wordData.word));
    handleTabChange('definitions');
}

function renderTabContent(tab) {
    let content = '';
    switch (tab) {
        case 'definitions':
            content = state.wordData.meanings.map(meaning => `
                <div class="meaning slideIn">
                    <h4>${meaning.partOfSpeech}</h4>
                    <ol>${meaning.definitions.map(def => `<li>${def.definition}</li>`).join('')}</ol>
                </div>
            `).join('');
            break;
        case 'examples':
            content = state.wordData.meanings.flatMap(meaning => 
                meaning.definitions.filter(def => def.example).map(def => `<li class="slideIn">${def.example}</li>`)
            ).join('');
            content = content ? `<ul>${content}</ul>` : '<p class="slideIn">No examples available.</p>';
            break;
        case 'synonyms':
        case 'antonyms':
            const words = Array.from(new Set(state.wordData.meanings.flatMap(meaning => 
                meaning.definitions.flatMap(def => def[tab])
            )));
            content = words.length ? 
                `<ul>${words.map(word => `<li class="slideIn"><button onclick="searchWord('${word}')">${word}</button></li>`).join('')}</ul>` :
                `<p class="slideIn">No ${tab} available.</p>`;
            break;
    }
    tabContent.innerHTML = content;
}

function renderQuiz() {
    if (state.currentQuizQuestion >= state.quizQuestions.length) {
        quizContainer.classList.add('hidden');
        return;
    }

    quizContainer.classList.remove('hidden');
    historyContainer.classList.add('hidden');
    favoritesContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');

    const question = state.quizQuestions[state.currentQuizQuestion];
    quizQuestion.textContent = `Define: ${question.word}`;
    quizOptions.innerHTML = question.options.map(option => `
        <button onclick="handleQuizAnswer('${option}')" class="quiz-option">${option}</button>
    `).join('');
    quizProgress.textContent = `Question ${state.currentQuizQuestion + 1} of ${state.quizQuestions.length}`;
    quizScore.textContent = `Score: ${state.quizScore}/${state.quizQuestions.length}`;
}

function handleQuizAnswer(answer) {
    const question = state.quizQuestions[state.currentQuizQuestion];
    if (answer === question.correctAnswer) {
        updateState({ quizScore: state.quizScore + 1 });
    }
    updateState({ currentQuizQuestion: state.currentQuizQuestion + 1 });
    renderQuiz();
}

function addToHistory(word) {
    const updatedHistory = [word, ...state.history.filter(w => w !== word)].slice(0, 10);
    updateState({ history: updatedHistory });
    localStorage.setItem('history', JSON.stringify(updatedHistory));
}

function updateWordsLearned() {
    updateState({ wordsLearned: state.wordsLearned + 1 });
    wordsLearnedElement.textContent = state.wordsLearned;
    dailyGoalElement.textContent = state.dailyGoal;
    const progress = (state.wordsLearned / state.dailyGoal) * 100;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
}

function showError(message) {
    resultContainer.classList.remove('hidden');
    tabContent.innerHTML = `<p class="error slideIn">${message}</p>`;
}

function searchWord(word) {
    searchInput.value = word;
    handleSearch();
}

function showLoadingIndicator() {
    loadingIndicator.classList.remove('hidden');
}

function hideLoadingIndicator() {
    loadingIndicator.classList.add('hidden');
}

function scrollToResult() {
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Initialize
function init() {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
        updateState({ favorites: JSON.parse(storedFavorites) });
    }

    const storedHistory = localStorage.getItem('history');
    if (storedHistory) {
        updateState({ history: JSON.parse(storedHistory) });
    }

    handleFontSizeChange();
}

init();
