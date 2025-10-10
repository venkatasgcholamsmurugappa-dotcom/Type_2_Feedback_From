const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLScuYZJ_b-Vpp1PZiWM9iVrQqKm-sMpZOu1X11LC7w9YVuqxtA/formResponse';

const ENTRY_MAP = {
  name: 'entry.84179135',
  designation: 'entry.2068159052',
  date: 'entry.335516663',
  batch: 'entry.726977150',
  state: 'entry.1696703865',
  location: 'entry.518800673',
  row1: 'entry.1429054805',
  row2: 'entry.685992984',
  row3: 'entry.2116776803',
  row4: 'entry.1507968468',
  row5: 'entry.1841573839',
  row6: 'entry.1388564020',
  remarks: 'entry.501229103'
};

const STATE_LOCATIONS = {
  "Rajasthan State Office": ["Jaipur DO","Jodhpur DO","LPG BP-Bikaner","Jaipur Terminal","Udaipur DO"],
  "Tamil Nadu State Office": ["LPG BP – ERODE","Chennai Terminal – Foreshore","Tuticorin Terminal","Salem Terminal"],
  "Gujarat State Office": ["Ahmedabad DO","Surat DO","Vadodara Terminal","Rajkot DO","Kandla Terminal"],
  "West Bengal State Office": ["Kolkata DO","Durgapur DO","Haldia DO","Siliguri DO"],
  "Indian Oil Assam Oil Division": ["Tinsukia DO","Silchar DO","Guwahati DO","Digboi Terminal"],
  "Punjab and Himachal State Office": ["Chandigarh DO","Shimla DO","Leh Depot","Jalandhar Terminal"],
  "Bihar State Office": ["Patna DO","Muzaffarpur DO","Begusarai DO","Ranchi DO"],
  "Karnataka State Office": ["Bangalore DO","Mysore DO","Mangalore DO","Belgaum DO"],
  "Maharashtra State Office": ["Mumbai DO","Pune DO","Nagpur DO","Aurangabad DO"],
  "AFS": ["Leh AFS","Jammu AFS","Jaipur AFS","Lucknow AFS","Agra AFS"]
};

const form = document.getElementById('feedbackForm');
const syncBtn = document.getElementById('syncBtn');
const counter = document.getElementById('counter');
const stateSelect = document.getElementById('q_state');
const locationSelect = document.getElementById('q_location');
const locationLabel = document.getElementById('locationLabel');

// Populate location dropdown dynamically
stateSelect.addEventListener('change', () => {
  const selectedState = stateSelect.value;
  locationSelect.innerHTML = '';
  if (STATE_LOCATIONS[selectedState]) {
    STATE_LOCATIONS[selectedState].forEach(loc => {
      const opt = document.createElement('option');
      opt.textContent = loc;
      locationSelect.appendChild(opt);
    });
    locationLabel.style.display = 'block';
  } else {
    locationLabel.style.display = 'none';
  }
});

form.addEventListener('submit', e => {
  e.preventDefault();

  const data = {
    name: q_name.value.trim(),
    designation: document.querySelector('input[name="designation"]:checked')?.value || '',
    date: q_date.value,
    batch: document.querySelector('input[name="batch"]:checked')?.value || '',
    state: q_state.value,
    location: q_location.value || '',
    row1: q_row1.value,
    row2: q_row2.value,
    row3: q_row3.value,
    row4: q_row4.value,
    row5: q_row5.value,
    row6: q_row6.value,
    remarks: q_remarks.value.trim()
  };

  saveOffline(data);
  form.reset();
  locationLabel.style.display = 'none';
  updateCounter();
  alert('Response saved offline.');
});

syncBtn.addEventListener('click', syncData);

function saveOffline(entry) {
  const existing = JSON.parse(localStorage.getItem('responses') || '[]');
  existing.push(entry);
  localStorage.setItem('responses', JSON.stringify(existing));
}

function updateCounter() {
  const count = JSON.parse(localStorage.getItem('responses') || '[]').length;
  counter.textContent = count;
}
updateCounter();

async function syncData() {
  const all = JSON.parse(localStorage.getItem('responses') || '[]');
  if (!all.length) {
    alert('No responses to sync.');
    return;
  }

  let success = 0;
  for (const entry of all) {
    await postToGoogleForm(entry);
    success++;
  }

  localStorage.removeItem('responses');
  updateCounter();
  alert(`Synced ${success} responses successfully.`);
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

    for (const [key, entry] of Object.entries(ENTRY_MAP)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = entry;
      input.value = data[key] || '';
      formEl.appendChild(input);
    }

    const iframe = document.querySelector('iframe[name="hidden_iframe"]');
    const timeout = setTimeout(resolve, 6000);
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

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}
