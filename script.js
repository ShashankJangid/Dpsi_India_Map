/* ═══════════════════════════════════════════════════════════
   DPSI INDIA CORE KIOSK 2.0 — script.js  [ENHANCED v2]
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ── Audio ────────────────────────────────────────────────── */
const SND = {
  start:   document.getElementById('snd-start'),
  zoom:    document.getElementById('snd-zoom'),
  back:    document.getElementById('snd-back'),
  ambient: document.getElementById('snd-ambient'),
};
function playSound(key) {
  const el = SND[key];
  if (!el) return;
  el.currentTime = 0;
  el.play().catch(() => {});
}

/* ── DOM refs ─────────────────────────────────────────────── */
const screenSaver      = document.getElementById('screen-saver');
const screenApp        = document.getElementById('screen-app');
const mapContainer     = document.getElementById('map-container');
const map              = document.getElementById('map');
const mapLoading       = document.getElementById('map-loading');
const mapLoadingText   = document.getElementById('map-loading-text');
const searchInput      = document.getElementById('search-input');
const searchDropdown   = document.getElementById('search-dropdown');
const searchClear      = document.getElementById('search-clear');
const modalState       = document.getElementById('modal-state');
const modalClose       = document.getElementById('modal-close');
const overlayInc       = document.getElementById('overlay-incredible');
const btnIncredible    = document.getElementById('btn-incredible');
const btnBack          = document.getElementById('btn-back');
const toastEl          = document.getElementById('inactivity-toast');
const countdownVal     = document.getElementById('countdown-val');
const stayBtn          = document.getElementById('stay-btn');
const selectedLabel    = document.getElementById('selected-state-label');
const hudClock         = document.getElementById('hud-clock');
const hudClockApp      = document.getElementById('hud-clock-app');
const stateVideo       = document.getElementById('state-video');
const stateVideoSrc    = document.getElementById('state-video-src');
const videoPlaceholder = document.getElementById('video-placeholder');
const muteToggle       = document.getElementById('mute-toggle');

/* ── Flags ────────────────────────────────────────────────── */
let appMode       = 'saver';
let mapLoaded     = false;
let inactTimer    = null;
let warnInterval  = null;
let countdownSec  = 10;
let videoMuted    = false;   // start muted to comply with autoplay policy
const INACTIVE_MS = 120_000;
const WARN_SEC    = 10;

/* ══════════════════════════════════════════════════════════
   CLOCK
══════════════════════════════════════════════════════════ */
function tickClock() {
  const now = new Date();
  const t = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => String(n).padStart(2, '0')).join(':');
  if (hudClock)    hudClock.textContent    = t;
  if (hudClockApp) hudClockApp.textContent = t;
}
setInterval(tickClock, 1000);
tickClock();

/* ══════════════════════════════════════════════════════════
   PARTICLES
══════════════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener('resize', resize);
  resize();
  const pts = Array.from({ length: 80 }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.4 + 0.3,
    vx: (Math.random() - .5) * .3,
    vy: (Math.random() - .5) * .3,
    a: Math.random() * .5 + .2,
    c: Math.random() > .5 ? '#00f2ff' : '#FF9933',
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => {
      p.x = (p.x + p.vx + canvas.width)  % canvas.width;
      p.y = (p.y + p.vy + canvas.height) % canvas.height;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = p.a;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ══════════════════════════════════════════════════════════
   GLITCH
══════════════════════════════════════════════════════════ */
function triggerGlitch() {
  document.body.classList.add('glitching');
  setTimeout(() => document.body.classList.remove('glitching'), 450);
}

/* ══════════════════════════════════════════════════════════
   LOADING TEXT CYCLER
══════════════════════════════════════════════════════════ */
const LOADING_MSGS = [
  'INITIALISING MAP…',
  'LOADING STATE DATA…',
  'RENDERING BORDERS…',
  'CALIBRATING REGIONS…',
  'APPLYING CARTOGRAPHY…',
  'MAP READY ✓',
];
let _loadMsgIdx = 0;
let _loadMsgTimer = null;

