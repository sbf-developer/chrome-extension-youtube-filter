(() => {
  const { defaults, topics } = FeedSieve;
  const get = id => document.getElementById(id);
  const status = get('status');
  let settings;
  let writes = Promise.resolve();

  function update(change, message) {
    settings = { ...settings, ...change };
    const snapshot = settings;
    writes = writes.then(async () => {
      try {
        await chrome.storage.local.set({ settings: snapshot });
        status.textContent = message;
      } catch {
        status.textContent = 'Could not save. Try again.';
      }
    });
  }

  function addChips(group, labels) {
    for (const [key, text] of Object.entries(labels)) {
      const label = document.createElement('label');
      label.className = 'chip';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(settings[group][key]);
      input.addEventListener('change', () => {
        update({ [group]: { ...settings[group], [key]: input.checked } }, 'Saved');
      });
      const caption = document.createElement('span');
      caption.textContent = text;
      label.append(input, caption);
      get(group).append(label);
    }
  }

  async function init() {
    const { settings: saved } = await chrome.storage.local.get('settings');
    settings = saved || defaults;
    addChips('topics', Object.fromEntries(Object.entries(topics).map(([key, topic]) => [key, topic.label])));
    addChips('surfaces', { home: 'Home feed', watch: 'Watch sidebar', search: 'Search' });
    get('enabled').checked = settings.enabled;
    get('sensitivity').value = settings.sensitivity;
    get('block').value = settings.block;
    get('allow').value = settings.allow;
    get('enabled').addEventListener('change', event => {
      update({ enabled: event.target.checked }, event.target.checked ? 'Filtering on' : 'Filtering paused');
    });
    get('sensitivity').addEventListener('change', event => {
      update({ sensitivity: event.target.value }, 'Saved');
    });
  }

  get('phrases').addEventListener('submit', event => {
    event.preventDefault();
    if (settings) update({ block: get('block').value, allow: get('allow').value }, 'Phrases saved');
  });
  init().catch(() => { status.textContent = 'Could not load settings. Reopen the popup.'; });
})();
