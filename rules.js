(() => {
  const topics = {
    migration: {
      label: 'Migration',
      strong: 'immigration|emigration|migrant|migrants|refugee|refugees|deportation|asylum seeker|asylum seekers|border crisis|mass migration|border crossings|indvandring|udlændingepolitik|flygtninge|asylansøgere|deportationer|grænsekontrol|migranter',
      clues: 'migration|asylum|border|visa|citizenship|migrant crisis|migration policy|asyl|grænse|opholdstilladelse',
      exceptions: 'database migration|cloud migration|data migration|code migration|bird migration|animal migration|whale migration|spring migration'
    },
    politics: {
      label: 'Politics',
      strong: 'politics|political debate|election|elections|presidential debate|prime minister|parliament|congress|geopolitics|democrats|republicans|donald trump|white house|folketinget|folketingsvalg|valgkamp|statsminister|regeringen|politik|politisk debat',
      clues: 'senate|government|ballot|campaign|voters|polling|candidate|partisan|legislation|minister|regering|vælgere|valg',
      exceptions: 'student election|office politics|steam congress'
    },
    celebrity: {
      label: 'Celebrity gossip',
      strong: 'celebrity gossip|celebrity drama|hollywood scandal|celebrity breakup|celeb gossip|kendissladder',
      clues: 'celebrity|paparazzi|breakup|scandal|hollywood|kendisser|skandale'
    },
    sports: {
      label: 'Sports',
      strong: 'football highlights|premier league|champions league|super bowl|nba|nfl|world cup|formula 1|fodbold|superligaen|håndbold',
      clues: 'goal|match|playoffs|league|tournament|final score|slutspil'
    }
  };

  const defaults = {
    enabled: true,
    topics: { migration: true, politics: true },
    surfaces: { home: true, watch: true, search: false },
    block: '', allow: '', sensitivity: 'balanced'
  };

  function normalize(value) {
    return ' ' + value.toLowerCase().normalize('NFKD')
      .replace(/\p{M}/gu, '').replace(/ø/g, 'o').replace(/æ/g, 'ae')
      .replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ';
  }

  const parse = (value, separator) => [...new Set(value.split(separator).map(normalize))]
    .filter(term => term.trim());
  const has = (text, terms) => terms.some(term => text.includes(term));

  function compile(settings) {
    const block = parse(settings.block, /[\n,]+/);
    const allow = parse(settings.allow, /[\n,]+/);
    const enabledTopics = Object.entries(topics)
      .filter(([key]) => settings.topics[key])
      .map(([, topic]) => ({
        strong: parse(topic.strong, '|'),
        clues: parse(topic.clues, '|'),
        exceptions: parse(topic.exceptions || '', '|')
      }));
    const threshold = { strict: 3, balanced: 2, broad: 1 }[settings.sensitivity] ?? 2;

    return (title, channel) => {
      const normalizedTitle = normalize(title);
      const normalizedChannel = normalize(channel);
      if (has(normalizedTitle, allow) || has(normalizedChannel, allow)) return false;
      if (has(normalizedTitle, block) || has(normalizedChannel, block)) return true;
      return enabledTopics.some(({ strong, clues, exceptions }) => {
        if (has(normalizedTitle, exceptions)) return false;
        const score = (has(normalizedTitle, strong) ? 3 : 0) +
          clues.filter(clue => normalizedTitle.includes(clue)).length +
          Number(has(normalizedChannel, strong));
        return score >= threshold;
      });
    };
  }

  globalThis.FeedSieve = { defaults, topics, compile };
})();