function startLoadingTextCycle() {
  if (!mapLoadingText) return;
  _loadMsgIdx = 0;
  mapLoadingText.textContent = LOADING_MSGS[0];
  _loadMsgTimer = setInterval(() => {
    _loadMsgIdx++;
    if (_loadMsgIdx >= LOADING_MSGS.length - 1) {
      clearInterval(_loadMsgTimer);
      return;
    }
    if (mapLoadingText) mapLoadingText.textContent = LOADING_MSGS[_loadMsgIdx];
  }, 900);
}

function hideMapLoading() {
  clearInterval(_loadMsgTimer);
  if (mapLoadingText) mapLoadingText.textContent = LOADING_MSGS[LOADING_MSGS.length - 1];
  if (mapLoading) {
    mapLoading.classList.add('fade-out');
    setTimeout(() => {
      if (mapLoading.parentNode) mapLoading.parentNode.removeChild(mapLoading);
    }, 650);
  }
}

/* ══════════════════════════════════════════════════════════
   STATE MACHINE
══════════════════════════════════════════════════════════ */
function enterApp() {
  if (appMode === 'app') return;
  appMode = 'app';

  playSound('start');
  triggerGlitch();

  screenSaver.classList.remove('active');
  screenSaver.classList.add('exiting');

  requestAnimationFrame(() => {
    screenApp.classList.add('active');
    setTimeout(() => screenSaver.classList.remove('exiting'), 500);

    if (!mapLoaded) {
      startLoadingTextCycle();
      setTimeout(() => {
        requestAnimationFrame(() => requestAnimationFrame(initMap));
      }, 80);
    }
    resetInactTimer();
  });

  SND.ambient && SND.ambient.play().catch(() => {});
}

function returnToSaver() {
  if (appMode === 'saver') return;
  appMode = 'saver';

  clearTimers();
  playSound('back');
  triggerGlitch();
  closeModal();
  closeIncredible();
  clearSearch();

  screenApp.classList.remove('active');
  screenSaver.classList.add('active');
  if (SND.ambient) SND.ambient.pause();
}

screenSaver.addEventListener('click', enterApp);
btnBack.addEventListener('click', returnToSaver);

/* ══════════════════════════════════════════════════════════
   INACTIVITY TIMER
══════════════════════════════════════════════════════════ */
function resetInactTimer() {
  clearTimers();
  inactTimer = setTimeout(showWarn, INACTIVE_MS - WARN_SEC * 1000);
}
function showWarn() {
  countdownSec = WARN_SEC;
  countdownVal.textContent = countdownSec;
  toastEl.classList.remove('hidden');
  warnInterval = setInterval(() => {
    countdownSec--;
    countdownVal.textContent = countdownSec;
    if (countdownSec <= 0) { clearTimers(); returnToSaver(); }
  }, 1000);
}
function clearTimers() {
  clearTimeout(inactTimer);
  clearInterval(warnInterval);
  toastEl.classList.add('hidden');
}

['click', 'touchstart', 'keydown', 'mousemove'].forEach(ev =>
  document.addEventListener(ev, () => { if (appMode === 'app') resetInactTimer(); }, { passive: true })
);
stayBtn.addEventListener('click', e => {
  e.stopPropagation();
  clearTimers();
  resetInactTimer();
});

