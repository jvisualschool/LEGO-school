import './style.css';
import { LEGO_SETS as MOCK_DATA } from './mockData.js';

// --- State Management ---
const state = {
  apiKey: localStorage.getItem('lego_api_key') || import.meta.env.VITE_REBRICKABLE_API_KEY || '',
  favorites: JSON.parse(localStorage.getItem('lego_favorites') || '[]'),
  currentView: null,
  currentLang: 'ko',
  nextPage: { explore: null, themes: null, time: null, part: null },
  totalSets: 0,
  lastResponseTime: 0,
  currentTheme: null,
  themeCounts: JSON.parse(localStorage.getItem('lego_theme_counts') || '{}')
};

// --- DOM Elements ---
const els = {
  app: document.getElementById('app'),
  navBtns: document.querySelectorAll('.nav-btn'),
  views: document.querySelectorAll('.view-section'),
  luckyBtn: document.getElementById('lucky-btn'),
  searchInput: document.getElementById('search-input'),
  grids: {
    explore: document.getElementById('explore-grid'),
    time: document.getElementById('time-grid'),
    favorites: document.getElementById('favorites-grid'),
    part: document.getElementById('part-grid'),
    themes: document.getElementById('theme-sets-grid')
  },
  loadMore: {
    explore: document.getElementById('load-more-explore'),
    themes: document.getElementById('load-more-themes'),
    time: document.getElementById('load-more-time'),
    part: document.getElementById('load-more-part')
  },
  timeMachine: {
    slider: document.getElementById('year-slider'),
    display: document.getElementById('current-year')
  },
  partSearch: {
    btn: document.getElementById('search-parts-btn'),
    label: document.getElementById('part-range-label'),
    container: document.getElementById('dual-slider-container'),
    fill: document.getElementById('slider-fill'),
    thumbMin: document.getElementById('thumb-min'),
    thumbMax: document.getElementById('thumb-max')
  },
  modal: {
    overlay: document.getElementById('modal-overlay'),
    body: document.getElementById('modal-body'),
    close: document.querySelector('.close-modal')
  },
  lightbox: {
    overlay: document.getElementById('lightbox-overlay'),
    img: document.getElementById('lightbox-img'),
    close: document.querySelector('.lightbox-close')
  },
  trivia: {
    marquee: document.getElementById('trivia-marquee'),
    track: document.getElementById('trivia-track'),
    modal: document.getElementById('trivia-modal'),
    body: document.getElementById('trivia-body'),
    close: document.querySelector('.trivia-close'),
    searchStats: document.getElementById('search-stats')
  },
  newArrivals: {
    grid: document.getElementById('new-arrivals-grid'),
    updated: document.getElementById('new-arrivals-updated')
  },
  apiKeyBanner: document.getElementById('api-key-banner'),
  addKeyBtn: document.getElementById('add-api-key'),
  stats: {
    totalSets: document.getElementById('total-sets-count'),
    responseTime: document.getElementById('api-response-time')
  }
};

// --- Initialization ---
async function init() {
  initTheme();
  initLanguage();
  initTrivia();
  attachEventListeners();
  checkApiKey();

  // Handle Routing
  window.addEventListener('hashchange', handleRouting);
  handleRouting();

  await fetchTotalSetsCount();
}

function handleRouting() {
  const hash = location.hash.replace('#', '') || 'new-arrivals';
  switchView(hash);
}

// --- i18n Translations ---
const i18n = {
  ko: {
    explore: '탐색',
    themes: '시리즈',
    timeMachine: '타임머신',
    partPicker: '부품수 검색',
    hallOfFame: '명예의 전당',
    discoverBricks: '브릭을 발견하세요',
    searchPlaceholder: '세트 검색 (예: Star Wars, 2024)...',
    allSeries: '전체 시리즈',
    browseSeries: '시리즈 둘러보기',
    backToSeries: '← 시리즈로 돌아가기',
    search: '검색...',
    loading: '로딩 중...',
    noResults: '결과 없음',
    loadMore: '더 보기...',
    year: '년도',
    parts: '부품',
    addToFav: '명예의 전당에 추가',
    removeFav: '즐겨찾기 제거',
    viewDetails: '자세히 보기',
    buildingInstructions: '조립 설명서',
    timeMachineTitle: '타임머신',
    timeMachineDesc: '슬라이더를 움직여 레고 역사를 탐험하세요',
    partPickerTitle: '부품수 검색',
    partPickerDesc: '부품 개수로 세트 찾기',
    findSetsWith: '세트 찾기:',
    bricks: '개 부품',
    hallOfFameTitle: '명예의 전당',
    noLegends: '아직 저장된 세트가 없습니다.',
    noApiKey: 'API 키가 없습니다. 샘플 데이터 사용 중.',
    addKey: '키 추가',
    newArrivals: '신제품',
    newArrivalsTitle: '신제품 <span class="light-amp">&</span> 출시 예정',
    newArrivalsDesc: 'LEGO.com에서 가져온 최신 출시 예정 제품입니다.',
    lastUpdated: '마지막 업데이트:',
    comingSoon: '출시 예정',
    viewOnLego: 'LEGO.com에서 보기',
    dedicatedTo: 'For OTTO with ❤️',
    otArt: '오토의 예술 세계',
    // Modal
    officialImageMissing: '공식 이미지 없음',
    findOnGoogle: 'Google에서 찾기',
    id: 'ID',
    discovering: '탐색 중:',
    scanning: '우주를 스캔 중...'
  },
  en: {
    explore: 'Explore',
    themes: 'Themes',
    timeMachine: 'Time Machine',
    partPicker: 'Part Picker',
    hallOfFame: 'Hall of Fame',
    discoverBricks: 'Discover the Bricks',
    searchPlaceholder: 'Search sets (e.g. Star Wars, 2024)...',
    allSeries: 'All Series',
    browseSeries: 'Browse Series',
    backToSeries: '← Back to Series',
    search: 'Search...',
    loading: 'Loading...',
    noResults: 'No results found',
    loadMore: 'Load More...',
    year: 'Year',
    parts: 'Parts',
    addToFav: 'Add to Hall of Fame',
    removeFav: 'Remove Fav',
    viewDetails: 'View Details',
    buildingInstructions: 'Building Instructions',
    timeMachineTitle: 'Time Machine',
    timeMachineDesc: 'Drag to travel through LEGO history',
    partPickerTitle: 'Part Picker',
    partPickerDesc: 'Find sets by number of bricks',
    findSetsWith: 'Find Sets with',
    bricks: 'Bricks',
    hallOfFameTitle: 'Hall of Fame',
    noLegends: 'No legends saved yet.',
    noApiKey: 'No API Key found. Using Mock Data.',
    addKey: 'Add Key',
    newArrivals: 'New',
    newArrivalsTitle: 'New & Coming Soon',
    newArrivalsDesc: 'Latest upcoming and new sets from LEGO.com',
    lastUpdated: 'Last updated:',
    comingSoon: 'Coming Soon',
    viewOnLego: 'View on LEGO.com',
    dedicatedTo: 'For OTTO with ❤️',
    otArt: "OTTO's Art World",
    // Modal
    officialImageMissing: 'Official Image Missing',
    findOnGoogle: 'Find on Google',
    id: 'ID',
    discovering: 'Discovering',
    scanning: 'Scanning the universe...'
  }
};

