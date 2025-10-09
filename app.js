const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSd-EKZOSVgIszymbyecICTg0vckoHAKbbk230SxvNLFQeUiXA/formResponse';

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
  remarks: 'entry.501229103'
};

const form = document.getElementById('feedbackForm');
const syncBtn = document.getElementById('syncBtn');

const q_name = document.getElementById('q_name');
const q_designation = document.getElementById('q_designation');
const q_content = document.getElementById('q_content');
const q_coverage = document.getElementById('q_coverage');
const q_usefulness = document.getElementById('q_usefulness');
const q_application = document.getElementById('q_application');
const q_presentation = document.getElementById('q_presentation');
const q_overall = document.getElementById('q_overall');
const q_remarks = document.getElementById('q_remarks');

form.addEventListener('submit', e => {
  e.preventDefault();

  const data = {
    name: q_name.value.trim(),
    designation: q_designation.value.trim(),
    batch: document.querySelector('input[name="batch"]:checked')?.value || '',
    content: q_content.value,
    coverage: q_coverage.value,
    usefulness: q_usefulness.value,
    application: q_application.value,
    presentation: q_presentation.value,
    overall: q_overall.value,
    remarks: q_remarks.value.trim()
  };

  saveOffline(data);
  alert('Saved offline successfully!');
  form.reset();
});

syncBtn.addEventListener('click', syncData);

window.addEventListener('online', () => {
  syncData();
});

function saveOffline(entry) {
  const existing = JSON.parse(localStorage.getItem('responses') || '[]');
  existing.push(entry);
  localStorage.setItem('responses', JSON.stringify(existing));
}

async function syncData() {
  const all = JSON.parse(localStorage.getItem('responses') || '[]');
  if (!all.length) {
    alert('No responses to sync.');
    return;
  }

  let count = 0;
  for (const entry of all) {
    try {
      await postToGoogleForm(entry);
      count++;
    } catch (err) {
      console.error('Failed to sync one response:', err);
      // Stop or continue? Here continue syncing others
    }
  }

  localStorage.removeItem('responses');
  alert(`Synced ${count} responses successfully.`);
}

function postToGoogleForm(data) {
  return new Promise(resolve => {
    const formEl = document.createElement('form');
    formEl.action = GOOGLE_FORM_ACTION;
    formEl.method = 'POST';
    formEl.target = 'hidden_iframe';
    formEl.style.display = 'none';

    // Required hidden fields for Google Forms
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
      iframe.removeEventListener('load', loadHandler);
      resolve();
    }, 8000);

    function loadHandler() {
      clearTimeout(timeout);
      iframe.removeEventListener('load', loadHandler);
      resolve();
    }

    iframe.addEventListener('load', loadHandler);

    document.body.appendChild(formEl);
    formEl.submit();
    document.body.removeChild(formEl);
  });
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}
