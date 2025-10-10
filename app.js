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

// -------- Load States --------
let locationsData = {};
fetch('locations.json')
  .then(res => res.json())
  .then(data => {
    locationsData = data;
    Object.keys(data).forEach(state => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      qState.appendChild(opt);
    });
  });

qState.addEventListener('change', () => {
  const state = qState.value;
  qLocation.innerHTML = '';
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

// -------- Offline Save --------
form.addEventListener('submit', e => {
  e.preventDefault();

  const data = {
    name: q_name.value.trim(),
    designation: document.querySelector('input[name="designation"]:checked')?.value || '',
    date: q_date.value,
    batch: document.querySelector('input[name="batch"]:checked')?.value || '',
    state: q_state.value,
    location: q_location.value,
    expect1: q_expect1.value,
    expect2: q_expect2.value,
    expect3: q_expect3.value,
    expect4: q_expect4.value,
    expect5: q_expect5.value,
    expect6: q_expect6.value,
    remarks: q_remarks.value.trim()
  };

  saveOffline(data);
  form.reset();
  locationContainer.classList.replace('visible', 'hidden');
  updateStatus();
  alert('✅ Saved offline successfully!');
});

syncBtn.addEventListener('click', syncData);

function saveOffline(entry) {
  const existing = JSON.parse(localStorage.getItem('responses') || '[]');
  existing.push(entry);
  localStorage.setItem('responses', JSON.stringify(existing));
}

function updateStatus() {
  const all = JSON.parse(localStorage.getItem('responses') || '[]');
  statusBar.textContent = `📦 Offline responses stored: ${all.length}`;
}
updateStatus();

// -------- Sync Logic --------
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

// -------- PWA Register + Background Sync --------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then(reg => {
    window.addEventListener('online', () => {
      reg.sync.register('sync-responses');
    });
  });
}