function initTheme() {
  const savedTheme = localStorage.getItem('lego_theme') || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  document.body.classList.remove('theme-dark', 'theme-light', 'theme-gray');
  if (theme !== 'dark') document.body.classList.add(`theme-${theme}`);
  localStorage.setItem('lego_theme', theme);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function initLanguage() {
  const savedLang = localStorage.getItem('lego_lang') || 'ko';
  setLanguage(savedLang);
}

function setLanguage(lang) {
  state.currentLang = lang;
  localStorage.setItem('lego_lang', lang);

  // Update text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (i18n[lang] && i18n[lang][key]) {
      el.innerHTML = i18n[lang][key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (i18n[lang] && i18n[lang][key]) {
      el.placeholder = i18n[lang][key];
    }
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// --- Fetch Total Sets Count ---
async function fetchTotalSetsCount() {
  if (!state.apiKey) return;
  try {
    const start = performance.now();
    const response = await fetch(`https://rebrickable.com/api/v3/lego/sets/?key=${state.apiKey}&page_size=1`);
    const end = performance.now();
    state.lastResponseTime = Math.round(end - start);

    if (response.ok) {
      const data = await response.json();
      state.totalSets = data.count || 0;
      updateStatsDisplay();
    }
  } catch (e) { console.error('Stats fetch failed:', e); }
}

function updateStatsDisplay() {
  if (els.stats.totalSets) {
    els.stats.totalSets.innerHTML = `<i class="fa-solid fa-database"></i> ${state.totalSets.toLocaleString()}`;
  }
  if (els.stats.responseTime) {
    els.stats.responseTime.innerHTML = `<i class="fa-solid fa-bolt"></i> ${state.lastResponseTime} ms`;
  }
}

// --- Logic: Navigation ---
function switchView(viewName) {
  if (state.currentView === viewName) return;
  state.currentView = viewName;

  els.navBtns.forEach(btn => {
    if (btn.dataset.view === viewName) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  els.views.forEach(view => {
    if (view.id === `${viewName}-view`) view.classList.add('active');
    else view.classList.remove('active');
  });

  // Load initial content if needed
  if (viewName === 'explore' && els.grids.explore.children.length === 0) loadExploreSets('Star Wars');
  if (viewName === 'themes') renderThemesGallery();
  if (viewName === 'favorites') renderFavorites();
  if (viewName === 'new-arrivals') loadNewArrivals();
  if (viewName === 'explore') setTimeout(() => els.searchInput.focus(), 100);
}

// --- Logic: Data Fetching ---
async function fetchFromApi(endpoint) {
  if (!state.apiKey) return null;
  try {
    const isFullUrl = endpoint.startsWith('http');
    const url = isFullUrl ? endpoint : `https://rebrickable.com/api/v3/lego/${endpoint}`;
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = `${url}${separator}key=${state.apiKey}`;

    const start = performance.now();
    const response = await fetch(finalUrl);
    const end = performance.now();
    state.lastResponseTime = Math.round(end - start);
    updateStatsDisplay();

    if (!response.ok) throw new Error('API Error');
    return await response.json();
  } catch (e) {
    console.error("Fetch failed:", e);
    return null;
  }
}

// 2. Themes Feature - Load from cache or API
let ALL_THEMES = [];

async function fetchAllThemes() {
  if (ALL_THEMES.length > 0) return ALL_THEMES;

  const gallery = document.getElementById('themes-gallery');
  if (gallery) gallery.innerHTML = '<div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading themes...</div>';

  // Try to load from cache first
  try {
    const cacheResponse = await fetch('./themes-cache.json');
    if (cacheResponse.ok) {
      const cacheData = await cacheResponse.json();
      if (cacheData.themes && cacheData.themes.length > 0) {
        console.log(`Loaded ${cacheData.themes.length} themes from cache`);
        return cacheData.themes;
      }
    }
  } catch (e) {
    console.log('Cache not available, fetching from API...');
  }

  // Fallback to API
  let themes = [];
  let nextUrl = 'themes/?page_size=1000';

  while (nextUrl) {
    const data = await fetchFromApi(nextUrl);
    if (data && data.results) {
      themes = themes.concat(data.results);
      nextUrl = data.next;
    } else break;
  }

  const themesList = themes
    .filter(t => !t.parent_id && t.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  return themesList;
}

window.renderThemesGallery = async function () {
  const gallery = document.getElementById('themes-gallery');
  const container = document.getElementById('theme-sets-container');
  if (!gallery || !container) return;

  gallery.classList.remove('hidden');
  container.classList.add('hidden');

  const themes = await fetchAllThemes();

  if (themes.length === 0) {
    gallery.innerHTML = '<div class="loading">No themes found.</div>';
    return;
  }

  // Check if themes have cached images (img_url property)
  const hasCachedImages = themes[0].img_url !== undefined;

  // Generate color from theme name for fallback
  function getThemeColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const h = hash % 360;
    return `hsl(${h}, 70%, 45%)`;
  }

  gallery.innerHTML = `
    <div class="themes-header">
      <div class="themes-title-group">
        <h3><i class="fa-solid fa-layer-group"></i> All Series (${themes.length})</h3>
        <button id="theme-sort-toggle" class="sort-toggle-btn" title="Toggle Sort Order">
          <i class="fa-solid fa-arrow-down-a-z"></i> Name
        </button>
      </div>
      <div class="themes-controls">
        <input type="text" id="theme-search" class="theme-search-input" placeholder="Search...">
      </div>
    </div>
    <div class="themes-grid" id="themes-grid-inner"></div>
  `;

  const gridInner = document.getElementById('themes-grid-inner');

  function renderThemeCards(sortedThemes) {
    gridInner.innerHTML = sortedThemes.map(theme => {
      const color = getThemeColor(theme.name);
      const initial = theme.name.charAt(0).toUpperCase();
      return `
        <div class="theme-card" data-theme-id="${theme.id}" onclick="window.loadThemeSets('${theme.name.replace(/'/g, "\\'")}', ${theme.id})">
          <div class="theme-img-wrap" id="theme-img-${theme.id}" ${!theme.img_url ? `style="background: linear-gradient(135deg, ${color}, ${color}dd)"` : ''}>
            ${theme.img_url
          ? `<img src="${theme.img_url}" alt="${theme.name}" loading="lazy">`
          : `<span class="theme-initial">${initial}</span>`
        }
          </div>
          <h4>${theme.name} ${state.themeCounts[theme.id] ? `<span class="theme-count">[ ${state.themeCounts[theme.id].toLocaleString()} ]</span>` : ''}</h4>
        </div>
      `;
    }).join('');

    // Lazy load images if needed
    if (!hasCachedImages) loadThemeImages(sortedThemes);
  }

  // Initial render (already sorted by ABC from fetch)
  renderThemeCards(themes);

  // Sorting logic (Toggle)
  let currentSort = 'abc'; // 'abc' or 'count'

  document.getElementById('theme-sort-toggle')?.addEventListener('click', (e) => {
    const btn = e.currentTarget; // Use currentTarget to get the button element even if icon is clicked

    // Toggle sort type
    currentSort = currentSort === 'abc' ? 'count' : 'abc';

    // Update button UI
    if (currentSort === 'count') {
      btn.innerHTML = '<i class="fa-solid fa-arrow-down-9-1"></i> Count';
    } else {
      btn.innerHTML = '<i class="fa-solid fa-arrow-down-a-z"></i> Name';
    }

    let sorted = [...themes];
    if (currentSort === 'count') {
      sorted.sort((a, b) => {
        const countA = state.themeCounts[a.id] || 0;
        const countB = state.themeCounts[b.id] || 0;
        return countB - countA;
      });
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    renderThemeCards(sorted);
    // Re-apply search filter if exists
    const query = document.getElementById('theme-search').value.toLowerCase();
    if (query) {
      document.querySelectorAll('#themes-grid-inner .theme-card').forEach(card => {
        const name = card.querySelector('h4').textContent.toLowerCase();
        card.style.display = name.includes(query) ? 'flex' : 'none';
      });
    }
  });

  // Search functionality
  document.getElementById('theme-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('#themes-grid-inner .theme-card').forEach(card => {
      const name = card.querySelector('h4').textContent.toLowerCase();
      card.style.display = name.includes(query) ? 'flex' : 'none';
    });
  });

  // Load images only if not cached

};

async function loadThemeImages(themes) {
  for (const theme of themes) {
    const imgWrap = document.getElementById(`theme - img - ${theme.id} `);
    if (!imgWrap || imgWrap.querySelector('img')) continue;

    try {
      const data = await fetchFromApi(`sets/?theme_id=${theme.id}&page_size=1&ordering=-num_parts`);
      if (data && data.results && data.results[0] && data.results[0].set_img_url) {
        imgWrap.innerHTML = `<img src="${data.results[0].set_img_url}" alt="${theme.name}" loading="lazy">`;
      }
    } catch (e) { /* Keep placeholder */ }
  }
}

async function loadNewArrivals() {
  const grid = els.newArrivals.grid;
  const updatedEl = els.newArrivals.updated;
  if (!grid) return;

  grid.innerHTML = '<div class="loading">Fetching latest LEGO sets...</div>';

  try {
    const response = await fetch('new-sets.json');
    if (!response.ok) throw new Error('Failed to load new sets');
    const data = await response.json();

    if (data.lastUpdated) {
      const date = new Date(data.lastUpdated);
      updatedEl.innerText = `${i18n[state.currentLang].lastUpdated} ${date.toLocaleString()} `;
    }

    grid.innerHTML = data.items.map(item => `
      <div class="card ${item.isComingSoon ? 'coming-soon' : 'is-new'}">
        <div class="card-badge ${item.isComingSoon ? 'badge-soon' : 'badge-new'}">
          ${item.isComingSoon ? i18n[state.currentLang].comingSoon : i18n[state.currentLang].newArrivals}
        </div>
        <div class="card-image-wrap">
          <img src="${item.image}" alt="${item.name}" class="card-image" loading="lazy" onclick="window.open('${item.url}', '_blank')">
        </div>
        <div class="card-info">
          <h3>${item.name}</h3>
          <div class="card-meta">
            ${item.pieces ? `<span><i class="fa-solid fa-puzzle-piece"></i> ${item.pieces}</span>` : ''}
            <span><i class="fa-solid fa-won-sign"></i> ${item.price}</span>
          </div>
          <div class="card-actions" style="margin-top: 15px;">
            <a href="${item.url}" target="_blank" class="card-google-link new-set-link ${item.isComingSoon ? 'link-soon' : ''}">
              <i class="fa-solid fa-cart-shopping"></i> ${item.isComingSoon ? i18n[state.currentLang].comingSoon : i18n[state.currentLang].viewOnLego}
            </a>
          </div>
        </div>
      </div >
    `).join('');
  } catch (e) {
    grid.innerHTML = `<div class="error">Failed to load new arrivals. Please try again later.</div>`;
  }
}

window.loadThemeSets = async function (name, id, isLoadMore = false) {
  const grid = els.grids.themes;
  const btn = els.loadMore.themes;
  const titleEl = document.getElementById('selected-theme-title');

  if (!isLoadMore) {
    document.getElementById('themes-gallery').classList.add('hidden');
    document.getElementById('theme-sets-container').classList.remove('hidden');
    titleEl.innerHTML = `${name} <span class="theme-count">...</span>`;
    grid.innerHTML = `<div class="loading">${i18n[state.currentLang].discovering} ${name}...</div>`;
    state.nextPage.themes = null;
    state.currentTheme = { name, id };
  } else if (btn) { btn.innerText = "Loading..."; btn.disabled = true; }

  let results = [];
  let totalCount = 0;
  if (state.apiKey) {
    // If id contains commas, it's a list of IDs (including sub-themes)
    const endpoint = isLoadMore ? state.nextPage.themes : `sets/?theme_id=${id}&page_size=20`;
    const data = await fetchFromApi(endpoint);
    if (data && data.results) {
      results = data.results;
      state.nextPage.themes = data.next;
      totalCount = data.count || results.length;
    }
  } else {
    results = MOCK_DATA.filter(s => s.theme.includes(name));
    totalCount = results.length;
  }

  // Update title with count
  // Update title with count
  if (!isLoadMore && titleEl) {
    titleEl.innerHTML = `${name} <span class="theme-count">[ ${totalCount.toLocaleString()} ]</span>`;

    // Cache the count if valid
    if (totalCount > 0) {
      state.themeCounts[id] = totalCount;
      localStorage.setItem('lego_theme_counts', JSON.stringify(state.themeCounts));
    }
  }

  if (isLoadMore) { appendGrid(grid, results); if (btn) { btn.innerText = "Load More Bricks..."; btn.disabled = false; } }
  else { if (results.length === 0) grid.innerHTML = '<div class="loading">No sets found.</div>'; else renderGrid(grid, results); }
  updateLoadMoreButton('themes');
};

document.getElementById('back-to-themes')?.addEventListener('click', () => window.renderThemesGallery());

// 1. Explore Feature
async function loadExploreSets(query, isLoadMore = false) {
  const grid = els.grids.explore;
  const btn = els.loadMore.explore;
  const statsEl = els.trivia.searchStats;
  if (!isLoadMore) {
    grid.innerHTML = `<div class="loading">${i18n[state.currentLang].scanning}</div>`;
    state.nextPage.explore = null;
    if (statsEl) statsEl.innerHTML = '';
  } else if (btn) {
    btn.innerText = "Loading...";
    btn.disabled = true;
  }

  const startTime = performance.now();
  let results = [];
  let totalCount = 0;

  if (state.apiKey) {
    // Basic Korean to English mapping for better search results
    const keywordMap = {
      '자동차': 'car', '차': 'car', '트럭': 'truck', '버스': 'bus',
      '비행기': 'plane', '기차': 'train', '배': 'boat', '용': 'dragon',
      '우주': 'space', '성': 'castle', '로봇': 'robot',
      '경찰': 'police', '소방': 'fire', '병원': 'hospital',
      '해리포터': 'Harry Potter', '스타워즈': 'Star Wars', '닌자고': 'Ninjago',
      '마인크래프트': 'Minecraft', '테크닉': 'Technic', '시티': 'City',
      '프렌즈': 'Friends', '이터널스': 'Eternals', '마블': 'Marvel',
      '아바타': 'Avatar', '디즈니': 'Disney'
    };

    // Check for exact match or simple inclusion if needed, but exact/partial match is safer
    let finalQuery = query.trim();
    const sortedKeys = Object.keys(keywordMap).sort((a, b) => b.length - a.length);

    for (const ko of sortedKeys) {
      if (finalQuery.includes(ko)) {
        finalQuery = keywordMap[ko]; // Replace with English keyword
        break; // Use the first (longest) match
      }
    }

    const endpoint = isLoadMore ? state.nextPage.explore : `sets/?search=${encodeURIComponent(finalQuery)}&page_size=20`;
    const data = await fetchFromApi(endpoint);
    if (data && data.results) {
      results = data.results;
      state.nextPage.explore = data.next;
      totalCount = data.count || results.length;
    }
  } else {
    results = MOCK_DATA.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.theme.toLowerCase().includes(query.toLowerCase()));
    totalCount = results.length;
  }

  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  if (statsEl && !isLoadMore && query) {
    statsEl.innerHTML = `<span class="stats-badge"><i class="fa-solid fa-list-check"></i> ${totalCount.toLocaleString()} sets</span> <span class="stats-badge"><i class="fa-solid fa-bolt"></i> ${duration} ms</span>`;
  }

  if (isLoadMore) {
    appendGrid(grid, results);
    if (btn) { btn.innerText = "Load More Bricks..."; btn.disabled = false; }
  } else {
    renderGrid(grid, results);
  }
  updateLoadMoreButton('explore');
}

async function loadTimeMachineSets(year, isLoadMore = false) {
  const grid = els.grids.time;
  const btn = els.loadMore.time;
  const statsEl = document.getElementById('time-stats');

  if (!isLoadMore) {
    grid.innerHTML = '<div class="loading">Warping to ' + year + '...</div>';
    state.nextPage.time = null;
    if (statsEl) statsEl.innerHTML = '';
  }
  else if (btn) { btn.innerText = "Loading..."; btn.disabled = true; }

  const startTime = performance.now();
  let results = [];
  let totalCount = 0;

  if (state.apiKey) {
    const endpoint = isLoadMore ? state.nextPage.time : `sets/?min_year=${year}&max_year=${year}&page_size=20`;
    const data = await fetchFromApi(endpoint);
    if (data && data.results) {
      results = data.results;
      state.nextPage.time = data.next;
      totalCount = data.count || results.length;
    }
  } else {
    results = MOCK_DATA.filter(s => s.year == year);
    totalCount = results.length;
  }

  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  if (statsEl && !isLoadMore) {
    statsEl.innerHTML = `<span class="stats-badge"><i class="fa-solid fa-list-check"></i> ${totalCount.toLocaleString()} sets</span> <span class="stats-badge"><i class="fa-solid fa-bolt"></i> ${duration} ms</span>`;
  }

  if (isLoadMore) { appendGrid(grid, results); if (btn) { btn.innerText = "Load More Bricks..."; btn.disabled = false; } }
  else { if (results.length === 0) grid.innerHTML = '<div class="loading">No history found.</div>'; else renderGrid(grid, results); }
  updateLoadMoreButton('time');
}

async function loadPartSearchSets(min, max, isLoadMore = false) {
  const grid = els.grids.part;
  const btn = els.loadMore.part;
  const statsEl = document.getElementById('part-stats');

  if (!isLoadMore) {
    grid.innerHTML = `<div class="loading">Counting ${min} ~ ${max} bricks...</div>`;
    state.nextPage.part = null;
    if (statsEl) statsEl.innerHTML = '';
  }
  else if (btn) { btn.innerText = "Loading..."; btn.disabled = true; }

  const startTime = performance.now();
  let results = [];
  let totalCount = 0;

  if (state.apiKey) {
    const endpoint = isLoadMore ? state.nextPage.part : `sets/?min_parts=${min}&max_parts=${max}&page_size=20`;
    const data = await fetchFromApi(endpoint);
    if (data && data.results) {
      results = data.results;
      state.nextPage.part = data.next;
      totalCount = data.count || results.length;
    }
  } else {
    results = MOCK_DATA.filter(s => s.num_parts >= min && s.num_parts <= max);
    totalCount = results.length;
  }

  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  if (statsEl && !isLoadMore) {
    statsEl.innerHTML = `<span class="stats-badge"><i class="fa-solid fa-list-check"></i> ${totalCount.toLocaleString()} sets</span> <span class="stats-badge"><i class="fa-solid fa-bolt"></i> ${duration} ms</span>`;
  }

  if (isLoadMore) { appendGrid(grid, results); if (btn) { btn.innerText = "Load More Bricks..."; btn.disabled = false; } }
  else { if (results.length === 0) grid.innerHTML = '<div class="loading">Nothing here.</div>'; else renderGrid(grid, results); }
  updateLoadMoreButton('part');
}

// Modal (Without What's Inside section)
async function openModal(set) {
  els.modal.overlay.classList.remove('hidden');
  const hasImage = !!set.set_img_url;
  const imgUrl = hasImage ? set.set_img_url : 'https://www.lego.com/cdn/cs/set/assets/blt296289b43de2b470/LEGO_logo_rgb_700.jpg';
  const isFav = state.favorites.some(f => f.set_num === set.set_num);
  const googleSearchUrl = `https://www.google.com/search?q=LEGO+${set.set_num}+${encodeURIComponent(set.name)}&tbm=isch`;
  const instructionUrl = `https://www.lego.com/ko-kr/service/building-instructions/${set.set_num.split('-')[0]}`;
  const t = i18n[state.currentLang] || i18n.en;

  els.modal.body.innerHTML = `
    <div class="modal-layout">
      <div class="modal-img-col">
        <img src="${imgUrl}" alt="${set.name}" style="${!hasImage ? 'opacity: 0.3; filter: grayscale(1);' : ''}">
        ${!hasImage ? `<div class="modal-no-img-overlay">
          <p>${t.officialImageMissing}</p>
          <a href="${googleSearchUrl}" target="_blank" class="action-btn" style="background:var(--accent-blue); text-decoration:none; font-size:0.9rem; padding:10px 20px;"><i class="fa-solid fa-magnifying-glass"></i> ${t.findOnGoogle}</a>
        </div>` : ''}
      </div>
      <div class="modal-info-col">
        <h2>${set.name}</h2>
        <span class="tag">${set.theme || 'LEGO'}</span>
        <div class="stat-row">
           <div class="stat-item"><span class="stat-val">${set.year}</span><span class="stat-label">${t.year}</span></div>
           <div class="stat-item"><span class="stat-val">${set.num_parts}</span><span class="stat-label">${t.parts}</span></div>
           <div class="stat-item"><span class="stat-val">${set.set_num}</span><span class="stat-label">${t.id}</span></div>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <a href="https://www.lego.com/ko-kr/product/${set.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${set.set_num.split('-')[0]}" target="_blank" class="site-link-btn" style="background:linear-gradient(135deg, #FF6B00, #FF9500);" title="LEGO 공식">
              <i class="fa-solid fa-cube"></i> LEGO
            </a>
            <a href="https://www.bricklink.com/v2/catalog/catalogitem.page?S=${set.set_num}" target="_blank" class="site-link-btn" style="background:#1a73e8;" title="BrickLink">
              <i class="fa-solid fa-link"></i> BrickLink
            </a>
            <a href="https://brickset.com/sets/${set.set_num}" target="_blank" class="site-link-btn" style="background:#c62828;" title="Brickset">
              <i class="fa-solid fa-cubes-stacked"></i> Brickset
            </a>
            <a href="https://rebrickable.com/sets/${set.set_num}/" target="_blank" class="site-link-btn" style="background:#6a1b9a;" title="Rebrickable">
              <i class="fa-solid fa-puzzle-piece"></i> Rebrickable
            </a>
            <a href="https://www.brickinside.com/NeoView.php?Db=set&Mode=search&Text=${set.set_num.split('-')[0]}" target="_blank" class="site-link-btn" style="background:#00897b;" title="브릭인사이드 (한국)">
              <i class="fa-solid fa-flag"></i> 브릭인사이드
            </a>
          </div>
          
          <div class="modal-action-icons">
            <a href="https://www.google.com/search?q=LEGO+${set.set_num}" target="_blank" class="modal-icon-btn btn-google" title="Google 검색">
              <i class="fa-brands fa-google"></i>
            </a>
            <a href="https://www.youtube.com/results?search_query=LEGO+${set.set_num}+review" target="_blank" class="modal-icon-btn btn-youtube" title="YouTube 검색">
              <i class="fa-brands fa-youtube"></i>
            </a>
            <a href="${instructionUrl}" target="_blank" class="modal-icon-btn btn-instructions" title="${t.buildingInstructions}">
              <i class="fa-solid fa-book"></i>
            </a>
            <button class="modal-icon-btn btn-fav ${isFav ? 'active' : ''}" id="modal-fav-btn" title="${isFav ? t.removeFav : t.addToFav}">
              <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-fav-btn').addEventListener('click', () => { toggleFavorite(set); openModal(set); });

  // Add lightbox functionality to modal image
  const modalImg = els.modal.body.querySelector('.modal-img-col img');
  if (modalImg && hasImage) {
    modalImg.addEventListener('click', () => openLightbox(imgUrl, set.name));
  }
}

// Lightbox functionality with zoom
function openLightbox(imgUrl, altText) {
  const lightbox = els.lightbox;
  lightbox.img.src = imgUrl;
  lightbox.img.alt = altText;
  lightbox.overlay.classList.remove('hidden');

  // Reset zoom state
  lightbox.img.classList.remove('zoomed');
  lightbox.img.style.transform = '';

  let isZoomed = false;
  let isDragging = false;
  let startX, startY, translateX = 0, translateY = 0;

  const toggleZoom = (e) => {
    if (isDragging) return;
    isZoomed = !isZoomed;
    if (isZoomed) {
      lightbox.img.classList.add('zoomed');
      lightbox.img.style.transform = 'scale(2)';
    } else {
      lightbox.img.classList.remove('zoomed');
      lightbox.img.style.transform = '';
      translateX = 0;
      translateY = 0;
    }
  };

  const startDrag = (e) => {
    if (!isZoomed) return;
    isDragging = true;
    startX = (e.clientX || e.touches?.[0]?.clientX) - translateX;
    startY = (e.clientY || e.touches?.[0]?.clientY) - translateY;
    lightbox.img.style.transition = 'none';
  };

  const drag = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = (e.clientX || e.touches?.[0]?.clientX) - startX;
    const y = (e.clientY || e.touches?.[0]?.clientY) - startY;
    translateX = x;
    translateY = y;
    lightbox.img.style.transform = `scale(2) translate(${x / 2}px, ${y / 2}px)`;
  };

  const endDrag = () => {
    isDragging = false;
    lightbox.img.style.transition = 'transform 0.3s ease';
  };

  // Event listeners
  lightbox.img.onclick = toggleZoom;
  lightbox.img.onmousedown = startDrag;
  document.onmousemove = drag;
  document.onmouseup = endDrag;
  lightbox.img.ontouchstart = startDrag;
  document.ontouchmove = drag;
  document.ontouchend = endDrag;
}

function closeLightbox() {
  els.lightbox.overlay.classList.add('hidden');
  els.lightbox.img.src = '';
}

// Favorites
function toggleFavorite(set) {
  const idx = state.favorites.findIndex(f => f.set_num === set.set_num);
  if (idx > -1) state.favorites.splice(idx, 1);
  else state.favorites.push(set);
  localStorage.setItem('lego_favorites', JSON.stringify(state.favorites));
  renderFavorites();
}

function renderFavorites() {
  if (state.favorites.length === 0) { els.grids.favorites.innerHTML = ''; document.getElementById('empty-favorites').classList.remove('hidden'); }
  else { document.getElementById('empty-favorites').classList.add('hidden'); renderGrid(els.grids.favorites, state.favorites); }
}

// Helpers
function updateLoadMoreButton(view) {
  const btn = els.loadMore[view];
  if (btn) { if (state.nextPage[view]) btn.classList.remove('hidden'); else btn.classList.add('hidden'); }
}

function renderGrid(container, sets) { container.innerHTML = sets.map(set => createCard(set)).join(''); }
function appendGrid(container, sets) { container.insertAdjacentHTML('beforeend', sets.map(set => createCard(set)).join('')); }

function createCard(set) {
  const isFav = state.favorites.some(f => f.set_num === set.set_num);
  const hasImage = !!set.set_img_url;
  const imgUrl = hasImage ? set.set_img_url : 'https://www.lego.com/cdn/cs/set/assets/blt296289b43de2b470/LEGO_logo_rgb_700.jpg';
  const setJson = JSON.stringify(set).replace(/"/g, '&quot;');
  const googleSearchUrl = `https://www.google.com/search?q=LEGO+${set.set_num}+${encodeURIComponent(set.name)}&tbm=isch`;
  return `
    <div class="card ${!hasImage ? 'no-image-card' : ''}">
       <button class="fav-btn-card ${isFav ? 'active' : ''}" data-id="${set.set_num}" onclick="event.stopPropagation(); window.handleFavClick(this, ${setJson})"><i class="fa-solid fa-heart"></i></button>
       <div class="card-content-area" onclick="window.handleCardClick(${setJson})">
          <div class="card-image-wrap">
            <img src="${imgUrl}" alt="${set.name}" class="card-image ${!hasImage ? 'opacity-20 grayscale' : ''}" loading="lazy">
            ${!hasImage ? `<a href="${googleSearchUrl}" target="_blank" class="card-google-link" onclick="event.stopPropagation()"><i class="fa-solid fa-magnifying-glass"></i> Google</a>` : ''}
          </div>
          <div class="card-content">
            <span class="tag" style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:10px; font-size:0.8rem; color:var(--accent-yellow)">${set.theme || 'LEGO'}</span>
            <h3 style="margin-top:10px;">${set.name}</h3>
            <div class="card-footer"><span>${set.year}</span><span>${set.num_parts} Parts</span></div>
          </div>
       </div>
    </div>
  `;
}

window.handleCardClick = (set) => openModal(set);
window.handleFavClick = (btn, set) => { toggleFavorite(set); btn.classList.toggle('active'); };

function attachEventListeners() {
  els.navBtns.forEach(btn => btn.addEventListener('click', (e) => {
    const view = e.target.dataset.view || e.target.closest('.nav-btn').dataset.view;
    location.hash = view;
  }));
  els.searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadExploreSets(e.target.value); });
  els.timeMachine.slider.addEventListener('input', (e) => { els.timeMachine.display.innerText = e.target.value; });
  els.timeMachine.slider.addEventListener('change', (e) => { loadTimeMachineSets(e.target.value); });
  els.luckyBtn.addEventListener('click', feelingBricky);
  els.modal.close.addEventListener('click', () => els.modal.overlay.classList.add('hidden'));
  els.modal.overlay.addEventListener('click', (e) => { if (e.target === els.modal.overlay) els.modal.overlay.classList.add('hidden'); });

  // Lightbox close events
  if (els.lightbox.close) els.lightbox.close.addEventListener('click', closeLightbox);
  if (els.lightbox.overlay) els.lightbox.overlay.addEventListener('click', (e) => { if (e.target === els.lightbox.overlay) closeLightbox(); });

  // ESC key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!els.lightbox.overlay.classList.contains('hidden')) closeLightbox();
      else if (!els.modal.overlay.classList.contains('hidden')) els.modal.overlay.classList.add('hidden');
      else if (!els.trivia.modal.classList.contains('hidden')) els.trivia.modal.classList.add('hidden');
    }
  });

  // Theme toggle
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });

  // Language toggle
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  // Load More
  if (els.loadMore.explore) els.loadMore.explore.addEventListener('click', () => loadExploreSets(els.searchInput.value, true));
  if (els.loadMore.time) els.loadMore.time.addEventListener('click', () => loadTimeMachineSets(els.timeMachine.slider.value, true));
  if (els.loadMore.part) els.loadMore.part.addEventListener('click', () => { const range = els.partSearch.label.innerText.split(' ~ '); loadPartSearchSets(parseInt(range[0]), parseInt(range[1]), true); });
  if (els.loadMore.themes) els.loadMore.themes.addEventListener('click', () => {
    if (state.currentTheme) window.loadThemeSets(state.currentTheme.name, state.currentTheme.id, true);
  });

  if (els.addKeyBtn) els.addKeyBtn.addEventListener('click', () => { const k = prompt('Enter API Key:'); if (k) { localStorage.setItem('lego_api_key', k); location.reload(); } });

  // Part Picker Dual Slider (Fixed)
  setupPartPickerSlider();
}

