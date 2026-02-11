
const STORAGE_KEY = "forge_data_v1";
const SUPABASE_URL = "https://ruuzraihxczeeeafkbve.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dXpyYWloeGN6ZWVlYWZrYnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTU5MzAsImV4cCI6MjA4NjE5MTkzMH0.OVLMNwN0e940dSd6-aZqzaFFXCY3hcbgR_-dGvF1OwE";
const SUPABASE_AUTH_URL_KEYS = [
  "code",
  "type",
  "access_token",
  "refresh_token",
  "expires_at",
  "expires_in",
  "token_type",
  "provider_token",
  "provider_refresh_token",
  "error",
  "error_code",
  "error_description"
];

const SEED_EXERCISES = [];

const LEGACY_SEEDED_IDS = new Set([
  "ex-bench",
  "ex-incline-db",
  "ex-overhead-press",
  "ex-pushup",
  "ex-dips",
  "ex-chest-fly",
  "ex-deadlift",
  "ex-row",
  "ex-db-row",
  "ex-pullup",
  "ex-assisted-pullup",
  "ex-lat-pulldown",
  "ex-back-squat",
  "ex-front-squat",
  "ex-rdl",
  "ex-leg-press",
  "ex-leg-curl",
  "ex-leg-extension",
  "ex-calf-raise",
  "ex-walking-lunge",
  "ex-hip-thrust",
  "ex-barbell-curl",
  "ex-hammer-curl",
  "ex-tri-pushdown",
  "ex-skull",
  "ex-plank",
  "ex-hanging-leg",
  "ex-russian-twist",
  "ex-run",
  "ex-cycle",
  "ex-rowing",
  "ex-jumprope",
  "ex-stair",
  "ex-elliptical",
  "ex-clean-press",
  "ex-kb-swing"
]);

const DEFAULT_STATE = {
  version: 1,
  lastModified: 0,
  settings: {
    units: "kg",
    restSecondsWork: 90,
    restSecondsDrop: 45,
    autoRest: true,
    barWeight: 20,
    plates: [25, 20, 15, 10, 5, 2.5, 1.25],
    bodyweight: 75,
    includeBarWeightInCalc: true
  },
  exercises: SEED_EXERCISES,
  routines: [],
  workouts: [],
  bodyMeasurements: [],
  muscleTagLibrary: {
    primary: [],
    detailed: []
  },
  activeWorkoutId: null
};

const PRIMARY_MUSCLE_OPTIONS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Lower Back",
  "Traps",
  "Neck",
  "Full Body"
];

const DETAILED_MUSCLE_OPTIONS = [
  "Upper Chest",
  "Mid Chest",
  "Lower Chest",
  "Lats",
  "Upper Back",
  "Mid Back",
  "Rear Delts",
  "Lateral Delts",
  "Front Delts",
  "Long Head Triceps",
  "Lateral Head Triceps",
  "Brachialis",
  "Brachioradialis",
  "Abs",
  "Obliques",
  "Spinal Erectors",
  "Hip Flexors",
  "Adductors",
  "Abductors",
  "Glute Max",
  "Glute Med",
  "Quads",
  "Hamstrings",
  "Calves"
];

const ui = {
  view: "workouts",
  editRoutineId: null,
  statsExerciseId: null,
  statsMetric: "heaviestWeight",
  statsMonthsBack: 6,
  muscleGrouping: "week",
  muscleMonthsBack: 1,
  muscleDimension: "primary",
  selectedMuscles: [],
  exerciseSearch: "",
  selectedRoutineId: null,
  replaceTarget: null,
  replaceSearch: "",
  editExerciseId: null,
  historyActionTarget: null,
  historyEditTarget: null,
  historyFilter: "all",
  measurementMetric: "bodyWeight",
  exercisePrimarySelection: [],
  exerciseDetailedSelection: [],
  editExercisePrimarySelection: [],
  editExerciseDetailedSelection: [],
  muscleSearchQuery: "",
  exercisePrimaryQuery: "",
  exerciseDetailedQuery: "",
  editExercisePrimaryQuery: "",
  editExerciseDetailedQuery: "",
  activeMultiSelect: null,
  muscleSelectionInitialized: false
};

const BODY_MEASUREMENT_FIELDS = [
  { key: "bodyWeight", label: "Body Weight", unit: "kg", decimals: 1, metricColorKey: "bodyWeight" },
  { key: "muscleWeight", label: "Muscle Weight", unit: "kg", decimals: 1, metricColorKey: "muscleWeight" },
  { key: "boneWeight", label: "Bone Weight", unit: "kg", decimals: 1, metricColorKey: "boneWeight" },
  { key: "bodyFat", label: "Body Fat", unit: "%", decimals: 1, metricColorKey: "bodyFat" },
  { key: "tbw", label: "TBW", unit: "%", decimals: 1, metricColorKey: "tbw" },
  { key: "bmi", label: "BMI", unit: "", decimals: 1, metricColorKey: "bmi" }
];

const EXERCISE_STATS_METRICS = [
  { key: "heaviestWeight", label: "Heaviest Weight Lifted", metricColorKey: "heaviestWeight", unit: "kg" },
  { key: "oneRmBrzycki", label: "Projected / True 1RM (Brzycki)", metricColorKey: "oneRmBrzycki", unit: "kg" },
  { key: "bestSetVolume", label: "Best Set Volume", metricColorKey: "bestSetVolume", unit: "kg" },
  { key: "bestSessionVolume", label: "Best Session Volume", metricColorKey: "bestSessionVolume", unit: "kg" },
  { key: "mostReps", label: "Most Reps Done", metricColorKey: "mostReps", unit: "reps" }
];

const MUSCLE_CHART_COLORS = [
  "var(--chart-series-1)",
  "var(--chart-series-2)",
  "var(--chart-series-3)",
  "var(--chart-series-4)",
  "var(--chart-series-5)",
  "var(--chart-series-6)",
  "var(--chart-series-7)",
  "var(--chart-series-8)"
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function cssVar(name, fallback = "") {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function resolveMetricColor(metricKey, fallback = "#4F66FF") {
  const configured = window.FORGE_COLORS?.getMetricColor?.(metricKey);
  if (configured) return configured;
  const token = cssVar(`--metric-${metricKey}`, "");
  return token || fallback;
}

function resolveSeriesColor(index, fallback = "#4F66FF") {
  const configured = window.FORGE_COLORS?.getSeriesColor?.(index);
  if (configured) return configured;
  return cssVar(`--chart-series-${(Math.abs(index) % 8) + 1}`, fallback);
}

function esc(str = "") {
  return String(str).replace(/[&<>"']/g, (ch) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[ch] || ch;
  });
}

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = JSON.parse(JSON.stringify(DEFAULT_STATE));
    fresh.exercises = normalizeExercises(fresh.exercises);
    return fresh;
  }
  try {
    const saved = JSON.parse(raw);
    const merged = JSON.parse(JSON.stringify(DEFAULT_STATE));
    merged.settings = mergeSettings(saved.settings || {});
    merged.exercises = normalizeExercises(saved.exercises);
    merged.routines = Array.isArray(saved.routines) ? saved.routines.map(normalizeRoutine) : [];
    merged.workouts = Array.isArray(saved.workouts) ? saved.workouts.map(normalizeWorkout) : [];
    merged.bodyMeasurements = Array.isArray(saved.bodyMeasurements)
      ? saved.bodyMeasurements.map(normalizeBodyMeasurement).filter(Boolean)
      : [];
    merged.muscleTagLibrary = normalizeMuscleTagLibrary(saved.muscleTagLibrary);
    merged.activeWorkoutId = saved.activeWorkoutId || null;
    merged.lastModified = saved.lastModified || 0;
    return merged;
  } catch (err) {
    const fallback = JSON.parse(JSON.stringify(DEFAULT_STATE));
    fallback.exercises = normalizeExercises(fallback.exercises);
    return fallback;
  }
}

function saveState() {
  state.lastModified = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleCloudSync();
}

let state = loadState();

let supabaseClient = null;
const cloud = {
  user: null,
  syncing: false,
  lastSync: null
};
let syncTimer = null;

function stripLegacyExercises(exercises) {
  if (!Array.isArray(exercises)) return [];
  return exercises.filter((exercise) => !LEGACY_SEEDED_IDS.has(exercise.id));
}

function normalizeMuscleGroupText(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean).join(", ");
  }
  return String(value || "").trim();
}

function normalizeMuscleTagValue(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeMuscleTagLibrary(library) {
  const safe = library && typeof library === "object" ? library : {};
  const normalizeList = (list) => uniqueSorted((Array.isArray(list) ? list : []).map(normalizeMuscleTagValue));
  return {
    primary: normalizeList(safe.primary),
    detailed: normalizeList(safe.detailed)
  };
}

function rememberMuscleTags(kind, tags) {
  if (kind !== "primary" && kind !== "detailed") return;
  const current = state.muscleTagLibrary?.[kind] || [];
  const merged = uniqueSorted([...current, ...tags.map(normalizeMuscleTagValue)]);
  if (!state.muscleTagLibrary) {
    state.muscleTagLibrary = { primary: [], detailed: [] };
  }
  state.muscleTagLibrary[kind] = merged;
}

function normalizeExercise(exercise) {
  if (!exercise || typeof exercise !== "object") return null;
  const normalizedType = exercise.type === "assisted" || exercise.type === "duration" ? exercise.type : "weight";
  return {
    ...exercise,
    id: exercise.id || uid(),
    name: String(exercise.name || "").trim(),
    category: String(exercise.category || "").trim(),
    type: normalizedType,
    primaryMuscleGroups: normalizeMuscleGroupText(
      exercise.primaryMuscleGroups || exercise.primaryMuscles || exercise.primaryMuscleGroup
    ),
    detailedMuscleGroups: normalizeMuscleGroupText(
      exercise.detailedMuscleGroups || exercise.detailedMuscles || exercise.detailMuscleGroup
    )
  };
}

function normalizeExercises(exercises) {
  return stripLegacyExercises(exercises)
    .map(normalizeExercise)
    .filter((exercise) => exercise && exercise.name);
}

function mergeSettings(saved = {}) {
  const merged = { ...DEFAULT_STATE.settings, ...saved };
  const legacyRest = saved.restSeconds;
  if (Number.isFinite(legacyRest)) {
    if (!Number.isFinite(saved.restSecondsWork)) merged.restSecondsWork = legacyRest;
    if (!Number.isFinite(saved.restSecondsDrop)) merged.restSecondsDrop = Math.max(10, Math.round(legacyRest * 0.5));
  }
  merged.includeBarWeightInCalc = saved.includeBarWeightInCalc !== false;
  return merged;
}

  function normalizeRoutine(routine) {
    const items = Array.isArray(routine.items) ? routine.items : [];
    return {
      ...routine,
      items: items.map((item) => ({
        ...item,
        sets: Array.isArray(item.sets)
          ? item.sets.map((set) => ({ ...set, completed: !!set.completed }))
          : []
      }))
    };
  }

  function normalizeWorkout(workout) {
    const items = Array.isArray(workout.items) ? workout.items : [];
    return {
      ...workout,
      items: items.map((item) => ({
        ...item,
        sets: Array.isArray(item.sets)
          ? item.sets.map((set) => ({ ...set, completed: !!set.completed }))
          : []
      }))
    };
  }

function normalizeBodyMeasurement(entry) {
  if (!entry || typeof entry !== "object") return null;
  const createdAt = entry.createdAt || new Date().toISOString();
  const normalized = {
    id: entry.id || uid(),
    createdAt
  };
  BODY_MEASUREMENT_FIELDS.forEach((field) => {
    const value = parseFloat(entry[field.key]);
    normalized[field.key] = Number.isFinite(value) ? value : null;
  });
  return normalized;
}


let photoDB = null;

function openPhotoDB() {
  if (photoDB) return Promise.resolve(photoDB);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("forge_photos", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("photos", { keyPath: "id" });
    };
    req.onsuccess = () => {
      photoDB = req.result;
      resolve(photoDB);
    };
    req.onerror = () => reject(req.error);
  });
}

function idbPut(store, value) {
  return openPhotoDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(store).put(value);
    });
  });
}

function idbGet(store, key) {
  return openPhotoDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

function idbDelete(store, key) {
  return openPhotoDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(store).delete(key);
    });
  });
}

let toastTimer = null;

function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
}

  function getExercise(id) {
    return state.exercises.find((ex) => ex.id === id);
  }

  function findExerciseByName(name) {
    const needle = String(name || "").trim().toLowerCase();
    if (!needle) return null;
    return state.exercises.find((ex) => ex.name.toLowerCase() === needle) || null;
  }

  function createExerciseFromName(name) {
    const trimmed = String(name || "").trim();
    if (!trimmed) return null;
    const exercise = {
      id: uid(),
      name: trimmed,
      category: "",
      type: "weight",
      primaryMuscleGroups: "",
      detailedMuscleGroups: ""
    };
    state.exercises.push(exercise);
    return exercise;
  }

  function ensureExercise(name) {
    return findExerciseByName(name) || createExerciseFromName(name);
  }

function getActiveWorkout() {
  return state.workouts.find((w) => w.id === state.activeWorkoutId) || null;
}