/* ══════════════════════════════════════════════════════════
   MAP INIT
   KEY FIX: simplemaps highlights states using its own
   click_state hook. We use ONLY that hook (not a manual
   SVG path click listener) so the correct state ID is
   always passed — preventing wrong-state highlights.
══════════════════════════════════════════════════════════ */
function initMap() {
  if (typeof simplemaps_countrymap === 'undefined') {
    setTimeout(() => { renderFallbackMap(); mapLoaded = true; hideMapLoading(); }, 1200);
    return;
  }

  const rect = mapContainer.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    requestAnimationFrame(initMap);
    return;
  }

  try {
    if (typeof simplemaps_countrymap_mapdata !== 'undefined' &&
        simplemaps_countrymap_mapdata.main_settings) {
      const s = simplemaps_countrymap_mapdata.main_settings;

      /* Visual style */
      s.initial_back        = 'transparent';
      s.state_color         = '#0d1a2e';
      s.state_hover_color   = '#FF9933';   // saffron on hover
      s.active_color        = '#FF9933';   // saffron when clicked/active
      s.border_color        = '#00f2ff';
      s.border_hover_color  = '#ffffff';
      s.border_size         = 1;

      /* Zoom */
      s.zoom                     = 'yes';
      s.zoom_out_incrementally   = 'yes';
      s.manual_zoom              = 'yes';

      /* CRITICAL: disable simplemaps built-in popups so our modal controls everything */
      s.popups = 'off';

      /* Labels */
      s.label_color       = '#15ff00';
      s.label_hover_color = '#ffffff';

      /*
       * FIX — Wrong state highlighted when clicking Himachal Pradesh:
       * simplemaps_countrymap sometimes leaves previously-active state
       * coloured from its own internal `active` state tracking.
       * Setting location_color & all per-state overrides to match
       * state_color prevents stale highlights. If mapdata has per-state
       * `color` fields that conflict, clear them below.
       */
      const regions = simplemaps_countrymap_mapdata.regions
                   || simplemaps_countrymap_mapdata.states
                   || {};
      Object.values(regions).forEach(r => {
        // Remove any per-region colour overrides so global style_settings wins
        delete r.color;
        delete r.hover_color;
        delete r.active_color;
      });
    }

    /*
     * USE ONLY click_state HOOK — do NOT add a separate SVG path click
     * listener. The hook receives the correct simplemaps state ID.
     */
    simplemaps_countrymap.hooks.click_state = function (id) {
      playSound('zoom');

      const mapStateData = (
        simplemaps_countrymap_mapdata?.regions?.[id] ||
        simplemaps_countrymap_mapdata?.states?.[id]  || {}
      );
      openStateModal(id, mapStateData);

      if (selectedLabel)
        selectedLabel.textContent = `◈ ${(STATE_INFO[id]?.name || mapStateData.name || id).toUpperCase()}`;
    };

    simplemaps_countrymap.load();
    mapLoaded = true;

    /* Poll until the SVG appears, then fade the loader */
    _pollForMapReady();

  } catch (err) {
    console.warn('[DPSI] simplemaps error:', err);
    setTimeout(() => { renderFallbackMap(); mapLoaded = true; hideMapLoading(); }, 800);
  }
}

/* Poll DOM for SVG, then dismiss loader */
function _pollForMapReady(attempts = 0) {
  const hasSVG = map.querySelector('svg') || map.querySelector('canvas') ||
                 (map.children.length > 0);

  if (hasSVG || attempts > 60) {
    setTimeout(hideMapLoading, 300);
  } else {
    setTimeout(() => _pollForMapReady(attempts + 1), 120);
  }
}

/* Fallback map when simplemaps is unavailable */
function renderFallbackMap() {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px';
  wrap.innerHTML = `
    <svg viewBox="0 0 340 420" style="width:min(55vh,55vw);height:auto;
         filter:drop-shadow(0 0 20px rgba(0,242,255,.5))">
      <defs>
        <radialGradient id="iglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="#1a3a6a"/>
          <stop offset="100%" stop-color="#020818"/>
        </radialGradient>
      </defs>
      <path d="M170 18 C145 18 125 35 115 52
               L98 85 L82 128 L72 165 L68 198
               L58 232 L54 260 L62 296
               L78 326 L96 352 L118 374
               L140 392 L158 402 L170 406
               L182 402 L200 392 L222 374
               L244 352 L262 326 L278 296
               L286 260 L282 232 L272 198
               L268 165 L258 128 L242 85
               L225 52 C215 35 195 18 170 18Z"
            fill="url(#iglow)" stroke="#00f2ff" stroke-width="1.5"
            stroke-dasharray="6 3" opacity="0.9"/>
      <circle cx="170" cy="220" r="5" fill="#141e27" opacity=".8">
        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".8;.3;.8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x="170" y="215" text-anchor="middle"
            font-family="Orbitron,sans-serif" font-size="22" font-weight="900"
            fill="#ff9933" opacity=".95">INDIA</text>
      <text x="170" y="240" text-anchor="middle"
            font-family="Rajdhani,sans-serif" font-size="10" letter-spacing="5"
            fill="#00f2ff" opacity=".65">INTERACTIVE MAP</text>
    </svg>
    <div style="font-family:Orbitron,sans-serif;font-size:.58rem;letter-spacing:.25em;
                color:rgba(0,242,255,.45);text-align:center;padding:0 20px">
      ADD mapdata.js + countrymap.js TO ENABLE FULL MAP
    </div>`;
  map.appendChild(wrap);

  wrap.addEventListener('click', () => {
    const ids = Object.keys(STATE_INFO);
    const id  = ids[Math.floor(Math.random() * ids.length)];
    playSound('zoom');
    openStateModal(id, {});
  });
}

