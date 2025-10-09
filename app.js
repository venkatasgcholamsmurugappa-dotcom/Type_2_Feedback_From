// ======= CONFIG - your Google Form =========
const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSd-EKZOSVgIszymbyecICTg0vckoHAKbbk230SxvNLFQeUiXA/formResponse';

const ENTRY_MAP = {
  name: 'entry.84179135',
  designation: 'entry.649353373',
  batch: 'entry.2068159052',
  topic1: 'entry.1696703865',
  topic2: 'entry.668356233',
  topic3: 'entry.1158237827',
  topic4: 'entry.131632769',
  topic5: 'entry.1514587503',
  comments: 'entry.501229103'
};
// ===========================================

// IndexedDB setup
const DB_NAME = 'offline-form-db';
const STORE = 'queue';
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
  return dbPromise;
}

async function addToQueue(data) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({ data, created: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

async function getQueue() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function removeItem(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

// ======== UI elements ===========
const form = document.getElementById('localForm');
const syncBtn = document.getElementById('syncBtn');
const netSpan = document.getElementById('net');
const queueCount = document.getElementById('queueCount');

function updateNetworkStatus() {
  netSpan.textContent = navigator.onLine ? 'Online' : 'Offline';
}
updateNetworkStatus();
window.addEventListener('online', () => { updateNetworkStatus(); trySyncQueue(); });
window.addEventListener('offline', updateNetworkStatus);

async function updateQueueCount() {
  const q = await getQueue();
  queueCount.textContent = q.length;
}

// ========== Form handling ============
form.addEventListener('submit', async e => {
  e.preventDefault();

  const data = {
    name: document.getElementById('q_name').value,
    designation: document.getElementById('q_designation').value,
    batch: document.getElementById('q_batch').value,
    topic1: document.getElementById('q_topic1').value,
    topic2: document.getElementById('q_topic2').value,
    topic3: document.getElementById('q_topic3').value,
    topic4: document.getElementById('q_topic4').value,
    topic5: document.getElementById('q_topic5').value,
    comments: document.getElementById('q_comments').value
  };

  await addToQueue(data);
  await updateQueueCount();
  form.reset();
  alert('Saved locally. Will sync when online.');

  if (navigator.onLine) trySyncQueue();
});

syncBtn.addEventListener('click', trySyncQueue);

function postToGoogleForm(data) {
  return new Promise((resolve) => {
    const formEl = document.createElement('form');
    formEl.action = GOOGLE_FORM_ACTION;
    formEl.method = 'POST';
    formEl.target = 'hidden_iframe';
    formEl.style.display = 'none';

    for (const [key, entry] of Object.entries(ENTRY_MAP)) {
      const input = document.createElement('input');
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
    alert('No network — cannot sync now.');
    return;
  }

  const queue = await getQueue();
  if (!queue.length) {
    alert('No pending responses.');
    return;
  }

  for (const item of queue) {
    await postToGoogleForm(item.data);
    await removeItem(item.id);
  }

  await updateQueueCount();
  alert('All pending responses synced!');
}

updateQueueCount();
if (navigator.onLine) trySyncQueue();