function getItemCollection(owner) {
  const workout = owner === "workout" ? getActiveWorkout() : null;
  const routine = owner === "routine" ? getEditRoutine() : null;
  const items = owner === "routine" ? routine?.items : workout?.items;
  return { workout, routine, items };
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function findBodyMeasurementField(fieldKey) {
  return BODY_MEASUREMENT_FIELDS.find((field) => field.key === fieldKey) || BODY_MEASUREMENT_FIELDS[0];
}

function formatMeasurementValue(fieldKey, value) {
  const field = findBodyMeasurementField(fieldKey);
  if (!Number.isFinite(value)) return "-";
  const formatted = value.toFixed(field.decimals);
  return field.unit ? `${formatted}${field.unit === "%" ? "%" : ` ${field.unit}`}` : formatted;
}

function getSortedBodyMeasurements() {
  return state.bodyMeasurements
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function getLatestBodyMeasurement() {
  const sorted = getSortedBodyMeasurements();
  return sorted[sorted.length - 1] || null;
}

function getLatestBodyWeight() {
  const sorted = getSortedBodyMeasurements().slice().reverse();
  const latestWithWeight = sorted.find((entry) => Number.isFinite(entry.bodyWeight));
  return latestWithWeight ? latestWithWeight.bodyWeight : null;
}

function formatExerciseType(type) {
  if (type === "assisted") return "Assisted";
  if (type === "duration") return "Duration";
  return "Weight";
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "-";
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function parseDuration(value) {
  if (!value) return 0;
  const raw = String(value).trim();
  if (raw.includes(":")) {
    const [m, s] = raw.split(":").map((v) => parseInt(v, 10));
    if (!Number.isFinite(m)) return 0;
    return (m * 60) + (Number.isFinite(s) ? s : 0);
  }
  const minutes = parseFloat(raw);
  return Number.isFinite(minutes) ? minutes * 60 : 0;
}

function calcOneRm(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

function effectiveWeight(set, workoutBodyweight) {
  if (set.type === "weight") return set.weight || 0;
  if (set.type === "assisted") {
    const bw = set.bodyweight ?? workoutBodyweight ?? state.settings.bodyweight;
    if (!Number.isFinite(bw)) return 0;
    return Math.max(0, bw - (set.assist || 0));
  }
  return 0;
}

function setVolume(set, workoutBodyweight) {
  const weight = effectiveWeight(set, workoutBodyweight);
  if (!weight || !set.reps) return 0;
  return weight * set.reps;
}

const restTimer = {
  remaining: 0,
  interval: null
};

function getRestSeconds(tag = "work") {
  const normalizedTag = String(tag || "work").toLowerCase();
  const key = normalizedTag === "drop" || normalizedTag === "dropset" || normalizedTag === "drop-set"
    ? "restSecondsDrop"
    : "restSecondsWork";
  const value = state.settings[key];
  return Math.max(10, Number.isFinite(value) ? value : 0);
}

  function updateTimerUI() {
    const mini = $("#restMini");
    const display = $("#restCountdown");
    if (!mini || !display) return;
    if (restTimer.remaining > 0) {
      display.textContent = formatDuration(restTimer.remaining);
      mini.classList.add("active");
      return;
    }
    display.textContent = "00:00";
    mini.classList.remove("active");
  }

function startTimer(seconds) {
  const duration = Math.max(0, Math.round(seconds));
  restTimer.remaining = duration;
  updateTimerUI();
  if (restTimer.interval) clearInterval(restTimer.interval);
  if (!duration) return;
  restTimer.interval = setInterval(() => {
    restTimer.remaining -= 1;
    updateTimerUI();
    if (restTimer.remaining <= 0) {
      stopTimer(false);
      toast("Rest complete");
    }
  }, 1000);
}

function stopTimer(clear = true) {
  if (restTimer.interval) {
    clearInterval(restTimer.interval);
    restTimer.interval = null;
  }
  if (clear) restTimer.remaining = 0;
  updateTimerUI();
}

function updateThemeMetaColor(theme) {
  const meta = document.querySelector("meta[name='theme-color']");
  if (!meta) return;
  const color = theme === "dark"
    ? cssVar("--color-app-bg", "#0B1024")
    : cssVar("--color-app-bg", "#F6F8FC");
  meta.setAttribute("content", color);
}

function applyTheme(theme, options = {}) {
  const mode = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = mode;
  document.documentElement.dataset.theme = mode;
  if (window.FORGE_COLORS?.applyTheme) {
    window.FORGE_COLORS.applyTheme(mode);
  }
  void options;
  updateThemeMetaColor(mode);
}

  function setView(view) {
    const resolvedView = view === "workouts" && getActiveWorkout() ? "session" : view;
    ui.view = resolvedView;
    $$(".view").forEach((section) => {
      section.classList.toggle("active", section.id === `view-${resolvedView}`);
    });
    const navView = resolvedView === "session" ? "workouts" : resolvedView;
    $$(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === navView);
    });
  }

function startWorkout(routineId = null) {
  const routine = routineId ? state.routines.find((r) => r.id === routineId) : null;
  const now = new Date().toISOString();
  const latestBodyWeight = getLatestBodyWeight();
  const workout = {
    id: uid(),
    name: routine ? routine.name : "Workout",
    createdAt: now,
    routineId: routine ? routine.id : null,
    bodyweight: Number.isFinite(latestBodyWeight) ? latestBodyWeight : state.settings.bodyweight,
    notes: "",
    photoIds: [],
    items: []
  };
    if (routine) {
      workout.items = routine.items.map((item) => ({
        id: uid(),
        exerciseId: item.exerciseId,
        group: item.group || "",
        note: item.note || "",
        sets: (item.sets || []).map((set) => ({ ...set, id: uid(), completed: false }))
      }));
    }
  state.workouts.unshift(workout);
  state.activeWorkoutId = workout.id;
  saveState();
  renderLog();
  renderHistory();
  setView("session");
  toast("Workout started");
}

  function endWorkout() {
    const active = getActiveWorkout();
    if (!active) return;
    active.endedAt = new Date().toISOString();
    state.activeWorkoutId = null;
    saveState();
    renderLog();
    renderHistory();
    setView("workouts");
    toast("Workout saved");
  }

  function cancelWorkout() {
    const active = getActiveWorkout();
    if (!active) return;
    state.workouts = state.workouts.filter((w) => w.id !== active.id);
    state.activeWorkoutId = null;
    saveState();
    renderLog();
    renderHistory();
    setView("workouts");
    toast("Workout canceled");
    closeFinishSheet();
  }

  function openFinishSheet() {
    const sheet = $("#finishSheet");
    if (sheet) sheet.classList.remove("hidden");
  }

  function closeFinishSheet() {
    const sheet = $("#finishSheet");
    if (sheet) sheet.classList.add("hidden");
  }

  function completeUnfinishedSets() {
    const active = getActiveWorkout();
    if (!active) return;
    active.items.forEach((item) => {
      item.sets.forEach((set) => {
        set.completed = true;
      });
    });
    closeFinishSheet();
    endWorkout();
  }

function addWorkoutExercise(exerciseId) {
  const workout = getActiveWorkout();
  if (!workout) return;
  const exercise = getExercise(exerciseId);
  if (!exercise) return;
  workout.items.push({
    id: uid(),
    exerciseId: exercise.id,
    group: "",
    note: "",
    sets: []
  });
  saveState();
  renderLog();
}

function removeWorkoutExercise(itemId) {
  const workout = getActiveWorkout();
  if (!workout) return;
  workout.items = workout.items.filter((item) => item.id !== itemId);
  saveState();
  renderLog();
}

function replaceExercise(owner, itemId, newExerciseId) {
  if (!newExerciseId) return;
  const { items } = getItemCollection(owner);
  if (!items) return;
  const item = items.find((entry) => entry.id === itemId);
  if (!item) return;
  if (item.exerciseId === newExerciseId) return;
  const nextExercise = getExercise(newExerciseId);
  if (!nextExercise) return;
  const existingType = item.sets?.[0]?.type;
  item.exerciseId = newExerciseId;
  if (existingType && existingType !== nextExercise.type) {
    item.sets = [];
  } else if (item.sets) {
    item.sets.forEach((set) => {
      set.type = nextExercise.type;
    });
  }
  saveState();
  owner === "routine" ? renderRoutines() : renderLog();
}

function getReplaceTargetItem() {
  if (!ui.replaceTarget) return null;
  const { owner, itemId } = ui.replaceTarget;
  const { items } = getItemCollection(owner);
  if (!items) return null;
  return items.find((entry) => entry.id === itemId) || null;
}

function renderReplaceSheet() {
  const sheet = $("#replaceSheet");
  const list = $("#replaceList");
  const title = $("#replaceSheetTitle");
  if (!sheet || !list || !title) return;
  if (!ui.replaceTarget) {
    list.innerHTML = "";
    title.textContent = "Replace Exercise";
    return;
  }
  const item = getReplaceTargetItem();
  if (!item) {
    closeReplaceSheet();
    return;
  }
  const currentExercise = getExercise(item.exerciseId);
  title.textContent = currentExercise
    ? `Replace ${currentExercise.name}`
    : "Replace Exercise";
  const term = ui.replaceSearch.trim().toLowerCase();
  const options = state.exercises
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((ex) => {
      if (!term) return true;
      const hay = `${ex.name} ${ex.category || ""} ${ex.primaryMuscleGroups || ""} ${ex.detailedMuscleGroups || ""}`.toLowerCase();
      return hay.includes(term);
    });
  if (!options.length) {
    list.innerHTML = "<div class=\"muted small\">No exercises found.</div>";
    return;
  }
  list.innerHTML = options.map((ex) => {
    return `
      <button type="button" class="result-item replace-option" data-action="replace-choose" data-exercise-id="${ex.id}">
        <div class="title">${esc(ex.name)}</div>
        <div class="muted small">${esc(ex.category || "General")} · ${formatExerciseType(ex.type)}</div>
      </button>
    `;
  }).join("");
}

function openReplaceSheet(owner, itemId) {
  ui.replaceTarget = { owner, itemId };
  ui.replaceSearch = "";
  const search = $("#replaceSearch");
  if (search) search.value = "";
  renderReplaceSheet();
  const sheet = $("#replaceSheet");
  if (sheet) sheet.classList.remove("hidden");
}

function closeReplaceSheet() {
  ui.replaceTarget = null;
  ui.replaceSearch = "";
  const search = $("#replaceSearch");
  if (search) search.value = "";
  const sheet = $("#replaceSheet");
  if (sheet) sheet.classList.add("hidden");
}

function chooseReplacement(exerciseId) {
  if (!ui.replaceTarget || !exerciseId) return;
  replaceExercise(ui.replaceTarget.owner, ui.replaceTarget.itemId, exerciseId);
  closeReplaceSheet();
}

function openExerciseEditSheet(exerciseId) {
  const exercise = state.exercises.find((ex) => ex.id === exerciseId);
  if (!exercise) return;
  ui.editExerciseId = exercise.id;
  const name = $("#editExerciseName");
  if (name) name.value = exercise.name || "";
  ui.editExercisePrimarySelection = uniqueSorted(parseMuscleGroups(exercise.primaryMuscleGroups));
  ui.editExerciseDetailedSelection = uniqueSorted(parseMuscleGroups(exercise.detailedMuscleGroups));
  ui.editExercisePrimaryQuery = "";
  ui.editExerciseDetailedQuery = "";
  renderExerciseMuscleSelectors();
  const sheet = $("#exerciseEditSheet");
  if (sheet) sheet.classList.remove("hidden");
}

function closeExerciseEditSheet() {
  ui.editExerciseId = null;
  ui.editExercisePrimarySelection = [];
  ui.editExerciseDetailedSelection = [];
  ui.editExercisePrimaryQuery = "";
  ui.editExerciseDetailedQuery = "";
  const sheet = $("#exerciseEditSheet");
  if (sheet) sheet.classList.add("hidden");
}

function saveExerciseEdit() {
  if (!ui.editExerciseId) return;
  const exercise = state.exercises.find((ex) => ex.id === ui.editExerciseId);
  if (!exercise) return;
  const name = $("#editExerciseName")?.value.trim() || "";
  const primaryMuscleGroups = ui.editExercisePrimarySelection.join(", ");
  const detailedMuscleGroups = ui.editExerciseDetailedSelection.join(", ");
  if (!name) {
    toast("Exercise needs a name");
    return;
  }
  exercise.name = name;
  exercise.primaryMuscleGroups = primaryMuscleGroups;
  exercise.detailedMuscleGroups = detailedMuscleGroups;
  rememberMuscleTags("primary", ui.editExercisePrimarySelection);
  rememberMuscleTags("detailed", ui.editExerciseDetailedSelection);
  saveState();
  renderExercises();
  renderRoutines();
  renderLog();
  renderStats();
  renderHistory();
  renderReplaceSheet();
  closeExerciseEditSheet();
  toast("Exercise updated");
}

function normalizeSetTag(tag) {
  const normalized = String(tag || "work").toLowerCase();
  if (normalized === "drop-set") return "drop";
  if (normalized === "dropset") return "drop";
  if (normalized === "failure") return "failure";
  if (normalized === "drop") return "drop";
  return "work";
}

function nextSetTag(tag) {
  const order = ["work", "failure", "drop"];
  const current = normalizeSetTag(tag);
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

function setTagShort(tag) {
  const current = normalizeSetTag(tag);
  if (current === "failure") return "F";
  if (current === "drop") return "D";
  return "W";
}

function setTagLabel(tag) {
  const current = normalizeSetTag(tag);
  if (current === "failure") return "Failure";
  if (current === "drop") return "Drop";
  return "Work";
}

function cycleSetTag(owner, itemId, setId) {
  const { items } = getItemCollection(owner);
  if (!items) return;
  const item = items.find((entry) => entry.id === itemId);
  if (!item) return;
  const set = item.sets.find((entry) => entry.id === setId);
  if (!set) return;
  set.tag = nextSetTag(set.tag);
  saveState();
  if (owner === "routine") {
    renderRoutines();
    return;
  }
  if (set.completed) {
    startTimer(getRestSeconds(set.tag));
  }
  renderLog();
}

function addSetFromCard(button) {
  const owner = button.dataset.owner || "workout";
  const itemId = button.dataset.itemId;
  const workout = owner === "workout" ? getActiveWorkout() : null;
  const routine = owner === "routine" ? getEditRoutine() : null;
  const collection = owner === "routine" ? routine?.items : workout?.items;
  if (!collection) return;
  const item = collection.find((it) => it.id === itemId);
  if (!item) return;
  const exercise = getExercise(item.exerciseId);
  if (!exercise) return;

    const set = { id: uid(), type: exercise.type, tag: "work", completed: false };
  item.sets.push(set);
  saveState();
  owner === "routine" ? renderRoutines() : renderLog();
}

function removeSet(itemId, setId, owner = "workout") {
  const workout = owner === "workout" ? getActiveWorkout() : null;
  const routine = owner === "routine" ? getEditRoutine() : null;
  const collection = owner === "routine" ? routine?.items : workout?.items;
  if (!collection) return;
  const item = collection.find((it) => it.id === itemId);
  if (!item) return;
  item.sets = item.sets.filter((set) => set.id !== setId);
  saveState();
  owner === "routine" ? renderRoutines() : renderLog();
}

function createRoutine(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    toast("Name your workout");
    return null;
  }
  const routine = {
    id: uid(),
    name: trimmed,
    items: []
  };
  state.routines.push(routine);
  ui.editRoutineId = routine.id;
  saveState();
  renderRoutines();
  return routine;
}

function deleteRoutine(routineId) {
  state.routines = state.routines.filter((r) => r.id !== routineId);
  if (ui.editRoutineId === routineId) ui.editRoutineId = null;
  saveState();
  renderRoutines();
}

  function addRoutineItem() {
    const routine = getEditRoutine();
    if (!routine) {
      toast("Create or select a workout");
      return;
    }
    const nameInput = $("#routineExerciseInput");
    const exerciseName = nameInput?.value.trim();
    if (!exerciseName) {
      toast("Add an exercise name");
      return;
    }
    const exercise = ensureExercise(exerciseName);
    if (!exercise) return;
    routine.items.push({
      id: uid(),
      exerciseId: exercise.id,
      group: "",
      note: "",
      sets: []
    });
    if (nameInput) nameInput.value = "";
    saveState();
    renderRoutines();
    renderExercises();
    renderStats();
  }

function removeRoutineItem(routineId, itemId) {
  const routine = state.routines.find((r) => r.id === routineId);
  if (!routine) return;
  routine.items = routine.items.filter((item) => item.id !== itemId);
  saveState();
  renderRoutines();
}

function moveRoutineItem(routineId, itemId, delta) {
  const routine = state.routines.find((r) => r.id === routineId);
  if (!routine) return;
  const index = routine.items.findIndex((item) => item.id === itemId);
  if (index < 0) return;
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= routine.items.length) return;
  const [moved] = routine.items.splice(index, 1);
  routine.items.splice(newIndex, 0, moved);
  saveState();
  renderRoutines();
}

function getEditRoutine() {
  if (!ui.editRoutineId) return null;
  return state.routines.find((r) => r.id === ui.editRoutineId) || null;
}

function createExercise() {
  const name = $("#exerciseName")?.value.trim();
  const category = "";
  const type = "weight";
  const primaryMuscleGroups = ui.exercisePrimarySelection.join(", ");
  const detailedMuscleGroups = ui.exerciseDetailedSelection.join(", ");
  if (!name) {
    toast("Exercise needs a name");
    return;
  }
  const exercise = {
    id: uid(),
    name,
    category,
    type,
    primaryMuscleGroups,
    detailedMuscleGroups
  };
  state.exercises.push(exercise);
  rememberMuscleTags("primary", ui.exercisePrimarySelection);
  rememberMuscleTags("detailed", ui.exerciseDetailedSelection);
  $("#exerciseName").value = "";
  ui.exercisePrimarySelection = [];
  ui.exerciseDetailedSelection = [];
  ui.exercisePrimaryQuery = "";
  ui.exerciseDetailedQuery = "";
  if (ui.activeMultiSelect === "exercise-primary" || ui.activeMultiSelect === "exercise-detailed") {
    ui.activeMultiSelect = null;
  }
  saveState();
  renderExercises();
  renderRoutines();
  renderLog();
  renderStats();
  toast("Exercise added");
}

function exerciseInUse(exerciseId) {
  const inRoutines = state.routines.some((r) => r.items.some((item) => item.exerciseId === exerciseId));
  const inWorkouts = state.workouts.some((w) => w.items.some((item) => item.exerciseId === exerciseId));
  return inRoutines || inWorkouts;
}

function deleteExercise(exerciseId) {
  if (exerciseInUse(exerciseId)) {
    toast("Exercise is used in workouts or sessions");
    return;
  }
  state.exercises = state.exercises.filter((ex) => ex.id !== exerciseId);
  saveState();
  renderExercises();
  renderRoutines();
  renderLog();
  renderStats();
}
function renderLog() {
  renderLandingWorkouts();
  renderSession();
}

function renderSession() {
  const active = getActiveWorkout();
  const activePanel = $("#activeWorkoutPanel");
  if (!activePanel) return;

  if (!active) {
    activePanel.classList.add("hidden");
    return;
  }
  activePanel.classList.remove("hidden");

    const nameInput = $("[data-field='workout-name']");
    const notesInput = $("[data-field='workout-notes']");
    if (nameInput) nameInput.value = active.name || "";
    if (notesInput) notesInput.value = active.notes || "";

  const addSelect = $("#addExerciseSelect");
  if (addSelect) {
    if (state.exercises.length) {
      addSelect.disabled = false;
      addSelect.innerHTML = state.exercises
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((ex) => `<option value="${ex.id}">${esc(ex.name)}</option>`)
        .join("");
    } else {
      addSelect.disabled = true;
      addSelect.innerHTML = "<option value=\"\">Add exercises first</option>";
    }
  }
  const addButton = document.querySelector("[data-action='add-workout-exercise']");
  if (addButton) addButton.disabled = !state.exercises.length;
  const addExerciseHint = document.querySelector(".add-exercise .muted");
  if (addExerciseHint) {
    addExerciseHint.textContent = state.exercises.length
      ? "Choose from your library or create a new one."
      : "Add exercises in the Exercises tab first.";
  }

  const container = $("#workoutExercises");
  if (container) {
    if (!active.items.length) {
      container.innerHTML = "<div class=\"empty\">Add an exercise to start logging.</div>";
    } else {
      container.innerHTML = active.items.map((item) => renderWorkoutExercise(item)).join("");
    }
  }

  updateTimerUI();
  renderPhotoStrip(active.photoIds || []);
}

  function renderSetsHeader(type, owner) {
    const loadLabel = type === "assisted" ? "Assist" : type === "duration" ? "Time" : "kg";
    const repsLabel = type === "duration" ? "Distance" : "Reps";
    const doneLabel = owner === "workout" ? "<div>Done</div>" : "";
    return `<div class="set-row owner-${owner} header"><div>Set</div><div>${loadLabel}</div><div>${repsLabel}</div>${doneLabel}<div></div></div>`;
  }

  function renderSetRow(set, index, itemId, owner) {
    const tag = normalizeSetTag(set.tag || "work");
    const baseAttrs = `data-owner="${owner}" data-item-id="${itemId}" data-set-id="${set.id}"`;
    let loadField = "";
    let repsField = "";

  if (set.type === "duration") {
    loadField = `<input type="text" placeholder="mm:ss" value="${set.durationSec ? formatDuration(set.durationSec) : ""}" data-set-field="duration" ${baseAttrs}>`;
    repsField = `<input type="number" step="0.1" placeholder="km" value="${Number.isFinite(set.distance) ? set.distance : ""}" data-set-field="distance" ${baseAttrs}>`;
  } else if (set.type === "assisted") {
    loadField = `<input type="number" step="0.5" placeholder="Assist" value="${Number.isFinite(set.assist) ? set.assist : ""}" data-set-field="assist" ${baseAttrs}>`;
    repsField = `<input type="number" step="1" placeholder="Reps" value="${Number.isFinite(set.reps) ? set.reps : ""}" data-set-field="reps" ${baseAttrs}>`;
  } else {
    loadField = `<input type="number" step="0.5" placeholder="kg" value="${Number.isFinite(set.weight) ? set.weight : ""}" data-set-field="weight" ${baseAttrs}>`;
    repsField = `<input type="number" step="1" placeholder="Reps" value="${Number.isFinite(set.reps) ? set.reps : ""}" data-set-field="reps" ${baseAttrs}>`;
  }

    const doneCell = owner === "workout"
      ? `<div class="set-check"><input type="checkbox" ${set.completed ? "checked" : ""} data-set-field="complete" ${baseAttrs}></div>`
      : "";

    return `
      <div class="set-row owner-${owner}${set.completed ? " completed" : ""}">
        <button type="button" class="set-pill set-tag-toggle tag-${tag}" data-action="cycle-set-tag" data-owner="${owner}" data-item-id="${itemId}" data-set-id="${set.id}" title="Tag: ${setTagLabel(tag)}">
          <span class="set-pill-num">${index + 1}</span>
          <span class="set-pill-tag">${setTagShort(tag)}</span>
        </button>
        <div class="set-cell">${loadField}</div>
        <div class="set-cell">${repsField}</div>
        ${doneCell}
        <button class="ghost small set-remove" data-action="remove-set" data-owner="${owner}" data-item-id="${itemId}" data-set-id="${set.id}">-</button>
      </div>
    `;
  }

function renderExerciseCard(item, options) {
  const owner = options.owner;
  const exercise = getExercise(item.exerciseId);
  if (!exercise) return "";
  const meta = `${esc(exercise.category || "General")} · ${formatExerciseType(exercise.type)}`;
  const setsHeader = renderSetsHeader(exercise.type, owner);
  const setsRows = item.sets.map((set, index) => renderSetRow(set, index, item.id, owner)).join("");
  const setsHtml = item.sets.length ? setsHeader + setsRows : `${setsHeader}<div class="muted small">No sets yet.</div>`;
  const tagHelp = item.sets.length
    ? "<div class=\"muted small set-tag-help\">Tap set number to cycle tag (W, F, D).</div>"
    : "";
    const actions = owner === "routine"
      ? `
        <button class="ghost small" data-action="move-routine-item-up" data-routine-id="${options.routineId}" data-item-id="${item.id}">Up</button>
        <button class="ghost small" data-action="move-routine-item-down" data-routine-id="${options.routineId}" data-item-id="${item.id}">Down</button>
        <button class="ghost small" data-action="replace-exercise" data-owner="${owner}" data-item-id="${item.id}">Replace</button>
        <button class="ghost small" data-action="remove-routine-item" data-routine-id="${options.routineId}" data-item-id="${item.id}">Remove</button>
      `
      : `
        <button class="ghost small" data-action="replace-exercise" data-owner="${owner}" data-item-id="${item.id}">Replace</button>
        <button class="ghost small" data-action="remove-workout-exercise" data-item-id="${item.id}">Remove</button>
      `;

    return `
      <div class="card exercise-card" data-item-id="${item.id}">
        <div class="exercise-header">
          <div>
            <div class="exercise-title">${esc(exercise.name)}</div>
            <div class="exercise-meta">${meta}</div>
          </div>
          <div class="exercise-actions">
            ${actions}
          </div>
        </div>
        <div class="exercise-note-line">
          <input type="text" data-field="item-note" data-owner="${owner}" data-item-id="${item.id}" placeholder="Note (optional)" value="${esc(item.note || "")}">
        </div>
        <div class="sets">${setsHtml}</div>
        ${tagHelp}
        <div class="add-set">
          <button class="primary" data-action="add-set" data-owner="${owner}" data-item-id="${item.id}">+ Add Set</button>
        </div>
      </div>
    `;
  }

function renderWorkoutExercise(item) {
  return renderExerciseCard(item, { owner: "workout" });
}

function renderLandingWorkouts() {
  const grid = $("#landingWorkouts");
  if (!grid) return;
  if (!state.routines.length) {
    grid.innerHTML = "<div class=\"muted small\">No workouts yet. Create one to get started.</div>";
    return;
  }
  grid.innerHTML = state.routines.map((routine) => {
    return `
      <div class="workout-card" data-action="workout-options" data-routine-id="${routine.id}">
        <div class="workout-title">${esc(routine.name)}</div>
      </div>
    `;
  }).join("");
}

function openWorkoutSheet(routineId) {
  const routine = state.routines.find((entry) => entry.id === routineId);
  if (!routine) return;
  ui.selectedRoutineId = routineId;
  const sheet = $("#workoutSheet");
  const title = $("#workoutSheetTitle");
  if (title) title.textContent = routine.name;
  if (sheet) sheet.classList.remove("hidden");
}

function closeWorkoutSheet() {
  const sheet = $("#workoutSheet");
  if (sheet) sheet.classList.add("hidden");
  ui.selectedRoutineId = null;
}

function getHistoryEntries() {
  const workoutEntries = state.workouts
    .filter((workout) => workout.id !== state.activeWorkoutId)
    .map((workout) => ({ type: "workout", createdAt: workout.createdAt, workout }));
  const measurementEntries = state.bodyMeasurements
    .map((measurement) => ({ type: "measurement", createdAt: measurement.createdAt, measurement }));
  let merged = [...workoutEntries, ...measurementEntries];
  if (ui.historyFilter === "workouts") {
    merged = merged.filter((entry) => entry.type === "workout");
  } else if (ui.historyFilter === "measurements") {
    merged = merged.filter((entry) => entry.type === "measurement");
  }
  return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderWorkoutHistoryItem(workout) {
  const volume = workoutVolume(workout);
  const exerciseCount = workout.items.length;
  return `
    <div class="result-item history-item" data-action="history-details" data-entry-type="workout" data-workout-id="${workout.id}">
      <div>
        <div class="title">${esc(workout.name || "Workout")}</div>
        <div class="muted small">${formatDate(workout.createdAt)} · ${exerciseCount} exercises</div>
      </div>
      <div class="history-actions">
        <div class="title">${volume.toFixed(0)} kg</div>
        <button class="ghost icon-btn" data-action="history-options" data-entry-type="workout" data-workout-id="${workout.id}" aria-label="History entry options">⋯</button>
      </div>
    </div>
  `;
}

function renderMeasurementHistoryItem(measurement) {
  const primary = Number.isFinite(measurement.bodyWeight)
    ? `${measurement.bodyWeight.toFixed(1)} kg`
    : "No weight";
  return `
    <div class="result-item history-item history-measurement" data-action="history-details" data-entry-type="measurement" data-measurement-id="${measurement.id}">
      <div>
        <div class="title">Body Measurements</div>
        <div class="muted small">${formatDate(measurement.createdAt)}</div>
      </div>
      <div class="history-actions">
        <div class="title">${primary}</div>
        <button class="ghost icon-btn" data-action="history-options" data-entry-type="measurement" data-measurement-id="${measurement.id}" aria-label="History entry options">⋯</button>
      </div>
    </div>
  `;
}

function renderHistory() {
  const list = $("#historyList");
  if (!list) return;
  const filters = $("#historyFilters");
  if (filters) {
    $$("button[data-filter]", filters).forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === ui.historyFilter);
    });
  }
  const entries = getHistoryEntries();
  if (!entries.length) {
    list.innerHTML = "<div class=\"muted small\">No history entries yet.</div>";
    return;
  }
  list.innerHTML = entries.map((entry) => (
    entry.type === "workout"
      ? renderWorkoutHistoryItem(entry.workout)
      : renderMeasurementHistoryItem(entry.measurement)
  )).join("");
}

  function workoutVolume(workout) {
    let volume = 0;
    workout.items.forEach((item) => {
      item.sets.forEach((set) => {
        if (set.type === "duration") return;
        volume += setVolume(set, workout.bodyweight);
      });
    });
    return volume;
  }

  function workoutTotals(workout) {
    let sets = 0;
    let reps = 0;
    let weight = 0;
    let hasDuration = false;
    workout.items.forEach((item) => {
      item.sets.forEach((set) => {
        sets += 1;
        if (set.type === "duration") {
          hasDuration = true;
          if (set.durationSec) reps += set.durationSec;
          return;
        }
        if (set.reps) reps += set.reps;
        weight += setVolume(set, workout.bodyweight);
      });
    });
    return { sets, reps, weight, hasDuration };
  }

  function formatHistorySet(set, workout) {
    if (set.type === "duration") {
      const time = set.durationSec ? formatDuration(set.durationSec) : "-";
      const distance = Number.isFinite(set.distance) ? `${set.distance} km` : "";
      return distance ? `${time} · ${distance}` : time;
    }
    if (set.type === "assisted") {
      const assist = Number.isFinite(set.assist) ? `${set.assist} kg` : "-";
      const reps = Number.isFinite(set.reps) ? `${set.reps} reps` : "-";
      return `${assist} x ${reps}`;
    }
    const weight = Number.isFinite(set.weight) ? set.weight : effectiveWeight(set, workout.bodyweight);
    const reps = Number.isFinite(set.reps) ? set.reps : "-";
    return `${weight || "-"} kg x ${reps}`;
  }