/* ══════════════════════════════════════════════════════════
   STATE DATA
══════════════════════════════════════════════════════════ */
const STATE_INFO = {
  INAP: { name:'Andhra Pradesh',        capital:'Amaravati',          pop:'53M',   area:'162,975 km²', lang:'Telugu',            known:'Tirupati, Kuchipudi Dance, Araku Valley' },
  INAR: { name:'Arunachal Pradesh',     capital:'Itanagar',           pop:'1.6M',  area:'83,743 km²',  lang:'Nyishi / English',  known:'Tawang Monastery, Sela Pass, Ziro Valley' },
  INAS: { name:'Assam',                 capital:'Dispur',             pop:'35M',   area:'78,438 km²',  lang:'Assamese',          known:'Kaziranga Rhinos, Tea Gardens, Bihu Dance' },
  INBR: { name:'Bihar',                 capital:'Patna',              pop:'128M',  area:'94,163 km²',  lang:'Hindi / Maithili',  known:'Bodh Gaya, Nalanda University, Chhath Puja' },
  INCT: { name:'Chhattisgarh',          capital:'Raipur',             pop:'30M',   area:'135,192 km²', lang:'Hindi',             known:'Bastar Caves, Chitrakote Falls, Tribal Arts' },
  INGA: { name:'Goa',                   capital:'Panaji',             pop:'1.5M',  area:'3,702 km²',   lang:'Konkani',           known:'Beaches, Portuguese Heritage, Feni' },
  INGJ: { name:'Gujarat',               capital:'Gandhinagar',        pop:'70M',   area:'196,024 km²', lang:'Gujarati',          known:'Rann of Kutch, Gir Forest Lions, Textiles' },
  INHR: { name:'Haryana',               capital:'Chandigarh',         pop:'29M',   area:'44,212 km²',  lang:'Hindi',             known:'Kurukshetra, Milk Production, Sports' },
  INHP: { name:'Himachal Pradesh',      capital:'Shimla',             pop:'7M',    area:'55,673 km²',  lang:'Hindi / Pahari',    known:'Shimla Hill Station, Spiti Valley, Apple Orchards' },
  INJH: { name:'Jharkhand',             capital:'Ranchi',             pop:'38M',   area:'79,716 km²',  lang:'Hindi / Santali',   known:'Hundru Falls, Tribal Culture, Mineral Wealth' },
  INKA: { name:'Karnataka',             capital:'Bengaluru',          pop:'67M',   area:'191,791 km²', lang:'Kannada',           known:'IT Hub, Mysore Palace, Coorg Coffee' },
  INKL: { name:'Kerala',                capital:'Thiruvananthapuram', pop:'35M',   area:'38,852 km²',  lang:'Malayalam',         known:'Backwaters, Ayurveda, Kathakali Dance' },
  INMP: { name:'Madhya Pradesh',        capital:'Bhopal',             pop:'85M',   area:'308,252 km²', lang:'Hindi',             known:'Khajuraho Temples, Kanha Tiger Reserve, Sanchi' },
  INMH: { name:'Maharashtra',           capital:'Mumbai',             pop:'126M',  area:'307,713 km²', lang:'Marathi',           known:'Bollywood, Ajanta Caves, Gateway of India' },
  INMN: { name:'Manipur',               capital:'Imphal',             pop:'3M',    area:'22,327 km²',  lang:'Meitei',            known:'Loktak Lake, Polo Sport Origin, Ras Lila' },
  INML: { name:'Meghalaya',             capital:'Shillong',           pop:'3M',    area:'22,429 km²',  lang:'Khasi / Garo',      known:'Wettest Place on Earth, Living Root Bridges' },
  INMZ: { name:'Mizoram',               capital:'Aizawl',             pop:'1.2M',  area:'21,081 km²',  lang:'Mizo',              known:'Blue Mountains, Phawngpui Peak, Bamboo' },
  INNL: { name:'Nagaland',              capital:'Kohima',             pop:'2M',    area:'16,579 km²',  lang:'Nagamese',          known:'Hornbill Festival, Naga Warriors, Dzukou Valley' },
  INOR: { name:'Odisha',                capital:'Bhubaneswar',        pop:'46M',   area:'155,707 km²', lang:'Odia',              known:'Puri Jagannath Temple, Konark Sun Temple, Odissi Dance' },
  INPB: { name:'Punjab',                capital:'Chandigarh',         pop:'30M',   area:'50,362 km²',  lang:'Punjabi',           known:'Golden Temple, Bhangra Dance, Wheat Bowl' },
  INRJ: { name:'Rajasthan',             capital:'Jaipur',             pop:'81M',   area:'342,239 km²', lang:'Hindi / Rajasthani',known:'Thar Desert, Amber Fort, Camel Safari' },
  INSK: { name:'Sikkim',                capital:'Gangtok',            pop:'0.7M',  area:'7,096 km²',   lang:'Nepali / Sikkimese',known:'Kanchenjunga, Buddhist Monasteries, Tsomgo Lake' },
  INTN: { name:'Tamil Nadu',            capital:'Chennai',            pop:'77M',   area:'130,058 km²', lang:'Tamil',             known:'Dravidian Temples, Classical Arts, Silk Sarees' },
  INTG: { name:'Telangana',             capital:'Hyderabad',          pop:'38M',   area:'112,077 km²', lang:'Telugu',            known:'Charminar, Hyderabadi Biryani, IT Hub' },
  INTR: { name:'Tripura',               capital:'Agartala',           pop:'4M',    area:'10,486 km²',  lang:'Bengali / Kokborok',known:'Ujjayanta Palace, Neermahal, Sepahijala Wildlife Sanctuary' },
  INUP: { name:'Uttar Pradesh',         capital:'Lucknow',            pop:'235M',  area:'240,928 km²', lang:'Hindi',             known:'Taj Mahal, Varanasi Ghats, Mathura Krishna Temples' },
  INUT: { name:'Uttarakhand',           capital:'Dehradun',           pop:'11M',   area:'53,483 km²',  lang:'Hindi / Garhwali',  known:'Haridwar, Rishikesh Yoga Capital, Valley of Flowers' },
  INWB: { name:'West Bengal',           capital:'Kolkata',            pop:'99M',   area:'88,752 km²',  lang:'Bengali',           known:'Durga Puja, Rabindranath Tagore, Darjeeling Tea' },
  INAN: { name:'Andaman & Nicobar',     capital:'Port Blair',         pop:'0.4M',  area:'8,249 km²',   lang:'Hindi / Bengali',   known:'Cellular Jail, Pristine Beaches, Coral Reefs' },
  INCH: { name:'Chandigarh',            capital:'Chandigarh',         pop:'1.2M',  area:'114 km²',     lang:'Hindi / Punjabi',   known:'Le Corbusier City, Rock Garden, Sukhna Lake' },
  INDH: { name:'Dadra, NH & Daman Diu', capital:'Daman',              pop:'0.95M', area:'603 km²',     lang:'Gujarati / Hindi',  known:'Portuguese Heritage, Beaches, Silvassa Forests' },
  INDL: { name:'Delhi',                 capital:'New Delhi',          pop:'32M',   area:'1,484 km²',   lang:'Hindi',             known:'Red Fort, Qutub Minar, India Gate' },
  INJK: { name:'Jammu & Kashmir',       capital:'Srinagar / Jammu',   pop:'13M',   area:'42,241 km²',  lang:'Urdu / Kashmiri',   known:'Dal Lake, Gulmarg Ski Resort, Mughal Gardens' },
  INLA: { name:'Ladakh',                capital:'Leh',                pop:'0.3M',  area:'59,146 km²',  lang:'Ladakhi / Hindi',   known:'Pangong Lake, Monasteries, Stargazing Capital' },
  INLD: { name:'Lakshadweep',           capital:'Kavaratti',          pop:'0.07M', area:'32 km²',      lang:'Malayalam',         known:'Coral Islands, Lagoons, Scuba Diving' },
  INPY: { name:'Puducherry',            capital:'Puducherry',         pop:'1.6M',  area:'479 km²',     lang:'Tamil / French',    known:'French Quarter, Sri Aurobindo Ashram, Auroville' },
};

