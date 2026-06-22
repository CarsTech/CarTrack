'use strict';

/* ═══════════════════════════════════════════════════════
   CarTrack — app.js
   Local-first car maintenance tracker.
   All data persists in localStorage. No server, no auth.
═══════════════════════════════════════════════════════ */

// ─── ACTIVATION ──────────────────────────────────────
const ACTIVATION_CODE = 'DRIVE-SAFE-PRO';
const KEY_ACTIVATED   = 'cartrack_activated';
const KEY_DATA        = 'cartrack_data';

// ─── STATUS THRESHOLDS ───────────────────────────────
const WARN_DAYS = 30;
const WARN_KM   = 1000;

// ─── MAINTENANCE TYPE DEFINITIONS ────────────────────
const LEGAL_TYPES = [
  { key: 'rca',       name: 'RCA Insurance',              category: 'legal' },
  { key: 'casco',     name: 'CASCO Insurance',            category: 'legal' },
  { key: 'itp',       name: 'Technical Inspection (ITP)', category: 'legal' },
  { key: 'rovinieta', name: 'Road Tax (Rovinieta)',        category: 'legal' },
];

const TECHNICAL_TYPES = [
  // Engine
  { key: 'coolant',         name: 'Coolant (Antifreeze)',         group: 'Engine',        intervalKm: 60000, intervalMonths: 36 },
  { key: 'ps_fluid',        name: 'Power Steering Fluid',         group: 'Engine',        intervalKm: 60000, intervalMonths: 36 },
  { key: 'timing_belt',     name: 'Timing Belt',                  group: 'Engine',        intervalKm: 90000, intervalMonths: 60 },
  { key: 'drive_belt',      name: 'Drive Belt / Alternator Belt', group: 'Engine',        intervalKm: 60000, intervalMonths: 48 },
  { key: 'spark_plugs',     name: 'Spark Plugs',                  group: 'Engine',        intervalKm: 30000, intervalMonths: 36 },
  { key: 'ignition_coils',  name: 'Ignition Coils',               group: 'Engine',        intervalKm: 60000, intervalMonths: 60 },
  { key: 'service',         name: 'Manufacturer Service',         group: 'Engine',        intervalKm: null,  intervalMonths: 12 },
  // Filters
  { key: 'oil_change',      name: 'Engine Oil Change',            group: 'Filters',       intervalKm: 10000, intervalMonths: 12 },
  { key: 'oil_filter',      name: 'Oil Filter',                   group: 'Filters',       intervalKm: 10000, intervalMonths: 12 },
  { key: 'air_filter',      name: 'Air Filter',                   group: 'Filters',       intervalKm: 15000, intervalMonths: 12 },
  { key: 'fuel_filter',     name: 'Fuel Filter',                  group: 'Filters',       intervalKm: 30000, intervalMonths: 24 },
  { key: 'cabin_filter',    name: 'Cabin Filter (Pollen)',        group: 'Filters',       intervalKm: 15000, intervalMonths: 12 },
  // Brakes
  { key: 'brake_fluid',     name: 'Brake Fluid',                  group: 'Brakes',        intervalKm: 40000, intervalMonths: 24 },
  { key: 'brake_pads_front',name: 'Front Brake Pads',            group: 'Brakes',        intervalKm: 30000, intervalMonths: 24 },
  { key: 'brake_pads_rear', name: 'Rear Brake Pads',             group: 'Brakes',        intervalKm: 40000, intervalMonths: 24 },
  { key: 'brake_discs',     name: 'Brake Discs',                  group: 'Brakes',        intervalKm: 60000, intervalMonths: 48 },
  // Suspension
  { key: 'shock_absorbers', name: 'Shock Absorbers',              group: 'Suspension',    intervalKm: 80000, intervalMonths: 60 },
  { key: 'stabilizer',      name: 'Stabilizer Bar / End Links',   group: 'Suspension',    intervalKm: 60000, intervalMonths: 48 },
  // Tires & Wheels
  { key: 'summer_tires',    name: 'Summer Tires',                 group: 'Tires & Wheels',intervalKm: 40000, intervalMonths: 48 },
  { key: 'winter_tires',    name: 'Winter Tires',                 group: 'Tires & Wheels',intervalKm: 40000, intervalMonths: 48 },
  { key: 'tire_rotation',   name: 'Tire Rotation',                group: 'Tires & Wheels',intervalKm: 10000, intervalMonths:  6 },
  { key: 'wheel_alignment', name: 'Wheel Alignment & Balancing',  group: 'Tires & Wheels',intervalKm: 10000, intervalMonths: 12 },
  // Electrical
  { key: 'battery',         name: 'Car Battery',                  group: 'Electrical',    intervalKm: null,  intervalMonths: 48 },
  { key: 'light_bulb',      name: 'Light Bulb Replacement',       group: 'Electrical',    intervalKm: null,  intervalMonths: null },
  // Exterior
  { key: 'wiper_blades',    name: 'Windshield Wiper Blades',      group: 'Exterior',      intervalKm: 15000, intervalMonths: 12 },
  { key: 'washer_fluid',    name: 'Windshield Washer Fluid',      group: 'Exterior',      intervalKm: 5000,  intervalMonths:  3 },
  { key: 'car_wash',        name: 'Car Washing & Paint Protection',group: 'Exterior',      intervalKm: 2000,  intervalMonths:  1 },
  // Fluids & General
  { key: 'fluid_check',     name: 'Fluid Checks & Top-offs',      group: 'Fluids',        intervalKm: 10000, intervalMonths:  6 },
  { key: 'tune_up',         name: 'Engine Tune-Up',               group: 'Engine',        intervalKm: 30000, intervalMonths: 24 },
  { key: 'tire_replace',    name: 'Tire Replacement',             group: 'Tires & Wheels',intervalKm: 40000, intervalMonths: 60 },
];