function openWorkoutHistorySheet(workoutId) {
    const workout = state.workouts.find((w) => w.id === workoutId);
    if (!workout) return;
    const title = $("#historySheetTitle");
    if (title) title.textContent = "Workout Details";
    const details = $("#historyDetails");
    if (!details) return;
    const durationSec = workout.endedAt
      ? Math.max(0, Math.round((new Date(workout.endedAt) - new Date(workout.createdAt)) / 1000))
      : 0;
    const totals = workoutTotals(workout);
    const repsLabel = totals.hasDuration ? formatDuration(totals.reps) : `${totals.reps}`;
    const weightLabel = totals.weight ? `${totals.weight.toFixed(0)} kg` : "-";

    const exerciseHtml = workout.items.map((item) => {
      const ex = getExercise(item.exerciseId);
      const setLines = item.sets.length
        ? item.sets.map((set, idx) => `<div class="history-set">Set ${idx + 1}: ${formatHistorySet(set, workout)}</div>`).join("")
        : "<div class=\"muted small\">No sets logged.</div>";
      return `
        <div class="history-exercise">
          <div class="title">${esc(ex?.name || "Exercise")}</div>
          <div class="muted small">${formatExerciseType(ex?.type || "weight")}</div>
          <div class="history-set-list">${setLines}</div>
        </div>
      `;
    }).join("");

    details.innerHTML = `
      <div class="history-summary">
        <div class="result-item"><div>Duration</div><div>${durationSec ? formatDuration(durationSec) : "-"}</div></div>
        <div class="result-item"><div>Exercises</div><div>${workout.items.length}</div></div>
        <div class="result-item"><div>Sets</div><div>${totals.sets}</div></div>
        <div class="result-item"><div>Total Reps</div><div>${repsLabel}</div></div>
        <div class="result-item"><div>Total Weight</div><div>${weightLabel}</div></div>
      </div>
      <div class="history-exercises">${exerciseHtml}</div>
    `;

    const sheet = $("#historySheet");
    if (sheet) sheet.classList.remove("hidden");
  }

function openBodyMeasurementHistorySheet(measurementId) {
  const measurement = state.bodyMeasurements.find((entry) => entry.id === measurementId);
  if (!measurement) return;
  const title = $("#historySheetTitle");
  if (title) title.textContent = "Body Measurement Details";
  const details = $("#historyDetails");
  if (!details) return;
  const rows = BODY_MEASUREMENT_FIELDS.map((field) => {
    return `<div class="result-item"><div>${field.label}</div><div>${formatMeasurementValue(field.key, measurement[field.key])}</div></div>`;
  }).join("");
  details.innerHTML = `
    <div class="history-detail-grid">
      <div class="result-item"><div>Date</div><div>${formatDateTime(measurement.createdAt)}</div></div>
      ${rows}
    </div>
  `;
  const sheet = $("#historySheet");
  if (sheet) sheet.classList.remove("hidden");
}

function openHistorySheet(type, id) {
  if (type === "measurement") {
    openBodyMeasurementHistorySheet(id);
    return;
  }
  openWorkoutHistorySheet(id);
}

function closeHistorySheet() {
  const sheet = $("#historySheet");
  if (sheet) sheet.classList.add("hidden");
}

function getHistoryTarget(type, id) {
  if (type === "measurement") {
    const measurement = state.bodyMeasurements.find((entry) => entry.id === id);
    return measurement ? { type, id, label: "Body Measurement" } : null;
  }
  const workout = state.workouts.find((entry) => entry.id === id);
  return workout ? { type: "workout", id, label: workout.name || "Workout" } : null;
}

function openHistoryActionSheet(type, id) {
  const target = getHistoryTarget(type, id);
  if (!target) return;
  ui.historyActionTarget = target;
  const title = $("#historyActionTitle");
  if (title) title.textContent = target.label;
  const sheet = $("#historyActionSheet");
  if (sheet) sheet.classList.remove("hidden");
}

function closeHistoryActionSheet() {
  const sheet = $("#historyActionSheet");
  if (sheet) sheet.classList.add("hidden");
  ui.historyActionTarget = null;
}

function measurementEditInputId(fieldKey) {
  return `historyEditMeasure${fieldKey.charAt(0).toUpperCase()}${fieldKey.slice(1)}`;
}

function openHistoryEditSheet(type, id) {
  const target = getHistoryTarget(type, id);
  if (!target) return;
  ui.historyEditTarget = target;
  const title = $("#historyEditTitle");
  if (title) title.textContent = target.type === "measurement" ? "Edit Body Measurement" : "Edit Workout";

  const workoutFields = $("#historyEditWorkoutFields");
  const measurementFields = $("#historyEditMeasurementFields");
  if (workoutFields) workoutFields.classList.toggle("hidden", target.type !== "workout");
  if (measurementFields) measurementFields.classList.toggle("hidden", target.type !== "measurement");

  if (target.type === "workout") {
    const workout = state.workouts.find((entry) => entry.id === target.id);
    if (!workout) return;
    const name = $("#historyEditWorkoutName");
    const bodyweight = $("#historyEditWorkoutBodyweight");
    const notes = $("#historyEditWorkoutNotes");
    if (name) name.value = workout.name || "";
    if (bodyweight) bodyweight.value = Number.isFinite(workout.bodyweight) ? workout.bodyweight : "";
    if (notes) notes.value = workout.notes || "";
  } else {
    const measurement = state.bodyMeasurements.find((entry) => entry.id === target.id);
    if (!measurement) return;
    BODY_MEASUREMENT_FIELDS.forEach((field) => {
      const input = $(`#${measurementEditInputId(field.key)}`);
      if (!input) return;
      const value = measurement[field.key];
      input.value = Number.isFinite(value) ? value.toFixed(field.decimals) : "";
    });
  }

  closeHistoryActionSheet();
  const sheet = $("#historyEditSheet");
  if (sheet) sheet.classList.remove("hidden");
}

function closeHistoryEditSheet() {
  const sheet = $("#historyEditSheet");
  if (sheet) sheet.classList.add("hidden");
  ui.historyEditTarget = null;
}

function saveHistoryEdit() {
  const target = ui.historyEditTarget;
  if (!target) return;

  if (target.type === "workout") {
    const workout = state.workouts.find((entry) => entry.id === target.id);
    if (!workout) return;
    const name = $("#historyEditWorkoutName")?.value.trim() || "";
    const bodyweightValue = parseFloat($("#historyEditWorkoutBodyweight")?.value || "");
    const notes = $("#historyEditWorkoutNotes")?.value.trim() || "";
    workout.name = name || "Workout";
    workout.bodyweight = Number.isFinite(bodyweightValue) ? bodyweightValue : null;
    workout.notes = notes;
  } else {
    const measurement = state.bodyMeasurements.find((entry) => entry.id === target.id);
    if (!measurement) return;
    BODY_MEASUREMENT_FIELDS.forEach((field) => {
      const input = $(`#${measurementEditInputId(field.key)}`);
      const value = parseFloat(input?.value || "");
      measurement[field.key] = Number.isFinite(value) ? value : null;
    });
    const latestWeight = getLatestBodyWeight();
    if (Number.isFinite(latestWeight)) {
      state.settings.bodyweight = latestWeight;
    }
  }

  saveState();
  renderHistory();
  renderStats();
  renderTools();
  closeHistoryEditSheet();
  toast("History entry updated");
}

