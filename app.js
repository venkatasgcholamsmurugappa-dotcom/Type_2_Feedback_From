const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSeoCw-wO6ljQ6_gEzKbXQBNgfoncdDHjeI_qRmdju_y1RK3xg/formResponse';

const ENTRY_MAP = {
  name: 'entry.84179135',
  designation: 'entry.2068159052',
  batch: 'entry.726977150',
  content: 'entry.1696703865',
  coverage: 'entry.668356233',
  usefulness: 'entry.1158237827',
  application: 'entry.1528756438',
  presentation: 'entry.131632769',
  overall: 'entry.1514587503',
  remarks: 'entry.501229103'
};

const form = document.getElementById('feedbackForm');
const syncBtn = document.getElementById('syncBtn');
const offlineCountEl = document.getElementById('offlineCount');
const popup = document.getElementById('popup');
const q_name = document.getElementById('q_name');
const q_remarks = document.getElementById('q_remarks');

updateOfflineCounter();

// Save offline
form.addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    name: q_name.value.trim(),
    designation: document.querySelector('input[name="designation"]:checked')?.value || '',
    batch: document.querySelector('input[name="batch"]:checked')?.value || '',
    content: document.querySelector('input[name="content"]:checked')?.value || '',
    coverage: document.querySelector('input[name="coverage"]:checked')?.value || '',
    usefulness: document.querySelector('input[name="usefulness"]:checked')?.value || '',
    application: document.querySelector('input[name="application"]:checked')?.value || '',
    presentation: document.querySelector('input[name="presentation"]:checked')?.value || '',
    overall: document.querySelector('input[name="overall"]:checked')?.value || '',
    remarks: q_remarks.value.trim()
  };

  if (!data.name || !data.designation || !data.batch) {
    showPopup('⚠️ Please fill all required fields', 'error');
    return;
  }

  saveOffline(data);
  showPopup('💾 Saved offline!');
  form.reset();
});

// Sync now
syncBtn.addEventListener('click', syncData);

// Auto sync when online
window.addEventListener('online', () => syncData());

function saveOffline(entry) {
  const existing = JSON.parse(localStorage.getItem('responses') || '[]');
  existing.push(entry);
  localStorage.setItem('responses', JSON.stringify(existing));
  updateOfflineCounter();
}

function getOfflineCount() {
  return JSON.parse(localStorage.getItem('responses') || '[]').length;
}

function updateOfflineCounter() {
  offlineCountEl.textContent = `📦 Offline responses: ${getOfflineCount()}`;
}

async function syncData() {
  const all = JSON.parse(localStorage.getItem('responses') || '[]');
  if (!all.length) {
    showPopup('No responses to sync');
    return;
  }

  let count = 0;
  for (const entry of all) {
    await postToGoogleForm(entry);
    count++;
  }

  localStorage.removeItem('responses');
  updateOfflineCounter();
  showPopup(`✅ Synced ${count} responses successfully!`);
}

// Submit hidden form
function postToGoogleForm(data) {
  return new Promise(resolve => {
    const formEl = document.createElement('form');
    formEl.action = GOOGLE_FORM_ACTION;
    formEl.method = 'POST';
    formEl.target = 'hidden_iframe';
    formEl.style.display = 'none';

    for (const [key, entry] of Object.entries(ENTRY_MAP)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = entry;
      input.value = data[key] || '';
      formEl.appendChild(input);
    }

    document.body.appendChild(formEl);
    formEl.submit();
    setTimeout(() => {
      document.body.removeChild(formEl);
      resolve();
    }, 800);
  });
}

// Popup animation
function showPopup(msg, type = 'success') {
  popup.textContent = msg;
  popup.style.background = type === 'error' ? '#d9534f' : '#00a86b';
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 2500);
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${window.location.pathname.replace(/\/[^/]*$/, '')}/service-worker.js`;
    navigator.serviceWorker.register(swUrl);
  });
}
