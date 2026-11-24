(() => {
  const { defaults, compile } = FeedSieve;
  const marker = 'data-feed-sieve-hidden';
  const cards = [
    'ytd-rich-item-renderer', 'ytd-video-renderer', 'ytd-compact-video-renderer',
    'ytd-grid-video-renderer', 'ytd-reel-item-renderer', 'yt-lockup-view-model',
    'ytm-shorts-lockup-view-model', 'yt-shorts-lockup-view-model'
  ].join(',');
  const titleSelector = [
    '#video-title', '#video-title-link', '.yt-lockup-metadata-view-model__title',
    '.shortsLockupViewModelHostMetadataTitle', 'h3 a', 'h3'
  ].join(',');
  const channelSelector = [
    '#channel-name', '.yt-content-metadata-view-model__metadata-row a[href^="/@"]',
    'a[href^="/channel/"]', 'a[href^="/@"]'
  ].join(',');
  let settings = defaults;
  let shouldHide = compile(defaults);
  let pending = false;
  let ready = false;

  function scan() {
    pending = false;
    const path = location.pathname;
    const scope = settings.enabled && (
      path === '/' && settings.surfaces.home ? 'ytd-browse[page-subtype="home"]' :
      path === '/watch' && settings.surfaces.watch ? '#related' :
      path === '/results' && settings.surfaces.search ? 'ytd-search' : null
    );
    for (const card of document.querySelectorAll(cards)) {
      if (card.parentElement?.closest(cards)) {
        card.removeAttribute(marker);
        continue;
      }
      const titleNode = scope && card.closest(scope) && card.querySelector(titleSelector);
      const title = titleNode && (titleNode.textContent.trim() ||
        titleNode.getAttribute('title') || titleNode.getAttribute('aria-label') || '');
      const channel = title ? card.querySelector(channelSelector)?.textContent.trim() || '' : '';
      card.toggleAttribute(marker, Boolean(title && shouldHide(title, channel)));
    }
  }

  function schedule() {
    if (!ready || pending) return;
    pending = true;
    requestAnimationFrame(scan);
  }

  let settingsRevision = 0;
  function apply(value) {
    settings = value || defaults;
    shouldHide = compile(settings);
    ready = true;
    schedule();
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    settingsRevision++;
    apply(changes.settings.newValue);
  });
  chrome.storage.local.get('settings').then(({ settings: saved }) => {
    if (settingsRevision === 0) apply(saved);
  });
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ['title', 'aria-label', 'href', 'page-subtype']
  });
  document.addEventListener('yt-navigate-finish', schedule);
  addEventListener('popstate', schedule);
})();