function deleteWorkout(workoutId) {
  const workout = state.workouts.find((w) => w.id === workoutId);
  if (!workout) return;
  if (!confirm(`Delete ${workout.name || "this workout"}?`)) return;
  state.workouts = state.workouts.filter((w) => w.id !== workoutId);
  if (state.activeWorkoutId === workoutId) state.activeWorkoutId = null;
  saveState();
  renderHistory();
  renderStats();
  closeHistoryActionSheet();
  closeHistoryEditSheet();
  closeHistorySheet();
}

function deleteBodyMeasurement(measurementId) {
  const measurement = state.bodyMeasurements.find((entry) => entry.id === measurementId);
  if (!measurement) return;
  if (!confirm("Delete this body measurement entry?")) return;
  state.bodyMeasurements = state.bodyMeasurements.filter((entry) => entry.id !== measurementId);
  saveState();
  renderHistory();
  renderStats();
  renderTools();
  closeHistoryActionSheet();
  closeHistoryEditSheet();
  closeHistorySheet();
}

function renderRoutines() {
  const routineList = $("#routineList");
  if (routineList) {
    routineList.innerHTML = state.routines.length
      ? state.routines.map((routine) => {
        return `
          <div class="card">
            <div class="row space">
              <div>
                <div class="title">${esc(routine.name)}</div>
                <div class="muted small">${routine.items.length} exercises</div>
              </div>
              <div class="row wrap">
                <button class="primary" data-action="start-routine" data-routine-id="${routine.id}">Start</button>
                <button class="ghost" data-action="edit-routine" data-routine-id="${routine.id}">Edit</button>
                <button class="ghost" data-action="delete-routine" data-routine-id="${routine.id}">Delete</button>
              </div>
            </div>
          </div>
        `;
      }).join("")
      : "<div class=\"muted small\">No workouts yet.</div>";
  }

  const routineSelect = $("#routineSelect");
  if (routineSelect) {
    if (state.routines.length) {
      routineSelect.disabled = false;
      routineSelect.innerHTML = state.routines.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join("");
      if (!ui.editRoutineId) ui.editRoutineId = state.routines[0].id;
      if (ui.editRoutineId) routineSelect.value = ui.editRoutineId;
    } else {
      routineSelect.disabled = true;
      routineSelect.innerHTML = "<option value=\"\">No workouts yet</option>";
      ui.editRoutineId = null;
    }
  }

  const routineNameInput = $("#routineNameInput");
  if (routineNameInput) {
    if (ui.editRoutineId) {
      const edit = getEditRoutine();
      routineNameInput.disabled = false;
      routineNameInput.value = edit?.name || "";
    } else {
      routineNameInput.disabled = true;
      routineNameInput.value = "";
    }
  }

    const exerciseNameList = $("#exerciseNameList");
    if (exerciseNameList) {
      exerciseNameList.innerHTML = state.exercises
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((ex) => `<option value="${esc(ex.name)}"></option>`)
        .join("");
    }
    const routineExerciseInput = $("#routineExerciseInput");
    if (routineExerciseInput) routineExerciseInput.disabled = false;

  const builder = $("#routineItems");
  const routine = getEditRoutine();
  if (builder) {
    if (!routine) {
      builder.innerHTML = "<div class=\"muted small\">Select a workout to edit.</div>";
    } else if (!routine.items.length) {
      builder.innerHTML = "<div class=\"muted small\">Add exercises to build this workout.</div>";
    } else {
      builder.innerHTML = routine.items
        .map((item) => renderExerciseCard(item, { owner: "routine", routineId: routine.id }))
        .join("");
    }
  }

    const addButton = document.querySelector("[data-action='add-routine-item']");
    if (addButton) addButton.disabled = false;

  renderLandingWorkouts();
}

function renderExercises() {
  renderExerciseMuscleSelectors();
  const list = $("#exerciseList");
  if (!list) return;
  const term = ui.exerciseSearch.toLowerCase();
  const exercises = state.exercises
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((ex) => {
      const haystack = [
        ex.name,
        ex.category || "",
        ex.primaryMuscleGroups || "",
        ex.detailedMuscleGroups || ""
      ].join(" ").toLowerCase();
      return haystack.includes(term);
    });

  if (!state.exercises.length) {
    list.innerHTML = "<div class=\"empty\">No exercises yet. Add your first exercise to get started.</div>";
    return;
  }

  list.innerHTML = exercises.length
    ? exercises.map((ex) => {
      const video = ex.videoUrl
        ? `<div class=\"muted small\">Video: <a href=\"${esc(ex.videoUrl)}\" target=\"_blank\" rel=\"noopener\">${esc(ex.videoUrl)}</a></div>`
        : "";
      return `
        <div class="card">
          <div class="row space">
            <div>
              <div class="title">${esc(ex.name)}</div>
              <div class="muted small">${esc(ex.category || "General")} · ${formatExerciseType(ex.type)}</div>
              <div class="muted small">Primary: ${esc(ex.primaryMuscleGroups || "Unassigned")}</div>
              <div class="muted small">Detailed: ${esc(ex.detailedMuscleGroups || "Unassigned")}</div>
            </div>
            <div class="row">
              <button class="ghost small" data-action="edit-exercise" data-exercise-id="${ex.id}">Edit</button>
              <button class="ghost small" data-action="delete-exercise" data-exercise-id="${ex.id}">Delete</button>
            </div>
          </div>
          ${ex.instructions ? `<div class=\"muted small\">${esc(ex.instructions)}</div>` : ""}
          ${video}
        </div>
      `;
    }).join("")
    : "<div class=\"muted small\">No exercises found.</div>";
}

function getExerciseStatsMetric(metricKey) {
  return EXERCISE_STATS_METRICS.find((metric) => metric.key === metricKey) || EXERCISE_STATS_METRICS[0];
}

function populateMonthRangeSelect(select, selectedValue, fallbackValue = 6) {
  if (!select) return fallbackValue;
  const options = Array.from({ length: 12 }, (_, idx) => {
    const months = idx + 1;
    const suffix = months === 1 ? "" : "s";
    return `<option value="${months}">Last ${months} month${suffix}</option>`;
  }).join("");
  select.innerHTML = options;
  const numeric = Math.min(12, Math.max(1, parseInt(selectedValue, 10) || fallbackValue));
  select.value = String(numeric);
  return numeric;
}

function getMonthsBackCutoff(monthsBack) {
  const months = Math.min(12, Math.max(1, parseInt(monthsBack, 10) || 1));
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setMonth(cutoff.getMonth() - months);
  return cutoff;
}

function calcBrzyckiOneRm(weight, reps) {
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(reps) || reps <= 0) return 0;
  if (reps === 1) return weight;
  if (reps >= 37) return 0;
  return weight * (36 / (37 - reps));
}

function getExercisePerformanceData(exerciseId) {
  const sessions = [];
  let totalWeight = 0;
  let totalReps = 0;
  const workouts = state.workouts
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  workouts.forEach((workout) => {
    const session = {
      heaviestWeight: 0,
      oneRmBrzycki: 0,
      bestSetVolume: 0,
      bestSessionVolume: 0,
      mostReps: 0
    };
    let hasExercise = false;
    workout.items.forEach((item) => {
      if (item.exerciseId !== exerciseId) return;
      hasExercise = true;
      item.sets.forEach((set) => {
        if (set.type === "duration") {
          const duration = Number.isFinite(set.durationSec) ? set.durationSec : 0;
          if (duration > 0) {
            totalReps += duration;
            session.mostReps = Math.max(session.mostReps, duration);
          }
          return;
        }
        const reps = Number.isFinite(set.reps) ? set.reps : 0;
        if (reps <= 0) return;
        totalReps += reps;
        session.mostReps = Math.max(session.mostReps, reps);
        const weight = effectiveWeight(set, workout.bodyweight);
        if (!Number.isFinite(weight) || weight <= 0) return;
        session.heaviestWeight = Math.max(session.heaviestWeight, weight);
        const setVolume = weight * reps;
        session.bestSetVolume = Math.max(session.bestSetVolume, setVolume);
        session.bestSessionVolume += setVolume;
        totalWeight += setVolume;
        session.oneRmBrzycki = Math.max(session.oneRmBrzycki, calcBrzyckiOneRm(weight, reps));
      });
    });
    if (hasExercise) {
      sessions.push({
        date: workout.createdAt,
        ...session
      });
    }
  });

  return { sessions, totalWeight, totalReps };
}

function formatExerciseMetricValue(metric, value, options = {}) {
  if (!Number.isFinite(value)) return "-";
  const integerOnly = metric.key === "mostReps";
  const decimals = integerOnly ? 0 : (Math.abs(value) >= 100 ? 0 : 1);
  const numeric = value.toFixed(decimals).replace(/\.0$/, "");
  if (options.withUnit === false) return numeric;
  if (metric.unit === "reps") return `${numeric} reps`;
  if (metric.unit) return `${numeric} ${metric.unit}`;
  return numeric;
}

function formatSignedPercent(pct) {
  if (!Number.isFinite(pct)) return "n/a";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function formatSignedDelta(metric, delta) {
  if (!Number.isFinite(delta)) return "-";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatExerciseMetricValue(metric, delta, { withUnit: true })}`;
}

function computeNextGoal(metric, bestValue) {
  if (!Number.isFinite(bestValue) || bestValue <= 0) return null;
  if (metric.key === "mostReps") {
    return Math.max(Math.round(bestValue) + 1, Math.ceil(bestValue * 1.05));
  }
  const step = bestValue >= 180 ? 5 : bestValue >= 100 ? 2.5 : 1.25;
  let goal = Math.ceil((bestValue * 1.03) / step) * step;
  if (goal <= bestValue) goal = bestValue + step;
  const decimals = Number.isInteger(step) ? 0 : (step % 0.5 === 0 ? 1 : 2);
  return Number(goal.toFixed(decimals));
}

function computeTrendLine(values) {
  if (!Array.isArray(values) || values.length < 2) return null;
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  values.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });
  const denominator = (n * sumXX) - (sumX * sumX);
  if (Math.abs(denominator) < 1e-9) return null;
  const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
  const intercept = (sumY - (slope * sumX)) / n;
  return { slope, intercept };
}

function computeExercisePerformanceSnapshot(chartData, metric) {
  const count = chartData.length;
  const values = chartData.map((entry) => Number.isFinite(entry.value) ? entry.value : 0);
  const firstValue = count ? values[0] : null;
  const latestValue = count ? values[count - 1] : null;
  const delta = count > 1 ? latestValue - firstValue : null;
  const pctChange = count > 1 && Math.abs(firstValue) > 1e-9
    ? (delta / Math.abs(firstValue)) * 100
    : null;
  const direction = !Number.isFinite(delta) || Math.abs(delta) < 1e-9
    ? "flat"
    : delta > 0
      ? "up"
      : "down";

  let bestIndex = -1;
  let bestValue = null;
  values.forEach((value, idx) => {
    if (!Number.isFinite(bestValue) || value > bestValue) {
      bestValue = value;
      bestIndex = idx;
    }
  });

  const previousCandidates = values
    .map((value, idx) => ({ value, idx }))
    .filter((entry) => entry.idx !== bestIndex && entry.value < (bestValue - 1e-9))
    .sort((a, b) => b.value - a.value);
  const previousBestValue = previousCandidates[0]?.value ?? null;
  const previousBestIndex = previousCandidates[0]?.idx ?? -1;

  const average = count
    ? values.reduce((sum, value) => sum + value, 0) / count
    : null;

  let monthlyAverage = null;
  let monthlyLabel = "";
  if (count) {
    const latestDate = new Date(chartData[count - 1].date);
    monthlyLabel = latestDate.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    const monthlyValues = chartData
      .filter((entry) => {
        const date = new Date(entry.date);
        return date.getMonth() === latestDate.getMonth() && date.getFullYear() === latestDate.getFullYear();
      })
      .map((entry) => entry.value)
      .filter((value) => Number.isFinite(value));
    if (monthlyValues.length) {
      monthlyAverage = monthlyValues.reduce((sum, value) => sum + value, 0) / monthlyValues.length;
    }
  }

  const nextGoal = computeNextGoal(metric, bestValue);
  const latestIsPr = count ? Math.abs(latestValue - bestValue) < 1e-9 : false;

  let screenReaderSummary = "No workout sessions found for this exercise and range.";
  if (count === 1) {
    screenReaderSummary = `One session recorded. Latest ${metric.label.toLowerCase()} is ${formatExerciseMetricValue(metric, latestValue)}.`;
  } else if (count > 1) {
    const movement = direction === "up" ? "increased" : direction === "down" ? "decreased" : "stayed the same";
    screenReaderSummary = `${metric.label} ${movement} from ${formatExerciseMetricValue(metric, firstValue)} to ${formatExerciseMetricValue(metric, latestValue)} across ${count} sessions. Best is ${formatExerciseMetricValue(metric, bestValue)}.`;
  }

  return {
    count,
    values,
    firstValue,
    latestValue,
    delta,
    pctChange,
    direction,
    bestValue,
    bestIndex,
    previousBestValue,
    previousBestIndex,
    average,
    monthlyAverage,
    monthlyLabel,
    nextGoal,
    latestIsPr,
    screenReaderSummary
  };
}

function performanceDirectionLabel(direction) {
  if (direction === "up") return "Improved";
  if (direction === "down") return "Declined";
  return "Stable";
}

function performanceDirectionGlyph(direction) {
  if (direction === "up") return "▲";
  if (direction === "down") return "▼";
  return "•";
}

function renderExercisePerformanceStageA(container, metric, latestEntry, snapshot) {
  if (!container) return;
  const latestValueLabel = latestEntry
    ? formatExerciseMetricValue(metric, latestEntry.value)
    : "—";
  const countLabel = snapshot.count === 0
    ? "No workouts in this range yet."
    : "Only 1 workout recorded in this range.";

  container.classList.add("performance-stage-a");
  container.classList.remove("performance-stage-b", "performance-stage-c");
  container.innerHTML = `
    <div class="performance-empty">
      <div class="performance-empty-kicker">Latest ${esc(metric.label)}</div>
      <div class="performance-empty-value">${esc(latestValueLabel)}</div>
      <div class="muted small">${esc(countLabel)}</div>
      <div class="muted small">Log more workouts to see performance trends.</div>
    </div>
  `;
}