/* ══════════════════════════════════════════════════════════
   STATE MODAL
══════════════════════════════════════════════════════════ */
function openStateModal(id, mapData) {
  const info    = STATE_INFO[id] || {};
  const name    = info.name    || mapData?.name    || id;
  const capital = info.capital || '—';
  const pop     = info.pop     || '—';
  const area    = info.area    || '—';
  const lang    = info.lang    || '—';
  const known   = info.known   || '—';
  const emoji   = info.emoji   || '';

  const displayCode = id.startsWith('IN') ? id.slice(2) : id;
  document.getElementById('modal-state-code').textContent    = displayCode;
  document.getElementById('modal-state-name').textContent    = name;
  document.getElementById('modal-state-capital').textContent = `Capital: ${capital}`;
  document.getElementById('modal-state-emblem').textContent  = emoji;

  document.getElementById('modal-info-grid').innerHTML = `
    <div class="info-card">
      <div class="info-card-label">Population</div>
      <div class="info-card-val">${pop}</div>
    </div>
    <div class="info-card">
      <div class="info-card-label">Area</div>
      <div class="info-card-val">${area}</div>
    </div>
    <div class="info-card">
      <div class="info-card-label">Language</div>
      <div class="info-card-val">${lang}</div>
    </div>
    <div class="info-card">
      <div class="info-card-label">ISO Code</div>
      <div class="info-card-val">${id}</div>
    </div>
    <div class="info-card full">
      <div class="info-card-label">Known For</div>
      <div class="info-card-val">${known}</div>
    </div>`;

  /* Video — start muted (autoplay policy), user can unmute */
  videoMuted = false;
  stateVideo.muted = false;
  muteToggle.textContent = '🔊';

  stateVideoSrc.src = `videos/${id}.mp4`;
  stateVideo.load();
  stateVideo.style.display = '';
  videoPlaceholder.classList.add('hidden');

  stateVideo.onerror = () => {
    stateVideo.style.display = 'none';
    videoPlaceholder.classList.remove('hidden');
  };

  stateVideo.play().catch(() => {
    stateVideo.style.display = 'none';
    videoPlaceholder.classList.remove('hidden');
  });

  modalState.classList.remove('hidden');
}

