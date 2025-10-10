const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLScuYZJ_b-Vpp1PZiWM9iVrQqKm-sMpZOu1X11LC7w9YVuqxtA/formResponse';

const ENTRY_MAP = {
  name: 'entry.84179135',
  designation: 'entry.2068159052',
  date: 'entry.335516663',
  batch: 'entry.726977150',
  state: 'entry.1696703865',
  location: 'entry.518800673',
  expect1: 'entry.1429054805',
  expect2: 'entry.685992984',
  expect3: 'entry.2116776803',
  expect4: 'entry.1507968468',
  expect5: 'entry.1841573839',
  expect6: 'entry.1388564020',
  remarks: 'entry.501229103'
};

const form = document.getElementById('feedbackForm');
const syncBtn = document.getElementById('syncBtn');
const statusBar = document.getElementById('statusBar');
const qState = document.getElementById('q_state');
const qLocation = document.getElementById('q_location');
const locationContainer = document.getElementById('locationContainer');

let locationsData = {};

// Load States (unique) from locations.json and populate state select
fetch('locations.json')
  .then(res => res.json())
  .then(data => {
    locationsData = data;
    qState.innerHTML = '<option value="">--Select State Office--</option>';

    // Use Set to avoid duplicates if any
    const uniqueStates = [...new Set(Object.keys(data))];
    uniqueStates.forEach(state => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      qState.appendChild(opt);
    });
  });

// Populate location dropdown based on state
qState.addEventListener('change', () => {
  const state = qState.value;
  qLocation.innerHTML = '<option value="">--Select Location--</option>';

  if (locationsData[state]) {
    locationsData[state].forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc;
      opt.textContent = loc;
      qLocation.appendChild(opt);
    });
    locationContainer.classList.replace('hidden', 'visible');
  } else {
    locationContainer.classList.replace('visible', 'hidden');
  }
});

// Form submit - save offline
form.addEventListener('submit', e => {
  e.preventDefault();

  const data = {
    name: document.getElementById('q_name').value.trim(),
    designation: document.querySelector('input[name="designation"]:checked')?.value || '',
    date: document.getElementById('q_date').value,
    batch: document.querySelector('input[name="batch"]:checked')?.value || '',
    state: qState.value,
    location: qLocation.value,
    expect1: document.getElementById('q_expect1').value,
    expect2: document.getElementById('q_expect2').value,
    expect3: document.getElementById('q_expect3').value,
    expect4: document.getElementById('q_expect4').value,
    expect5: document.getElementById('q_expect5').value,
    expect6: document.getElementById('q_expect6').value,
    remarks: document.getElementById('q_remarks').value.trim()
  };

  saveOffline(data);
  form.reset();
  locationContainer.classList.replace('visible', 'hidden');
  updateStatus();
  alert('✅ Saved offline successfully!');
});

// Save to localStorage
function saveOffline(entry) {
  const existing = JSON.parse(localStorage.getItem('responses') || '[]');
  existing.push(entry);
  localStorage.setItem('responses', JSON.stringify(existing));
}

// Update offline count display
function updateStatus() {
  const all = JSON.parse(localStorage.getItem('responses') || '[]');
  statusBar.textContent = `📦 Offline responses stored: ${all.length}`;
}
updateStatus();

// Sync button click
syncBtn.addEventListener('click', syncData);

// Sync logic: post all saved responses to Google Form
async function syncData() {
  const all = JSON.parse(localStorage.getItem('responses') || '[]');
  if (!all.length) return;

  let count = 0;
  for (const entry of all) {
    await postToGoogleForm(entry);
    count++;
  }

  localStorage.removeItem('responses');
  updateStatus();
  alert(`☁️ Synced ${count} responses successfully.`);
}

// Post one entry to Google Form via hidden form + iframe trick
function postToGoogleForm(data) {
  return new Promise(resolve => {
    const formEl = document.createElement('form');
    formEl.action = GOOGLE_FORM_ACTION;
    formEl.method = 'POST';
    formEl.target = 'hidden_iframe';
    formEl.style.display = 'none';

    formEl.innerHTML += `
      <input type="hidden" name="fvv" value="1">
      <input type="hidden" name="draftResponse" value="[]">
      <input type="hidden" name="pageHistory" value="0">
      <input type="hidden" name="fbzx" value="1234567890">
    `;

    for (const [key, entryId] of Object.entries(ENTRY_MAP)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = entryId;
      input.value = data[key] || '';
      formEl.appendChild(input);
    }

    const iframe = document.querySelector('iframe[name="hidden_iframe"]');
    const timeout = setTimeout(resolve, 8000);
    iframe.addEventListener('load', function handler() {
      clearTimeout(timeout);
      iframe.removeEventListener('load', handler);
      resolve();
    });

    document.body.appendChild(formEl);
    formEl.submit();
    document.body.removeChild(formEl);
  });
}

// Register service worker and background sync
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then(reg => {
    window.addEventListener('online', () => {
      if (reg.sync) {
        reg.sync.register('sync-responses').catch(console.error);
      }
    });
  });
}

// Collapsible sections with smooth slide toggle
document.querySelectorAll('.section-header').forEach(header => {
  header.addEventListener('click', () => {
    const section = header.parentElement;
    const content = section.querySelector('.section-content');

    if (section.classList.contains('collapsed')) {
      // Expand section
      section.classList.remove('collapsed');
      content.style.height = content.scrollHeight + 'px';
      setTimeout(() => {
        content.style.height = 'auto';
      }, 300);
    } else {
      // Collapse section
      content.style.height = content.scrollHeight + 'px'; // set current height explicitly
      setTimeout(() => {
        content.style.height = '0';
      }, 10);
      setTimeout(() => {
        section.classList.add('collapsed');
      }, 300);
    }
  });
});

// Initialize collapsible sections open
document.querySelectorAll('.section').forEach(section => {
  const content = section.querySelector('.section-content');
  content.style.height = 'auto'; // initially expanded
  section.classList.remove('collapsed');
});