function renderExercisePerformanceStageB(container, metric, chartData, color, snapshot) {
  if (!container) return;
  const width = 340;
  const height = 120;
  const left = 10;
  const right = 10;
  const top = 10;
  const bottom = 24;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = snapshot.values;
  let minValue = Math.min(...values);
  let maxValue = Math.max(...values);
  if (Math.abs(maxValue - minValue) < 1e-9) {
    maxValue += 1;
    minValue -= 1;
  }
  const pad = Math.max((maxValue - minValue) * 0.2, 0.5);
  const min = minValue - pad;
  const max = maxValue + pad;
  const span = max - min || 1;
  const stepX = chartData.length > 1 ? plotWidth / (chartData.length - 1) : 0;
  const points = chartData.map((entry, idx) => {
    const x = left + (stepX * idx);
    const y = top + ((max - entry.value) / span) * plotHeight;
    return { x, y, value: entry.value, label: entry.label };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const bestPoint = points[snapshot.bestIndex] || points[points.length - 1];
  const latestPoint = points[points.length - 1];
  const axisColor = cssVar("--chart-axis-text", "#AAB3C5");

  container.classList.add("performance-stage-b");
  container.classList.remove("performance-stage-a", "performance-stage-c");
  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="120" preserveAspectRatio="none">
      <line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" stroke="${axisColor}" stroke-opacity="0.35" stroke-width="1" />
      <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
      ${points.map((point, idx) => `<circle cx="${point.x}" cy="${point.y}" r="${idx === points.length - 1 ? 3.2 : 2.2}" fill="${color}" />`).join("")}
      <circle cx="${bestPoint.x}" cy="${bestPoint.y}" r="4.4" fill="none" stroke="${cssVar("--color-warning", "#F59E0B")}" stroke-width="2" />
      <text x="${bestPoint.x}" y="${Math.max(10, bestPoint.y - 8)}" fill="${axisColor}" font-size="10" text-anchor="middle">Best so far</text>
    </svg>
    <div class="chart-axis">
      <span>${esc(chartData[0]?.label || "")}</span>
      <span>${esc(latestPoint?.label || "")}</span>
    </div>
  `;
}

function attachExercisePerformanceTooltip(container, chartData, points, metric, snapshot, width, height) {
  const tooltip = container.querySelector(".performance-tooltip");
  const svg = container.querySelector(".performance-svg");
  const pointEls = Array.from(container.querySelectorAll(".performance-point"));
  if (!tooltip || !svg || !pointEls.length) return;

  const hide = () => {
    tooltip.classList.remove("show");
    pointEls.forEach((point) => point.classList.remove("active"));
  };

  const show = (idx) => {
    const entry = chartData[idx];
    const point = points[idx];
    if (!entry || !point) return;
    const valueText = formatExerciseMetricValue(metric, entry.value);
    const prTag = Math.abs(entry.value - snapshot.bestValue) < 1e-9
      ? "<div class=\"performance-tooltip-badge\">Personal record</div>"
      : "";
    tooltip.innerHTML = `
      <div class="performance-tooltip-value">${esc(valueText)}</div>
      <div class="performance-tooltip-date">${esc(formatDateTime(entry.date))}</div>
      ${prTag}
    `;
    tooltip.style.left = `${(point.x / width) * 100}%`;
    tooltip.style.top = `${(point.y / height) * 100}%`;
    tooltip.classList.add("show");
    pointEls.forEach((pointEl, pointIdx) => {
      pointEl.classList.toggle("active", pointIdx === idx);
    });
  };

  pointEls.forEach((pointEl) => {
    const idx = parseInt(pointEl.dataset.index || "-1", 10);
    if (!Number.isFinite(idx) || idx < 0) return;
    pointEl.addEventListener("pointerenter", () => show(idx));
    pointEl.addEventListener("pointerdown", () => show(idx));
    pointEl.addEventListener("focus", () => show(idx));
    pointEl.addEventListener("blur", hide);
  });

  svg.addEventListener("pointerleave", hide);
}

function renderExercisePerformanceStageC(container, metric, chartData, color, snapshot) {
  if (!container) return;
  const width = 360;
  const height = 210;
  const left = 42;
  const right = 12;
  const top = 16;
  const bottom = 30;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const axis = buildNumericAxis(snapshot.values, {
    tickCount: 6,
    forceZero: false,
    integerOnly: metric.key === "mostReps"
  });
  const span = axis.max - axis.min || 1;
  const stepX = chartData.length > 1 ? plotWidth / (chartData.length - 1) : 0;
  const gridStroke = cssVar("--chart-grid-stroke", "rgba(170, 179, 197, 0.24)");
  const axisColor = cssVar("--chart-axis-text", "#AAB3C5");
  const prColor = cssVar("--color-warning", "#F59E0B");

  const points = chartData.map((entry, idx) => {
    const x = left + (stepX * idx);
    const y = top + ((axis.max - entry.value) / span) * plotHeight;
    return { x, y, value: entry.value, label: entry.label };
  });

  const gridLines = axis.ticks.map((tick) => {
    const y = top + ((axis.max - tick) / span) * plotHeight;
    const tickLabel = formatExerciseMetricValue(metric, tick, { withUnit: false });
    return `
      <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="${gridStroke}" stroke-width="1" stroke-dasharray="2 4" />
      <text x="${left - 6}" y="${y + 3}" fill="${axisColor}" font-size="10" text-anchor="end">${esc(tickLabel)}</text>
    `;
  }).join("");

  const dataLine = points.map((point) => `${point.x},${point.y}`).join(" ");
  const trend = computeTrendLine(snapshot.values);
  const trendLine = trend
    ? points.map((_point, idx) => {
      const trendValue = trend.intercept + (trend.slope * idx);
      const x = left + (stepX * idx);
      const y = top + ((axis.max - trendValue) / span) * plotHeight;
      return `${x},${y}`;
    }).join(" ")
    : "";

  const averageY = Number.isFinite(snapshot.average)
    ? top + ((axis.max - snapshot.average) / span) * plotHeight
    : null;
  const bestPoint = points[snapshot.bestIndex] || null;
  const previousPoint = snapshot.previousBestIndex >= 0 ? points[snapshot.previousBestIndex] : null;

  container.classList.add("performance-stage-c");
  container.classList.remove("performance-stage-a", "performance-stage-b");
  container.innerHTML = `
    <div class="performance-chart-wrap">
      <svg class="performance-svg" viewBox="0 0 ${width} ${height}" width="100%" height="210" preserveAspectRatio="none">
        <text x="${left}" y="${top - 4}" fill="${axisColor}" font-size="10">${esc(metric.unit || "value")}</text>
        ${gridLines}
        ${Number.isFinite(averageY) ? `
          <line x1="${left}" y1="${averageY}" x2="${width - right}" y2="${averageY}" stroke="${axisColor}" stroke-width="1" stroke-dasharray="4 4" />
          <text x="${width - right}" y="${Math.max(10, averageY - 6)}" fill="${axisColor}" font-size="10" text-anchor="end">Avg ${esc(formatExerciseMetricValue(metric, snapshot.average))}</text>
        ` : ""}
        ${trendLine ? `<polyline points="${trendLine}" fill="none" stroke="${axisColor}" stroke-opacity="0.55" stroke-width="1.5" stroke-dasharray="5 4" />` : ""}
        <polyline points="${dataLine}" fill="none" stroke="${color}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" />
        ${points.map((point, idx) => `
          <circle
            class="performance-point"
            data-index="${idx}"
            tabindex="0"
            cx="${point.x}"
            cy="${point.y}"
            r="${idx === snapshot.bestIndex ? 4.2 : 3}"
            fill="${idx === snapshot.bestIndex ? prColor : color}"
          />
        `).join("")}
        ${bestPoint ? `
          <circle cx="${bestPoint.x}" cy="${bestPoint.y}" r="7" fill="none" stroke="${prColor}" stroke-width="1.8" />
          <text x="${bestPoint.x}" y="${Math.max(12, bestPoint.y - 10)}" fill="${prColor}" font-size="10" text-anchor="middle">PR</text>
        ` : ""}
        ${previousPoint ? `
          <rect x="${previousPoint.x - 3.2}" y="${previousPoint.y - 3.2}" width="6.4" height="6.4" transform="rotate(45 ${previousPoint.x} ${previousPoint.y})" fill="none" stroke="${axisColor}" stroke-width="1.4" />
          <text x="${previousPoint.x}" y="${Math.max(12, previousPoint.y - 9)}" fill="${axisColor}" font-size="10" text-anchor="middle">Prev best</text>
        ` : ""}
      </svg>
      ${buildChartAxis(chartData.map((entry) => entry.label), 4)}
      <div class="performance-tooltip"></div>
    </div>
  `;

  attachExercisePerformanceTooltip(container, chartData, points, metric, snapshot, width, height);
}

function renderAdaptiveExercisePerformance(metric, chartData, cutoffDate, fallbackSessions = []) {
  const chartEl = $("#exerciseMetricChart");
  const rangeEl = $("#exerciseMetricRange");
  const summaryEl = $("#exerciseMetricSummary");
  if (!chartEl || !rangeEl || !summaryEl) return;

  const snapshot = computeExercisePerformanceSnapshot(chartData, metric);
  const stage = snapshot.count <= 1 ? "a" : snapshot.count < 5 ? "b" : "c";
  const color = resolveMetricColor(metric.metricColorKey || metric.key);
  const fallbackLatestSession = fallbackSessions.length
    ? fallbackSessions[fallbackSessions.length - 1]
    : null;
  const fallbackLatestEntry = fallbackLatestSession
    ? {
      date: fallbackLatestSession.date,
      value: Number.isFinite(fallbackLatestSession[metric.key]) ? fallbackLatestSession[metric.key] : null
    }
    : null;
  const latestEntry = chartData[chartData.length - 1] || fallbackLatestEntry || null;
  const startDate = chartData[0]?.date || cutoffDate;
  const endDate = chartData[chartData.length - 1]?.date || latestEntry?.date || new Date();
  const stageHint = stage === "a"
    ? "Trend visible after 5 sessions."
    : stage === "b"
      ? `Early trend from ${snapshot.count} sessions. Trend visible after 5 sessions.`
      : "Mature trend view with average line, PR, and tooltips.";

  if (stage === "a") {
    renderExercisePerformanceStageA(chartEl, metric, latestEntry, snapshot);
  } else if (stage === "b") {
    renderExercisePerformanceStageB(chartEl, metric, chartData, color, snapshot);
  } else {
    renderExercisePerformanceStageC(chartEl, metric, chartData, color, snapshot);
  }

  const interpretation = snapshot.count > 1
    ? `${performanceDirectionLabel(snapshot.direction)} by ${formatSignedDelta(metric, snapshot.delta)}.`
    : "No trend yet.";
  const prCopy = snapshot.latestIsPr && snapshot.count > 1 ? "New personal best." : "";
  const sessionsLabel = `${snapshot.count} session${snapshot.count === 1 ? "" : "s"}`;
  const rangeParts = [
    `Visualized range: ${formatDateRange(startDate, endDate)}`,
    sessionsLabel,
    stageHint,
    interpretation,
    prCopy
  ].filter(Boolean);
  rangeEl.textContent = rangeParts.join(" · ");
  summaryEl.textContent = snapshot.screenReaderSummary;
}

function buildChartAxis(labels, slots = 4) {
  if (!labels.length) return "";
  const normalizedSlots = Math.max(2, Math.min(slots, labels.length));
  const indices = [];
  for (let i = 0; i < normalizedSlots; i += 1) {
    const ratio = normalizedSlots === 1 ? 0 : i / (normalizedSlots - 1);
    indices.push(Math.round(ratio * (labels.length - 1)));
  }
  const uniqueIndices = Array.from(new Set(indices));
  return `
    <div class="chart-axis">
      ${uniqueIndices.map((idx) => `<span>${esc(labels[idx])}</span>`).join("")}
    </div>
  `;
}

function niceStep(rawStep) {
  const safeStep = Math.max(0.0001, rawStep);
  const exponent = Math.floor(Math.log10(safeStep));
  const magnitude = 10 ** exponent;
  const normalized = safeStep / magnitude;
  if (normalized <= 1) return 1 * magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function buildNumericAxis(values, options = {}) {
  const { tickCount = 5, forceZero = true, integerOnly = false } = options;
  const maxValue = Math.max(...values, 0);
  const minValue = forceZero ? 0 : Math.min(...values, 0);
  if (maxValue <= minValue) {
    return { min: 0, max: 1, ticks: [0, 1] };
  }
  const roughStep = (maxValue - minValue) / Math.max(2, tickCount - 1);
  let step = niceStep(roughStep);
  if (integerOnly) step = Math.max(1, Math.round(step));
  const min = forceZero ? 0 : Math.floor(minValue / step) * step;
  const max = Math.ceil(maxValue / step) * step;
  const ticks = [];
  for (let value = min; value <= max + (step / 2); value += step) {
    ticks.push(integerOnly ? Math.round(value) : value);
  }
  return { min, max, ticks };
}

function defaultTickFormatter(value, options = {}) {
  if (options.integerOnly) return `${Math.round(value)}`;
  if (Math.abs(value) >= 100) return `${Math.round(value)}`;
  if (Math.abs(value) >= 10) return `${value.toFixed(1).replace(/\.0$/, "")}`;
  return `${value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}`;
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const sameYear = start.getFullYear() === end.getFullYear();
  const startFmt = start.toLocaleDateString(undefined, sameYear
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" });
  const endFmt = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${startFmt} - ${endFmt}`;
}

function renderLineChart(container, data, color, options = {}) {
  if (!container) return;
  if (!data.length) {
    container.innerHTML = "<div class=\"muted small\">No data yet.</div>";
    return;
  }
  const width = 340;
  const height = 180;
  const left = 38;
  const right = 10;
  const top = 12;
  const bottom = 22;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = data.map((entry) => Number.isFinite(entry.value) ? entry.value : 0);
  const axis = buildNumericAxis(values, {
    tickCount: options.tickCount || 5,
    forceZero: options.forceZero !== false,
    integerOnly: !!options.integerOnly
  });
  const span = axis.max - axis.min || 1;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const gridStroke = cssVar("--chart-grid-stroke", "rgba(71, 85, 105, 0.18)");
  const axisColor = cssVar("--chart-axis-text", "#64748B");
  const lineColor = color || cssVar("--chart-series-1", "#4F66FF");

  const points = data.map((entry, idx) => {
    const x = left + stepX * idx;
    const value = Number.isFinite(entry.value) ? entry.value : 0;
    const y = top + ((axis.max - value) / span) * plotHeight;
    return { x, y, value };
  });

  const gridLines = axis.ticks.map((tick) => {
    const y = top + ((axis.max - tick) / span) * plotHeight;
    const tickLabel = options.tickFormatter
      ? options.tickFormatter(tick)
      : defaultTickFormatter(tick, { integerOnly: !!options.integerOnly });
    return `
      <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="${gridStroke}" stroke-width="1" stroke-dasharray="2 3" />
      <text x="${left - 6}" y="${y + 3}" fill="${axisColor}" font-size="10" text-anchor="end">${esc(tickLabel)}</text>
    `;
  }).join("");

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const dots = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="2.6" fill="${lineColor}" />`).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="180" preserveAspectRatio="none">
      ${gridLines}
      <polyline points="${polyline}" fill="none" stroke="${lineColor}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
    </svg>
    ${buildChartAxis(data.map((entry) => entry.label), 4)}
  `;
}

function renderMultiLineChart(container, labels, series, options = {}) {
  if (!container) return;
  if (!labels.length || !series.length) {
    container.innerHTML = "<div class=\"muted small\">No data yet.</div>";
    return;
  }
  const width = 340;
  const height = Math.max(120, Number.isFinite(options.height) ? options.height : 180);
  const showYLabels = options.showYLabels !== false;
  const showGrid = options.showGrid !== false;
  const yLabel = String(options.yLabel || "");
  const left = Number.isFinite(options.left) ? options.left : (showYLabels ? 38 : 14);
  const right = Number.isFinite(options.right) ? options.right : 10;
  const top = Number.isFinite(options.top) ? options.top : 12;
  const bottom = Number.isFinite(options.bottom) ? options.bottom : 22;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = series.flatMap((entry) => entry.values.map((value) => Number.isFinite(value) ? value : 0));
  const axis = buildNumericAxis(values, {
    tickCount: options.tickCount || 6,
    forceZero: true,
    integerOnly: options.integerOnly !== false
  });
  const span = axis.max - axis.min || 1;
  const stepX = labels.length > 1 ? plotWidth / (labels.length - 1) : 0;
  const gridStroke = cssVar("--chart-grid-stroke", "rgba(71, 85, 105, 0.18)");
  const axisColor = cssVar("--chart-axis-text", "#64748B");

  const gridLines = axis.ticks.map((tick) => {
    const y = top + ((axis.max - tick) / span) * plotHeight;
    const tickLabel = options.tickFormatter
      ? options.tickFormatter(tick)
      : `${Math.round(tick)}`;
    return `
      ${showGrid ? `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="${gridStroke}" stroke-width="1" stroke-dasharray="2 3" />` : ""}
      ${showYLabels ? `<text x="${left - 6}" y="${y + 3}" fill="${axisColor}" font-size="10" text-anchor="end">${esc(tickLabel)}</text>` : ""}
    `;
  }).join("");

  const lineWidth = Number.isFinite(options.lineWidth) ? options.lineWidth : 2.1;
  const dotRadius = Number.isFinite(options.dotRadius) ? options.dotRadius : 2.2;
  const lines = series.map((entry) => {
    const points = entry.values.map((value, idx) => {
      const safe = Number.isFinite(value) ? value : 0;
      const x = left + stepX * idx;
      const y = top + ((axis.max - safe) / span) * plotHeight;
      return { x, y };
    });
    const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
    const circles = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="${dotRadius}" fill="${entry.color}" />`).join("");
    return `<polyline points="${polyline}" fill="none" stroke="${entry.color}" stroke-width="${lineWidth}" stroke-linecap="round" stroke-linejoin="round" />${circles}`;
  }).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none">
      ${yLabel ? `<text x="${left}" y="${Math.max(10, top - 3)}" fill="${axisColor}" font-size="10">${esc(yLabel)}</text>` : ""}
      ${gridLines}
      ${lines}
    </svg>
    ${buildChartAxis(labels, options.axisSlots || 4)}
  `;
}

function parseMuscleGroups(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean)))
    .sort((a, b) => a.localeCompare(b));
}

function collectExerciseMuscleOptions(kind) {
  const seed = kind === "detailed" ? DETAILED_MUSCLE_OPTIONS : PRIMARY_MUSCLE_OPTIONS;
  const remembered = state.muscleTagLibrary?.[kind] || [];
  const existing = state.exercises.flatMap((exercise) => {
    const raw = kind === "detailed" ? exercise.detailedMuscleGroups : exercise.primaryMuscleGroups;
    return parseMuscleGroups(raw);
  });
  return uniqueSorted([...seed, ...remembered, ...existing]);
}

function getMultiSelectState(multiId) {
  if (multiId === "exercise-primary") {
    return { selected: ui.exercisePrimarySelection, query: ui.exercisePrimaryQuery };
  }
  if (multiId === "exercise-detailed") {
    return { selected: ui.exerciseDetailedSelection, query: ui.exerciseDetailedQuery };
  }
  if (multiId === "edit-exercise-primary") {
    return { selected: ui.editExercisePrimarySelection, query: ui.editExercisePrimaryQuery };
  }
  if (multiId === "edit-exercise-detailed") {
    return { selected: ui.editExerciseDetailedSelection, query: ui.editExerciseDetailedQuery };
  }
  return { selected: ui.selectedMuscles, query: ui.muscleSearchQuery };
}

function setMultiSelectQuery(multiId, value) {
  const query = String(value || "");
  if (multiId === "exercise-primary") {
    ui.exercisePrimaryQuery = query;
    return;
  }
  if (multiId === "exercise-detailed") {
    ui.exerciseDetailedQuery = query;
    return;
  }
  if (multiId === "edit-exercise-primary") {
    ui.editExercisePrimaryQuery = query;
    return;
  }
  if (multiId === "edit-exercise-detailed") {
    ui.editExerciseDetailedQuery = query;
    return;
  }
  ui.muscleSearchQuery = query;
}

function setMultiSelectSelection(multiId, values) {
  const normalized = uniqueSorted(values.map((entry) => String(entry || "").trim()));
  if (multiId === "exercise-primary") {
    ui.exercisePrimarySelection = normalized;
    return;
  }
  if (multiId === "exercise-detailed") {
    ui.exerciseDetailedSelection = normalized;
    return;
  }
  if (multiId === "edit-exercise-primary") {
    ui.editExercisePrimarySelection = normalized;
    return;
  }
  if (multiId === "edit-exercise-detailed") {
    ui.editExerciseDetailedSelection = normalized;
    return;
  }
  ui.selectedMuscles = normalized;
}

function multiSelectMuscleKind(multiId) {
  if (multiId === "exercise-primary" || multiId === "edit-exercise-primary") return "primary";
  if (multiId === "exercise-detailed" || multiId === "edit-exercise-detailed") return "detailed";
  return null;
}

function canCreateMultiSelectOption(multiId) {
  return !!multiSelectMuscleKind(multiId);
}

function focusMultiInput(multiId) {
  const input = $(`[data-multi-input="${multiId}"]`);
  if (!input) return;
  input.focus();
  const end = input.value.length;
  input.setSelectionRange(end, end);
}

function renderMultiSelectControl({ rootId, multiId, selected, query, options, placeholder }) {
  const root = $(`#${rootId}`);
  if (!root) return;
  const safeQuery = String(query || "");
  const trimmedQuery = normalizeMuscleTagValue(safeQuery);
  const allowCreate = canCreateMultiSelectOption(multiId);
  const normalizedOptionSet = new Set(options.map((option) => option.toLowerCase()));
  const filteredOptions = options.filter((option) => option.toLowerCase().includes(safeQuery.toLowerCase()));
  const dropdownOpen = ui.activeMultiSelect === multiId;
  const chips = selected.map((value) => `
    <span class="multi-chip">
      <span>${esc(value)}</span>
      <button type="button" class="multi-chip-remove" data-action="multi-remove" data-multi-id="${multiId}" data-value="${esc(value)}" aria-label="Remove ${esc(value)}">×</button>
    </span>
  `).join("");
  const optionsHtml = filteredOptions.length
    ? filteredOptions.map((option) => {
      const selectedClass = selected.includes(option) ? " selected" : "";
      return `<button type="button" class="multi-option${selectedClass}" data-action="multi-toggle" data-multi-id="${multiId}" data-value="${esc(option)}">${esc(option)}</button>`;
    }).join("")
    : "<div class=\"multi-empty\">No matches</div>";
  const canCreate = allowCreate
    && trimmedQuery
    && !normalizedOptionSet.has(trimmedQuery.toLowerCase())
    && !selected.some((entry) => entry.toLowerCase() === trimmedQuery.toLowerCase());
  const createHtml = canCreate
    ? `<button type="button" class="multi-option multi-option-create" data-action="multi-create" data-multi-id="${multiId}" data-value="${esc(trimmedQuery)}">Add "${esc(trimmedQuery)}"</button>`
    : "";

  root.innerHTML = `
    <div class="multi-select${dropdownOpen ? " open" : ""}" data-multi-id="${multiId}">
      <div class="multi-control" data-action="multi-open" data-multi-id="${multiId}">
        ${chips}
        <input
          type="text"
          class="multi-input"
          data-multi-input="${multiId}"
          value="${esc(safeQuery)}"
          placeholder="${esc(placeholder)}"
          autocomplete="off"
        >
        <button type="button" class="multi-caret-btn" data-action="multi-open" data-multi-id="${multiId}" aria-label="Toggle options">
          <span class="multi-caret">▾</span>
        </button>
      </div>
      <div class="multi-dropdown${dropdownOpen ? "" : " hidden"}">
        ${createHtml}
        ${optionsHtml}
      </div>
    </div>
  `;
}

function renderExerciseMuscleSelectors() {
  renderMultiSelectControl({
    rootId: "exercisePrimaryMusclesSelect",
    multiId: "exercise-primary",
    selected: ui.exercisePrimarySelection,
    query: ui.exercisePrimaryQuery,
    options: collectExerciseMuscleOptions("primary"),
    placeholder: "Search primary muscles"
  });
  renderMultiSelectControl({
    rootId: "exerciseDetailedMusclesSelect",
    multiId: "exercise-detailed",
    selected: ui.exerciseDetailedSelection,
    query: ui.exerciseDetailedQuery,
    options: collectExerciseMuscleOptions("detailed"),
    placeholder: "Search detailed muscles"
  });
  renderMultiSelectControl({
    rootId: "editExercisePrimaryMusclesSelect",
    multiId: "edit-exercise-primary",
    selected: ui.editExercisePrimarySelection,
    query: ui.editExercisePrimaryQuery,
    options: collectExerciseMuscleOptions("primary"),
    placeholder: "Search primary muscles"
  });
  renderMultiSelectControl({
    rootId: "editExerciseDetailedMusclesSelect",
    multiId: "edit-exercise-detailed",
    selected: ui.editExerciseDetailedSelection,
    query: ui.editExerciseDetailedQuery,
    options: collectExerciseMuscleOptions("detailed"),
    placeholder: "Search detailed muscles"
  });
}

function getExerciseMuscleGroups(exercise, dimension) {
  const source = dimension === "detailed" ? exercise?.detailedMuscleGroups : exercise?.primaryMuscleGroups;
  const groups = parseMuscleGroups(source);
  return groups.length ? groups : ["Unassigned"];
}

function getPeriodStart(date, grouping) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  if (grouping === "year") {
    start.setMonth(0, 1);
    return start;
  }
  if (grouping === "month") {
    start.setDate(1);
    return start;
  }
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  return start;
}

