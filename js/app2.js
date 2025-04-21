const files = ['kotara.json', 'indira.json']; // Add other filenames here

// DOM Elements
const file1Select = document.getElementById('file1');
const file2Select = document.getElementById('file2');
const colorsAContainer = document.getElementById('colorsA');
const colorsBContainer = document.getElementById('colorsB');
const metadataA = document.getElementById('metadataA');
const metadataB = document.getElementById('metadataB');

const colorFilterContainer = document.getElementById('color-filters');
const pigmentFilterContainer = document.getElementById('pigment-filters');

let visiblecolorSetA = [];
let visiblecolorSetB = [];

let activeColorFilters = new Set();
let activePigmentFilters = new Set();

function populateDropdowns() {
  files.forEach(file => {
    const option1 = document.createElement('option');
    option1.value = file;
    option1.textContent = file;
    file1Select.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = file;
    option2.textContent = file;
    file2Select.appendChild(option2);
  });

  file1Select.selectedIndex = 0;
  file2Select.selectedIndex = 1;

  loadAndRenderComparison(file1Select.value, file2Select.value);
}

function fetchJsonFile(fileName) {
  return fetch(`../data/${fileName}`).then(res => res.json()).catch(err => {
    console.error(`Error loading ${fileName}:`, err);
    return {};
  });
}

function getVisibleColorSet(data) {
  return data?.data?.work?.analysisSet?.[0]?.visiblecolorSet || [];
}

function renderMetadata(data, container) {
  const work = data?.data?.work;
  if (!work) {
    container.innerHTML = '';
    return;
  }
  const title = work.title || '—';
  const accession = work.accessionNumber || '—';
  const height = work.height || '—';
  const width = work.width || '—';
  const repo = work?.repository?.name || '—';
  const imageUrl = work?.image?.imageUrl || null;

  const imageTag = imageUrl ? 
    `<a href="${imageUrl}" target="_blank"><img src="${imageUrl}" class="thumbnail" alt="Image thumbnail"></a>` : '';

  container.innerHTML = `
    ${imageTag}
    <div><strong>Title:</strong> ${title}</div>
    <div><strong>Accession #:</strong> ${accession}</div>
    <div><strong>Size:</strong> ${height} × ${width} cm</div>
    <div><strong>Repository:</strong> ${repo}</div>
  `;
}

function groupByColorName(data) {
  const grouped = {};
  data.forEach(entry => {
    const name = entry.color?.name || 'Unknown';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(entry);
  });
  return grouped;
}

function formatEntry(entry) {
  if (!entry || Object.keys(entry).length === 0) {
    return `<div class="placeholder">—</div>`;
  }

  const hex = '#' + entry.color?.hexCode || '#ccc';
  const name = entry.color?.name || '—';
  const desc = entry.description || '—';

  const pigments = (entry.visiblecolorhierarchicalpigmentSet || [])
    .map(p => {
      const pname = p.hierarchicalPigment?.name || '—';
      const conf = p.confidenceLevel || '—';
      return `${pname} (${conf})`;
    }).join('<br>') || '—';

  const elements = (entry.visiblecolorelementSet || [])
    .map(e => {
      const symbol = e.element?.symbol || e.element?.name || '—';
      const amount = e.amount || '—';
      return `${symbol} (${amount})`;
    }).join('<br>') || '—';

  return `
    <div class="swatch" style="background-color: ${hex};"></div>
    <div class="color-name">${name}</div>
    <div class="description"><strong>Description:</strong> ${desc}</div>
    <div class="pigments"><strong>Pigments:</strong><br>${pigments}</div>
    <div class="elements"><strong>Elements:</strong><br>${elements}</div>
  `;
}

function applyFilters(colorSets) {
    const hasColorFilter = activeColorFilters.size > 0;
    const hasPigmentFilter = activePigmentFilters.size > 0;
  
    const applyTo = colorSet => colorSet.filter(entry => {
      const entryColor = entry.color?.name;
      const pigmentNames = (entry.visiblecolorhierarchicalpigmentSet || [])
        .map(p => p.hierarchicalPigment?.name);
  
      const colorMatch = activeColorFilters.has(entryColor);
      const pigmentMatch = pigmentNames.some(pname => activePigmentFilters.has(pname));
  
      if (!hasColorFilter && !hasPigmentFilter) {
        return true; // no filters applied → include everything
      }
  
      return colorMatch || pigmentMatch; // entry must match at least one selected filter
    });
  
    return colorSets.map(applyTo);
  }

function createCheckboxList(data, container, filterSet, onChange) {
  container.innerHTML = '';
  const names = Array.from(new Set(data)).sort();
  names.forEach(name => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${name}"> ${name}`;
    label.querySelector('input').addEventListener('change', e => {
      if (e.target.checked) {
        filterSet.add(name);
      } else {
        filterSet.delete(name);
      }
      loadFilteredResults();
    });
    container.appendChild(label);
  });
}

function loadFilteredResults() {
  const filteredSets = applyFilters([visiblecolorSetA, visiblecolorSetB]);
  const groupedA = groupByColorName(filteredSets[0]);
  const groupedB = groupByColorName(filteredSets[1]);

  const allColorNames = new Set([...Object.keys(groupedA), ...Object.keys(groupedB)]);
  colorsAContainer.innerHTML = '';
  colorsBContainer.innerHTML = '';

  allColorNames.forEach(name => {
    const entriesA = groupedA[name] || [null];
    const entriesB = groupedB[name] || [null];
    const max = Math.max(entriesA.length, entriesB.length);
    for (let i = 0; i < max; i++) {
      const blockA = document.createElement('div');
      blockA.classList.add('color-entry');
      blockA.innerHTML = formatEntry(entriesA[i] || {});
      colorsAContainer.appendChild(blockA);

      const blockB = document.createElement('div');
      blockB.classList.add('color-entry');
      blockB.innerHTML = formatEntry(entriesB[i] || {});
      colorsBContainer.appendChild(blockB);
    }
  });
}

async function loadAndRenderComparison(fileA, fileB) {
  const [dataA, dataB] = await Promise.all([fetchJsonFile(fileA), fetchJsonFile(fileB)]);

  renderMetadata(dataA, metadataA);
  renderMetadata(dataB, metadataB);

  visiblecolorSetA = getVisibleColorSet(dataA);
  visiblecolorSetB = getVisibleColorSet(dataB);

  // Filters
  const allColorNames = [...visiblecolorSetA, ...visiblecolorSetB].map(e => e.color?.name).filter(Boolean);
  const allPigments = [...visiblecolorSetA, ...visiblecolorSetB].flatMap(e =>
    (e.visiblecolorhierarchicalpigmentSet || []).map(p => p.hierarchicalPigment?.name)
  ).filter(Boolean);

  createCheckboxList(allColorNames, colorFilterContainer, activeColorFilters, loadFilteredResults);
  createCheckboxList(allPigments, pigmentFilterContainer, activePigmentFilters, loadFilteredResults);

  loadFilteredResults();
}

// Event Listeners
file1Select.addEventListener('change', () => {
  activeColorFilters.clear();
  activePigmentFilters.clear();
  loadAndRenderComparison(file1Select.value, file2Select.value);
});
file2Select.addEventListener('change', () => {
  activeColorFilters.clear();
  activePigmentFilters.clear();
  loadAndRenderComparison(file1Select.value, file2Select.value);
});

document.getElementById('toggle-sidebar').addEventListener('click', () => {
  const filters = document.getElementById('filters');
  filters.style.display = (filters.style.display === 'none') ? 'block' : 'none';
});

populateDropdowns();