(() => {
  const { defaults, blockList } = FeedSieve;
  const block = document.getElementById('block');
  const toggle = document.getElementById('toggle');
  const save = document.getElementById('save');
  const status = document.getElementById('status');
  let settings;

  function updateControls(busy) {
    block.disabled = busy;
    toggle.disabled = busy;
    save.disabled = busy;
    toggle.textContent = settings?.enabled === false ? 'Resume' : 'Pause';
  }

  async function update(change, message) {
    updateControls(true);
    try {
      const next = { ...settings, ...change };
      await chrome.storage.local.set({ settings: next });
      settings = next;
      status.textContent = message;
    } catch {
      status.textContent = 'Could not save. Try again.';
    } finally {
      updateControls(false);
    }
  }

  document.getElementById('filters').addEventListener('submit', event => {
    event.preventDefault();
    if (!save.disabled) update({ blockList: block.value.trim() }, settings.enabled ? 'Saved' : 'Saved · filtering paused');
  });

  toggle.addEventListener('click', () => {
    const enabled = !settings.enabled;
    update({ enabled }, enabled ? 'Filtering resumed' : 'Filtering paused');
  });

  chrome.storage.local.get('settings').then(({ settings: saved }) => {
    settings = saved || defaults;
    block.value = blockList(settings);
    if (!settings.enabled) status.textContent = 'Filtering paused';
    updateControls(false);
  }).catch(() => { status.textContent = 'Could not load filters. Reopen the popup.'; });
})();