function formatPeriodLabel(periodStart, grouping) {
  if (grouping === "year") return `${periodStart.getFullYear()}`;
  if (grouping === "month") {
    return periodStart.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }
  return `Wk ${periodStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function collectAvailableMuscles(dimension) {
  const seedOptions = dimension === "detailed" ? DETAILED_MUSCLE_OPTIONS : PRIMARY_MUSCLE_OPTIONS;
  const remembered = state.muscleTagLibrary?.[dimension] || [];
  const muscles = new Set();
  [...seedOptions, ...remembered].forEach((group) => muscles.add(group));
  state.exercises.forEach((exercise) => {
    getExerciseMuscleGroups(exercise, dimension).forEach((group) => muscles.add(group));
  });
  state.workouts.forEach((workout) => {
    workout.items.forEach((item) => {
      const exercise = getExercise(item.exerciseId);
      getExerciseMuscleGroups(exercise, dimension).forEach((group) => muscles.add(group));
    });
  });
  if (!muscles.size) muscles.add("Unassigned");
  return Array.from(muscles).sort((a, b) => a.localeCompare(b));
}

function computeMuscleVolumeSeries(grouping, monthsBack, dimension, selectedMuscles) {
  const cutoff = getMonthsBackCutoff(monthsBack);
  const buckets = new Map();
  const workouts = state.workouts
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  workouts.forEach((workout) => {
    const workoutDate = new Date(workout.createdAt);
    if (workoutDate < cutoff) return;
    workout.items.forEach((item) => {
      const setCount = item.sets.length;
      if (!setCount) return;
      const exercise = getExercise(item.exerciseId);
      const muscles = getExerciseMuscleGroups(exercise, dimension);
      const periodStart = getPeriodStart(workoutDate, grouping);
      const key = toDateKey(periodStart);
      if (!buckets.has(key)) {
        buckets.set(key, {
          date: periodStart,
          label: formatPeriodLabel(periodStart, grouping),
          counts: {}
        });
      }
      const bucket = buckets.get(key);
      muscles.forEach((muscle) => {
        bucket.counts[muscle] = (bucket.counts[muscle] || 0) + setCount;
      });
    });
  });

  const ordered = Array.from(buckets.values()).sort((a, b) => a.date - b.date);
  const labels = ordered.map((entry) => entry.label);
  const series = selectedMuscles.map((muscle, idx) => ({
    name: muscle,
    color: resolveSeriesColor(idx, MUSCLE_CHART_COLORS[idx % MUSCLE_CHART_COLORS.length]),
    values: ordered.map((entry) => entry.counts[muscle] || 0)
  }))
    .map((entry) => ({
      ...entry,
      total: entry.values.reduce((sum, value) => sum + value, 0)
    }))
    .filter((entry) => entry.values.some((value) => value > 0));
  const fromDate = ordered[0]?.date || null;
  const toDate = ordered[ordered.length - 1]?.date || null;
  return { labels, series, fromDate, toDate, cutoff };
}

function formatSetCount(value, withUnit = true) {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  const text = safe.toLocaleString();
  return withUnit ? `${text} sets` : text;
}

function renderAdaptiveMuscleVolumeChart(container, labels, series, options = {}) {
  if (!container) {
    return {
      stage: "a",
      status: "no-container",
      selectedCount: 0,
      periodCount: 0,
      nonZeroCount: 0,
      totalSets: 0,
      latestSets: 0,
      bestSets: 0,
      bestLabel: ""
    };
  }

  const selectedCount = Number.isFinite(options.selectedCount) ? options.selectedCount : 0;
  const hasSeries = labels.length > 0 && series.length > 0;
  const totalsByPeriod = labels.map((_label, idx) => {
    return series.reduce((sum, entry) => sum + (Number.isFinite(entry.values[idx]) ? entry.values[idx] : 0), 0);
  });
  const nonZeroCount = totalsByPeriod.filter((value) => value > 0).length;
  const totalSets = totalsByPeriod.reduce((sum, value) => sum + value, 0);
  const latestSets = totalsByPeriod[totalsByPeriod.length - 1] || 0;
  const bestSets = totalsByPeriod.length ? Math.max(...totalsByPeriod) : 0;
  const bestIndex = totalsByPeriod.findIndex((value) => Math.abs(value - bestSets) < 1e-9);
  const bestLabel = bestIndex >= 0 ? labels[bestIndex] : "";
  const stage = nonZeroCount <= 1 ? "a" : nonZeroCount < 5 ? "b" : "c";

  container.classList.add("adaptive-performance-chart");
  container.classList.remove("performance-stage-a", "performance-stage-b", "performance-stage-c");
  container.classList.add(`performance-stage-${stage}`);

  if (!selectedCount) {
    container.innerHTML = `
      <div class="performance-empty">
        <div class="performance-empty-kicker">Muscle Sets</div>
        <div class="performance-empty-value">0 sets</div>
        <div class="muted small">Select one or more muscles to track sets.</div>
      </div>
    `;
    return {
      stage: "a",
      status: "selection-required",
      selectedCount,
      periodCount: labels.length,
      nonZeroCount,
      totalSets,
      latestSets,
      bestSets,
      bestLabel
    };
  }

  if (!hasSeries || nonZeroCount === 0) {
    container.innerHTML = `
      <div class="performance-empty">
        <div class="performance-empty-kicker">Muscle Sets</div>
        <div class="performance-empty-value">0 sets</div>
        <div class="muted small">No logged muscle sets in this range.</div>
        <div class="muted small">Log workouts to see muscle set trends.</div>
      </div>
    `;
    return {
      stage: "a",
      status: "no-data",
      selectedCount,
      periodCount: labels.length,
      nonZeroCount,
      totalSets,
      latestSets,
      bestSets,
      bestLabel
    };
  }

  if (stage === "b") {
    renderMultiLineChart(container, labels, series, {
      integerOnly: true,
      tickCount: 4,
      height: 132,
      showYLabels: false,
      axisSlots: 2,
      lineWidth: 2.3,
      dotRadius: 2.4,
      yLabel: "sets"
    });
  } else {
    renderMultiLineChart(container, labels, series, {
      integerOnly: true,
      tickCount: 6,
      height: 186,
      showYLabels: true,
      axisSlots: 4,
      lineWidth: 2.2,
      dotRadius: 2.3,
      yLabel: "sets"
    });
  }

  return {
    stage,
    status: "ok",
    selectedCount,
    periodCount: labels.length,
    nonZeroCount,
    totalSets,
    latestSets,
    bestSets,
    bestLabel
  };
}

function renderMuscleGroupSection() {
  const groupingSelect = $("#muscleGroupingSelect");
  if (groupingSelect) groupingSelect.value = ui.muscleGrouping;
  const monthsSelect = $("#muscleMonthsSelect");
  ui.muscleMonthsBack = populateMonthRangeSelect(monthsSelect, ui.muscleMonthsBack, 1);
  const toggle = $("#muscleDimensionToggle");
  if (toggle) {
    $$("button[data-dimension]", toggle).forEach((button) => {
      button.classList.toggle("active", button.dataset.dimension === ui.muscleDimension);
    });
  }

  const availableMuscles = collectAvailableMuscles(ui.muscleDimension);
  const validSelection = ui.selectedMuscles.filter((muscle) => availableMuscles.includes(muscle));
  if (!ui.muscleSelectionInitialized) {
    ui.selectedMuscles = validSelection.length
      ? validSelection
      : availableMuscles.slice();
    ui.muscleSelectionInitialized = true;
  } else {
    ui.selectedMuscles = validSelection;
  }

  renderMultiSelectControl({
    rootId: "muscleFilterSelect",
    multiId: "stats-muscles",
    selected: ui.selectedMuscles,
    query: ui.muscleSearchQuery,
    options: availableMuscles,
    placeholder: "Search muscles to track"
  });

  const data = computeMuscleVolumeSeries(
    ui.muscleGrouping,
    ui.muscleMonthsBack,
    ui.muscleDimension,
    ui.selectedMuscles
  );
  const chartSnapshot = renderAdaptiveMuscleVolumeChart($("#muscleVolumeChart"), data.labels, data.series, {
    selectedCount: ui.selectedMuscles.length
  });

  const summaryEl = $("#muscleChartSummary");
  if (summaryEl) {
    if (chartSnapshot.status === "selection-required") {
      summaryEl.textContent = "No muscles selected. Choose one or more muscles to track sets.";
    } else if (chartSnapshot.status === "no-data") {
      summaryEl.textContent = "No muscle sets logged for the selected range and muscle filters.";
    } else if (chartSnapshot.stage === "a") {
      summaryEl.textContent = `Latest logged sets: ${formatSetCount(chartSnapshot.latestSets)}. Log more periods to unlock trends.`;
    } else if (chartSnapshot.stage === "b") {
      summaryEl.textContent = `Early trend across ${chartSnapshot.nonZeroCount} logged periods. Peak sets ${formatSetCount(chartSnapshot.bestSets)}${chartSnapshot.bestLabel ? ` (${chartSnapshot.bestLabel})` : ""}.`;
    } else {
      summaryEl.textContent = `Set trend across ${chartSnapshot.periodCount} periods. Peak period ${formatSetCount(chartSnapshot.bestSets)}${chartSnapshot.bestLabel ? ` (${chartSnapshot.bestLabel})` : ""}.`;
    }
  }

  const rangeEl = $("#muscleChartRange");
  if (rangeEl) {
    const start = data.fromDate || data.cutoff;
    const end = data.toDate || new Date();
    const sourceLabel = ui.muscleDimension === "detailed" ? "Detailed muscles" : "Primary muscles";
    const stageHint = chartSnapshot.status === "selection-required"
      ? "Select muscles to track sets"
      : chartSnapshot.status === "no-data"
        ? "No logged muscle sets in this range"
        : chartSnapshot.stage === "a"
          ? "Trend visible after 5 logged periods"
          : chartSnapshot.stage === "b"
            ? `Early trend from ${chartSnapshot.nonZeroCount} periods`
            : "Mature trend view";
    rangeEl.textContent = `Visualized range: ${formatDateRange(start, end)} · ${sourceLabel} · ${stageHint}`;
  }

  const legend = $("#muscleChartLegend");
  if (legend) {
    legend.innerHTML = data.series.length
      ? data.series.map((entry) => {
        return `
          <div class="legend-item">
            <span class="legend-name">
              <span class="legend-swatch" style="background:${entry.color};"></span>
              <span>${esc(entry.name)}</span>
            </span>
            <span class="legend-total">${formatSetCount(entry.total)}</span>
          </div>
        `;
      }).join("")
      : "<div class=\"muted small\">No muscle data in selected range.</div>";
  }
}

function renderStats() {
  const exerciseSelect = $("#statsExerciseSelect");
  if (exerciseSelect) {
    if (!state.exercises.length) {
      exerciseSelect.innerHTML = "<option value=\"\">Add exercises first</option>";
      exerciseSelect.disabled = true;
      ui.statsExerciseId = null;
    } else {
      const sortedExercises = state.exercises
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
      if (!sortedExercises.some((exercise) => exercise.id === ui.statsExerciseId)) {
        ui.statsExerciseId = sortedExercises[0]?.id || null;
      }
      exerciseSelect.disabled = false;
      exerciseSelect.innerHTML = sortedExercises
        .map((exercise) => `<option value="${exercise.id}">${esc(exercise.name)}</option>`)
        .join("");
      if (ui.statsExerciseId) exerciseSelect.value = ui.statsExerciseId;
    }
  }

  const metricSelect = $("#statsMetricSelect");
  if (metricSelect) {
    metricSelect.innerHTML = EXERCISE_STATS_METRICS
      .map((metric) => `<option value="${metric.key}">${metric.label}</option>`)
      .join("");
    if (!EXERCISE_STATS_METRICS.some((metric) => metric.key === ui.statsMetric)) {
      ui.statsMetric = EXERCISE_STATS_METRICS[0].key;
    }
    metricSelect.value = ui.statsMetric;
  }

  const statsMonthsSelect = $("#statsMonthsSelect");
  ui.statsMonthsBack = populateMonthRangeSelect(statsMonthsSelect, ui.statsMonthsBack, 6);
  const selectedMetric = getExerciseStatsMetric(ui.statsMetric);
  const chartTitle = $("#exerciseMetricTitle");
  if (chartTitle) {
    chartTitle.textContent = `${selectedMetric.label} · Last ${ui.statsMonthsBack} month${ui.statsMonthsBack === 1 ? "" : "s"}`;
  }
  const rangeEl = $("#exerciseMetricRange");

  const totalWeightEl = $("#statTotalWeightAll");
  const totalRepsEl = $("#statTotalRepsAll");
  if (!ui.statsExerciseId) {
    if (totalWeightEl) totalWeightEl.textContent = "-";
    if (totalRepsEl) totalRepsEl.textContent = "-";
    const cutoff = getMonthsBackCutoff(ui.statsMonthsBack);
    renderAdaptiveExercisePerformance(selectedMetric, [], cutoff, []);
    if (rangeEl) rangeEl.textContent = "No sessions in selected range. Log workouts to unlock trend feedback.";
  } else {
    const performance = getExercisePerformanceData(ui.statsExerciseId);
    if (totalWeightEl) {
      totalWeightEl.textContent = performance.totalWeight > 0
        ? `${performance.totalWeight.toFixed(0)} kg`
        : "-";
    }
    if (totalRepsEl) {
      totalRepsEl.textContent = performance.totalReps > 0
        ? `${performance.totalReps.toFixed(0)}`
        : "-";
    }

    const cutoff = getMonthsBackCutoff(ui.statsMonthsBack);
    const sessionsInRange = performance.sessions
      .filter((session) => new Date(session.date) >= cutoff);
    const chartData = sessionsInRange
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((session) => ({
        date: session.date,
        label: formatDate(session.date),
        value: Number.isFinite(session[selectedMetric.key]) ? session[selectedMetric.key] : 0
      }));
    renderAdaptiveExercisePerformance(selectedMetric, chartData, cutoff, performance.sessions);
  }

  renderMuscleGroupSection();
  renderBodyMeasurementSection();
}

function measurementInputId(fieldKey) {
  return `measure${fieldKey.charAt(0).toUpperCase()}${fieldKey.slice(1)}`;
}

function getBodyMeasurementDraft() {
  const draft = {};
  let hasValue = false;
  BODY_MEASUREMENT_FIELDS.forEach((field) => {
    const input = $(`#${measurementInputId(field.key)}`);
    const value = parseFloat(input?.value || "");
    draft[field.key] = Number.isFinite(value) ? value : null;
    if (Number.isFinite(value)) hasValue = true;
  });
  return { draft, hasValue };
}