function closeModal() {
  modalState.classList.add('hidden');
  stateVideo.pause();
  stateVideoSrc.src = '';
  if (selectedLabel) selectedLabel.textContent = '◈ TAP ANY STATE TO EXPLORE';
}

modalClose.addEventListener('click', closeModal);
modalState.addEventListener('click', e => { if (e.target === modalState) closeModal(); });

muteToggle.addEventListener('click', e => {
  e.stopPropagation();
  videoMuted = !videoMuted;
  stateVideo.muted = videoMuted;
  muteToggle.textContent = videoMuted ? '🔇' : '🔊';
});

/* ══════════════════════════════════════════════════════════
   SEARCH
══════════════════════════════════════════════════════════ */
function buildSearchIndex() {
  const idx = [];
  if (typeof simplemaps_countrymap_mapdata !== 'undefined') {
    const regions = simplemaps_countrymap_mapdata.regions
                 || simplemaps_countrymap_mapdata.states || {};
    Object.entries(regions).forEach(([id, d]) => idx.push({ id, name: d.name || id }));
  }
  Object.entries(STATE_INFO).forEach(([id, info]) => {
    if (!idx.find(i => i.id === id)) idx.push({ id, name: info.name });
  });
  return idx;
}
let searchIndex = [];
window.addEventListener('load', () => { searchIndex = buildSearchIndex(); });

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { searchDropdown.classList.add('hidden'); return; }
  const results = searchIndex.filter(s =>
    s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
  ).slice(0, 8);
  if (!results.length) { searchDropdown.classList.add('hidden'); return; }
  searchDropdown.innerHTML = results.map(r =>
    `<div class="dropdown-item" data-id="${r.id}">
       <span class="di-code">${r.id}</span>
       <span>${r.name}</span>
     </div>`
  ).join('');
  searchDropdown.classList.remove('hidden');
});

