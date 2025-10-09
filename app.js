// ===== CONFIG =====
const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSd-EKZOSVgIszymbyecICTg0vckoHAKbbk230SxvNLFQeUiXA/formResponse';

// Replace these IDs with your actual entry IDs from “Get prefilled link”
const ENTRY_MAP = {
  name: 'entry.84179135',
  designation: 'entry.649353373',
  batch: 'entry.2068159052',
  content: 'entry.1696703865',
  coverage: 'entry.668356233',
  usefulness: 'entry.1158237827',
  application: 'entry.1528756438',
  presentation: 'entry.131632769',
  overall: 'entry.1514587503',
  remarks: 'entry.501229103' // replace with actual if different
};
// ===================

const DB_NAME = 'offline-form-db';
const STORE = 'queue';
let dbPromise;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e =>
      e.target.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e.target.error);
  });
  return dbPromise;
}

async function addToQueue(data) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({ data, created: Date.now() });
    tx.oncomplete = res;
    tx.onerror = e => rej(e.target.error);
  });
}

async function getQueue() {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e.target.error);
  });
}

async function removeItem(id) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = res;
    tx.onerror = e => rej(e.target.error);
  });
}

// UI elements
const form = document.getElementById('localForm');
const syncBtn = document.getElementById('syncBtn');
const netSpan = document.getElementById('net');
const queueCount = document.getElementById('queueCount');

function updateNet() {
  netSpan.textContent = navigator.onLine ? 'Online' : 'Offline';
}
window.addEventListener('online', () => {
  updateNet();
  trySyncQueue();
});
window.addEventListener('offline', updateNet);
updateNet();

async function updateQueueCount() {
  const q = await getQueue();
  queueCount.textContent = q.length;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    name: q_name.value,
    designation: q_designation.value,
    batch: q_batch.value,
    content: q_content.value,
    coverage: q_coverage.value,
    usefulness: q_usefulness.value,
    application: q_application.value,
    presentation: q_presentation.value,
    overall: q_overall.value,
    remarks: q_remarks.value
  };
  await addToQueue(data);
  form.reset();
  await updateQueueCount();
  alert('Saved locally. Will sync when online.');
  if (navigator.onLine) trySyncQueue();
});

syncBtn.addEventListener('click', trySyncQueue);

function postToGoogleForm(data) {
  return new Promise(resolve => {
    const formEl = document.createElement('form');
    formEl.action = GOOGLE_FORM_ACTION;
    formEl.method = 'POST';
    formEl.target = 'hidden_iframe';
    formEl.style.display = 'none';

    // Required hidden fields
    formEl.innerHTML += `
      <input type="hidden" name="fvv" value="1">
      <input type="hidden" name="draftResponse" value="[]">
      <input type="hidden" name="pageHistory" value="0">
      <input type="hidden" name="fbzx" value="1234567890">
    `;

    for (const [key, entry] of Object.entries(ENTRY_MAP)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = entry;
      input.value = data[key] || '';
      formEl.appendChild(input);
    }

    const iframe = document.querySelector('iframe[name="hidden_iframe"]');
    const timeout = setTimeout(resolve, 10000);
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

async function trySyncQueue() {
  if (!navigator.onLine) {
    alert('No network connection.');
    return;
  }
  const items = await getQueue();
  if (!items.length) {
    alert('No pending responses.');
    return;
  }

  for (const item of items) {
    await postToGoogleForm(item.data);
    await removeItem(item.id);
  }
  await updateQueueCount();
  alert('All responses synced!');
}

updateQueueCount();
if (navigator.onLine) trySyncQueue();
