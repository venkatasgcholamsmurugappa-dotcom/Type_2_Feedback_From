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
    await postToGoogleForm(entry);
    count++;
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