// ─── CAR MAKES & MODELS ───────────────────────────────
const CAR_MAKES_MODELS = {
  'Alfa Romeo':    ['147', '156', '159', 'Giulia', 'Giulietta', 'Stelvio'],
  'Buick':         ['Enclave', 'Encore', 'Encore GX', 'Envision', 'LaCrosse', 'Regal', 'Verano'],
  'Cadillac':      ['ATS', 'CT4', 'CT5', 'CT6', 'Escalade', 'SRX', 'XT4', 'XT5', 'XT6'],
  'Chrysler':      ['300', 'Pacifica', 'Voyager'],
  'Dodge':         ['Challenger', 'Charger', 'Dart', 'Durango', 'Grand Caravan', 'Journey', 'Neon'],
  'GMC':           ['Acadia', 'Canyon', 'Envoy', 'Sierra 1500', 'Sierra 2500', 'Terrain', 'Yukon'],
  'Lincoln':       ['Aviator', 'Continental', 'Corsair', 'MKC', 'MKX', 'MKZ', 'Nautilus', 'Navigator'],
  'Ram':           ['1500', '2500', '3500', 'ProMaster', 'ProMaster City'],
  'Audi':          ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'e-tron'],
  'BMW':           ['Seria 1', 'Seria 2', 'Seria 3', 'Seria 4', 'Seria 5', 'Seria 7', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX'],
  'Chevrolet':     ['Aveo', 'Captiva', 'Cruze', 'Spark', 'Trax'],
  'Citroen':       ['Berlingo', 'C1', 'C2', 'C3', 'C3 Aircross', 'C4', 'C4 Cactus', 'C5', 'C5 Aircross', 'Jumpy', 'Picasso'],
  'Dacia':         ['Dokker', 'Duster', 'Jogger', 'Logan', 'Logan MCV', 'Lodgy', 'Sandero', 'Sandero Stepway', 'Spring'],
  'Fiat':          ['500', '500X', 'Bravo', 'Doblo', 'Ducato', 'Grande Punto', 'Panda', 'Punto', 'Tipo'],
  'Ford':          ['B-Max', 'C-Max', 'EcoSport', 'Fiesta', 'Focus', 'Galaxy', 'Kuga', 'Mondeo', 'Mustang', 'Puma', 'Ranger', 'S-Max', 'Transit'],
  'Honda':         ['Accord', 'Civic', 'CR-V', 'HR-V', 'Jazz'],
  'Hyundai':       ['Bayon', 'Elantra', 'i10', 'i20', 'i30', 'i40', 'IONIQ 5', 'Kona', 'Santa Fe', 'Tucson', 'ix35'],
  'Jeep':          ['Cherokee', 'Compass', 'Grand Cherokee', 'Renegade', 'Wrangler'],
  'Kia':           ['Ceed', 'EV6', 'Niro', 'Picanto', 'ProCeed', 'Rio', 'Sorento', 'Sportage', 'Stonic', 'XCeed'],
  'Land Rover':    ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport'],
  'Lexus':         ['CT', 'ES', 'IS', 'NX', 'RX', 'UX'],
  'Mazda':         ['CX-3', 'CX-30', 'CX-5', 'MX-5', 'Mazda2', 'Mazda3', 'Mazda6'],
  'Mercedes-Benz': ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'S-Class', 'Sprinter', 'Vito'],
  'Mini':          ['Clubman', 'Convertible', 'Countryman', 'Hatch'],
  'Mitsubishi':    ['ASX', 'Colt', 'Eclipse Cross', 'L200', 'Outlander', 'Pajero'],
  'Nissan':        ['Juke', 'Leaf', 'Micra', 'Navara', 'Qashqai', 'X-Trail'],
  'Opel':          ['Adam', 'Agila', 'Astra', 'Corsa', 'Crossland', 'Grandland', 'Insignia', 'Meriva', 'Mokka', 'Vectra', 'Zafira'],
  'Peugeot':       ['2008', '206', '207', '208', '3008', '301', '307', '308', '408', '5008', '508', 'Expert', 'Partner'],
  'Porsche':       ['718', '911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  'Renault':       ['Arkana', 'Captur', 'Clio', 'Espace', 'Fluence', 'Kadjar', 'Kangoo', 'Koleos', 'Laguna', 'Megane', 'Scenic', 'Twingo', 'Zoe'],
  'Seat':          ['Arona', 'Ateca', 'Ibiza', 'Leon', 'Tarraco', 'Toledo'],
  'Skoda':         ['Citigo', 'Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Scala', 'Superb', 'Yeti'],
  'Subaru':        ['Forester', 'Impreza', 'Legacy', 'Outback', 'XV'],
  'Suzuki':        ['Baleno', 'Ignis', 'Jimny', 'S-Cross', 'Swift', 'Vitara'],
  'Tesla':         ['Model 3', 'Model S', 'Model X', 'Model Y'],
  'Toyota':        ['Auris', 'Avensis', 'Aygo', 'C-HR', 'Camry', 'Corolla', 'Hilux', 'Land Cruiser', 'RAV4', 'Supra', 'Yaris', 'Yaris Cross'],
  'Volkswagen':    ['Amarok', 'Arteon', 'Caddy', 'Golf', 'ID.3', 'ID.4', 'Passat', 'Polo', 'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'Touran', 'Transporter', 'Up'],
  'Volvo':         ['C30', 'C40', 'S40', 'S60', 'S80', 'S90', 'V40', 'V60', 'V90', 'XC40', 'XC60', 'XC90'],
};

// ─── IN-MEMORY STATE ──────────────────────────────────
let appData = null;    // loaded from localStorage on init
let currentView = 'dashboard';
let currentCarId = null;
let currentTab = 'reminders';

// ─── HELPERS ──────────────────────────────────────────
function genId() {
  return 'id_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now().toString(36);
}

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getUnit() {
  return (appData && appData.settings && appData.settings.distanceUnit) || 'km';
}

function formatKm(km) {
  if (km == null || km === '') return '—';
  return Number(km).toLocaleString('en-US') + ' ' + getUnit();
}

function daysBetween(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now    = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

function addMonths(dateStr, months) {
  if (!dateStr || !months) return null;
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTypeInfo(typeKey) {
  const legal = LEGAL_TYPES.find(t => t.key === typeKey);
  if (legal) return { ...legal };
  const tech = TECHNICAL_TYPES.find(t => t.key === typeKey);
  if (tech) return { ...tech, category: 'technical' };
  const custom = (appData.customTypes || []).find(t => t.id === typeKey);
  if (custom) return { key: custom.id, name: custom.name, category: 'custom', intervalKm: custom.intervalKm, intervalMonths: custom.intervalMonths };
  return null;
}

// ─── DATA MANAGEMENT ──────────────────────────────────
function defaultData() {
  return {
    schemaVersion: 1,
    cars: [],
    customTypes: [],
    settings: {
      notificationsEnabled: false,
      distanceUnit: 'km',
    },
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(KEY_DATA);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    return migrateData(parsed);
  } catch (e) {
    console.error('[CarTrack] Failed to load data:', e);
    return defaultData();
  }
}

function saveData() {
  try {
    localStorage.setItem(KEY_DATA, JSON.stringify(appData));
    updateDemoBanner();
  } catch (e) {
    console.error('[CarTrack] Failed to save data:', e);
    showToast('Failed to save data. Storage may be full.', 'error');
  }
}

function migrateData(data) {
  // Future schema migrations go here.
  if (!data.schemaVersion) data.schemaVersion = 1;
  if (!data.customTypes)   data.customTypes   = [];
  if (!data.settings)      data.settings      = { notificationsEnabled: false, distanceUnit: 'km' };
  if (!data.settings.distanceUnit || data.settings.distanceUnit === 'mi') data.settings.distanceUnit = 'km';
  if (!data.cars)          data.cars           = [];
  data.cars.forEach(car => {
    if (!car.maintenanceItems) car.maintenanceItems = [];
    if (!car.history)          car.history          = [];
  });
  return data;
}

function getCarById(carId) {
  return appData.cars.find(c => c.id === carId) || null;
}

// ─── REMINDER STATUS CALCULATION ─────────────────────
// Returns { status: 'red'|'yellow'|'green'|'grey', label: string, daysLeft: number|null, kmLeft: number|null }
function calcStatus(item, currentKm) {
  if (!item) return { status: 'grey', label: 'No data', daysLeft: null, kmLeft: null };

  if (item.category === 'legal') {
    if (!item.expiryDate) return { status: 'grey', label: 'Expiry date not set', daysLeft: null, kmLeft: null };
    const days = daysBetween(item.expiryDate);
    let status = 'green';
    if (days < 0)          status = 'red';
    else if (days <= WARN_DAYS) status = 'yellow';
    const label = days < 0
      ? `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`
      : days === 0
        ? 'Expires today!'
        : `Expires in ${days} day${days !== 1 ? 's' : ''}`;
    return { status, label, daysLeft: days, kmLeft: null };
  }

  // Technical or custom
  if (!item.lastDoneDate && item.lastDoneKm == null) {
    if (item.expiryDate) {
      const days = daysBetween(item.expiryDate);
      const status = days < 0 ? 'red' : days <= WARN_DAYS ? 'yellow' : 'green';
      const label = days < 0 ? `Scheduled date passed ${Math.abs(days)}d ago`
                  : days === 0 ? 'Scheduled today!'
                  : `Scheduled in ${days}d`;
      return { status, label, daysLeft: days, kmLeft: null };
    }
    return { status: 'grey', label: 'Not logged yet', daysLeft: null, kmLeft: null };
  }

  const hasKmInterval   = item.intervalKm   != null && item.intervalKm   > 0;
  const hasTimeInterval = item.intervalMonths != null && item.intervalMonths > 0;

  let daysLeft = null;
  let kmLeft   = null;
  let worstStatus = 'green';

  if (hasTimeInterval && item.lastDoneDate) {
    const nextDate = addMonths(item.lastDoneDate, item.intervalMonths);
    daysLeft = daysBetween(nextDate);
    if (daysLeft < 0)             worstStatus = 'red';
    else if (daysLeft <= WARN_DAYS) worstStatus = worst(worstStatus, 'yellow');
  }

  if (hasKmInterval && item.lastDoneKm != null && currentKm != null) {
    const nextKm = item.lastDoneKm + item.intervalKm;
    kmLeft = nextKm - currentKm;
    if (kmLeft < 0)           worstStatus = 'red';
    else if (kmLeft <= WARN_KM) worstStatus = worst(worstStatus, 'yellow');
  }

  const label = buildTechLabel(daysLeft, kmLeft, hasKmInterval, hasTimeInterval, currentKm);
  return { status: worstStatus, label, daysLeft, kmLeft };
}

function worst(a, b) {
  const rank = { grey: 0, green: 1, yellow: 2, red: 3 };
  return rank[a] >= rank[b] ? a : b;
}

function buildTechLabel(daysLeft, kmLeft, hasKm, hasTime, currentKm) {
  const parts = [];
  if (hasTime && daysLeft !== null) {
    if (daysLeft < 0)       parts.push(`${Math.abs(daysLeft)}d overdue`);
    else if (daysLeft === 0) parts.push('Due today');
    else                    parts.push(`${daysLeft}d left`);
  }
  if (hasKm && kmLeft !== null) {
    if (kmLeft < 0)         parts.push(`${formatKm(Math.abs(kmLeft))} km overdue`);
    else if (currentKm != null) parts.push(`next at ${formatKm(currentKm + kmLeft)} km`);
    else                    parts.push(`${formatKm(kmLeft)} km left`);
  } else if (hasKm && currentKm == null) {
    parts.push('Enter car km to track');
  }
  return parts.length ? parts.join(' · ') : 'On schedule';
}

// Returns the worst status string across all maintenance items for a car
function carWorstStatus(car) {
  if (!car.maintenanceItems || car.maintenanceItems.length === 0) return 'grey';
  let worst = 'grey';
  car.maintenanceItems.forEach(item => {
    const { status } = calcStatus(item, car.currentKm);
    if (status === 'red')    worst = 'red';
    else if (status === 'yellow' && worst !== 'red') worst = 'yellow';
    else if (status === 'green'  && worst === 'grey') worst = 'green';
  });
  return worst;
}

function carStatusCounts(car) {
  const counts = { red: 0, yellow: 0, green: 0, grey: 0 };
  (car.maintenanceItems || []).forEach(item => {
    const { status } = calcStatus(item, car.currentKm);
    counts[status]++;
  });
  return counts;
}

// Returns ALL urgent/soon items across ALL cars, sorted worst-first
function getGlobalAlerts() {
  const alerts = [];
  appData.cars.forEach(car => {
    (car.maintenanceItems || []).forEach(item => {
      const { status, label } = calcStatus(item, car.currentKm);
      if (status === 'red' || status === 'yellow') {
        alerts.push({ car, item, status, label });
      }
    });
  });
  alerts.sort((a, b) => {
    const rank = { red: 0, yellow: 1 };
    return rank[a.status] - rank[b.status];
  });
  return alerts;
}

// ─── SIDEBAR ──────────────────────────────────────────
function initSidebar() {
  const app     = document.getElementById('app');
  const overlay = document.getElementById('sidebar-overlay');
  const isDesk  = () => window.innerWidth >= 1024;

  // Toggle button in header
  document.getElementById('btn-sidebar-toggle').addEventListener('click', () => {
    if (isDesk()) {
      app.classList.toggle('sidebar-collapsed');
      localStorage.setItem('sb-collapsed', app.classList.contains('sidebar-collapsed') ? '1' : '');
    } else {
      app.classList.toggle('sidebar-open');
    }
  });

  // Close on overlay click or X button
  overlay.addEventListener('click', () => app.classList.remove('sidebar-open'));
  document.getElementById('btn-sidebar-close').addEventListener('click', () => app.classList.remove('sidebar-open'));

  // Nav items
  document.getElementById('nav-dashboard').addEventListener('click', () => {
    navigateTo('dashboard');
    if (!isDesk()) app.classList.remove('sidebar-open');
  });
  document.getElementById('nav-settings').addEventListener('click', () => {
    navigateTo('settings');
    if (!isDesk()) app.classList.remove('sidebar-open');
  });
  document.getElementById('nav-history').addEventListener('click', () => {
    navigateTo('history');
    if (!isDesk()) app.classList.remove('sidebar-open');
  });
  document.getElementById('nav-calendar').addEventListener('click', () => {
    navigateTo('calendar');
    if (!isDesk()) app.classList.remove('sidebar-open');
  });
  document.getElementById('nav-backup').addEventListener('click', () => {
    navigateTo('backup');
    if (!isDesk()) app.classList.remove('sidebar-open');
  });
  document.getElementById('nav-guide').addEventListener('click', () => {
    navigateTo('guide');
    if (!isDesk()) app.classList.remove('sidebar-open');
  });

  // Restore desktop collapsed state
  if (localStorage.getItem('sb-collapsed')) app.classList.add('sidebar-collapsed');

  document.getElementById('nav-activation').addEventListener('click', () => {
    openActivationModal();
    if (!isDesk()) app.classList.remove('sidebar-open');
  });

  // Version label
  const verEl = document.getElementById('sidebar-version');
  if (verEl && typeof APP_VERSION !== 'undefined') verEl.textContent = 'v' + APP_VERSION;

  updateActivationLabel();
  updateSidebarActive();
}

function updateSidebarActive() {
  ['nav-dashboard', 'nav-settings', 'nav-history', 'nav-calendar', 'nav-backup', 'nav-guide'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const map = { settings: 'nav-settings', history: 'nav-history', calendar: 'nav-calendar', backup: 'nav-backup', guide: 'nav-guide' };
  const activeId = map[currentView] || 'nav-dashboard';
  const el = document.getElementById(activeId);
  if (el) el.classList.add('active');
}

// ─── ROUTER / VIEW SWITCHER ───────────────────────────
function navigateTo(view, carId) {
  const views = ['dashboard', 'car-detail', 'settings', 'history', 'calendar', 'backup', 'guide'];
  views.forEach(v => {
    const el = document.getElementById('view-' + v);
    if (el) el.classList.toggle('hidden', v !== view);
  });

  const btnBack     = document.getElementById('btn-back');
  const btnSettings = document.getElementById('btn-settings');
  const isRoot = view === 'dashboard';
  const isTopLevel = ['guide', 'backup', 'history', 'calendar'].includes(view);

  btnBack.classList.toggle('hidden', isRoot || isTopLevel);
  btnSettings.classList.toggle('hidden', view === 'settings' || isTopLevel);

  currentView = view;
  localStorage.setItem('ct-last-view', view);
  updateSidebarActive();

  if (view === 'dashboard') {
    currentCarId = null;
    renderDashboard();
  } else if (view === 'car-detail' && carId) {
    currentCarId = carId;
    renderCarDetail(carId);
  } else if (view === 'settings') {
    renderSettings();
  } else if (view === 'history') {
    renderAllHistory();
  } else if (view === 'calendar') {
    const now = new Date();
    calViewYear = now.getFullYear(); calViewMonth = now.getMonth(); calViewDay = now.getDate();
    calViewMode = 'weekly';
    renderCalendar();
  } else if (view === 'backup') {
    renderBackup();
  } else if (view === 'guide') {
    renderQuickStart();
  }

  window.scrollTo(0, 0);
}

// ─── DASHBOARD RENDERING ──────────────────────────────
function renderDashboard() {
  const el = document.getElementById('view-dashboard');
  const alerts = getGlobalAlerts();

  let alertHtml = '';
  if (alerts.length > 0) {
    const alertItems = alerts.slice(0, 5).map(a => {
      const carMeta = [a.car.brand, a.car.model].filter(Boolean).join(' · ');
      const carLabel = carMeta ? `${a.car.name} ${carMeta}` : a.car.name;
      return `
        <div class="alert-banner-item alert-${a.status}">
          <span class="alert-banner-icon">${a.status === 'red' ? '🔴' : '🟡'}</span>
          <div class="alert-banner-text">
            <strong>${escHtml(a.item.typeName)}</strong>
            <span>${escHtml(carLabel)} — ${escHtml(a.label)}</span>
          </div>
        </div>
      `;
    }).join('');
    const more = alerts.length > 5 ? `<div class="alert-banner-item alert-yellow" style="font-size:.8125rem;color:#7A4A1A;padding:10px 16px;">+${alerts.length - 5} more alerts — check your cars</div>` : '';
    alertHtml = `<div class="alert-banner">${alertItems}${more}</div>`;
  }

  let carsHtml = '';
  if (appData.cars.length === 0) {
    carsHtml = `
      <div class="empty-state">
        <h3>No cars yet</h3>
        <p>Add your first car to start tracking maintenance.</p>
        <button class="btn btn-primary" onclick="openAddCarModal()">+ Add Car</button>
        <div class="empty-state-divider">or</div>
        <label class="btn btn-secondary" style="cursor:pointer;">
          📥 Import Backup
          <input type="file" accept=".json" style="display:none;" onchange="importData(this)">
        </label>
      </div>
    `;
  } else {
    const cards = appData.cars.map(car => renderCarCard(car)).join('');
    carsHtml = `<div class="cars-grid">${cards}</div>`;
  }

  el.innerHTML = `
    ${alertHtml}
    <div class="page-header">
      <h2>My Cars <span class="help-icon" data-help-title="My Cars" data-help="All your vehicles are listed here. Tap a car to open its reminders and records.<br><br>The colored bar on the left of each card shows the worst reminder status:<br>🔴 <strong>Red</strong> = overdue &nbsp;🟡 <strong>Yellow</strong> = due soon &nbsp;🟢 <strong>Green</strong> = all good">💡</span></h2>
      ${appData.cars.length > 0 ? '<button class="btn btn-primary btn-sm" onclick="openAddCarModal()">+ Add Car</button>' : ''}
    </div>
    <div class="page-body">${carsHtml}</div>
  `;
}

function renderCarCard(car) {
  const counts = carStatusCounts(car);
  const worst  = carWorstStatus(car);

  let badgesHtml = '';
  if (car.maintenanceItems.length === 0) {
    badgesHtml = '<span class="badge badge-grey">No reminders set</span>';
  } else {
    if (counts.red    > 0) badgesHtml += `<span class="badge badge-red">🔴 ${counts.red} urgent</span>`;
    if (counts.yellow > 0) badgesHtml += `<span class="badge badge-yellow">🟡 ${counts.yellow} soon</span>`;
    if (counts.green  > 0) badgesHtml += `<span class="badge badge-green">🟢 ${counts.green} OK</span>`;
  }

  const meta = [car.brand, car.model, car.year].filter(Boolean).join(' · ');

  return `
    <div class="car-card" onclick="navigateTo('car-detail', '${escHtml(car.id)}')">
      <div class="car-card-status-bar ${worst}"></div>
      <div class="car-card-body">
        <div class="car-card-header">
          <div class="car-card-name">${escHtml(car.name)}${car.plate ? ` <span class="car-plate-tag">${escHtml(car.plate)}</span>` : ''}</div>
          <div class="car-card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></div>
        </div>
        ${meta ? `<div class="car-card-meta">${escHtml(meta)}</div>` : ''}
        ${car.currentKm != null ? `<div class="car-card-km"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>${formatKm(car.currentKm)}</div>` : ''}
        <div class="car-card-badges">${badgesHtml}</div>
      </div>
    </div>
  `;
}

// ─── CAR DETAIL RENDERING ─────────────────────────────
function renderCarDetail(carId) {
  const car = getCarById(carId);
  if (!car) { navigateTo('dashboard'); return; }

  const el = document.getElementById('view-car-detail');
  const meta = [car.brand, car.model, car.year].filter(Boolean).join(' · ');
  const vinHtml = car.vin ? `<div class="car-detail-vin">VIN: <span>${escHtml(car.vin)}</span></div>` : '';

  const kmHtml = `
    <div class="car-detail-km-row" id="km-display-area">
      ${car.currentKm != null
        ? `<div class="km-display">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
             ${formatKm(car.currentKm)}
           </div>`
        : '<span style="opacity:.65;font-size:.875rem;">Mileage not set</span>'
      }
      <button class="btn-edit-km" onclick="showKmEdit('${escHtml(carId)}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        ${car.currentKm != null ? 'Update km' : 'Set km'}
      </button>
    </div>
  `;

  el.innerHTML = `
    <div class="car-detail-hero">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div style="flex:1;min-width:0;">
          <div class="car-detail-name">${escHtml(car.name)}${car.plate ? ` <span class="car-plate-tag car-plate-tag--hero">${escHtml(car.plate)}</span>` : ''}</div>
          ${meta ? `<div class="car-detail-meta">${escHtml(meta)}</div>` : ''}
          ${vinHtml}
        </div>
        <button class="btn btn-sm" style="background:rgba(255,255,255,.15);color:white;border:1.5px solid rgba(255,255,255,.3);flex-shrink:0;" onclick="openEditCarModal('${escHtml(carId)}')">
          Edit
        </button>
      </div>
      ${kmHtml}
    </div>

    <div class="tabs">
      <button class="tab-btn ${currentTab === 'reminders' ? 'active' : ''}" onclick="switchTab('reminders')">
        Reminders ${car.maintenanceItems.length > 0 ? `(${car.maintenanceItems.length})` : ''}
      </button>
      <button class="tab-btn ${currentTab === 'history' ? 'active' : ''}" onclick="switchTab('history')">
        Records ${car.history.length > 0 ? `(${car.history.length})` : ''}
      </button>
    </div>

    <div id="tab-reminders" class="tab-content ${currentTab === 'reminders' ? 'active' : ''}">
      ${renderRemindersTab(car)}
    </div>
    <div id="tab-history" class="tab-content ${currentTab === 'history' ? 'active' : ''}">
      ${renderHistoryTab(car)}
    </div>

    <button class="fab" onclick="openLogMaintenanceModal('${escHtml(carId)}', null)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      Add Record
    </button>
  `;
}

function renderRemindersTab(car) {
  if (!car.maintenanceItems || car.maintenanceItems.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No reminders yet</h3>
        <p>Log your first maintenance to set up automatic reminders.</p>
      </div>
    `;
  }

  const sorted = [...car.maintenanceItems].sort((a, b) => {
    const rank = { red: 0, yellow: 1, green: 2, grey: 3 };
    const sa = calcStatus(a, car.currentKm);
    const sb = calcStatus(b, car.currentKm);
    if (rank[sa.status] !== rank[sb.status]) return rank[sa.status] - rank[sb.status];
    // Within same status, sort by days left ascending
    const da = sa.daysLeft != null ? sa.daysLeft : 9999;
    const db = sb.daysLeft != null ? sb.daysLeft : 9999;
    return da - db;
  });

  const items = sorted.map(item => {
    const { status, label } = calcStatus(item, car.currentKm);
    return `
      <div class="reminder-item">
        <div class="reminder-item-bar ${status}"></div>
        <div class="reminder-item-body">
          <div class="reminder-status-dot ${status}"></div>
          <div class="reminder-info">
            <div class="reminder-name">${escHtml(item.typeName)}</div>
            <div class="reminder-due ${status === 'red' || status === 'yellow' ? status : ''}">${escHtml(label)}</div>
          </div>
          <div class="reminder-actions">
            <button class="btn-icon" title="Log service" onclick="openLogMaintenanceModal('${escHtml(car.id)}', '${escHtml(item.id)}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <button class="btn-icon danger" title="Delete reminder" onclick="confirmDeleteReminder('${escHtml(car.id)}', '${escHtml(item.id)}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="section-header">
      <h3>Active Reminders <span class="help-icon" data-help-title="Active Reminders" data-help="Reminders are calculated automatically from your records and the km/time intervals for each maintenance type.<br><br>🔴 <strong>Red</strong> — Overdue by date or km<br>🟡 <strong>Yellow</strong> — Due within 30 days or 1,000 km<br>🟢 <strong>Green</strong> — On track<br>⚫ <strong>Grey</strong> — Not logged yet<br><br>Tap <strong>+</strong> next to a reminder to log a new service for it.">💡</span></h3>
    </div>
    <div class="reminder-list">${items}</div>
  `;
}

function renderHistoryTab(car) {
  if (!car.history || car.history.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h3>No records yet</h3>
        <p>Tap "+ Add Record" to add your first record.</p>
      </div>
    `;
  }

  const sorted = [...car.history].sort((a, b) => {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return 0;
  });

  const items = sorted.map(entry => `
    <div class="history-item">
      <div class="history-item-header">
        <div class="history-item-name">${escHtml(entry.typeName)}</div>
        <div class="history-item-actions">
          <button class="btn-icon" title="Edit" onclick="openEditHistoryModal('${escHtml(car.id)}', '${escHtml(entry.id)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon danger" title="Delete" onclick="confirmDeleteHistory('${escHtml(car.id)}', '${escHtml(entry.id)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
      <div class="history-item-meta">
        <span>📅 ${formatDate(entry.date)}</span>
        ${entry.km != null ? `<span>🔢 ${formatKm(entry.km)}</span>` : ''}
        ${entry.category === 'legal' && entry.expiryDate ? `<span>⏳ Expires: ${formatDate(entry.expiryDate)}</span>` : ''}
      </div>
      ${entry.notes ? `<div class="history-item-notes">${escHtml(entry.notes)}</div>` : ''}
    </div>
  `).join('');

  return `
    <div class="section-header">
      <h3>Records <span class="help-icon" data-help-title="Records" data-help="All maintenance records for this car, sorted from most recent to oldest.<br><br>Each record shows the service type, date, mileage, and any notes you added.<br><br>Tap the <strong>pencil icon</strong> to edit a record, or the <strong>trash icon</strong> to delete it.">💡</span></h3>
    </div>
    <div class="history-list">${items}</div>
  `;
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('onclick').includes(`'${tab}'`)) btn.classList.add('active');
  });
  const tc = document.getElementById('tab-' + tab);
  if (tc) tc.classList.add('active');
}

// ─── INLINE KM EDIT ───────────────────────────────────
function showKmEdit(carId) {
  const car = getCarById(carId);
  if (!car) return;
  const area = document.getElementById('km-display-area');
  if (!area) return;
  area.innerHTML = `
    <form class="inline-edit-form" onsubmit="saveKm(event, '${escHtml(carId)}')">
      <input type="number" id="km-input" value="${car.currentKm != null ? car.currentKm : ''}" placeholder="e.g. 85000" min="0" max="9999999" inputmode="numeric">
      <button type="submit" class="btn-save-km">Save</button>
      <button type="button" class="btn-cancel-km" onclick="renderCarDetail('${escHtml(carId)}')">Cancel</button>
    </form>
  `;
  document.getElementById('km-input').focus();
}

function saveKm(e, carId) {
  e.preventDefault();
  const car = getCarById(carId);
  if (!car) return;
  const val = parseInt(document.getElementById('km-input').value, 10);
  if (isNaN(val) || val < 0) { showToast('Please enter a valid mileage.', 'error'); return; }
  car.currentKm = val;
  saveData();
  renderCarDetail(carId);
  showToast('Mileage updated.', 'success');
}

// ─── ALL HISTORY PAGE ─────────────────────────────────
function _collectAllRecords() {
  const CAR_PALETTE = ['#1E3A5F','#2D7D32','#6A1B9A','#B71C1C','#E65100','#006064','#4527A0','#00695C'];
  const records = [];
  (appData.cars || []).forEach((car, carIdx) => {
    const carName  = car.name || car.brand || 'Car';
    const carMeta  = [car.brand, car.model].filter(Boolean).join(' · ');
    const carColor = CAR_PALETTE[carIdx % CAR_PALETTE.length];
    const currentKm = car.currentKm != null ? car.currentKm : null;

    // Done — history entries
    (car.history || []).forEach(entry => {
      records.push({
        _id:           entry.id,
        carId:         car.id,
        carName,
        carMeta,
        carColor,
        typeName:      entry.typeName,
        category:      entry.category || 'technical',
        status:        'done',
        date:          entry.date,
        km:            entry.km,
        expiryDate:    entry.expiryDate,
        notes:         entry.notes,
        priority:      entry.priority || null,
        _historyId:    entry.id,
        _sourceItemId: entry._sourceItemId || null,
      });
    });

    // Planned / Overdue — hide items that have a Done history entry today (by item ID)
    const todayStr = new Date().toISOString().slice(0, 10);
    const doneItemIdsToday = new Set(
      (car.history || []).filter(h => h.date === todayStr && h._sourceItemId).map(h => h._sourceItemId)
    );
    (car.maintenanceItems || []).forEach(item => {
      const s = calcStatus(item, currentKm);
      if (s.status === 'green') return;
      if (doneItemIdsToday.has(item.id)) return;
      const itemStatus = s.status === 'red' ? 'overdue' : 'planned';
      records.push({
        _id:        item.id,
        carId:      car.id,
        carName,
        carMeta,
        carColor,
        typeName:   item.typeName,
        category:   item.category || 'technical',
        status:     itemStatus,
        statusLabel: s.label,
        date:       item.lastDoneDate || null,
        km:         item.lastDoneKm  != null ? item.lastDoneKm : null,
        expiryDate: item.expiryDate  || null,
        notes:      null,
        priority:   item.priority || null,
        _itemId:    item.id,
      });
    });
  });
  return records;
}

function renderAllHistory() {
  const el = document.getElementById('view-history');
  const all = _collectAllRecords();

  const cars  = (appData.cars || []).map(c => ({ id: c.id, name: c.nickname || c.brand || 'Car' }));
  const doneYears = [...new Set(all.filter(e => e.date).map(e => e.date.slice(0, 4)))].sort().reverse();
  const months = [
    { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' },
    { v: '04', l: 'April' },   { v: '05', l: 'May' },      { v: '06', l: 'June' },
    { v: '07', l: 'July' },    { v: '08', l: 'August' },   { v: '09', l: 'September' },
    { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' },
  ];

  const carOpts   = cars.map(c => `<option value="${escHtml(c.id)}">${escHtml(c.name)}</option>`).join('');
  const yearOpts  = doneYears.map(y => `<option value="${y}">${y}</option>`).join('');
  const monthOpts = months.map(m => `<option value="${m.v}">${m.l}</option>`).join('');

  const firstCarId = appData.cars && appData.cars.length > 0 ? appData.cars[0].id : null;
  el.innerHTML = `
    <div class="page-header">
      <h2>📋 Records</h2>
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="ah-total" id="rf-count">${all.length} records</span>
        <button class="btn btn-secondary btn-sm" onclick="window.print()" title="Print records">🖨 Print</button>
        ${firstCarId ? `<button class="btn btn-primary btn-sm" onclick="openAddRecordOnDate(null)">+ Add Record</button>` : ''}
      </div>
    </div>
    <div class="rf-bar">
      <span class="rf-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
        Filters:
      </span>
      <button class="rf-pill rf-all active" id="rf-all" onclick="clearRecordFilters()">All</button>
      <select class="rf-select" id="rf-status" onchange="applyRecordFilters()">
        <option value="">All Statuses</option>
        <option value="planned">Planned</option>
        <option value="done">Done</option>
        <option value="overdue">Overdue</option>
      </select>
      <select class="rf-select" id="rf-car" onchange="applyRecordFilters()">
        <option value="">All Cars</option>${carOpts}
      </select>
      <select class="rf-select" id="rf-category" onchange="applyRecordFilters()">
        <option value="">All Types</option>
        <option value="technical">Technical</option>
        <option value="legal">Legal</option>
        <option value="custom">Custom</option>
      </select>
      <select class="rf-select" id="rf-month" onchange="applyRecordFilters()">
        <option value="">All Months</option>${monthOpts}
      </select>
      <select class="rf-select" id="rf-year" onchange="applyRecordFilters()">
        <option value="">All Years</option>${yearOpts}
      </select>
    </div>
    <div class="ah-body" id="rf-list"></div>`;

  applyRecordFilters();
}

// ─── CALENDAR VIEW ────────────────────────────────────
let calViewYear  = new Date().getFullYear();
let calViewMonth = new Date().getMonth();
let calViewDay   = new Date().getDate();
let calViewMode  = 'weekly';

function setCalMode(mode) {
  calViewMode = mode;
  renderCalendar();
}

function buildCalendarEventMap() {
  const map = {};
  function add(dateStr, ev) {
    if (!dateStr) return;
    if (!map[dateStr]) map[dateStr] = [];
    map[dateStr].push(ev);
  }
  appData.cars.forEach(car => {
    const carName = car.name || car.brand || 'Car';
    (car.history || []).forEach(entry => {
      if (entry.date) add(entry.date, { typeName: entry.typeName, carName, status: 'done', carId: car.id });
    });
    (car.maintenanceItems || []).forEach(item => {
      const s = calcStatus(item, car.currentKm);
      if (s.status === 'grey') return;
      let dueDate = item.expiryDate || null;
      if (!dueDate && item.lastDoneDate && item.intervalMonths) {
        const d = new Date(item.lastDoneDate);
        d.setMonth(d.getMonth() + item.intervalMonths);
        dueDate = d.toISOString().slice(0, 10);
      }
      if (!dueDate) return;
      const todayStr = new Date().toISOString().slice(0, 10);
      add(dueDate, { typeName: item.typeName, carName, status: dueDate < todayStr ? 'overdue' : 'planned', carId: car.id });
    });
  });
  return map;
}

function _calModeTabs() {
  return `<div class="cal-mode-tabs">
    <button class="cal-mode-btn${calViewMode==='daily'?' active':''}" onclick="setCalMode('daily')">Day</button>
    <button class="cal-mode-btn${calViewMode==='weekly'?' active':''}" onclick="setCalMode('weekly')">Week</button>
    <button class="cal-mode-btn${calViewMode==='monthly'?' active':''}" onclick="setCalMode('monthly')">Month</button>
    <button class="cal-mode-btn${calViewMode==='yearly'?' active':''}" onclick="setCalMode('yearly')">Year</button>
  </div>`;
}

function renderCalendar() {
  if (calViewMode === 'daily')  return _renderCalDaily();
  if (calViewMode === 'weekly') return _renderCalWeekly();
  if (calViewMode === 'yearly') return _renderCalYearly();
  _renderCalMonthly();
}

function _renderCalMonthly() {
  const el = document.getElementById('view-calendar');
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const year  = calViewYear;
  const month = calViewMonth;
  const eventMap = buildCalendarEventMap();
  const todayStr = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay();
  if (startDow === 0) startDow = 7;
  startDow--;

  const totalCells = Math.ceil((lastDay.getDate() + startDow) / 7) * 7;
  const cells = [];
  for (let i = 0; i < totalCells; i++) cells.push(new Date(year, month, i - startDow + 1));

  const headerHtml = DAY_NAMES.map(d => `<div class="cal-header-cell">${d}</div>`).join('');
  const gridHtml = cells.map(d => {
    const dStr    = d.toISOString().slice(0, 10);
    const isToday = dStr === todayStr;
    const isOther = d.getMonth() !== month;
    const isWknd  = d.getDay() === 0 || d.getDay() === 6;
    const evs     = eventMap[dStr] || [];
    const dots    = evs.slice(0, 3).map(ev => {
      const cls = ev.status === 'overdue' ? 'cal-dot--overdue'
                : ev.status === 'done'    ? 'cal-dot--done'
                : 'cal-dot--planned';
      return `<span class="cal-dot ${cls}" title="${escHtml(ev.typeName + ' · ' + ev.carName)}"></span>`;
    }).join('');
    const more = evs.length > 3 ? `<span class="cal-more">+${evs.length - 3}</span>` : '';
    return `<div class="cal-cell${isToday?' cal-cell--today':''}${isOther?' cal-cell--other':''}${isWknd?' cal-cell--weekend':''}" onclick="selectCalDay('${dStr}')">
      <div class="cal-cell-num">${d.getDate()}</div>
      <div class="cal-cell-dots">${dots}${more}</div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="cal-topbar">
      <div class="page-header" style="margin-bottom:0;"><h2>📅 Calendar</h2></div>
      ${_calModeTabs()}
      <div class="cal-nav">
        <button class="cal-nav-btn" onclick="calPrev()">❮ Prev</button>
        <span class="cal-nav-title">${MONTH_NAMES[month]} ${year}</span>
        <button class="cal-nav-btn" onclick="calNext()">Next ❯</button>
      </div>
    </div>
    <div class="cal-grid-wrapper">
      <div class="cal-grid">${headerHtml}${gridHtml}</div>
    </div>
    <div class="cal-day-detail" id="cal-day-detail" style="display:none;"></div>`;
}

function _renderCalDaily() {
  const el = document.getElementById('view-calendar');
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAY_FULL    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const eventMap    = buildCalendarEventMap();
  const d           = new Date(calViewYear, calViewMonth, calViewDay);
  const dateStr     = d.toISOString().slice(0, 10);
  const todayStr    = new Date().toISOString().slice(0, 10);
  const title       = `${DAY_FULL[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  const evs         = eventMap[dateStr] || [];

  const evHtml = evs.length === 0
    ? `<div class="cal-empty">No records for this day.</div>`
    : evs.map(ev => {
        const borderCls = ev.status === 'overdue' ? 'cal-detail--overdue'
                        : ev.status === 'done'    ? 'cal-detail--done'
                        : 'cal-detail--planned';
        const badge = ev.status === 'overdue' ? `<span class="rf-badge rf-badge--overdue">Overdue</span>`
                    : ev.status === 'done'    ? `<span class="rf-badge rf-badge--done">Done</span>`
                    : `<span class="rf-badge rf-badge--planned">Planned</span>`;
        return `<div class="cal-detail-item ${borderCls}">
          <div class="cal-detail-type">${escHtml(ev.typeName)} ${badge}</div>
          <div class="cal-detail-car">${escHtml(ev.carName)}</div>
        </div>`;
      }).join('');

  el.innerHTML = `
    <div class="cal-topbar">
      <div class="page-header" style="margin-bottom:0;"><h2>📅 Calendar</h2></div>
      ${_calModeTabs()}
      <div class="cal-nav">
        <button class="cal-nav-btn" onclick="calPrev()">❮ Prev</button>
        <span class="cal-nav-title">${dateStr === todayStr ? 'Today' : `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`}</span>
        <button class="cal-nav-btn" onclick="calNext()">Next ❯</button>
      </div>
    </div>
    <div class="cal-daily-view">
      <div class="cal-daily-header">
        <span class="cal-daily-title">${title}${dateStr === todayStr ? ' <span class="cal-today-badge">Today</span>' : ''}</span>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordOnDate('${dateStr}')">+ Add Record</button>
      </div>
      <div class="cal-daily-events">${evHtml}</div>
    </div>`;
}

function _renderCalWeekly() {
  const el = document.getElementById('view-calendar');
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAY_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const eventMap    = buildCalendarEventMap();
  const todayStr    = new Date().toISOString().slice(0, 10);

  const anchor = new Date(calViewYear, calViewMonth, calViewDay);
  let dow = anchor.getDay(); if (dow === 0) dow = 7;
  const monday = new Date(calViewYear, calViewMonth, calViewDay - (dow - 1));

  const days = Array.from({length: 7}, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const sm = days[0].getMonth(), em = days[6].getMonth(), fy = days[0].getFullYear();
  const titleStr = sm === em
    ? `${MONTH_NAMES[sm]} ${days[0].getDate()}–${days[6].getDate()}, ${fy}`
    : `${days[0].getDate()} ${MONTH_NAMES[sm]} – ${days[6].getDate()} ${MONTH_NAMES[em]}, ${fy}`;

  const colsHtml = days.map((d, i) => {
    const dStr    = d.toISOString().slice(0, 10);
    const isToday = dStr === todayStr;
    const isWknd  = i >= 5;
    const evs     = eventMap[dStr] || [];
    const evItems = evs.map(ev => {
      const cls = ev.status === 'overdue' ? 'cal-detail--overdue'
                : ev.status === 'done'    ? 'cal-detail--done'
                : 'cal-detail--planned';
      return `<div class="cal-week-event ${cls}" onclick="event.stopPropagation();calViewYear=${d.getFullYear()};calViewMonth=${d.getMonth()};calViewDay=${d.getDate()};setCalMode('daily')" title="${escHtml(ev.typeName+' · '+ev.carName)}">${escHtml(ev.typeName)}</div>`;
    }).join('');
    return `<div class="cal-week-col${isToday?' cal-week-col--today':''}${isWknd?' cal-week-col--weekend':''}"
        onclick="calViewYear=${d.getFullYear()};calViewMonth=${d.getMonth()};calViewDay=${d.getDate()};setCalMode('daily')">
      <div class="cal-week-col-header">
        <span class="cal-week-day-label">${DAY_SHORT[i]}</span>
        <span class="cal-week-num${isToday?' cal-week-num--today':''}">${d.getDate()}</span>
      </div>
      <div class="cal-week-events">${evItems || '<div class="cal-week-empty"></div>'}</div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="cal-topbar">
      <div class="page-header" style="margin-bottom:0;"><h2>📅 Calendar</h2></div>
      ${_calModeTabs()}
      <div class="cal-nav">
        <button class="cal-nav-btn" onclick="calPrev()">❮ Prev</button>
        <span class="cal-nav-title">${titleStr}</span>
        <button class="cal-nav-btn" onclick="calNext()">Next ❯</button>
      </div>
    </div>
    <div class="cal-week-grid">${colsHtml}</div>`;
}

function _renderCalYearly() {
  const el = document.getElementById('view-calendar');
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAY_MIN     = ['M','T','W','T','F','S','S'];
  const eventMap    = buildCalendarEventMap();
  const todayStr    = new Date().toISOString().slice(0, 10);

  const monthsHtml = Array.from({length: 12}, (_, mi) => {
    const firstDay = new Date(calViewYear, mi, 1);
    const lastDay  = new Date(calViewYear, mi + 1, 0);
    let startDow = firstDay.getDay(); if (startDow === 0) startDow = 7; startDow--;
    const totalCells = Math.ceil((lastDay.getDate() + startDow) / 7) * 7;
    const cells = Array.from({length: totalCells}, (_, i) => new Date(calViewYear, mi, i - startDow + 1));

    let monthTotal = 0;
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dStr = `${calViewYear}-${String(mi+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      monthTotal += (eventMap[dStr] || []).length;
    }

    const hdr = DAY_MIN.map(dl => `<span class="cal-mini-hcell">${dl}</span>`).join('');
    const dayCells = cells.map(cd => {
      const dStr    = cd.toISOString().slice(0, 10);
      const isOther = cd.getMonth() !== mi;
      const isToday = dStr === todayStr;
      const evs     = isOther ? [] : (eventMap[dStr] || []);
      const hasOverdue = evs.some(e => e.status === 'overdue');
      const hasPlanned = evs.some(e => e.status === 'planned');
      const hasDone    = evs.some(e => e.status === 'done');
      const dotCls  = hasOverdue ? 'cal-dot--overdue' : hasPlanned ? 'cal-dot--planned' : hasDone ? 'cal-dot--done' : '';
      return `<span class="cal-mini-cell${isToday?' cal-mini-cell--today':''}${isOther?' cal-mini-cell--other':''}"
        onclick="event.stopPropagation();calViewYear=${cd.getFullYear()};calViewMonth=${cd.getMonth()};calViewDay=${cd.getDate()};setCalMode('daily')"
        >${isOther ? '' : cd.getDate()}${evs.length && !isOther ? `<span class="cal-mini-dot ${dotCls}"></span>` : ''}</span>`;
    }).join('');

    return `<div class="cal-year-month" onclick="calViewMonth=${mi};setCalMode('monthly')">
      <div class="cal-year-month-name">${MONTH_NAMES[mi]}</div>
      <div class="cal-mini-grid">${hdr}${dayCells}</div>
      ${monthTotal > 0 ? `<div class="cal-year-month-count">${monthTotal} event${monthTotal !== 1 ? 's' : ''}</div>` : ''}
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="cal-topbar">
      <div class="page-header" style="margin-bottom:0;"><h2>📅 Calendar</h2></div>
      ${_calModeTabs()}
      <div class="cal-nav">
        <button class="cal-nav-btn" onclick="calPrev()">❮ Prev</button>
        <span class="cal-nav-title">${calViewYear}</span>
        <button class="cal-nav-btn" onclick="calNext()">Next ❯</button>
      </div>
    </div>
    <div class="cal-year-grid">${monthsHtml}</div>`;
}

function calPrev() {
  if (calViewMode === 'daily') {
    const d = new Date(calViewYear, calViewMonth, calViewDay - 1);
    calViewYear = d.getFullYear(); calViewMonth = d.getMonth(); calViewDay = d.getDate();
  } else if (calViewMode === 'weekly') {
    const d = new Date(calViewYear, calViewMonth, calViewDay - 7);
    calViewYear = d.getFullYear(); calViewMonth = d.getMonth(); calViewDay = d.getDate();
  } else if (calViewMode === 'monthly') {
    calViewMonth--; if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
  } else {
    calViewYear--;
  }
  renderCalendar();
}

function calNext() {
  if (calViewMode === 'daily') {
    const d = new Date(calViewYear, calViewMonth, calViewDay + 1);
    calViewYear = d.getFullYear(); calViewMonth = d.getMonth(); calViewDay = d.getDate();
  } else if (calViewMode === 'weekly') {
    const d = new Date(calViewYear, calViewMonth, calViewDay + 7);
    calViewYear = d.getFullYear(); calViewMonth = d.getMonth(); calViewDay = d.getDate();
  } else if (calViewMode === 'monthly') {
    calViewMonth++; if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
  } else {
    calViewYear++;
  }
  renderCalendar();
}

function selectCalDay(dateStr) {
  const evs = (buildCalendarEventMap()[dateStr] || []);
  document.querySelectorAll('.cal-cell--selected').forEach(c => c.classList.remove('cal-cell--selected'));
  document.querySelectorAll('.cal-cell').forEach(c => {
    if (c.getAttribute('onclick') && c.getAttribute('onclick').includes(dateStr)) c.classList.add('cal-cell--selected');
  });
  const el = document.getElementById('cal-day-detail');
  if (!el) return;
  const [y, m, d] = dateStr.split('-');
  const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const title = `${parseInt(d)} ${MO[parseInt(m) - 1]} ${y}`;
  if (evs.length === 0) {
    el.style.display = '';
    el.innerHTML = `
      <div class="cal-detail-header">
        <strong>${title}</strong>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn btn-primary btn-sm" onclick="openAddRecordOnDate('${dateStr}')">+ Add Record</button>
          <button class="cal-detail-close" onclick="document.getElementById('cal-day-detail').style.display='none'">×</button>
        </div>
      </div>
      <div style="padding:16px;color:var(--text-secondary);font-size:.875rem;">No records for this day.</div>`;
    return;
  }
  const items = evs.map(ev => {
    const borderCls = ev.status === 'overdue' ? 'cal-detail--overdue'
                    : ev.status === 'done'    ? 'cal-detail--done'
                    : 'cal-detail--planned';
    const badge = ev.status === 'overdue' ? `<span class="rf-badge rf-badge--overdue">Overdue</span>`
                : ev.status === 'done'    ? `<span class="rf-badge rf-badge--done">Done</span>`
                : `<span class="rf-badge rf-badge--planned">Planned</span>`;
    return `<div class="cal-detail-item ${borderCls}">
      <div class="cal-detail-type">${escHtml(ev.typeName)} ${badge}</div>
      <div class="cal-detail-car">${escHtml(ev.carName)}</div>
    </div>`;
  }).join('');
  el.style.display = '';
  el.innerHTML = `
    <div class="cal-detail-header">
      <strong>${title}</strong>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="btn btn-primary btn-sm" onclick="openAddRecordOnDate('${dateStr}')">+ Add Record</button>
        <button class="cal-detail-close" onclick="document.getElementById('cal-day-detail').style.display='none'">×</button>
      </div>
    </div>
    <div class="cal-detail-list">${items}</div>`;
}

function openAddRecordOnDate(dateStr) {
  if (!appData.cars || appData.cars.length === 0) {
    showToast('Add a car first.', 'error');
    return;
  }
  if (appData.cars.length === 1) {
    openLogMaintenanceModal(appData.cars[0].id, null, dateStr);
    return;
  }
  // Multiple cars — show picker
  const opts = appData.cars.map(c =>
    `<button class="btn btn-secondary" style="width:100%;margin-bottom:8px;" onclick="closeModal();openLogMaintenanceModal('${escHtml(c.id)}',null,'${dateStr}')">${escHtml(c.name || c.brand || 'Car')}</button>`
  ).join('');
  openModal(`
    <div class="modal-header">
      <h2>Pick a Car</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">${opts}</div>
  `);
}

function applyRecordFilters() {
  const statusVal = document.getElementById('rf-status')?.value   || '';
  const carVal    = document.getElementById('rf-car')?.value      || '';
  const catVal    = document.getElementById('rf-category')?.value || '';
  const monVal    = document.getElementById('rf-month')?.value    || '';
  const yearVal   = document.getElementById('rf-year')?.value     || '';
  const anyActive = statusVal || carVal || catVal || monVal || yearVal;

  // All pill active only when no filter selected
  const allBtn = document.getElementById('rf-all');
  if (allBtn) allBtn.classList.toggle('active', !anyActive);

  // Active pill styling on selects
  ['rf-status', 'rf-car', 'rf-category', 'rf-month', 'rf-year'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.classList.toggle('rf-active', !!sel.value);
  });

  const all = _collectAllRecords();
  const filtered = all.filter(e => {
    if (statusVal && e.status !== statusVal)                        return false;
    if (carVal    && e.carId  !== carVal)                           return false;
    if (catVal    && e.category !== catVal)                         return false;
    if (yearVal   && (!e.date || !e.date.startsWith(yearVal)))      return false;
    if (monVal    && (!e.date || e.date.slice(5, 7) !== monVal))    return false;
    return true;
  });

  const countEl = document.getElementById('rf-count');
  if (countEl) countEl.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;

  const listEl = document.getElementById('rf-list');
  if (!listEl) return;

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="empty-state" style="padding:40px 0;">
      <div class="empty-state-icon">🔍</div><h3>No records found</h3>
      <p>Try changing or clearing the filters.</p></div>`;
    return;
  }

  // Sort: overdue first, then planned, then done — within each group newest first
  const statusRank = { overdue: 0, planned: 1, done: 2 };
  filtered.sort((a, b) => {
    const ra = statusRank[a.status] ?? 2;
    const rb = statusRank[b.status] ?? 2;
    if (ra !== rb) return ra - rb;
    const da = a.date || a.expiryDate || '';
    const db = b.date || b.expiryDate || '';
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da < db ? 1 : -1;
  });

  function renderItem(entry) {
    const borderCls = entry.status === 'overdue' ? 'ah-item--overdue'
                    : entry.status === 'planned' ? 'ah-item--planned'
                    : entry.category === 'legal' ? 'ah-item--legal'
                    : 'ah-item--tech';
    const statusBadge = entry.status === 'done'    ? `<span class="rf-badge rf-badge--done">Done</span>`
                      : entry.status === 'overdue' ? `<span class="rf-badge rf-badge--overdue">Overdue</span>`
                      : `<span class="rf-badge rf-badge--planned">Planned</span>`;
    const editSvg   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const deleteSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
    let actionBtns;
    if (entry.status === 'done') {
      actionBtns = `
        <button class="btn-icon" title="Edit" onclick="openEditHistoryModal('${escHtml(entry.carId)}','${escHtml(entry._historyId)}')">${editSvg}</button>
        <button class="btn-icon danger" title="Delete" onclick="confirmDeleteHistory('${escHtml(entry.carId)}','${escHtml(entry._historyId)}')">${deleteSvg}</button>`;
    } else {
      const doneAction = entry.category === 'legal'
        ? `openLogMaintenanceModal('${escHtml(entry.carId)}','${escHtml(entry._itemId)}')`
        : `quickMarkDone('${escHtml(entry.carId)}','${escHtml(entry._itemId)}')`;
      actionBtns = `
        <button class="btn-record-toggle btn-record-done" title="Mark as done" onclick="${doneAction}">✓ Done</button>
        <button class="btn-icon" title="Edit" onclick="openLogMaintenanceModal('${escHtml(entry.carId)}','${escHtml(entry._itemId)}')">${editSvg}</button>
        <button class="btn-icon danger" title="Delete" onclick="confirmDeleteReminder('${escHtml(entry.carId)}','${escHtml(entry._itemId)}')">${deleteSvg}</button>`;
    }

    const priorityBadge = entry.priority === 'high'   ? `<span class="ah-priority ah-priority--high">↑ High</span>`
                        : entry.priority === 'medium' ? `<span class="ah-priority ah-priority--medium">→ Medium</span>`
                        : entry.priority === 'low'    ? `<span class="ah-priority ah-priority--low">↓ Low</span>`
                        : '';

    return `
      <div class="ah-item ${borderCls}">
        <div class="ah-item-left">
          <div class="ah-item-type">${escHtml(entry.typeName)} ${statusBadge} <span class="ah-car-tag" style="background:${entry.carColor || '#1E3A5F'}">${escHtml(entry.carName)}${entry.carMeta ? `<span class="ah-car-tag-meta"> ${escHtml(entry.carMeta)}</span>` : ''}</span>${priorityBadge}</div>
          <div class="ah-item-meta">
            ${entry.date ? `<span>📅 ${formatDate(entry.date)}</span>` : ''}
            ${entry.km != null ? `<span>🔢 ${formatKm(entry.km)}</span>` : ''}
            ${entry.expiryDate ? `<span>⏳ ${entry.status === 'done' ? 'Expires' : ''} ${formatDate(entry.expiryDate)}</span>` : ''}
            ${entry.statusLabel ? `<span class="ah-status-label">${escHtml(entry.statusLabel)}</span>` : ''}
          </div>
          ${entry.notes ? `<div class="ah-item-notes">${escHtml(entry.notes)}</div>` : ''}
        </div>
        <div class="ah-item-actions">${actionBtns}</div>
      </div>`;
  }

  listEl.innerHTML = filtered.map(renderItem).join('');
}

function clearRecordFilters() {
  ['rf-status', 'rf-car', 'rf-category', 'rf-month', 'rf-year'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  applyRecordFilters();
}

// ─── BACKUP PAGE ──────────────────────────────────────
function renderBackup() {
  const el = document.getElementById('view-backup');
  el.innerHTML = `
    <div class="page-header">
      <h2>💾 Backup</h2>
    </div>
    <div class="backup-body">

      <div class="backup-panel">
        <h2>
          <span class="help-icon" data-help-title="How Backup Works"
            data-help="Your data is stored <strong>only in this browser</strong> on this device — not in the cloud.<br><br><strong>💾 Export JSON Backup</strong><br>Saves all your cars, history and settings as a JSON file. Do this regularly.<br><br><strong>📥 Import JSON Backup</strong><br>Restores your data from a previously exported file.<br><br><strong>🗑️ Clear All Data</strong><br>Permanently deletes everything. Cannot be undone.<br><br>💡 <strong>Tip:</strong> Export a backup whenever you finish using the app to make sure nothing is lost.">💡</span>
          Backup &amp; Restore
        </h2>
        <p>Your data is saved locally on this device. Export regularly to keep it safe.</p>
        <div class="backup-actions">
          <button class="btn btn-navy" onclick="exportData()">
            💾 Export JSON Backup
          </button>
          <label class="btn btn-accent" style="cursor:pointer;">
            📥 Import JSON Backup
            <input type="file" accept=".json" style="display:none;" onchange="importData(this)">
          </label>
          <button class="btn btn-danger" onclick="confirmClearData()">
            🗑️ Clear All Data
          </button>
        </div>
      </div>

      <div class="backup-panel">
        <button class="backup-guide-toggle" onclick="toggleBackupGuide()">
          <span>🌐 Using the App Across Multiple Devices</span>
          <svg class="backup-guide-chevron" id="backup-guide-chevron" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="5 8 10 13 15 8"/>
          </svg>
        </button>
        <div class="backup-guide-body" id="backup-guide-body" style="display:none;">
          <hr class="backup-divider">
          <div class="backup-guide-note">
            CarTrack data is stored locally in your browser. Browser storage is not permanent — regular exports keep your data safe.<br><br>
            To use CarTrack on multiple devices, save your exports to <strong>Google Drive</strong>, <strong>OneDrive</strong> or <strong>iCloud Drive</strong> and import them on the other device.<br><br>
            💡 We recommend <strong>Google Drive</strong> — it works well across Windows, Mac, Android and iPhone.
          </div>

          <p class="backup-guide-subtitle">🖥️ Computer Setup</p>
          <ol class="backup-guide-list">
            <li>Install Google Drive or OneDrive on your computer and sign in</li>
            <li>Wait for the cloud folder to appear in your file manager</li>
            <li>In CarTrack, go to <strong>Backup → Export JSON Backup</strong></li>
            <li>Save the file inside your Google Drive or OneDrive folder</li>
            <li>Your backup will automatically sync to your other devices</li>
          </ol>

          <p class="backup-guide-subtitle">📱 Phone &amp; Tablet Setup</p>
          <ol class="backup-guide-list">
            <li>Install the same cloud storage app on your phone and sign in with the same account</li>
            <li>Open the cloud app and find your CarTrack backup file</li>
            <li>Make the folder available offline so it syncs automatically</li>
            <li>In CarTrack, go to <strong>Backup → Import JSON Backup</strong></li>
            <li>Select the latest backup file from your cloud folder</li>
          </ol>

          <div class="backup-guide-note" style="margin-top:14px; margin-bottom:0;">
            💡 Before switching devices, always export on the device you used last so the backup is up to date.
          </div>
        </div>
      </div>

    </div>
  `;
}

function toggleBackupGuide() {
  const body    = document.getElementById('backup-guide-body');
  const chevron = document.getElementById('backup-guide-chevron');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  chevron.classList.toggle('open', !isOpen);
}

// ─── QUICK START GUIDE ────────────────────────────────
function renderQuickStart() {
  const el = document.getElementById('view-guide');
  el.innerHTML = `
    <div class="page-header">
      <h2>📖 Quick Start Guide</h2>
    </div>
    <div class="qs-body">

      <div class="qs-panel">
        <h2>👋 Welcome to CarTrack!</h2>
        <p class="qs-intro">CarTrack is a local-first car maintenance tracker. No account, no cloud — all data is saved on your device. Add your cars, log services, and get reminders before things go overdue.</p>
      </div>

      <div class="qs-panel">
        <h2>💡 Help Icons</h2>
        <p class="qs-text">Throughout the app you'll find small <span class="help-icon" style="pointer-events:none;opacity:1;">💡</span> icons next to titles and fields. Tap them anytime for a quick explanation. On this page everything is already written out — no icons needed.</p>
      </div>

      <div class="qs-panel">
        <h2>🗺️ Where to Start</h2>
        <div class="qs-steps">
          <div class="qs-step">
            <div class="qs-step-num">1</div>
            <div class="qs-step-body">
              <div class="qs-step-title">Add Your Car</div>
              <div class="qs-step-desc">Go to <strong>My Cars</strong> → tap <strong>+ Add Car</strong>. Enter the name, make, model, year and current mileage. You can also add the VIN/chassis number.</div>
            </div>
          </div>
          <div class="qs-step">
            <div class="qs-step-num">2</div>
            <div class="qs-step-body">
              <div class="qs-step-title">Log a Service</div>
              <div class="qs-step-desc">Open a car → tap <strong>+ Add Record</strong>. Select the maintenance type, date done, and mileage at the time of service.</div>
            </div>
          </div>
          <div class="qs-step">
            <div class="qs-step-num">3</div>
            <div class="qs-step-body">
              <div class="qs-step-title">Check Reminders</div>
              <div class="qs-step-desc">CarTrack automatically calculates when the next service is due — by km and/or time — and shows a colored status for each reminder.</div>
            </div>
          </div>
          <div class="qs-step">
            <div class="qs-step-num">4</div>
            <div class="qs-step-body">
              <div class="qs-step-title">Update Mileage</div>
              <div class="qs-step-desc">Keep mileage up to date so km-based reminders stay accurate. Tap <strong>Update km</strong> on the car page anytime.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="qs-panel">
        <h2>🔴 Understanding Reminder Status</h2>
        <p class="qs-text" style="margin-bottom:12px;">Each reminder shows a colored dot based on urgency:</p>
        <div class="qs-status-row">
          <div class="qs-status-item"><div class="qs-dot red"></div><div><strong>Red — Overdue.</strong> The service is past due by date or by km. Act soon.</div></div>
          <div class="qs-status-item"><div class="qs-dot yellow"></div><div><strong>Yellow — Due soon.</strong> Within 30 days or 1,000 km of the threshold.</div></div>
          <div class="qs-status-item"><div class="qs-dot green"></div><div><strong>Green — On track.</strong> Plenty of time or km remaining.</div></div>
          <div class="qs-status-item"><div class="qs-dot grey"></div><div><strong>Grey — Not logged yet.</strong> No records yet for this item.</div></div>
        </div>
      </div>

      <div class="qs-panel">
        <h2>🔧 Maintenance Types</h2>
        <p class="qs-text">Types are grouped by category: <strong>Filters</strong>, <strong>Engine</strong>, <strong>Brakes</strong>, <strong>Suspension</strong>, <strong>Tires &amp; Wheels</strong>, <strong>Electrical</strong>. Each comes with default km and time intervals that you can customize per car. You can also create <strong>custom types</strong> for anything not in the list.</p>
      </div>

      <div class="qs-panel">
        <h2>📱 Works Everywhere</h2>
        <div class="qs-info-grid">
          <div class="qs-info-card">
            <div class="qs-info-icon">📴</div>
            <div>
              <div class="qs-info-title">Works offline</div>
              <div class="qs-info-desc">No internet needed. All data is saved locally in your browser.</div>
            </div>
          </div>
          <div class="qs-info-card">
            <div class="qs-info-icon">💾</div>
            <div>
              <div class="qs-info-title">Export your data</div>
              <div class="qs-info-desc">Use Settings → Export to save a backup of all your cars and history.</div>
            </div>
          </div>
          <div class="qs-info-card">
            <div class="qs-info-icon">📲</div>
            <div>
              <div class="qs-info-title">Install as PWA</div>
              <div class="qs-info-desc">Add to home screen on mobile or install on desktop for an app-like experience.</div>
            </div>
          </div>
          <div class="qs-info-card">
            <div class="qs-info-icon">🔒</div>
            <div>
              <div class="qs-info-title">Your data, your device</div>
              <div class="qs-info-desc">No account, no cloud. Data never leaves your device unless you export it.</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

// ─── SETTINGS RENDERING ───────────────────────────────
function renderSettings() {
  const el = document.getElementById('view-settings');
  const notifEnabled = appData.settings.notificationsEnabled;
  const notifPermission = Notification && Notification.permission ? Notification.permission : 'unsupported';

  el.innerHTML = `
    <div class="page-header"><h2>Settings</h2></div>
    <div class="page-body">

      <div class="settings-section">
        <div class="settings-section-title">Notifications</div>
        <div class="settings-item">
          <div class="settings-item-label">
            <strong>In-app Alerts</strong>
            <span>Always shown on dashboard for urgent reminders</span>
          </div>
          <span style="font-size:.8125rem;color:var(--status-green);font-weight:600;">Always on</span>
        </div>
        <div class="settings-item">
          <div class="settings-item-label">
            <strong>Browser Notifications</strong>
            <span>
              ${notifPermission === 'unsupported'
                ? 'Not supported in this browser.'
                : notifPermission === 'denied'
                  ? 'Blocked by browser. Enable in site settings.'
                  : 'Shown when the app tab is open. Not guaranteed in background.'
              }
            </span>
          </div>
          ${notifPermission !== 'unsupported' && notifPermission !== 'denied'
            ? `<label class="toggle">
                 <input type="checkbox" id="notif-toggle" ${notifEnabled ? 'checked' : ''} onchange="toggleNotifications(this.checked)">
                 <span class="toggle-slider"></span>
               </label>`
            : `<span style="font-size:.75rem;color:var(--text-muted);">${notifPermission === 'denied' ? 'Blocked' : 'N/A'}</span>`
          }
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Custom Maintenance Types</div>
        ${(appData.customTypes || []).length === 0
          ? `<div class="settings-item"><span style="color:var(--text-muted);font-size:.875rem;">No custom types defined.</span></div>`
          : (appData.customTypes || []).map(ct => `
              <div class="settings-item">
                <div class="settings-item-label">
                  <strong>${escHtml(ct.name)}</strong>
                  <span>${ct.intervalKm ? formatKm(ct.intervalKm) : '—'} · ${ct.intervalMonths ? ct.intervalMonths + ' months' : '—'}</span>
                </div>
                <button class="btn-icon danger" style="width:30px;height:30px;" onclick="confirmDeleteCustomType('${escHtml(ct.id)}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:15px;height:15px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            `).join('')
        }
        <div class="settings-item">
          <button class="btn btn-secondary btn-sm" onclick="openAddCustomTypeModal()">+ New Custom Type</button>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Units</div>
        <div class="settings-item">
          <div class="settings-item-label">
            <strong>Distance Unit</strong>
            <span>Used for mileage across the app</span>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm ${getUnit()==='km' ? 'btn-primary' : 'btn-secondary'}" onclick="setDistanceUnit('km')">km</button>
            <button class="btn btn-sm ${getUnit()==='miles' ? 'btn-primary' : 'btn-secondary'}" onclick="setDistanceUnit('miles')">miles</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Data Management</div>
        <div class="settings-item">
          <div class="settings-item-label">
            <strong>Export Data</strong>
            <span>Download a backup of all your data as JSON</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="exportData()">Export</button>
        </div>
        <div class="settings-item">
          <div class="settings-item-label">
            <strong>Import Data</strong>
            <span>Restore from a previously exported JSON file</span>
          </div>
          <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
            Import
            <input type="file" accept=".json" style="display:none;" onchange="importData(this)">
          </label>
        </div>
        <div class="settings-item">
          <div class="settings-item-label">
            <strong>Clear All Data</strong>
            <span>Permanently delete all cars and history</span>
          </div>
          <button class="btn btn-danger btn-sm" onclick="confirmClearData()">Clear</button>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">About</div>
        <div class="settings-item">
          <div class="settings-item-label"><strong>Version</strong></div>
          <span style="font-size:.875rem;color:var(--text-secondary);">${escHtml(APP_VERSION)}</span>
        </div>
        <div class="settings-item">
          <div class="settings-item-label"><strong>Storage</strong></div>
          <span style="font-size:.875rem;color:var(--text-secondary);" id="storage-info">Calculating…</span>
        </div>
      </div>

    </div>
  `;

  // Show storage usage
  try {
    const bytes = new Blob([localStorage.getItem(KEY_DATA) || '']).size;
    const kb = (bytes / 1024).toFixed(1);
    document.getElementById('storage-info').textContent = `${kb} KB used`;
  } catch (e) {}
}

function setDistanceUnit(unit) {
  appData.settings.distanceUnit = unit;
  saveData();
  renderSettings();
}

// ─── NOTIFICATIONS ────────────────────────────────────
function toggleNotifications(enabled) {
  if (enabled && Notification.permission !== 'granted') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        appData.settings.notificationsEnabled = true;
        saveData();
        showToast('Browser notifications enabled.', 'success');
      } else {
        appData.settings.notificationsEnabled = false;
        saveData();
        const toggle = document.getElementById('notif-toggle');
        if (toggle) toggle.checked = false;
        showToast('Notification permission denied.', 'error');
      }
    });
  } else {
    appData.settings.notificationsEnabled = enabled;
    saveData();
    showToast(enabled ? 'Notifications enabled.' : 'Notifications disabled.');
  }
}

function checkAndNotify() {
  if (!appData.settings.notificationsEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const alerts = getGlobalAlerts().filter(a => a.status === 'red');
  if (alerts.length === 0) return;

  const msg = alerts.length === 1
    ? `${alerts[0].item.typeName} on ${alerts[0].car.name} is overdue!`
    : `${alerts.length} maintenance items are overdue across your cars.`;

  new Notification('CarTrack — Action Required', {
    body: msg,
    icon: 'icons/icon-192.svg',
    tag: 'cartrack-alert',
  });
}

// ─── MODAL SYSTEM ─────────────────────────────────────
function openModal(html) {
  const overlay   = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  overlay.classList.remove('hidden');
  // Trap focus inside modal
  const firstFocusable = container.querySelector('input, select, textarea, button');
  if (firstFocusable) setTimeout(() => firstFocusable.focus(), 50);
}

function closeModal() {
  const overlay   = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  overlay.classList.add('hidden');
  container.innerHTML = '';
}

// ─── MAKE / MODEL DROPDOWN HELPERS ───────────────────
function buildMakeOptions(selectedMake) {
  const makes = Object.keys(CAR_MAKES_MODELS).sort();
  let opts = '<option value="">— Select Brand —</option>';
  opts += makes.map(m =>
    `<option value="${escHtml(m)}" ${selectedMake === m ? 'selected' : ''}>${escHtml(m)}</option>`
  ).join('');
  opts += `<option value="__other__" ${selectedMake === '__other__' ? 'selected' : ''}>Other...</option>`;
  return opts;
}

function buildModelOptions(make, selectedModel) {
  const models = CAR_MAKES_MODELS[make] || [];
  let opts = '<option value="">— Select Model —</option>';
  opts += models.map(m =>
    `<option value="${escHtml(m)}" ${selectedModel === m ? 'selected' : ''}>${escHtml(m)}</option>`
  ).join('');
  opts += `<option value="__other__" ${selectedModel === '__other__' ? 'selected' : ''}>Other...</option>`;
  return opts;
}

function onMakeDropdownChange() {
  const makeVal   = document.getElementById('cf-brand').value;
  const makeOther = document.getElementById('cf-brand-other');
  const modelSel  = document.getElementById('cf-model');
  const modelOther = document.getElementById('cf-model-other');

  makeOther.style.display = makeVal === '__other__' ? '' : 'none';
  if (makeVal !== '__other__') makeOther.value = '';

  const effectiveMake = (makeVal === '__other__' || makeVal === '') ? '' : makeVal;
  modelSel.innerHTML = buildModelOptions(effectiveMake, '');
  modelOther.style.display = 'none';
  modelOther.value = '';
}

function onModelDropdownChange() {
  const modelVal  = document.getElementById('cf-model').value;
  const modelOther = document.getElementById('cf-model-other');
  modelOther.style.display = modelVal === '__other__' ? '' : 'none';
  if (modelVal !== '__other__') modelOther.value = '';
}

// ─── ADD / EDIT CAR MODAL ─────────────────────────────
function openAddCarModal() {
  openModal(`
    <div class="modal-header">
      <h2>Add Car</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <form id="car-form" onsubmit="submitCarForm(event)">
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label for="cf-plate">Number Plate <span class="optional">optional</span></label>
            <input type="text" id="cf-plate" placeholder="e.g. B 123 ABC" maxlength="20" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="font-family:monospace;letter-spacing:.08em;text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()">
          </div>
          <div class="form-group">
            <label for="cf-name">Nickname / Name <span class="required">*</span></label>
            <input type="text" id="cf-name" placeholder='e.g. "Family SUV"' maxlength="60" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="cf-brand">Brand <span class="optional">optional</span></label>
            <select id="cf-brand" onchange="onMakeDropdownChange()">${buildMakeOptions('')}</select>
            <input type="text" id="cf-brand-other" placeholder="Enter make…" maxlength="40" autocomplete="off" style="display:none;margin-top:6px;">
          </div>
          <div class="form-group">
            <label for="cf-model">Model <span class="optional">optional</span></label>
            <select id="cf-model" onchange="onModelDropdownChange()">${buildModelOptions('', '')}</select>
            <input type="text" id="cf-model-other" placeholder="Enter model…" maxlength="40" autocomplete="off" style="display:none;margin-top:6px;">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="cf-year">Year <span class="optional">optional</span></label>
            <input type="number" id="cf-year" placeholder="e.g. 2018" min="1900" max="2099">
          </div>
          <div class="form-group">
            <label for="cf-km">Current Mileage (km/miles) <span class="optional">optional</span></label>
            <input type="number" id="cf-km" placeholder="e.g. 85000" min="0" max="9999999" inputmode="numeric">
          </div>
        </div>
        <div class="form-group">
          <label for="cf-vin">Chassis Number (VIN) <span class="optional">optional</span></label>
          <input type="text" id="cf-vin" placeholder="e.g. WVWZZZ1JZ3W386752" maxlength="20" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="font-family:monospace;letter-spacing:.04em;">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Car</button>
      </div>
    </form>
    <input type="hidden" id="cf-id" value="">
  `);
}

function openEditCarModal(carId) {
  const car = getCarById(carId);
  if (!car) return;

  const makes       = Object.keys(CAR_MAKES_MODELS).sort();
  const brandInList = car.brand && makes.includes(car.brand);
  const modelModels = brandInList ? (CAR_MAKES_MODELS[car.brand] || []) : [];
  const modelInList = car.model && modelModels.includes(car.model);
  const initMake    = brandInList ? car.brand : (car.brand ? '__other__' : '');
  const initModel   = modelInList ? car.model : (car.model ? '__other__' : '');
  const otherBrand  = !brandInList && car.brand ? car.brand : '';
  const otherModel  = !modelInList && car.model ? car.model : '';

  openModal(`
    <div class="modal-header">
      <h2>Edit Car</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <form id="car-form" onsubmit="submitCarForm(event)">
      <input type="hidden" id="cf-id" value="${escHtml(carId)}">
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label for="cf-plate">Number Plate <span class="optional">optional</span></label>
            <input type="text" id="cf-plate" value="${escHtml(car.plate || '')}" maxlength="20" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="font-family:monospace;letter-spacing:.08em;text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()">
          </div>
          <div class="form-group">
            <label for="cf-name">Nickname / Name <span class="required">*</span></label>
            <input type="text" id="cf-name" value="${escHtml(car.name)}" maxlength="60" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="cf-brand">Brand <span class="optional">optional</span></label>
            <select id="cf-brand" onchange="onMakeDropdownChange()">${buildMakeOptions(initMake)}</select>
            <input type="text" id="cf-brand-other" placeholder="Enter make…" maxlength="40" autocomplete="off" value="${escHtml(otherBrand)}" style="${otherBrand ? '' : 'display:none;'}margin-top:6px;">
          </div>
          <div class="form-group">
            <label for="cf-model">Model <span class="optional">optional</span></label>
            <select id="cf-model" onchange="onModelDropdownChange()">${buildModelOptions(brandInList ? car.brand : '', initModel)}</select>
            <input type="text" id="cf-model-other" placeholder="Enter model…" maxlength="40" autocomplete="off" value="${escHtml(otherModel)}" style="${otherModel ? '' : 'display:none;'}margin-top:6px;">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="cf-year">Year <span class="optional">optional</span></label>
            <input type="number" id="cf-year" value="${car.year != null ? car.year : ''}" min="1900" max="2099">
          </div>
          <div class="form-group">
            <label for="cf-km">Current Mileage (km/miles) <span class="optional">optional</span></label>
            <input type="number" id="cf-km" value="${car.currentKm != null ? car.currentKm : ''}" min="0" max="9999999" inputmode="numeric">
          </div>
        </div>
        <div class="form-group">
          <label for="cf-vin">Chassis Number (VIN) <span class="optional">optional</span></label>
          <input type="text" id="cf-vin" value="${escHtml(car.vin || '')}" maxlength="20" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="font-family:monospace;letter-spacing:.04em;">
        </div>
      </div>
      <div class="modal-footer">
        <button type="submit" class="btn btn-primary">Save Changes</button>
        <button type="button" class="btn btn-danger btn-sm" onclick="confirmDeleteCar('${escHtml(carId)}')">Delete this car</button>
      </div>
    </form>
  `);
}

function submitCarForm(e) {
  e.preventDefault();
  const id      = document.getElementById('cf-id').value;
  const name    = document.getElementById('cf-name').value.trim();
  const makeEl  = document.getElementById('cf-brand');
  const brand   = makeEl.value === '__other__'
    ? (document.getElementById('cf-brand-other').value.trim() || null)
    : (makeEl.value || null);
  const modelEl = document.getElementById('cf-model');
  const model   = modelEl.value === '__other__'
    ? (document.getElementById('cf-model-other').value.trim() || null)
    : (modelEl.value || null);
  const year  = parseInt(document.getElementById('cf-year').value, 10);
  const km    = parseFloat(document.getElementById('cf-km').value);
  const vin   = (document.getElementById('cf-vin').value || '').trim().toUpperCase();
  const plate = (document.getElementById('cf-plate').value || '').trim().toUpperCase();

  if (!name) { showToast('Please enter a name for the car.', 'error'); return; }

  if (id) {
    // Edit
    const car = getCarById(id);
    if (!car) return;
    car.name  = name;
    car.brand = brand || null;
    car.model = model || null;
    car.year  = isNaN(year) ? null : year;
    car.currentKm = isNaN(km) ? null : km;
    car.vin   = vin || null;
    car.plate = plate || null;
    saveData();
    closeModal();
    showToast('Car updated.');
    renderCarDetail(id);
  } else {
    // Add
    const newCar = {
      id: genId(),
      name,
      plate: plate || null,
      brand: brand || null,
      model: model || null,
      year: isNaN(year) ? null : year,
      currentKm: isNaN(km) ? null : km,
      vin: vin || null,
      createdAt: new Date().toISOString(),
      maintenanceItems: [],
      history: [],
    };
    appData.cars.push(newCar);
    saveData();
    closeModal();
    showToast('Car added!', 'success');
    navigateTo('car-detail', newCar.id);
  }
}

// ─── LOG MAINTENANCE MODAL ────────────────────────────
const CSD_CHEVRON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>`;

function buildCollapsibleTypeSelect(selectedKey, carId) {
  let selectedName = '— Select type —';
  if (selectedKey) {
    const info = getTypeInfo(selectedKey);
    if (info) selectedName = info.name;
  }
  const cid = escHtml(carId);

  function groupItems(items, grpLabel) {
    const hasSelected = items.some(t => (t.key || t.id) === selectedKey);
    const rows = items.map(t => {
      const k = t.key || t.id, n = t.name;
      return `<div class="csd-item${selectedKey === k ? ' selected' : ''}" onclick="selectCsdItem('${escHtml(k)}','${escHtml(n)}','${cid}')">${escHtml(n)}</div>`;
    }).join('');
    return `<div class="csd-group">
      <div class="csd-group-header${hasSelected ? ' open' : ''}" onclick="toggleCsdGroup(this)">
        <span>${grpLabel}</span>${CSD_CHEVRON}
      </div>
      <div class="csd-group-items${hasSelected ? ' open' : ''}">${rows}</div>
    </div>`;
  }

  const GROUP_ORDER = ['Filters','Engine','Brakes','Suspension','Tires & Wheels','Electrical','Exterior','Fluids'];
  const grouped = {};
  TECHNICAL_TYPES.forEach(t => { if (!grouped[t.group]) grouped[t.group] = []; grouped[t.group].push(t); });

  const customTypes = appData.customTypes || [];
  const customItems = [
    ...customTypes,
    { id: '__new_custom__', name: '+ Create new custom type…' }
  ];

  return `<div class="csd-wrapper" id="csd-mf-type">
    <input type="hidden" id="mf-type" value="${escHtml(selectedKey || '')}">
    <div class="csd-trigger" onclick="toggleCsd('csd-mf-type')">
      <span class="csd-display" id="csd-display-mf-type">${escHtml(selectedName)}</span>
      ${CSD_CHEVRON}
    </div>
    <div class="csd-dropdown" id="csd-dropdown-mf-type">
      ${groupItems(LEGAL_TYPES, 'Legal Documents')}
      ${GROUP_ORDER.map(g => grouped[g] ? groupItems(grouped[g], g) : '').join('')}
      ${groupItems(customItems, 'Custom')}
    </div>
  </div>`;
}

function toggleCsd(wrapperId) {
  const dropdown = document.getElementById('csd-dropdown-' + wrapperId.replace('csd-',''));
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains('open');
  document.querySelectorAll('.csd-dropdown.open').forEach(d => d.classList.remove('open'));
  if (!isOpen) dropdown.classList.add('open');
}

function toggleCsdGroup(header) {
  header.classList.toggle('open');
  header.nextElementSibling.classList.toggle('open');
}

function selectCsdItem(typeKey, typeName, carId) {
  const inp = document.getElementById('mf-type');
  const disp = document.getElementById('csd-display-mf-type');
  if (inp) inp.value = typeKey;
  if (disp) disp.textContent = typeName;
  document.querySelectorAll('.csd-dropdown.open').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.csd-item.selected').forEach(el => el.classList.remove('selected'));
  event.currentTarget && event.currentTarget.classList.add('selected');
  onMaintenanceTypeChange(carId);
}

function buildTypeOptions(selectedKey) {
  const placeholder = `<option value="" ${!selectedKey ? 'selected' : ''} disabled>— Select type —</option>`;

  const legalOpts = LEGAL_TYPES.map(t =>
    `<option value="${t.key}" ${selectedKey === t.key ? 'selected' : ''}>${escHtml(t.name)}</option>`
  ).join('');

  const GROUP_ORDER = ['Filters', 'Engine', 'Brakes', 'Suspension', 'Tires & Wheels', 'Electrical', 'Exterior', 'Fluids'];
  const grouped = {};
  TECHNICAL_TYPES.forEach(t => {
    if (!grouped[t.group]) grouped[t.group] = [];
    grouped[t.group].push(t);
  });
  const techGroupOpts = GROUP_ORDER.map(grp => {
    const items = grouped[grp];
    if (!items || !items.length) return '';
    const opts = items.map(t =>
      `<option value="${t.key}" ${selectedKey === t.key ? 'selected' : ''}>${escHtml(t.name)}</option>`
    ).join('');
    return `<optgroup label="${grp}">${opts}</optgroup>`;
  }).join('');

  const customOpts = (appData.customTypes || []).map(t =>
    `<option value="${t.id}" ${selectedKey === t.id ? 'selected' : ''}>${escHtml(t.name)}</option>`
  ).join('');
  const newCustomOpt = `<option value="__new_custom__" ${selectedKey === '__new_custom__' ? 'selected' : ''}>+ Create new custom type…</option>`;

  return `
    ${placeholder}
    <optgroup label="Legal Documents">${legalOpts}</optgroup>
    ${techGroupOpts}
    <optgroup label="Custom${customOpts ? '' : ' (none yet)'}">${customOpts}${newCustomOpt}</optgroup>
  `;
}

function getTypeDefaults(typeKey) {
  const legal = LEGAL_TYPES.find(t => t.key === typeKey);
  if (legal) return { category: 'legal', intervalKm: null, intervalMonths: null };
  const tech = TECHNICAL_TYPES.find(t => t.key === typeKey);
  if (tech) return { category: 'technical', intervalKm: tech.intervalKm, intervalMonths: tech.intervalMonths };
  const custom = (appData.customTypes || []).find(t => t.id === typeKey);
  if (custom) return { category: 'custom', intervalKm: custom.intervalKm, intervalMonths: custom.intervalMonths };
  return null;
}

function openLogMaintenanceModal(carId, existingItemId, defaultDate) {
  if (!existingItemId && isDemoLimitReached()) {
    showDemoUpgradeModal();
    return;
  }
  const car  = getCarById(carId);
  if (!car) return;
  const item = existingItemId ? car.maintenanceItems.find(i => i.id === existingItemId) : null;
  const prefillDate = defaultDate || null;

  const selectedKey = item ? item.typeKey : '';
  const defaults    = getTypeDefaults(selectedKey);
  const isLegal     = defaults && defaults.category === 'legal';
  // A scheduled item has no lastDoneDate and no lastDoneKm but has expiryDate (technical only)
  const isScheduled = item && !isLegal && !item.lastDoneDate && item.lastDoneKm == null && !!item.expiryDate;

  openModal(`
    <div class="modal-header">
      <h2>${item ? 'Edit Record' : 'Add Record'}</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <form id="maint-form" onsubmit="submitMaintenanceForm(event, '${escHtml(carId)}', '${escHtml(existingItemId || '')}')">
      <div class="modal-body">

        <div class="form-group">
          <label for="mf-type">Maintenance Type <span class="required">*</span> <span class="help-icon" data-help-title="Maintenance Type" data-help="Select the type of service performed. Types are grouped by category:<br><br><strong>Filters</strong> — Oil, Air, Fuel, Cabin filters<br><strong>Engine</strong> — Coolant, Belts, Spark plugs, etc.<br><strong>Brakes</strong> — Pads, Discs, Brake fluid<br><strong>Suspension</strong> — Shock absorbers, Stabilizer<br><strong>Tires &amp; Wheels</strong> — Rotation, Alignment<br><strong>Electrical</strong> — Battery<br><br>Can't find your type? Select <strong>+ Create new custom type</strong> at the bottom.">💡</span></label>
          ${buildCollapsibleTypeSelect(selectedKey, carId)}
        </div>

        <!-- New Custom Type fields — shown when "+ Create new custom type…" selected -->
        <div id="mf-custom-fields" style="display:none;">
          <div class="form-group">
            <label for="mf-custom-name">Type Name <span class="required">*</span></label>
            <input type="text" id="mf-custom-name" placeholder="e.g. Gearbox Oil" maxlength="60">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="mf-custom-km">Interval (${getUnit()}) <span class="optional">optional</span></label>
              <input type="number" id="mf-custom-km" placeholder="e.g. 30000" min="0" inputmode="numeric">
            </div>
            <div class="form-group">
              <label for="mf-custom-months">Interval (months) <span class="optional">optional</span></label>
              <input type="number" id="mf-custom-months" placeholder="e.g. 24" min="0" inputmode="numeric">
            </div>
          </div>
        </div>

        <!-- Done / Schedule mode toggle — hidden for legal types -->
        <div id="mf-mode-wrapper" style="${isLegal ? 'display:none;' : 'margin-bottom:16px;'}">
          <div class="mf-mode-toggle">
            <button type="button" class="mf-mode-btn${!isScheduled ? ' active' : ''}" id="mf-mode-done" onclick="setMfMode('done')">✓ Done</button>
            <button type="button" class="mf-mode-btn${isScheduled ? ' active' : ''}" id="mf-mode-schedule" onclick="setMfMode('schedule')">📅 Schedule</button>
          </div>
          <p class="mf-mode-hint" id="mf-mode-hint-done" style="${isScheduled ? 'display:none;' : ''}">Log a service that was already performed — date, mileage, and notes.</p>
          <p class="mf-mode-hint" id="mf-mode-hint-schedule" style="${isScheduled ? '' : 'display:none;'}">Plan a future service — set a target date and the app will remind you when it's due.</p>
        </div>

        <!-- Legal fields -->
        <div id="mf-legal-fields" style="${isLegal ? '' : 'display:none;'}">
          <div class="form-group">
            <label for="mf-renewal-date">Date of Renewal <span class="optional">optional</span></label>
            <input type="date" id="mf-renewal-date" value="${item && item.lastDoneDate ? item.lastDoneDate : today()}">
          </div>
          <div class="form-group">
            <label for="mf-expiry-date">Expiry Date <span class="required">*</span></label>
            <input type="date" id="mf-expiry-date" value="${item && item.expiryDate ? item.expiryDate : ''}">
          </div>
        </div>

        <!-- Technical: Done fields -->
        <div id="mf-tech-fields" style="${isLegal || isScheduled ? 'display:none;' : ''}">
          <div class="form-row">
            <div class="form-group">
              <label for="mf-done-date">Date Done <span class="required">*</span></label>
              <input type="date" id="mf-done-date" value="${item && item.lastDoneDate ? item.lastDoneDate : (prefillDate || today())}">
            </div>
            <div class="form-group">
              <label for="mf-done-km">Mileage (${getUnit()}) <span class="optional">optional</span></label>
              <input type="number" id="mf-done-km" value="${item && item.lastDoneKm != null ? item.lastDoneKm : (car.currentKm != null ? car.currentKm : '')}" min="0" max="9999999" inputmode="numeric" placeholder="km at service" oninput="validateDoneKm(${car.currentKm != null ? car.currentKm : 'null'})">
              <div class="form-error" id="mf-done-km-error" style="display:none;">Mileage can't be less than current odometer${car.currentKm != null ? ` (${formatKm(car.currentKm)})` : ''}.</div>
            </div>
          </div>

          <!-- Advanced interval overrides -->
          <button type="button" class="collapsible-toggle" id="interval-toggle" onclick="toggleIntervalSection()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
            Customize Intervals
          </button>
          <div class="collapsible-body" id="interval-section">
            <div class="form-section-title">Override default service intervals</div>
            <div class="form-row">
              <div class="form-group">
                <label for="mf-interval-km">Next service (${getUnit()})</label>
                <input type="number" id="mf-interval-km" placeholder="${defaults && defaults.intervalKm ? defaults.intervalKm : 'e.g. 10000'}" min="0" inputmode="numeric" value="${item && item.intervalKm != null ? item.intervalKm : ''}">
                <div class="form-hint">Default: ${defaults && defaults.intervalKm ? formatKm(defaults.intervalKm) : 'N/A'}</div>
              </div>
              <div class="form-group">
                <label for="mf-interval-months">Next service (months)</label>
                <input type="number" id="mf-interval-months" placeholder="${defaults && defaults.intervalMonths ? defaults.intervalMonths : 'e.g. 12'}" min="0" inputmode="numeric" value="${item && item.intervalMonths != null ? item.intervalMonths : ''}">
                <div class="form-hint">Default: ${defaults && defaults.intervalMonths ? defaults.intervalMonths + ' months' : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical: Schedule fields -->
        <div id="mf-schedule-fields" style="${isScheduled ? '' : 'display:none;'}">
          <div class="form-group">
            <label for="mf-sched-date">Scheduled Date <span class="required">*</span></label>
            <input type="date" id="mf-sched-date" value="${isScheduled && item.expiryDate ? item.expiryDate : (prefillDate || '')}">
          </div>
          <div class="form-group">
            <label for="mf-sched-km">Target ${getUnit()} <span class="optional">optional</span></label>
            <input type="number" id="mf-sched-km" min="0" inputmode="numeric" placeholder="km at which to do it" value="${isScheduled && item.intervalKm != null ? item.intervalKm : ''}" oninput="validateSchedKm(${car.currentKm != null ? car.currentKm : 'null'})">
            <div class="form-error" id="mf-sched-km-error" style="display:none;">Target ${getUnit()} can't be less than current odometer${car.currentKm != null ? ` (${formatKm(car.currentKm)})` : ''}.</div>
          </div>
        </div>

        <div class="form-group" style="margin-top:4px;">
          <label for="mf-notes">Notes <span class="optional">optional</span></label>
          <textarea id="mf-notes" placeholder="Any details (mechanic, parts used, observations…)" rows="3">${item && item.notes ? escHtml(item.notes) : ''}</textarea>
        </div>

        <div class="form-group">
          <label>Priority <span class="optional">optional</span></label>
          <div class="mf-priority-group">
            <button type="button" class="mf-priority-btn mf-priority-low${item && item.priority === 'low' ? ' active' : ''}"    onclick="setPriority('low')"   >↓ Low</button>
            <button type="button" class="mf-priority-btn mf-priority-medium${item && item.priority === 'medium' ? ' active' : ''}" onclick="setPriority('medium')">→ Medium</button>
            <button type="button" class="mf-priority-btn mf-priority-high${item && item.priority === 'high' ? ' active' : ''}"   onclick="setPriority('high')"  >↑ High</button>
          </div>
          <input type="hidden" id="mf-priority" value="${item && item.priority ? item.priority : ''}">
        </div>

      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  `);
}

function setPriority(level) {
  document.getElementById('mf-priority').value = level;
  document.querySelectorAll('.mf-priority-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const btn = document.querySelector(`.mf-priority-${level}`);
  if (btn) btn.classList.add('active');
}

function validateSchedKm(currentKm) {
  const el  = document.getElementById('mf-sched-km');
  const err = document.getElementById('mf-sched-km-error');
  if (!el || currentKm == null) return;
  const val       = parseFloat(el.value);
  const isInvalid = !isNaN(val) && val < currentKm;
  el.classList.toggle('input-error', isInvalid);
  if (err) err.style.display = isInvalid ? '' : 'none';
}

function validateDoneKm(currentKm) {
  const el  = document.getElementById('mf-done-km');
  const err = document.getElementById('mf-done-km-error');
  if (!el || currentKm == null) return;
  const val       = parseFloat(el.value);
  const isInvalid = !isNaN(val) && val < currentKm;
  el.classList.toggle('input-error', isInvalid);
  if (err) err.style.display = isInvalid ? '' : 'none';
}

function setMfMode(mode) {
  const isDone = mode === 'done';
  document.getElementById('mf-mode-done').classList.toggle('active', isDone);
  document.getElementById('mf-mode-schedule').classList.toggle('active', !isDone);
  document.getElementById('mf-tech-fields').style.display      = isDone ? '' : 'none';
  document.getElementById('mf-schedule-fields').style.display  = isDone ? 'none' : '';
  document.getElementById('mf-mode-hint-done').style.display   = isDone ? '' : 'none';
  document.getElementById('mf-mode-hint-schedule').style.display = isDone ? 'none' : '';
}

function onMaintenanceTypeChange(carId) {
  const typeKey  = document.getElementById('mf-type').value;
  const car      = getCarById(carId);
  const defaults = getTypeDefaults(typeKey);
  const isLegal  = defaults && defaults.category === 'legal';
  const isNew    = typeKey === '__new_custom__';

  const modeWrapper = document.getElementById('mf-mode-wrapper');
  if (modeWrapper) modeWrapper.style.display = (isLegal || isNew) ? 'none' : '';

  const isDone = !document.getElementById('mf-mode-schedule')?.classList.contains('active');

  document.getElementById('mf-legal-fields').style.display     = (isLegal && !isNew) ? '' : 'none';
  document.getElementById('mf-tech-fields').style.display      = (!isLegal && !isNew && isDone) ? '' : 'none';
  document.getElementById('mf-schedule-fields').style.display  = (!isLegal && !isNew && !isDone) ? '' : 'none';
  document.getElementById('mf-custom-fields').style.display    = isNew ? '' : 'none';

  if (!isLegal && !isNew && defaults) {
    const kmEl = document.getElementById('mf-interval-km');
    const moEl = document.getElementById('mf-interval-months');
    if (kmEl && !kmEl.value) kmEl.placeholder = defaults.intervalKm ? String(defaults.intervalKm) : '';
    if (moEl && !moEl.value) moEl.placeholder = defaults.intervalMonths ? String(defaults.intervalMonths) : '';
  }

  // Pre-fill done km with car's current km if blank
  const doneKmEl = document.getElementById('mf-done-km');
  if (doneKmEl && !doneKmEl.value && car && car.currentKm != null) {
    doneKmEl.value = car.currentKm;
  }
}

function toggleIntervalSection() {
  const btn  = document.getElementById('interval-toggle');
  const body = document.getElementById('interval-section');
  const open = body.classList.toggle('open');
  btn.classList.toggle('open', open);
}

function submitMaintenanceForm(e, carId, existingItemId) {
  e.preventDefault();
  const car = getCarById(carId);
  if (!car) return;

  let typeKey = document.getElementById('mf-type').value;
  const notes = (document.getElementById('mf-notes').value || '').trim();

  // Handle new custom type creation
  if (typeKey === '__new_custom__') {
    const customName   = (document.getElementById('mf-custom-name').value || '').trim();
    const customKm     = parseInt(document.getElementById('mf-custom-km').value, 10);
    const customMonths = parseInt(document.getElementById('mf-custom-months').value, 10);
    if (!customName) { showToast('Please enter a name for the custom type.', 'error'); return; }
    const newType = { id: genId(), name: customName, intervalKm: isNaN(customKm) ? null : customKm, intervalMonths: isNaN(customMonths) ? null : customMonths };
    appData.customTypes.push(newType);
    typeKey = newType.id;
  }

  const typeInfo = getTypeInfo(typeKey);
  if (!typeInfo) { showToast('Invalid maintenance type.', 'error'); return; }

  const recMode  = document.getElementById('mf-mode-schedule')?.classList.contains('active') ? 'schedule' : 'done';
  const priority = document.getElementById('mf-priority')?.value || null;

  if (typeInfo.category === 'legal') {
    const renewalDate = document.getElementById('mf-renewal-date').value || null;
    const expiryDate  = document.getElementById('mf-expiry-date').value;
    if (!expiryDate) { showToast('Please enter the expiry date.', 'error'); return; }

    saveOrUpdateMaintenanceItem(car, existingItemId, {
      typeKey, typeName: typeInfo.name, category: 'legal',
      expiryDate, lastDoneDate: renewalDate,
      intervalKm: null, intervalMonths: null, notes, priority: priority || null,
    });

    if (renewalDate) {
      addHistoryEntry(car, {
        typeKey, typeName: typeInfo.name, category: 'legal',
        date: renewalDate, km: null, expiryDate, notes, priority: priority || null,
      });
    }
  } else if (recMode === 'schedule') {
    const schedDate = document.getElementById('mf-sched-date').value;
    if (!schedDate) { showToast('Please enter a scheduled date.', 'error'); return; }

    const schedKm = parseFloat(document.getElementById('mf-sched-km').value);

    if (!isNaN(schedKm) && car.currentKm != null && schedKm < car.currentKm) {
      showToast(`Target ${getUnit()} can't be less than current odometer (${formatKm(car.currentKm)}).`, 'error');
      document.getElementById('mf-sched-km').classList.add('input-error');
      return;
    }

    saveOrUpdateMaintenanceItem(car, existingItemId, {
      typeKey, typeName: typeInfo.name, category: typeInfo.category,
      lastDoneDate: null, lastDoneKm: null,
      intervalKm: isNaN(schedKm) ? typeInfo.intervalKm : schedKm,
      intervalMonths: typeInfo.intervalMonths,
      expiryDate: schedDate, notes, priority: priority || null,
    });
    // No history entry for scheduled items
  } else {
    const doneDate   = document.getElementById('mf-done-date').value;
    if (!doneDate) { showToast('Please enter the service date.', 'error'); return; }

    const doneKm     = parseFloat(document.getElementById('mf-done-km').value);

    if (!isNaN(doneKm) && car.currentKm != null && doneKm < car.currentKm) {
      showToast(`Mileage can't be less than current odometer (${formatKm(car.currentKm)}).`, 'error');
      document.getElementById('mf-done-km').classList.add('input-error');
      return;
    }

    const intervalKm = parseFloat(document.getElementById('mf-interval-km').value);
    const intervalMo = parseFloat(document.getElementById('mf-interval-months').value);

    const resolvedKm = isNaN(intervalKm) ? typeInfo.intervalKm : intervalKm;
    const resolvedMo = isNaN(intervalMo) ? typeInfo.intervalMonths : intervalMo;

    saveOrUpdateMaintenanceItem(car, existingItemId, {
      typeKey, typeName: typeInfo.name, category: typeInfo.category,
      lastDoneDate: doneDate, lastDoneKm: isNaN(doneKm) ? null : doneKm,
      intervalKm: resolvedKm, intervalMonths: resolvedMo,
      expiryDate: null, notes, priority: priority || null,
    });

    addHistoryEntry(car, {
      typeKey, typeName: typeInfo.name, category: typeInfo.category,
      date: doneDate, km: isNaN(doneKm) ? null : doneKm, notes, priority: priority || null,
    });

    // Update car's current km if the entered km is higher
    if (!isNaN(doneKm) && (car.currentKm == null || doneKm > car.currentKm)) {
      car.currentKm = doneKm;
    }
  }

  saveData();
  closeModal();
  showToast(recMode === 'schedule' ? 'Scheduled!' : 'Maintenance logged!', 'success');
  if (!document.getElementById('view-calendar').classList.contains('hidden')) {
    renderCalendar();
  } else if (!document.getElementById('view-history').classList.contains('hidden')) {
    renderAllHistory();
  } else {
    renderCarDetail(carId);
  }
}

function saveOrUpdateMaintenanceItem(car, existingItemId, data) {
  // Check if an item with the same typeKey already exists (to avoid duplicates)
  const existingByType = car.maintenanceItems.find(i => i.typeKey === data.typeKey);
  const target = existingItemId
    ? car.maintenanceItems.find(i => i.id === existingItemId)
    : existingByType;

  if (target) {
    Object.assign(target, data);
  } else {
    car.maintenanceItems.push({ id: genId(), ...data });
  }
}

function addHistoryEntry(car, data) {
  car.history.push({ id: genId(), ...data });
}

function quickUndoHistory(carId, entryId) {
  const car = getCarById(carId);
  if (!car) return;
  car.history = car.history.filter(h => h.id !== entryId);
  saveData();
  showToast('Record removed.');
  if (!document.getElementById('view-history').classList.contains('hidden')) {
    renderAllHistory();
  } else {
    renderCarDetail(carId);
  }
}

function quickMarkDone(carId, itemId) {
  const car  = getCarById(carId);
  const item = car && car.maintenanceItems.find(i => i.id === itemId);
  if (!item) return;
  const today = new Date().toISOString().slice(0, 10);
  const km    = car.currentKm != null ? car.currentKm : null;

  item.lastDoneDate = today;
  if (km != null) item.lastDoneKm = km;

  addHistoryEntry(car, {
    typeKey: item.typeKey, typeName: item.typeName, category: item.category,
    date: today, km, expiryDate: item.expiryDate || null, notes: null,
    _sourceItemId: item.id,
  });

  saveData();
  showToast('Marked as done!', 'success');
  if (!document.getElementById('view-history').classList.contains('hidden')) {
    renderAllHistory();
  } else {
    renderCarDetail(carId);
  }
}

// ─── EDIT HISTORY ENTRY MODAL ─────────────────────────
function openEditHistoryModal(carId, entryId) {
  const car   = getCarById(carId);
  if (!car) return;
  const entry = car.history.find(h => h.id === entryId);
  if (!entry) return;

  const isLegal = entry.category === 'legal';

  openModal(`
    <div class="modal-header">
      <h2>Edit Record</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <form id="hist-form" onsubmit="submitEditHistory(event, '${escHtml(carId)}', '${escHtml(entryId)}')">
      <div class="modal-body">
        <div class="form-group">
          <label>Maintenance Type</label>
          <input type="text" value="${escHtml(entry.typeName)}" disabled style="background:var(--bg);color:var(--text-secondary);">
        </div>
        ${isLegal ? `
          <div class="form-group">
            <label for="hf-renewal-date">Date of Renewal</label>
            <input type="date" id="hf-renewal-date" value="${entry.date || ''}">
          </div>
          <div class="form-group">
            <label for="hf-expiry-date">Expiry Date</label>
            <input type="date" id="hf-expiry-date" value="${entry.expiryDate || ''}">
          </div>
        ` : `
          <div class="form-row">
            <div class="form-group">
              <label for="hf-date">Date Done <span class="required">*</span></label>
              <input type="date" id="hf-date" value="${entry.date || ''}" required>
            </div>
            <div class="form-group">
              <label for="hf-km">Mileage (${getUnit()}) <span class="optional">optional</span></label>
              <input type="number" id="hf-km" value="${entry.km != null ? entry.km : ''}" min="0" inputmode="numeric">
            </div>
          </div>
        `}
        <div class="form-group">
          <label for="hf-notes">Notes <span class="optional">optional</span></label>
          <textarea id="hf-notes" rows="3">${escHtml(entry.notes || '')}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  `);
}

function submitEditHistory(e, carId, entryId) {
  e.preventDefault();
  const car   = getCarById(carId);
  if (!car) return;
  const entry = car.history.find(h => h.id === entryId);
  if (!entry) return;

  const notes = (document.getElementById('hf-notes').value || '').trim();

  if (entry.category === 'legal') {
    entry.date       = document.getElementById('hf-renewal-date').value || entry.date;
    entry.expiryDate = document.getElementById('hf-expiry-date').value  || null;
  } else {
    const date = document.getElementById('hf-date').value;
    if (!date) { showToast('Date is required.', 'error'); return; }
    const km = parseFloat(document.getElementById('hf-km').value);
    entry.date = date;
    entry.km   = isNaN(km) ? null : km;
  }
  entry.notes = notes;

  saveData();
  closeModal();
  showToast('Entry updated.');
  renderCarDetail(carId);
}

// ─── DELETE CONFIRMATIONS ─────────────────────────────
function openConfirmModal(title, message, onConfirm) {
  openModal(`
    <div class="modal-header">
      <h2>${escHtml(title)}</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="modal-body confirm-body">
      <p>${escHtml(message)}</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" id="confirm-ok-btn">Delete</button>
    </div>
  `);
  document.getElementById('confirm-ok-btn').addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

function confirmDeleteCar(carId) {
  const car = getCarById(carId);
  if (!car) return;
  closeModal();
  openConfirmModal(
    'Delete Car',
    `Delete "${car.name}" and all its maintenance history? This cannot be undone.`,
    () => {
      appData.cars = appData.cars.filter(c => c.id !== carId);
      saveData();
      showToast('Car deleted.');
      navigateTo('dashboard');
    }
  );
}

function confirmDeleteReminder(carId, itemId) {
  const car  = getCarById(carId);
  const item = car && car.maintenanceItems.find(i => i.id === itemId);
  if (!item) return;
  openConfirmModal(
    'Delete Reminder',
    `Remove the reminder for "${item.typeName}"? Service history for this type is not affected.`,
    () => {
      car.maintenanceItems = car.maintenanceItems.filter(i => i.id !== itemId);
      saveData();
      showToast('Reminder removed.');
      renderCarDetail(carId);
    }
  );
}

function confirmDeleteHistory(carId, entryId) {
  const car   = getCarById(carId);
  const entry = car && car.history.find(h => h.id === entryId);
  if (!entry) return;
  openConfirmModal(
    'Delete Entry',
    `Delete this history entry (${entry.typeName}, ${formatDate(entry.date)})? This cannot be undone.`,
    () => {
      car.history = car.history.filter(h => h.id !== entryId);
      saveData();
      showToast('Entry deleted.');
      if (!document.getElementById('view-history').classList.contains('hidden')) {
        renderAllHistory();
      } else {
        renderCarDetail(carId);
      }
    }
  );
}

function confirmDeleteCustomType(typeId) {
  const ct = (appData.customTypes || []).find(t => t.id === typeId);
  if (!ct) return;
  openConfirmModal(
    'Delete Custom Type',
    `Delete custom type "${ct.name}"? Existing maintenance items using this type will still appear in history.`,
    () => {
      appData.customTypes = appData.customTypes.filter(t => t.id !== typeId);
      saveData();
      showToast('Custom type deleted.');
      renderSettings();
    }
  );
}

function confirmClearData() {
  openConfirmModal(
    'Clear All Data',
    'This will permanently delete ALL cars, history, and settings. This cannot be undone.',
    () => {
      appData = defaultData();
      saveData();
      showToast('All data cleared.');
      renderSettings();
    }
  );
}

// ─── ADD CUSTOM TYPE MODAL ────────────────────────────
function openAddCustomTypeModal() {
  openModal(`
    <div class="modal-header">
      <h2>New Custom Type</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <form id="ct-form" onsubmit="submitCustomType(event)">
      <div class="modal-body">
        <div class="form-group">
          <label for="ct-name">Type Name <span class="required">*</span></label>
          <input type="text" id="ct-name" placeholder="e.g. Gearbox Oil Change" maxlength="60" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="ct-km">Interval (${getUnit()}) <span class="optional">optional</span></label>
            <input type="number" id="ct-km" placeholder="e.g. 60000" min="0" inputmode="numeric">
          </div>
          <div class="form-group">
            <label for="ct-months">Interval (months) <span class="optional">optional</span></label>
            <input type="number" id="ct-months" placeholder="e.g. 48" min="0" inputmode="numeric">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Type</button>
      </div>
    </form>
  `);
}

function submitCustomType(e) {
  e.preventDefault();
  const name   = (document.getElementById('ct-name').value || '').trim();
  const km     = parseInt(document.getElementById('ct-km').value, 10);
  const months = parseInt(document.getElementById('ct-months').value, 10);
  if (!name) { showToast('Please enter a name.', 'error'); return; }

  appData.customTypes.push({ id: genId(), name, intervalKm: isNaN(km) ? null : km, intervalMonths: isNaN(months) ? null : months });
  saveData();
  closeModal();
  showToast('Custom type added!', 'success');
  renderSettings();
}

// ─── DATA EXPORT / IMPORT ─────────────────────────────
function _openFsDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('cartrack-fs', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('handles');
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = reject;
  });
}
async function _saveExportHandle(handle) {
  try {
    const db = await _openFsDB();
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(handle, 'lastExport');
  } catch {}
}
async function _getExportHandle() {
  try {
    const db = await _openFsDB();
    return await new Promise((res, rej) => {
      const tx  = db.transaction('handles', 'readonly');
      const req = tx.objectStore('handles').get('lastExport');
      req.onsuccess = () => res(req.result || null);
      req.onerror   = () => res(null);
    });
  } catch { return null; }
}

async function exportData() {
  const filename   = `CarTrack-backup-${today()}.json`;
  const json       = JSON.stringify(appData, null, 2);
  const blob       = new Blob([json], { type: 'application/json' });

  if (window.showSaveFilePicker) {
    try {
      const lastHandle = await _getExportHandle();
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        startIn: lastHandle || 'documents',
        types: [{ description: 'JSON Backup', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      await _saveExportHandle(handle);
      showToast('Backup exportat cu succes.', 'success');
    } catch (err) {
      if (err.name !== 'AbortError') showToast('Export eșuat.', 'error');
    }
  } else {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup exportat cu succes.', 'success');
  }
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.cars || !Array.isArray(parsed.cars)) throw new Error('Invalid format');
      appData = migrateData(parsed);
      saveData();
      showToast('Data imported successfully!', 'success');
      navigateTo('dashboard');
    } catch (err) {
      showToast('Import failed: invalid file format.', 'error');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// ─── TOAST SYSTEM ─────────────────────────────────────
function showToast(message, type) {
  const container = document.getElementById('toast-container');
  const toast     = document.createElement('div');
  toast.className = `toast ${type || ''}`;
  const icons = { success: '✓', error: '✕', warning: '⚠' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${escHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

// ─── ACTIVATION ───────────────────────────────────────
const DEMO_RECORD_LIMIT = 2;

function checkActivation() {
  return localStorage.getItem(KEY_ACTIVATED) === 'true';
}

function countAllRecords() {
  let n = 0;
  (appData.cars || []).forEach(car => {
    // Count history entries (Done / legal renewals)
    n += (car.history || []).length;
    // Count scheduled items that have never been done (no history entry)
    const doneSourceIds = new Set((car.history || []).map(h => h._sourceItemId).filter(Boolean));
    (car.maintenanceItems || []).forEach(item => {
      if (!doneSourceIds.has(item.id) && !item.lastDoneDate) n++;
    });
  });
  return n;
}

function isDemoLimitReached() {
  return !checkActivation() && countAllRecords() >= DEMO_RECORD_LIMIT;
}

function showDemoUpgradeModal() {
  openModal(`
    <div class="modal-header">
      <h2>Demo Limit Reached</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="demo-limit-banner">
        <div class="demo-limit-icon">🔒</div>
        <div class="demo-limit-text">
          <strong>You've used ${DEMO_RECORD_LIMIT}/${DEMO_RECORD_LIMIT} demo records</strong>
          <p>Purchase the full version to unlock unlimited records for all your cars.</p>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `);
}

function submitDemoActivation() {
  const code  = document.getElementById('demo-activation-code').value;
  const errEl = document.getElementById('demo-activation-error');
  if (activate(code)) {
    updateActivationLabel();
    closeModal();
    showToast('CarTrack activated! All limits removed.', 'success');
  } else {
    errEl.textContent = 'Invalid activation code. Please check your purchase email.';
  }
}

function activate(code) {
  if (code.trim().toUpperCase() === ACTIVATION_CODE) {
    localStorage.setItem(KEY_ACTIVATED, 'true');
    return true;
  }
  return false;
}

function updateActivationLabel() {
  const el = document.getElementById('sidebar-activation-label');
  if (el) el.textContent = checkActivation() ? 'Activated ✅' : 'Activation';
  updateDemoBanner();
}

function updateDemoBanner() {
  const banner = document.getElementById('demo-banner');
  const text   = document.getElementById('demo-banner-text');
  if (!banner || !text) return;
  if (checkActivation()) {
    banner.classList.add('hidden');
    return;
  }
  const used = Math.min(countAllRecords(), DEMO_RECORD_LIMIT);
  text.textContent = `🔒 Demo — ${used}/${DEMO_RECORD_LIMIT} records used`;
  banner.classList.remove('hidden');
}

function openActivationModal() {
  const isActivated = checkActivation();
  openModal(`
    <div class="modal-header">
      <h2>🔑 Activation</h2>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="modal-body">
      ${isActivated
        ? `<div class="activation-status activated">✅ CarTrack is activated</div>`
        : `<div class="activation-status not-activated">⚠️ Not activated</div>`
      }
      <div class="form-group" style="margin-top:20px;">
        <label for="modal-activation-code">Activation Code</label>
        <input type="text" id="modal-activation-code" class="form-input"
          placeholder="Enter your code here"
          autocomplete="off" autocorrect="off" autocapitalize="characters"
          spellcheck="false" maxlength="32"
          value="${isActivated ? ACTIVATION_CODE : ''}">
      </div>
      <p id="modal-activation-error" class="error-message" aria-live="polite"></p>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-navy" onclick="submitActivationModal()">Activate</button>
      </div>
    </div>
  `);
}

function submitActivationModal() {
  const code   = document.getElementById('modal-activation-code').value;
  const errEl  = document.getElementById('modal-activation-error');
  if (activate(code)) {
    updateActivationLabel();
    closeModal();
    showToast('CarTrack activated successfully!', 'success');
  } else {
    errEl.textContent = 'Invalid activation code. Please check your purchase email.';
  }
}

function showApp() {
  document.getElementById('app').classList.remove('hidden');
}

// ─── EVENT WIRING ─────────────────────────────────────
function wireEvents() {
  initSidebar();

  // Back button
  document.getElementById('btn-back').addEventListener('click', () => {
    if (currentView === 'car-detail' || currentView === 'settings') {
      navigateTo('dashboard');
    }
  });

  // Settings button
  document.getElementById('btn-settings').addEventListener('click', () => {
    navigateTo('settings');
  });

  // Close modal when clicking overlay backdrop
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Global help icon handler
  document.addEventListener('click', (e) => {
    const hi = e.target.closest('[data-help]');
    if (!hi) return;
    e.stopPropagation();
    const title = escHtml(hi.dataset.helpTitle || 'Help');
    const body  = hi.dataset.help;
    openModal(`
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" onclick="closeModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="help-modal-content">${body}</div>
    `);
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// ─── SERVICE WORKER REGISTRATION ─────────────────────
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
  }
}

// ─── INIT ─────────────────────────────────────────────
function init() {
  appData = loadData();
  wireEvents();
  registerServiceWorker();
  document.addEventListener('click', e => {
    if (!e.target.closest('.csd-wrapper')) {
      document.querySelectorAll('.csd-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });
  const isFirstLaunch = !localStorage.getItem('ct-first-launch');
  if (isFirstLaunch) {
    localStorage.setItem('ct-first-launch', 'true');
    navigateTo('guide');
  } else {
    navigateTo('dashboard');
  }
  setTimeout(checkAndNotify, 1500);
  setInterval(checkAndNotify, 3600000);
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
