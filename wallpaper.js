const PEXELS_API_KEY = 'Hh3GLxzntaqw28xLSIRpw7WZsdkegxwq6uD5MsWc81v8iZJCHRKIoVJU';
const pexelsClient = axios.create({
    baseURL: 'https://api.pexels.com/v1/',
    headers: { Authorization: PEXELS_API_KEY }
});

let currentPage = 1;
let currentSearch = '';
let isLoading = false;
const favorites = new Set(JSON.parse(localStorage.getItem('favorites')) || []);

const screens = {
    home: document.getElementById('home-screen'),
    search: document.getElementById('search-screen'),
    ai: document.getElementById('ai-screen'),
    categories: document.getElementById('categories-screen'),
    profile: document.getElementById('profile-screen')
};

const navButtons = document.querySelectorAll('.nav-button');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const aiPromptInput = document.getElementById('ai-prompt');
const generateButton = document.getElementById('generate-button');
const modal = document.getElementById('wallpaper-modal');
const modalWallpaper = document.getElementById('modal-wallpaper');
const closeModalButton = document.getElementById('close-modal');
const favoriteButton = document.getElementById('favorite-button');
const downloadButton = document.getElementById('download-button');
const themeToggle = document.getElementById('theme-toggle');

let currentWallpaper = null;

navButtons.forEach(button => {
    button.addEventListener('click', () => switchScreen(button.dataset.screen));
});

searchButton.addEventListener('click', () => searchWallpapers(searchInput.value));
generateButton.addEventListener('click', generateAIWallpaper);
closeModalButton.addEventListener('click', closeModal);
favoriteButton.addEventListener('click', toggleFavorite);
downloadButton.addEventListener('click', () => downloadWallpaper(currentWallpaper.src.original));
themeToggle.addEventListener('change', toggleTheme);

initCategories();
fetchTrendingWallpapers();

function switchScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
    navButtons.forEach(button => button.classList.remove('active'));
    document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');

    if (screenName === 'home') {
        currentPage = 1;
        fetchTrendingWallpapers();
    }
    if (screenName === 'profile') renderFavorites();
}

async function fetchTrendingWallpapers() {
    if (isLoading) return;
    isLoading = true;
    try {
        const response = await pexelsClient.get('curated', { params: { per_page: 20, page: currentPage } });
        renderWallpapers(response.data.photos, 'trending-wallpapers', currentPage === 1);
        currentPage++;
    } catch (error) {
        console.error('Error fetching trending wallpapers:', error);
    } finally {
        isLoading = false;
    }
}

async function searchWallpapers(query) {
    if (!query || isLoading) return;
    isLoading = true;
    currentSearch = query;
    try {
        const response = await pexelsClient.get('search', { params: { query, per_page: 20, page: currentPage } });
        renderWallpapers(response.data.photos, 'search-results', currentPage === 1);
        currentPage++;
    } catch (error) {
        console.error('Error searching wallpapers:', error);
    } finally {
        isLoading = false;
    }
}

function renderWallpapers(wallpapers, containerId, clearContainer = false) {
    const container = document.getElementById(containerId);
    if (clearContainer) container.innerHTML = '';
    wallpapers.forEach(wallpaper => {
        const wallpaperElement = createWallpaperElement(wallpaper);
        container.appendChild(wallpaperElement);
    });
}

function createWallpaperElement(wallpaper) {
    const element = document.createElement('div');
    element.className = 'wallpaper-item';
    element.innerHTML = `
        <img src="${wallpaper.src.medium}" alt="${wallpaper.photographer}" loading="lazy">
        <div class="wallpaper-info">${wallpaper.photographer}</div>
    `;
    element.addEventListener('click', () => openModal(wallpaper));
    return element;
}

function openModal(wallpaper) {
    currentWallpaper = wallpaper;
    modalWallpaper.src = wallpaper.src.large2x;
    modalWallpaper.alt = wallpaper.photographer;
    modal.classList.remove('hidden');
    favoriteButton.classList.toggle('active', favorites.has(wallpaper.id));
}

function closeModal() {
    modal.classList.add('hidden');
}

function toggleFavorite() {
    if (favorites.has(currentWallpaper.id)) {
        favorites.delete(currentWallpaper.id);
        favoriteButton.classList.remove('active');
    } else {
        favorites.add(currentWallpaper.id);
        favoriteButton.classList.add('active');
    }
    localStorage.setItem('favorites', JSON.stringify([...favorites]));
    renderFavorites();
}

function downloadWallpaper(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wallpaper.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateAIWallpaper() {
    const prompt = aiPromptInput.value;
    if (!prompt) return;
    const aiWallpaperUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920`;
    const aiWallpapersContainer = document.getElementById('ai-wallpapers');
    const wallpaperElement = createWallpaperElement({ id: Date.now(), src: { medium: aiWallpaperUrl, large2x: aiWallpaperUrl, original: aiWallpaperUrl }, photographer: 'AI Generated' });
    aiWallpapersContainer.prepend(wallpaperElement);
    aiPromptInput.value = '';
}

function initCategories() {
    const categories = ['Nature', 'Abstract', 'Animals', 'Space', 'Minimalist', 'Artistic', 'Technology', 'Travel'];
    const categoriesGrid = document.getElementById('categories-grid');
    categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category;
        button.addEventListener('click', () => {
            switchScreen('search');
            searchInput.value = category;
            searchWallpapers(category);
        });
        categoriesGrid.appendChild(button);
    });
}

function renderFavorites() {
    const favoritesContainer = document.getElementById('favorites');
    favoritesContainer.innerHTML = '';
    favorites.forEach(async (id) => {
        try {
            const response = await pexelsClient.get(`photos/${id}`);
            const wallpaperElement = createWallpaperElement(response.data);
            favoritesContainer.appendChild(wallpaperElement);
        } catch (error) {
            console.error('Error fetching favorite wallpaper:', error);
        }
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
}

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        if (screens.search.classList.contains('hidden')) {
            fetchTrendingWallpapers();
        } else {
            searchWallpapers(currentSearch);
        }
    }
});