function setupPartPickerSlider() {
  const container = els.partSearch.container;
  const thumbMin = els.partSearch.thumbMin;
  const thumbMax = els.partSearch.thumbMax;
  const fill = els.partSearch.fill;
  const label = els.partSearch.label;
  const searchBtn = els.partSearch.btn;

  if (!container || !thumbMin || !thumbMax) return;

  let minVal = 500, maxVal = 2000;
  const maxLimit = 10000;

  function updateSliderUI() {
    const pMin = (minVal / maxLimit) * 100;
    const pMax = (maxVal / maxLimit) * 100;
    thumbMin.style.left = pMin + "%";
    thumbMax.style.left = pMax + "%";
    fill.style.left = pMin + "%";
    fill.style.width = (pMax - pMin) + "%";
    label.innerText = `${Math.round(minVal)} ~ ${Math.round(maxVal)}`;

    // Update floating labels
    const minLabel = thumbMin.querySelector('.thumb-label');
    const maxLabel = thumbMax.querySelector('.thumb-label');
    if (minLabel) minLabel.innerText = Math.round(minVal).toLocaleString();
    if (maxLabel) maxLabel.innerText = Math.round(maxVal).toLocaleString();

    // Prevent overlap
    if (minLabel && maxLabel) {
      const containerWidth = container.offsetWidth;
      // Approximate width of a label is ~50px. 
      // Overlap happens if distance is < 60px (safe margin)
      // Distance in % = pMax - pMin
      // Distance in px = (pMax - pMin) / 100 * containerWidth
      const distPx = ((pMax - pMin) / 100) * containerWidth;

      if (distPx < 65) {
        maxLabel.classList.add('shifted-up');
      } else {
        maxLabel.classList.remove('shifted-up');
      }
    }
  }

  function createDragHandler(isMin) {
    return function (startEvent) {
      startEvent.preventDefault();
      const rect = container.getBoundingClientRect();

      function onMove(moveEvent) {
        let clientX;
        if (moveEvent.touches) clientX = moveEvent.touches[0].clientX;
        else clientX = moveEvent.clientX;

        let x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        let val = (x / rect.width) * maxLimit;

        if (isMin) minVal = Math.min(Math.max(0, val), maxVal - 200);
        else maxVal = Math.max(Math.min(maxLimit, val), minVal + 200);

        updateSliderUI();
      }

      function onEnd() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    };
  }

  thumbMin.addEventListener('mousedown', createDragHandler(true));
  thumbMin.addEventListener('touchstart', createDragHandler(true), { passive: false });
  thumbMax.addEventListener('mousedown', createDragHandler(false));
  thumbMax.addEventListener('touchstart', createDragHandler(false), { passive: false });

  updateSliderUI();
  searchBtn.addEventListener('click', () => loadPartSearchSets(Math.round(minVal), Math.round(maxVal)));
}

