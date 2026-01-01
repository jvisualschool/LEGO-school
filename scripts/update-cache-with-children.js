import fs from 'fs';
import path from 'path';

const apiKey = 'REBRICKABLE_API_KEY';
const cachePath = path.resolve('public/themes-cache.json');

// We need to fetch ALL themes to determine parent-child relationships
async function fetchAllThemes() {
  let url = `https://rebrickable.com/api/v3/lego/themes/?page_size=1000&key=${apiKey}`;
  let allThemes = [];

  try {
    while (url) {
      console.log(`Fetching themes from ${url}...`);
      const res = await fetch(url);
      const data = await res.json();
      allThemes = allThemes.concat(data.results);
      url = data.next;
    }
    return allThemes;
  } catch (err) {
    console.error('Error fetching themes:', err);
    return [];
  }
}

async function rebuildCache() {
  console.log('Reading existing cache...');
  let cacheData = {};
  try {
    cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch (e) {
    console.log('No cache found or invalid, starting fresh.');
  }

  const allThemes = await fetchAllThemes();
  if (allThemes.length === 0) return;

  // 1. Map all themes by ID for easy access
  const themeMap = new Map();
  allThemes.forEach(t => themeMap.set(t.id, t));

  // 2. Identify Root Themes (same as before)
  const rootThemes = allThemes.filter(t => t.parent_id === null);

  // 3. For each Root Theme, find ALL descendants (recursive)
  function getDescendantIds(parentId) {
    let ids = [];
    const children = allThemes.filter(t => t.parent_id === parentId);
    for (const child of children) {
      ids.push(child.id);
      ids = ids.concat(getDescendantIds(child.id));
    }
    return ids;
  }

  // 4. Update the cached themes list with a new property 'descendant_ids'
  // We want to keep existing image URLs if possible
  const newThemesList = rootThemes.map(root => {
    const existing = cacheData.themes ? cacheData.themes.find(t => t.id === root.id) : null;
    const descendants = getDescendantIds(root.id);

    // Create comma-separated string of IDs including itself
    // Rebrickable API filter: theme_id=1,2,3...
    const allIds = [root.id, ...descendants].join(',');

    return {
      id: root.id,
      name: root.name,
      img_url: existing ? existing.img_url : null,
      theme_ids: allIds, // New field for API calls
      set_count: existing ? existing.set_count : 0
    };
  });

  // Sort by name
  newThemesList.sort((a, b) => a.name.localeCompare(b.name));

  cacheData.themes = newThemesList;
  cacheData.updated = new Date().toISOString();
  cacheData.count = newThemesList.length;

  fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
  console.log(`Cache rebuilt with descendant IDs. Total Root Themes: ${newThemesList.length}`);
}

rebuildCache();