function renderBodyMeasurementSection() {
  const latest = getLatestBodyMeasurement();
  BODY_MEASUREMENT_FIELDS.forEach((field) => {
    const input = $(`#${measurementInputId(field.key)}`);
    if (!input) return;
    if (document.activeElement === input) return;
    const value = latest?.[field.key];
    input.value = Number.isFinite(value) ? value.toFixed(field.decimals) : "";
  });

  const meta = $("#bodyMeasurementMeta");
  if (meta) {
    meta.textContent = latest
      ? `Latest entry: ${formatDateTime(latest.createdAt)}`
      : "No body measurements logged yet.";
  }

  const metricSelect = $("#measurementMetricSelect");
  if (metricSelect) {
    metricSelect.innerHTML = BODY_MEASUREMENT_FIELDS
      .map((field) => `<option value="${field.key}">${field.label}</option>`)
      .join("");
    if (!BODY_MEASUREMENT_FIELDS.some((field) => field.key === ui.measurementMetric)) {
      ui.measurementMetric = BODY_MEASUREMENT_FIELDS[0].key;
    }
    metricSelect.value = ui.measurementMetric;
  }

  const metric = findBodyMeasurementField(ui.measurementMetric);
  const chartData = getSortedBodyMeasurements()
    .filter((entry) => Number.isFinite(entry[metric.key]))
    .map((entry) => ({ label: formatDate(entry.createdAt), value: entry[metric.key] }));
  renderLineChart($("#measurementChart"), chartData, resolveMetricColor(metric.metricColorKey || metric.key));
}

function saveBodyMeasurement() {
  const { draft, hasValue } = getBodyMeasurementDraft();
  if (!hasValue) {
    toast("Enter at least one body measurement");
    return;
  }
  const entry = {
    id: uid(),
    createdAt: new Date().toISOString(),
    ...draft
  };
  state.bodyMeasurements.push(entry);
  if (Number.isFinite(entry.bodyWeight)) {
    state.settings.bodyweight = entry.bodyWeight;
  }
  saveState();
  renderStats();
  renderHistory();
  renderTools();
  toast("Body measurements saved");
}

function renderTools() {
  if ($("#restSecondsWork")) $("#restSecondsWork").value = state.settings.restSecondsWork;
  if ($("#restSecondsDrop")) $("#restSecondsDrop").value = state.settings.restSecondsDrop;
  const autoRest = $("#autoRest");
  if (autoRest) autoRest.checked = !!state.settings.autoRest;
  const barWeightInput = $("#barWeight");
  if (barWeightInput) barWeightInput.value = state.settings.barWeight;
  const platesInput = $("#plates");
  if (platesInput) platesInput.value = state.settings.plates.join(", ");
  const latestBodyWeight = getLatestBodyWeight();
  const bodyweightInput = $("#bodyweight");
  if (bodyweightInput) {
    const fallback = Number.isFinite(latestBodyWeight) ? latestBodyWeight : state.settings.bodyweight;
    bodyweightInput.value = Number.isFinite(fallback) ? fallback : "";
  }
  const includeBar = $("#includeBarWeightInCalc");
  if (includeBar) includeBar.checked = state.settings.includeBarWeightInCalc !== false;
}

function calcPlates() {
  const target = parseFloat($("#plateTarget").value);
  if (!Number.isFinite(target)) {
    toast("Enter target weight");
    return;
  }
  const includeBar = state.settings.includeBarWeightInCalc !== false;
  const bar = includeBar ? (parseFloat(state.settings.barWeight) || 0) : 0;
  const perSide = (target - bar) / 2;
  if (perSide < 0) {
    toast(includeBar ? "Target is below bar weight" : "Target is too low");
    return;
  }
  const plates = state.settings.plates.slice().sort((a, b) => b - a);
  let remaining = perSide;
  const counts = [];
  plates.forEach((plate) => {
    const count = Math.floor(remaining / plate + 1e-6);
    if (count > 0) {
      counts.push({ plate, count });
      remaining -= count * plate;
    }
  });
  const list = $("#plateResults");
  const modeLabel = includeBar ? `Including ${bar.toFixed(1)} kg bar` : "Bar weight excluded";
  if (!counts.length) {
    list.innerHTML = `<div class="muted small">${modeLabel} · No plates needed.</div>`;
    return;
  }
  list.innerHTML = `<div class="muted small">${modeLabel}</div>${counts.map((c) => {
    return `<div class="result-item"><div>${c.plate} kg</div><div>${c.count} per side</div></div>`;
  }).join("")}`;
}
function exportCsv() {
  const rows = [];
  rows.push([
    "Date",
    "Workout",
    "Exercise",
    "Type",
    "Set",
    "WeightKg",
    "AssistKg",
    "Reps",
    "DurationSec",
    "Tag",
    "VolumeKg",
    "Notes"
  ]);

  state.workouts.forEach((workout) => {
    workout.items.forEach((item) => {
      const exercise = getExercise(item.exerciseId);
      item.sets.forEach((set, idx) => {
        const weight = set.type === "weight" ? set.weight : effectiveWeight(set, workout.bodyweight);
        const assist = set.type === "assisted" ? set.assist : "";
        const reps = set.reps || "";
        const duration = set.durationSec || "";
        const volume = set.type === "duration" ? "" : setVolume(set, workout.bodyweight).toFixed(1);
        rows.push([
          formatDateTime(workout.createdAt),
          workout.name || "Workout",
          exercise?.name || "Unknown",
          set.type,
          idx + 1,
          weight || "",
          assist,
          reps,
          duration,
          set.tag || "",
          volume,
          workout.notes || ""
        ]);
      });
    });
  });

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadFile(csv, "forge-data.csv", "text/csv");
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  downloadBlob(blob, "forge-backup.json");
}

function csvEscape(value) {
  const str = value == null ? "" : String(value);
  if (/[,\n\"]/.test(str)) {
    return `"${str.replace(/\"/g, '""')}"`;
  }
  return str;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function shareRoutine(routineId) {
  const routine = state.routines.find((r) => r.id === routineId) || getEditRoutine();
  if (!routine) return;
  const lines = routine.items.map((item) => {
    const ex = getExercise(item.exerciseId);
    const group = item.group ? ` [${item.group}]` : "";
    return `${ex?.name || "Unknown"}${group}`;
  });
  const text = `${routine.name}\n${lines.join("\n")}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: routine.name, text });
      return;
    } catch (err) {
      return;
    }
  }
  await navigator.clipboard.writeText(text);
  toast("Workout copied to clipboard");
}

async function shareWorkout() {
  const workout = getActiveWorkout();
  if (!workout) {
    toast("No active workout");
    return;
  }
  const lines = workout.items.map((item) => {
    const ex = getExercise(item.exerciseId);
    return `${ex?.name || "Unknown"} (${item.sets.length} sets)`;
  });
  const text = `${workout.name}\n${lines.join("\n")}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: workout.name, text });
      return;
    } catch (err) {
      return;
    }
  }
  await navigator.clipboard.writeText(text);
  toast("Workout copied to clipboard");
}

async function handlePhotoUpload(files) {
  const workout = getActiveWorkout();
  if (!workout) return;
  const fileList = Array.from(files || []);
  for (const file of fileList) {
    const id = uid();
    await idbPut("photos", { id, blob: file, createdAt: Date.now() });
    workout.photoIds.push(id);
  }
  saveState();
  renderLog();
}

async function renderPhotoStrip(photoIds) {
  const strip = $("#photoStrip");
  if (!strip) return;
  strip.innerHTML = "";
  for (const id of photoIds) {
    try {
      const record = await idbGet("photos", id);
      if (!record) continue;
      const url = URL.createObjectURL(record.blob);
      const img = document.createElement("img");
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
      strip.appendChild(img);
    } catch (err) {
      continue;
    }
  }
}

function updateSetting(key, value, element) {
  if (key === "autoRest") {
    state.settings.autoRest = !!element?.checked;
    if (!state.settings.autoRest) stopTimer();
    updateTimerUI();
  } else if (key === "plates") {
    state.settings.plates = value
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((v) => Number.isFinite(v))
      .sort((a, b) => b - a);
  } else if (key === "restSecondsWork") {
    state.settings.restSecondsWork = Math.max(10, parseInt(value, 10) || 90);
    updateTimerUI();
  } else if (key === "restSecondsDrop") {
    state.settings.restSecondsDrop = Math.max(10, parseInt(value, 10) || 45);
    updateTimerUI();
  } else if (key === "restSeconds") {
    state.settings.restSecondsWork = Math.max(10, parseInt(value, 10) || 90);
    updateTimerUI();
  } else if (key === "barWeight") {
    state.settings.barWeight = parseFloat(value) || 20;
    const barInput = $("#barWeight");
    if (barInput) barInput.value = state.settings.barWeight;
  } else if (key === "bodyweight") {
    state.settings.bodyweight = parseFloat(value) || 0;
  } else if (key === "includeBarWeightInCalc") {
    state.settings.includeBarWeightInCalc = !!element?.checked;
  }
  saveState();
}

function updateItemField(owner, itemId, field, value) {
  const { items } = getItemCollection(owner);
  if (!items) return;
  const item = items.find((entry) => entry.id === itemId);
  if (!item) return;
  if (field === "note") {
    item.note = value;
  }
  if (field === "group") {
    item.group = value;
  }
  saveState();
}

function updateSetFromControl(target) {
  const field = target.dataset.setField;
  if (!field) return false;
  const owner = target.dataset.owner || "workout";
  const itemId = target.dataset.itemId;
  const setId = target.dataset.setId;
  const { items } = getItemCollection(owner);
  if (!items) return true;
  const item = items.find((entry) => entry.id === itemId);
  if (!item) return true;
  const set = item.sets.find((entry) => entry.id === setId);
  if (!set) return true;

    if (field === "tag") {
      set.tag = target.value;
      saveState();
      return true;
    }

    if (field === "complete") {
      set.completed = !!target.checked;
      saveState();
      if (set.completed) {
        startTimer(getRestSeconds(set.tag));
      }
      return true;
    }

  if (field === "duration") {
    set.durationSec = parseDuration(target.value);
    saveState();
    return true;
  }

  if (field === "distance") {
    const value = parseFloat(target.value);
    set.distance = Number.isFinite(value) ? value : null;
    saveState();
    return true;
  }

  if (field === "assist") {
    const value = parseFloat(target.value);
    set.assist = Number.isFinite(value) ? value : null;
    saveState();
    return true;
  }

  if (field === "weight") {
    const value = parseFloat(target.value);
    set.weight = Number.isFinite(value) ? value : null;
    saveState();
    return true;
  }

  if (field === "reps") {
    const value = parseInt(target.value, 10);
    set.reps = Number.isFinite(value) ? value : null;
    saveState();
    return true;
  }

  return true;
}

