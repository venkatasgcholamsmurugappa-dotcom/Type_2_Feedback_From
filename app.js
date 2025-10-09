// Google Form POST endpoint (NOT the viewform link)
const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSeoCw-wO6ljQ6_gEzKbXQBNgfoncdDHjeI_qRmdju_y1RK3xg/formResponse';

// Google Form entry mapping
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
const q_name = document.getElementById('q_name');
const q_remarks = document.getElementById('q_remarks');

// -------------------------------
// 📥 Save button
// -------------------------------
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

  console.log('🟡 Collected form data:', data);

  if (!data.name || !data.designation || !data.batch) {
    alert('⚠️ Please fill all required fields before saving.');
    return;
  }

  saveOffline(data);
  alert('✅ Saved offline successfully!');
  form.reset();
});

// -------------------------------
// 🔁 Sync Button
// -------------------------------
syncBtn.addEventListener('click', syncData);

// Auto-sync when network returns
window.addEventListener('online', () => {
  console.log('🌐 Network restored. Attempting auto-sync...');
  syncData();
});

// -------------------------------
// 💾 Local storage
// -------------------------------
function saveOffline(entry) {
  const existing = JSON.parse(localStorage.getItem('responses') || '[]');
  existing.push(entry);
  localStorage.setItem('responses', JSON.stringify(existing));
  console.log(`💾 Offline responses count: ${existing.length}`);
}

// -------------------------------
// ☁️ Sync to Google Form
// -------------------------------
async function syncData() {
  const all = JSON.parse(localStorage.getItem('responses') || '[]');
  if (!all.length) {
    alert('No responses to sync.');
    return;
  }

  console.log(`🚀 Starting sync for ${all.length} responses...`);

  let count = 0;
  for (const entry of all) {
    try {
      console.log('➡️ Syncing entry:', entry);
      await postToGoogleForm(entry);
      count++;
    } catch (err) {
      console.error('❌ Failed to sync one entry:', err);
    }
  }

  localStorage.removeItem('responses');
  alert(`✅ Synced ${count} responses successfully.`);
  console.log(`✅ Synced ${count} responses successfully and cleared localStorage.`);
}

// -------------------------------
// 📤 Hidden form submission
// -------------------------------
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

    for (const [key, entry] of Object.entries(ENTRY_MAP)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = entry;
      input.value = data[key] || '';
      formEl.appendChild(input);
    }

    let iframe = document.querySelector('iframe[name="hidden_iframe"]');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.name = 'hidden_iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }

    const timeout = setTimeout(() => {
      console.warn('⚠️ Timeout during sync for entry:', data);
      iframe.removeEventListener('load', loadHandler);
      resolve();
    }, 8000);

    function loadHandler() {
      clearTimeout(timeout);
      iframe.removeEventListener('load', loadHandler);
      console.log('✅ Form entry synced successfully.');
      resolve();
    }

    iframe.addEventListener('load', loadHandler);
    document.body.appendChild(formEl);
    formEl.submit();
    document.body.removeChild(formEl);
  });
}

// -------------------------------
// ⚙️ Service Worker
// -------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${window.location.pathname.replace(/\/[^/]*$/, '')}/service-worker.js`;
    navigator.serviceWorker.register(swUrl)
      .then(reg => console.log('🧱 Service Worker registered:', reg))
      .catch(err => console.error('❌ Service Worker registration failed:', err));
  });
}
