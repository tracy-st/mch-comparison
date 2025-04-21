// List your JSON files here
const files = ['kotara.json', 'indira.json']; // Add up to 10 as needed

const file1Select = document.getElementById('file1');
const file2Select = document.getElementById('file2');
const colorsAContainer = document.getElementById('colorsA');
const colorsBContainer = document.getElementById('colorsB');

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

  // Optionally set defaults
  file1Select.selectedIndex = 0;
  file2Select.selectedIndex = 1;
}

function fetchJsonFile(fileName) {
  return fetch(`../data/${fileName}`)
    .then(res => res.json())
    .catch(err => {
      console.error(`Error loading file ${fileName}:`, err);
      return {};
    });
}

function groupByColorName(visiblecolorSet) {
  const grouped = {};
  visiblecolorSet.forEach(entry => {
    const name = entry.color?.name || 'Unknown';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(entry);
  });
  return grouped;
}

function renderGroupedColors(grouped, container, compareAgainst = {}) {
  container.innerHTML = ''; // Clear existing
  const allKeys = Object.keys(grouped);

  allKeys.forEach(colorName => {
    grouped[colorName].forEach(entry => {
      const colorBlock = document.createElement('div');
      colorBlock.classList.add('color-entry');

      // Color swatch and name
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.backgroundColor = entry.color?.hexCode || '#ccc';

      const title = document.createElement('div');
      title.className = 'color-name';
      title.textContent = entry.color?.name || '—';

      const description = document.createElement('div');
      description.className = 'description';
      description.textContent = `Description: ${entry.description || '—'}`;

      // Pigments
      const pigments = entry.visiblecolorhierarchicalpigmentSet || [];
      const pigmentList = document.createElement('div');
      pigmentList.className = 'pigments';
      pigmentList.innerHTML = `<strong>Pigments:</strong>`;
      if (pigments.length > 0) {
        pigments.forEach(p => {
          const item = document.createElement('div');
          const name = p.hierarchicalPigment?.name || '—';
          const conf = p.confidenceLevel || '—';
          item.textContent = `${name} (${conf})`;
          pigmentList.appendChild(item);
        });
      } else {
        pigmentList.innerHTML += ' —';
      }

      // Elements
      const elements = entry.visiblecolorelementSet || [];
      const elementList = document.createElement('div');
      elementList.className = 'elements';
      elementList.innerHTML = `<strong>Elements:</strong>`;
      if (elements.length > 0) {
        elements.forEach(el => {
          const { name, symbol } = el.element || {};
          const amount = el.amount || '—';
          const item = document.createElement('div');
          item.textContent = `${symbol || name || '—'} (${amount})`;
          elementList.appendChild(item);
        });
      } else {
        elementList.innerHTML += ' —';
      }

      colorBlock.appendChild(swatch);
      colorBlock.appendChild(title);
      colorBlock.appendChild(description);
      colorBlock.appendChild(pigmentList);
      colorBlock.appendChild(elementList);

      container.appendChild(colorBlock);
    });
  });
}

async function loadAndRenderComparison(fileA, fileB) {
  const [dataA, dataB] = await Promise.all([
    fetchJsonFile(fileA),
    fetchJsonFile(fileB)
  ]);

  const setA = dataA.visiblecolorSet || [];
  const setB = dataB.visiblecolorSet || [];

  const groupedA = groupByColorName(setA);
  const groupedB = groupByColorName(setB);

  // Collect all color names
  const allColorNames = new Set([...Object.keys(groupedA), ...Object.keys(groupedB)]);

  colorsAContainer.innerHTML = '';
  colorsBContainer.innerHTML = '';

  allColorNames.forEach(name => {
    const entriesA = groupedA[name] || [null];
    const entriesB = groupedB[name] || [null];

    // Ensure both sides have the same number of entries
    const max = Math.max(entriesA.length, entriesB.length);
    for (let i = 0; i < max; i++) {
      const entryA = entriesA[i] || {};
      const entryB = entriesB[i] || {};

      const blockA = document.createElement('div');
      blockA.classList.add('color-entry');
      blockA.innerHTML = formatEntry(entryA);

      const blockB = document.createElement('div');
      blockB.classList.add('color-entry');
      blockB.innerHTML = formatEntry(entryB);

      colorsAContainer.appendChild(blockA);
      colorsBContainer.appendChild(blockB);
    }
  });
}

function formatEntry(entry) {
  if (!entry || Object.keys(entry).length === 0) {
    return `<div class="placeholder">—</div>`;
  }

  const hex = entry.color?.hexCode || '#ccc';
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

file1Select.addEventListener('change', () => {
  loadAndRenderComparison(file1Select.value, file2Select.value);
});
file2Select.addEventListener('change', () => {
  loadAndRenderComparison(file1Select.value, file2Select.value);
});

// Initialize
populateDropdowns();
loadAndRenderComparison(file1Select.value, file2Select.value);