async function feelingBricky() {
  switchView('explore');
  els.grids.explore.innerHTML = '<div class="loading"><i class="fa-solid fa-dice"></i> Rolling the dice...</div>';
  if (state.apiKey) {
    const randomPage = Math.floor(Math.random() * 50) + 1;
    const data = await fetchFromApi(`sets/?page=${randomPage}&page_size=1`);
    if (data && data.results) { renderGrid(els.grids.explore, data.results); openModal(data.results[0]); }
  } else { const randomSet = MOCK_DATA[Math.floor(Math.random() * MOCK_DATA.length)]; renderGrid(els.grids.explore, [randomSet]); openModal(randomSet); }
}

function checkApiKey() { if (!state.apiKey) els.apiKeyBanner.classList.remove('hidden'); }

// --- Trivia Feature ---
async function initTrivia() {
  try {
    const response = await fetch('trivia.md');
    const text = await response.text();
    const triviaItems = parseTrivia(text);
    if (triviaItems.length > 0) {
      renderTriviaMarquee(triviaItems);
    } else {
      console.warn('No trivia items parsed');
      renderTriviaFallback();
    }
  } catch (err) {
    console.error('Failed to load trivia:', err);
    renderTriviaFallback();
  }
}

function renderTriviaFallback() {
  renderTriviaMarquee([
    { id: 1, title: '레고의 뜻', content: '"레고"는 덴마크어 "leg godt"(잘 놀다)의 줄임말입니다.', source: 'LEGO.com', link: 'https://www.lego.com' }
  ]);
}