searchDropdown.addEventListener('click', e => {
  const item = e.target.closest('.dropdown-item');
  if (!item) return;
  const id = item.dataset.id;
  clearSearch();
  const info = STATE_INFO[id];
  if (info) {
    playSound('zoom');
    openStateModal(id, {});
    if (selectedLabel) selectedLabel.textContent = `◈ ${info.name.toUpperCase()}`;
  }
});

searchClear.addEventListener('click', clearSearch);
function clearSearch() {
  searchInput.value = '';
  searchDropdown.classList.add('hidden');
}
document.addEventListener('click', e => {
  if (!e.target.closest('#search-wrap')) searchDropdown.classList.add('hidden');
});

/* ══════════════════════════════════════════════════════════
   INCREDIBLE INDIA
══════════════════════════════════════════════════════════ */
const FACTS = [
  { icon:'🏛️', title:"World's Largest Democracy",    desc:'Over 970 million eligible voters — the largest democratic electorate on Earth.' },
  { icon:'🔢', title:"Zero — India's Gift to Math",  desc:'The concept of zero and the decimal numeral system originated in ancient India.' },
  { icon:'🌊', title:'Wettest Place on Earth',        desc:'Mawsynram, Meghalaya receives the highest average annual rainfall globally.' },
  { icon:'🛕', title:'7,000+ Years of Civilisation',  desc:'The Indus Valley Civilization is one of the world\'s oldest, dating to ~3000 BCE.' },
  { icon:'🧘', title:'Birthplace of Yoga & Ayurveda', desc:'Yoga and Ayurveda originated in India over 5,000 years ago.' },
  { icon:'🌶️', title:'Spice Capital of the World',   desc:'India produces, consumes, and exports more spices than any other nation.' },
  { icon:'🎬', title:'Largest Film Industry',         desc:'Bollywood and regional Indian cinemas produce more films annually than Hollywood.' },
  { icon:'🐯', title:'Home of the Bengal Tiger',      desc:'India hosts over 75% of the world\'s wild tiger population.' },
  { icon:'☀️', title:'Top Solar Energy Producer',     desc:'India is among the top 5 solar energy producers in the world.' },
  { icon:'🚀', title:'Mars in One Attempt',            desc:'ISRO\'s Mangalyaan reached Mars on its very first attempt in 2014 — a global first.' },
  { icon:'♟️', title:'Chess — Born in India',          desc:'Chess, originally "Chaturanga," was invented in India around the 6th century.' },
  { icon:'🌿', title:'Largest Vegetarian Population', desc:'India has more vegetarians than the rest of the world combined.' },
  { icon:'💎', title:'Diamonds First Discovered Here',desc:'India was the world\'s only source of diamonds until 1725.' },
  { icon:'🦚', title:'National Bird: Peacock',        desc:'The Indian Peacock is celebrated for its vibrant iridescent plumage.' },
  { icon:'🌺', title:'22 Official Languages',          desc:'The Constitution recognises 22 languages with hundreds of regional dialects.' },
  { icon:'🌏', title:'4th Largest Economy',            desc:'India surpassed the UK to become the 5th largest economy; projected to be 3rd by 2030.' },
];

function openIncredible() {
  document.getElementById('facts-grid').innerHTML = FACTS.map((f, i) =>
    `<div class="fact-card" style="animation-delay:${i * .035}s">
       <div class="fact-icon">${f.icon}</div>
       <div><div class="fact-title">${f.title}</div><div class="fact-desc">${f.desc}</div></div>
     </div>`
  ).join('');
  overlayInc.classList.remove('hidden');
}
function closeIncredible() { overlayInc.classList.add('hidden'); }
window.closeIncredible = closeIncredible;

btnIncredible.addEventListener('click', openIncredible);
overlayInc.addEventListener('click', e => { if (e.target === overlayInc) closeIncredible(); });

/* ══════════════════════════════════════════════════════════
   KEYBOARD
══════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!modalState.classList.contains('hidden'))  { closeModal(); return; }
    if (!overlayInc.classList.contains('hidden'))  { closeIncredible(); return; }
    if (appMode === 'app')                         { returnToSaver(); }
  }
  if (e.key === 'Enter' && appMode === 'saver') enterApp();
});

console.log(
  '%c DPSI INDIA CORE KIOSK 2.0 [v2 Enhanced] ',
  'background:#FF9933;color:#020205;font-weight:bold;font-size:14px;padding:4px 10px'
);