function handleInputEvents() {
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (updateSetFromControl(target)) return;
    if (target.id === "routineNameInput") {
      const routine = getEditRoutine();
      if (routine) {
        routine.name = target.value;
        const select = $("#routineSelect");
        const option = select?.querySelector(`option[value="${routine.id}"]`);
        if (option) option.textContent = routine.name || "Workout";
        saveState();
        renderLandingWorkouts();
      }
      return;
    }
    if (target.id === "exerciseSearch") {
        ui.exerciseSearch = target.value;
        renderExercises();
        return;
      }
    if (target.id === "replaceSearch") {
        ui.replaceSearch = target.value;
        renderReplaceSheet();
        return;
      }
    if (target.dataset.multiInput) {
      const multiId = target.dataset.multiInput;
      ui.activeMultiSelect = multiId;
      setMultiSelectQuery(multiId, target.value);
      if (multiId === "stats-muscles") {
        renderMuscleGroupSection();
      } else {
        renderExerciseMuscleSelectors();
      }
      focusMultiInput(multiId);
      return;
    }
      if (target.dataset.field === "workout-name") {
        const workout = getActiveWorkout();
        if (workout) workout.name = target.value;
        saveState();
      return;
    }
    if (target.dataset.field === "workout-notes") {
      const workout = getActiveWorkout();
      if (workout) workout.notes = target.value;
      saveState();
    }
    if (target.dataset.field === "item-note") {
      updateItemField(target.dataset.owner || "workout", target.dataset.itemId, "note", target.value);
      return;
    }
    if (target.dataset.setting) {
      updateSetting(target.dataset.setting, target.value, target);
    }
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (updateSetFromControl(target)) return;
    if (target.id === "statsExerciseSelect") {
      ui.statsExerciseId = target.value;
      renderStats();
      return;
    }
    if (target.id === "statsMetricSelect") {
      ui.statsMetric = target.value;
      renderStats();
      return;
    }
    if (target.id === "statsMonthsSelect") {
      ui.statsMonthsBack = Math.min(12, Math.max(1, parseInt(target.value, 10) || 6));
      renderStats();
      return;
    }
    if (target.id === "muscleGroupingSelect") {
      ui.muscleGrouping = target.value || "week";
      renderStats();
      return;
    }
    if (target.id === "muscleMonthsSelect") {
      ui.muscleMonthsBack = Math.min(12, Math.max(1, parseInt(target.value, 10) || 1));
      renderStats();
      return;
    }
    if (target.id === "measurementMetricSelect") {
      ui.measurementMetric = target.value;
      renderBodyMeasurementSection();
      return;
    }
    if (target.id === "routineSelect") {
      ui.editRoutineId = target.value;
      renderRoutines();
      return;
    }
    if (target.id === "workoutPhotos") {
      handlePhotoUpload(target.files);
      target.value = "";
      return;
    }
    if (target.id === "importJsonInput") {
      importJson(target.files[0]);
      target.value = "";
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const multiId = target.dataset.multiInput;
    if (!multiId) return;

    if ((event.key === "Enter" || event.key === ",") && canCreateMultiSelectOption(multiId)) {
      const value = normalizeMuscleTagValue(target.value);
      if (!value) return;
      event.preventDefault();
      const current = getMultiSelectState(multiId).selected;
      if (!current.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
        setMultiSelectSelection(multiId, [...current, value]);
      }
      const kind = multiSelectMuscleKind(multiId);
      if (kind) {
        rememberMuscleTags(kind, [value]);
        saveState();
      }
      setMultiSelectQuery(multiId, "");
      if (multiId === "stats-muscles") {
        ui.muscleSelectionInitialized = true;
        renderStats();
      } else {
        renderExerciseMuscleSelectors();
      }
      focusMultiInput(multiId);
      return;
    }

    if (event.key === "Backspace" && !target.value.trim()) {
      const current = getMultiSelectState(multiId).selected;
      if (!current.length) return;
      event.preventDefault();
      setMultiSelectSelection(multiId, current.slice(0, -1));
      if (multiId === "stats-muscles") {
        ui.muscleSelectionInitialized = true;
        renderStats();
      } else {
        renderExerciseMuscleSelectors();
      }
      focusMultiInput(multiId);
    }
  });

    document.addEventListener("click", (event) => {
      const insideMulti = event.target.closest(".multi-select");
      if (!insideMulti && ui.activeMultiSelect) {
        ui.activeMultiSelect = null;
        if (ui.view === "stats") renderMuscleGroupSection();
        if (ui.view === "exercises") renderExerciseMuscleSelectors();
      }
      if (event.target.id === "workoutSheet") {
        closeWorkoutSheet();
        return;
      }
      if (event.target.id === "finishSheet") {
        closeFinishSheet();
        return;
      }
      if (event.target.id === "historySheet") {
        closeHistorySheet();
        return;
      }
      if (event.target.id === "historyActionSheet") {
        closeHistoryActionSheet();
        return;
      }
      if (event.target.id === "historyEditSheet") {
        closeHistoryEditSheet();
        return;
      }
      if (event.target.id === "replaceSheet") {
        closeReplaceSheet();
        return;
      }
      if (event.target.id === "exerciseEditSheet") {
        closeExerciseEditSheet();
        return;
      }
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "multi-open") {
        const multiId = button.dataset.multiId || null;
        ui.activeMultiSelect = ui.activeMultiSelect === multiId ? null : multiId;
        if (multiId === "stats-muscles") {
          renderMuscleGroupSection();
        } else {
          renderExerciseMuscleSelectors();
        }
        if (ui.activeMultiSelect) focusMultiInput(multiId);
        return;
      }
      if (action === "multi-toggle") {
        const multiId = button.dataset.multiId || "";
        const value = String(button.dataset.value || "").trim();
        if (!multiId || !value) return;
        const current = getMultiSelectState(multiId).selected;
        const next = current.includes(value)
          ? current.filter((entry) => entry !== value)
          : [...current, value];
        setMultiSelectSelection(multiId, next);
        ui.activeMultiSelect = multiId;
        if (multiId === "stats-muscles") {
          ui.muscleSelectionInitialized = true;
          renderStats();
        } else {
          renderExerciseMuscleSelectors();
        }
        focusMultiInput(multiId);
        return;
      }
      if (action === "multi-create") {
        const multiId = button.dataset.multiId || "";
        const rawValue = String(button.dataset.value || "");
        const value = normalizeMuscleTagValue(rawValue);
        if (!multiId || !value) return;
        const current = getMultiSelectState(multiId).selected;
        if (!current.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
          setMultiSelectSelection(multiId, [...current, value]);
        }
        const kind = multiSelectMuscleKind(multiId);
        if (kind) {
          rememberMuscleTags(kind, [value]);
          saveState();
        }
        ui.activeMultiSelect = multiId;
        if (multiId === "stats-muscles") {
          ui.muscleSelectionInitialized = true;
          renderStats();
        } else {
          renderExerciseMuscleSelectors();
        }
        focusMultiInput(multiId);
        return;
      }
      if (action === "multi-remove") {
        const multiId = button.dataset.multiId || "";
        const value = String(button.dataset.value || "").trim();
        if (!multiId || !value) return;
        const current = getMultiSelectState(multiId).selected;
        const next = current.filter((entry) => entry !== value);
        setMultiSelectSelection(multiId, next);
        ui.activeMultiSelect = multiId;
        if (multiId === "stats-muscles") {
          ui.muscleSelectionInitialized = true;
          renderStats();
        } else {
          renderExerciseMuscleSelectors();
        }
        focusMultiInput(multiId);
        return;
      }
      if (action === "nav") {
        const next = button.dataset.view;
        if (next === "workouts" && getActiveWorkout()) {
          setView("session");
        } else {
          setView(next);
        }
        return;
      }
    if (action === "start-quick") {
      startWorkout();
      return;
    }
    if (action === "create-workout") {
      const name = prompt("Workout name?");
      if (!name) return;
      const routine = createRoutine(name);
      if (routine) {
        setView("routines");
        renderRoutines();
      }
      return;
    }
    if (action === "workout-options") {
      openWorkoutSheet(button.dataset.routineId);
      return;
    }
    if (action === "sheet-start") {
      if (ui.selectedRoutineId) startWorkout(ui.selectedRoutineId);
      closeWorkoutSheet();
      return;
    }
    if (action === "sheet-edit") {
      if (ui.selectedRoutineId) {
        ui.editRoutineId = ui.selectedRoutineId;
        setView("routines");
        renderRoutines();
      }
      closeWorkoutSheet();
      return;
    }
    if (action === "sheet-cancel") {
      closeWorkoutSheet();
      return;
    }
    if (action === "sheet-delete") {
      const routineId = ui.selectedRoutineId;
      if (!routineId) return;
      const routine = state.routines.find((entry) => entry.id === routineId);
      if (!routine) return;
      if (!confirm(`Delete ${routine.name || "this workout"}?`)) return;
      deleteRoutine(routineId);
      closeWorkoutSheet();
      toast("Workout deleted");
      return;
    }
    if (action === "start-routine") {
      const routineId = button.dataset.routineId || $("#startRoutineSelect")?.value || null;
      if (!routineId) {
        toast("Create a workout first");
        return;
      }
      startWorkout(routineId);
      return;
    }
    if (action === "end-workout") {
      endWorkout();
      return;
    }
    if (action === "add-workout-exercise") {
      const exerciseId = $("#addExerciseSelect")?.value;
      if (!exerciseId) return;
      addWorkoutExercise(exerciseId);
      return;
    }
    if (action === "remove-workout-exercise") {
      removeWorkoutExercise(button.dataset.itemId);
      return;
    }
    if (action === "add-set") {
      addSetFromCard(button);
      return;
    }
    if (action === "remove-set") {
      removeSet(button.dataset.itemId, button.dataset.setId, button.dataset.owner || "workout");
      return;
    }
      if (action === "cycle-set-tag") {
        cycleSetTag(button.dataset.owner || "workout", button.dataset.itemId, button.dataset.setId);
        return;
      }
      if (action === "timer-stop") {
        stopTimer();
        return;
      }
      if (action === "finish-workout") {
        openFinishSheet();
        return;
      }
      if (action === "finish-complete") {
        completeUnfinishedSets();
        return;
      }
      if (action === "finish-cancel-workout") {
        cancelWorkout();
        return;
      }
      if (action === "finish-close") {
        closeFinishSheet();
        return;
      }
      if (action === "history-details") {
        const entryType = button.dataset.entryType || "workout";
        const entryId = entryType === "measurement" ? button.dataset.measurementId : button.dataset.workoutId;
        openHistorySheet(entryType, entryId);
        return;
      }
      if (action === "history-options") {
        const entryType = button.dataset.entryType || "workout";
        const entryId = entryType === "measurement" ? button.dataset.measurementId : button.dataset.workoutId;
        openHistoryActionSheet(entryType, entryId);
        return;
      }
      if (action === "history-action-view") {
        const target = ui.historyActionTarget;
        if (target) openHistorySheet(target.type, target.id);
        closeHistoryActionSheet();
        return;
      }
      if (action === "history-action-edit") {
        const target = ui.historyActionTarget;
        if (target) openHistoryEditSheet(target.type, target.id);
        return;
      }
      if (action === "history-action-delete") {
        const target = ui.historyActionTarget;
        if (!target) return;
        if (target.type === "measurement") {
          deleteBodyMeasurement(target.id);
        } else {
          deleteWorkout(target.id);
        }
        return;
      }
      if (action === "history-action-close") {
        closeHistoryActionSheet();
        return;
      }
      if (action === "history-edit-save") {
        saveHistoryEdit();
        return;
      }
      if (action === "history-edit-close") {
        closeHistoryEditSheet();
        return;
      }
      if (action === "history-filter") {
        ui.historyFilter = button.dataset.filter || "all";
        renderHistory();
        return;
      }
      if (action === "muscle-dimension") {
        const next = button.dataset.dimension === "detailed" ? "detailed" : "primary";
        if (ui.muscleDimension !== next) {
          ui.muscleDimension = next;
          ui.selectedMuscles = [];
          ui.muscleSearchQuery = "";
          ui.muscleSelectionInitialized = false;
        }
        renderStats();
        return;
      }
      if (action === "history-close") {
        closeHistorySheet();
        return;
      }
    if (action === "create-routine") {
      const name = prompt("Workout name?");
      if (!name) return;
      createRoutine(name);
      return;
    }
    if (action === "delete-routine") {
      deleteRoutine(button.dataset.routineId);
      return;
    }
    if (action === "edit-routine") {
      ui.editRoutineId = button.dataset.routineId;
      setView("routines");
      renderRoutines();
      return;
    }
    if (action === "add-routine-item") {
      addRoutineItem();
      return;
    }
      if (action === "replace-exercise") {
        openReplaceSheet(button.dataset.owner || "workout", button.dataset.itemId);
        return;
      }
      if (action === "replace-close") {
        closeReplaceSheet();
        return;
      }
      if (action === "replace-choose") {
        chooseReplacement(button.dataset.exerciseId);
        return;
      }
    if (action === "remove-routine-item") {
      removeRoutineItem(button.dataset.routineId, button.dataset.itemId);
      return;
    }
    if (action === "move-routine-item-up") {
      moveRoutineItem(button.dataset.routineId, button.dataset.itemId, -1);
      return;
    }
    if (action === "move-routine-item-down") {
      moveRoutineItem(button.dataset.routineId, button.dataset.itemId, 1);
      return;
    }
    if (action === "share-routine") {
      shareRoutine(button.dataset.routineId);
      return;
    }
    if (action === "toggle-exercise-form") {
      const form = $("#exerciseForm");
      if (form) form.classList.toggle("hidden");
      return;
    }
    if (action === "create-exercise") {
      createExercise();
      return;
    }
    if (action === "edit-exercise") {
      openExerciseEditSheet(button.dataset.exerciseId);
      return;
    }
    if (action === "exercise-edit-save") {
      saveExerciseEdit();
      return;
    }
    if (action === "exercise-edit-close") {
      closeExerciseEditSheet();
      return;
    }
    if (action === "delete-exercise") {
      deleteExercise(button.dataset.exerciseId);
      return;
    }
    if (action === "export-csv") {
      exportCsv();
      return;
    }
    if (action === "export-json") {
      exportJson();
      return;
    }
    if (action === "save-body-measurement") {
      saveBodyMeasurement();
      return;
    }
    if (action === "calc-plates") {
      calcPlates();
      return;
    }
    if (action === "share-workout") {
      shareWorkout();
    }
    if (action === "cloud-login") {
      const email = $("#cloudEmail")?.value.trim();
      sendMagicLink(email);
      return;
    }
    if (action === "cloud-sync") {
      syncToCloud();
      return;
    }
    if (action === "cloud-logout") {
      supabaseClient?.auth.signOut();
      return;
    }
  });
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = loadStateFromImport(parsed);
      saveState();
      renderAll();
      toast("Import complete");
    } catch (err) {
      toast("Invalid JSON");
    }
  };
  reader.readAsText(file);
}

function loadStateFromImport(parsed) {
  const merged = JSON.parse(JSON.stringify(DEFAULT_STATE));
  merged.settings = mergeSettings(parsed.settings || {});
  merged.exercises = normalizeExercises(parsed.exercises);
  merged.routines = Array.isArray(parsed.routines) ? parsed.routines.map(normalizeRoutine) : [];
  merged.workouts = Array.isArray(parsed.workouts) ? parsed.workouts.map(normalizeWorkout) : [];
  merged.bodyMeasurements = Array.isArray(parsed.bodyMeasurements)
    ? parsed.bodyMeasurements.map(normalizeBodyMeasurement).filter(Boolean)
    : [];
  merged.muscleTagLibrary = normalizeMuscleTagLibrary(parsed.muscleTagLibrary);
  merged.activeWorkoutId = parsed.activeWorkoutId || null;
  merged.lastModified = parsed.lastModified || 0;
  return merged;
}

function renderAll() {
  renderLog();
  renderHistory();
  renderRoutines();
  renderExercises();
  renderStats();
  renderTools();
  updateCloudUI();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js");
    });
  }
}

  function setupInstallPrompt() {
  const btn = $("#installBtn");
  if (!btn) return;
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    btn.classList.remove("hidden");
  });

  btn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.classList.add("hidden");
  });
}

function updateLatestUpdateStamp() {
  const el = $("#latestUpdate");
  if (!el) return;
  const raw = document.lastModified;
  const parsed = raw ? new Date(raw) : null;
  const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
  el.textContent = `Updated ${date.toLocaleString()}`;
}

function getUrlHashParams(url) {
  return new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
}

function hasSupabaseAuthParams(url) {
  const hashParams = getUrlHashParams(url);
  const callbackType = (url.searchParams.get("type") || hashParams.get("type") || "").toLowerCase();
  const hasAuthType = callbackType === "magiclink"
    || callbackType === "recovery"
    || callbackType === "invite"
    || callbackType === "signup"
    || callbackType === "email_change";
  return url.searchParams.has("code")
    || url.searchParams.has("access_token")
    || url.searchParams.has("refresh_token")
    || url.searchParams.has("error_code")
    || hashParams.has("access_token")
    || hashParams.has("refresh_token")
    || hashParams.has("error_code")
    || hasAuthType;
}

function stripSupabaseAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  if (!hasSupabaseAuthParams(url)) return;

  const hashParams = getUrlHashParams(url);
  SUPABASE_AUTH_URL_KEYS.forEach((key) => {
    url.searchParams.delete(key);
    hashParams.delete(key);
  });

  const query = url.searchParams.toString();
  const hash = hashParams.toString();
  const cleanUrl = `${url.pathname}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

async function restoreSupabaseSessionFromUrl() {
  if (!supabaseClient) return;
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (!code) return;
  const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
  if (error) {
    toast("Magic link failed");
  }
}

async function initSupabase() {
  if (!window.supabase) return;
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    cloud.user = session?.user || null;
    updateCloudUI();
    if (cloud.user) {
      loadFromCloud();
    }
  });
  await restoreSupabaseSessionFromUrl();
  const { data } = await supabaseClient.auth.getSession();
  cloud.user = data.session?.user || null;
  updateCloudUI();
  if (cloud.user) {
    loadFromCloud();
  }
  stripSupabaseAuthParamsFromUrl();
}

function updateCloudUI() {
  const status = $("#cloudStatus");
  const email = $("#cloudEmail");
  const loginBtn = $("#cloudLoginBtn");
  const syncBtn = $("#cloudSyncBtn");
  const logoutBtn = $("#cloudLogoutBtn");

  if (!status) return;
  if (!supabaseClient) {
    status.textContent = "Cloud sync unavailable";
    return;
  }

  if (cloud.user) {
    status.textContent = `Signed in as ${cloud.user.email || "user"}`;
    if (email) {
      email.value = cloud.user.email || "";
      email.disabled = true;
    }
    if (loginBtn) loginBtn.classList.add("hidden");
    if (syncBtn) syncBtn.classList.remove("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");
  } else {
    status.textContent = "Signed out";
    if (email) {
      email.disabled = false;
    }
    if (loginBtn) loginBtn.classList.remove("hidden");
    if (syncBtn) syncBtn.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
  }
}

async function sendMagicLink(email) {
  if (!supabaseClient) return;
  if (!email) {
    toast("Enter an email address");
    return;
  }
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });
  if (error) {
    toast("Magic link failed");
    return;
  }
  toast("Magic link sent");
}

async function loadFromCloud() {
  if (!supabaseClient || !cloud.user) return;
  const { data, error } = await supabaseClient
    .from("forge_profiles")
    .select("data, updated_at")
    .eq("user_id", cloud.user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    toast("Cloud sync error");
    return;
  }

  if (!data?.data) {
    await syncToCloud();
    return;
  }

  const remoteUpdated = Date.parse(data.updated_at || "") || 0;
  const localUpdated = state.lastModified || 0;
  if (remoteUpdated > localUpdated) {
    state = loadStateFromImport(data.data);
    state.lastModified = remoteUpdated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
    toast("Loaded cloud data");
  } else {
    await syncToCloud();
  }
}

async function syncToCloud() {
  if (!supabaseClient || !cloud.user) return;
  if (cloud.syncing) return;
  cloud.syncing = true;
  const payload = {
    user_id: cloud.user.id,
    data: state,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabaseClient
    .from("forge_profiles")
    .upsert(payload, { onConflict: "user_id" });
  cloud.syncing = false;
  if (error) {
    toast("Cloud sync failed");
    return;
  }
  cloud.lastSync = Date.now();
  toast("Synced to cloud");
}

function scheduleCloudSync() {
  if (!cloud.user) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncToCloud();
  }, 1200);
}

  function init() {
    handleInputEvents();
    applyTheme("dark", { persist: false });
    setView(ui.view);
    renderAll();
    renderTools();
    initSupabase().catch(() => {
      updateCloudUI();
    });
    updateLatestUpdateStamp();
    registerServiceWorker();
    setupInstallPrompt();
  }

document.addEventListener("DOMContentLoaded", init);