function parseTrivia(text) {
  const lines = text.split(/\r?\n/);
  const items = [];
  // Use a more inclusive regex for various numbering and spacing formats
  const regex = /^\s*(\d+)\.\s*\*\*(.+?)\*\*\s*-\s*(.+?)\s*\[(.+?)\]\((.+?)\)/;

  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      items.push({
        id: match[1],
        title: match[2].trim(),
        content: match[3].trim(),
        source: match[4].trim(),
        link: match[5].trim()
      });
    }
  });
  return items;
}

function renderTriviaMarquee(items) {
  if (!els.trivia.track) return;
  // Shuffle items for random display
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  state.triviaItems = shuffled;

  // Double the items for seamless loop
  const displayItems = [...shuffled, ...shuffled];

  els.trivia.track.innerHTML = displayItems.map((item, idx) => `
    <div class="trivia-item" data-idx="${idx % shuffled.length}">
      <span class="trivia-title">${item.title}</span>
    </div>
  `).join('');

  // Add click listeners to items
  els.trivia.track.querySelectorAll('.trivia-item').forEach(el => {
    el.addEventListener('click', () => {
      const item = state.triviaItems[el.dataset.idx];
      openTriviaModal(item);
    });
  });
}

window.openTriviaModal = function (item) {
  if (!item) return;
  els.trivia.body.innerHTML = `
    <div class="trivia-body">
      <h3>${item.title}</h3>
      <p>${item.content}</p>
      <a href="${item.link}" target="_blank" class="trivia-link-btn">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 원본 링크 확인 (${item.source})
      </a>
    </div>
  `;
  els.trivia.modal.classList.remove('hidden');
};

// Add to attachEventListeners
const originalAttach = attachEventListeners;
attachEventListeners = function () {
  originalAttach();
  els.trivia.close?.addEventListener('click', () => els.trivia.modal.classList.add('hidden'));
  els.trivia.modal?.addEventListener('click', (e) => {
    if (e.target === els.trivia.modal) els.trivia.modal.classList.add('hidden');
  });
};

init();
