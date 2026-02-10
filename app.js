
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
    restSecondsWarmup: 60,
    restSecondsDrop: 45,
    autoRest: true,
    warmupPercents: [40, 60, 80],
    barWeight: 20,
    plates: [25, 20, 15, 10, 5, 2.5, 1.25],
    bodyweight: 75,
    oneRmFormula: "epley"
  },
  exercises: SEED_EXERCISES,
  routines: [],
  workouts: [],
  activeWorkoutId: null
};

const ui = {
  view: "workouts",
  editRoutineId: null,
  statsExerciseId: null,
  exerciseSearch: "",
  selectedRoutineId: null,
  replaceTarget: null,
  replaceSearch: "",
  editExerciseId: null
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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
  if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
  try {
    const saved = JSON.parse(raw);
    const merged = JSON.parse(JSON.stringify(DEFAULT_STATE));
    merged.settings = mergeSettings(saved.settings || {});
    merged.exercises = stripLegacyExercises(saved.exercises);
    merged.routines = Array.isArray(saved.routines) ? saved.routines.map(normalizeRoutine) : [];
    merged.workouts = Array.isArray(saved.workouts) ? saved.workouts.map(normalizeWorkout) : [];
    merged.activeWorkoutId = saved.activeWorkoutId || null;
    merged.lastModified = saved.lastModified || 0;
    return merged;
  } catch (err) {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
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

function mergeSettings(saved = {}) {
  const merged = { ...DEFAULT_STATE.settings, ...saved };
  const legacyRest = saved.restSeconds;
  if (Number.isFinite(legacyRest)) {
    if (!Number.isFinite(saved.restSecondsWork)) merged.restSecondsWork = legacyRest;
    if (!Number.isFinite(saved.restSecondsWarmup)) merged.restSecondsWarmup = Math.max(10, Math.round(legacyRest * 0.7));
    if (!Number.isFinite(saved.restSecondsDrop)) merged.restSecondsDrop = Math.max(10, Math.round(legacyRest * 0.5));
  }
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
      type: "weight"
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
  if (state.settings.oneRmFormula === "brzycki") {
    if (reps >= 37) return 0;
    return weight * (36 / (37 - reps));
  }
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
  const key = normalizedTag === "warmup" || normalizedTag === "warm-up"
    ? "restSecondsWarmup"
    : normalizedTag === "drop" || normalizedTag === "dropset" || normalizedTag === "drop-set"
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
  const workout = {
    id: uid(),
    name: routine ? routine.name : "Workout",
    createdAt: now,
    routineId: routine ? routine.id : null,
    bodyweight: state.settings.bodyweight,
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
      const hay = `${ex.name} ${ex.category || ""}`.toLowerCase();
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
  const category = $("#editExerciseCategory");
  const type = $("#editExerciseType");
  if (name) name.value = exercise.name || "";
  if (category) category.value = exercise.category || "";
  if (type) type.value = exercise.type || "weight";
  const sheet = $("#exerciseEditSheet");
  if (sheet) sheet.classList.remove("hidden");
}

function closeExerciseEditSheet() {
  ui.editExerciseId = null;
  const sheet = $("#exerciseEditSheet");
  if (sheet) sheet.classList.add("hidden");
}

function saveExerciseEdit() {
  if (!ui.editExerciseId) return;
  const exercise = state.exercises.find((ex) => ex.id === ui.editExerciseId);
  if (!exercise) return;
  const name = $("#editExerciseName")?.value.trim() || "";
  const category = $("#editExerciseCategory")?.value.trim() || "";
  const type = $("#editExerciseType")?.value || "weight";
  if (!name) {
    toast("Exercise needs a name");
    return;
  }
  if (type !== exercise.type && exerciseInUse(exercise.id)) {
    toast("Type can't be changed while exercise is in use");
    return;
  }
  exercise.name = name;
  exercise.category = category;
  exercise.type = type;
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
  if (normalized === "warm-up") return "warmup";
  if (normalized === "drop-set") return "drop";
  if (normalized === "dropset") return "drop";
  if (normalized === "failure") return "failure";
  if (normalized === "warmup") return "warmup";
  if (normalized === "drop") return "drop";
  return "work";
}

function nextSetTag(tag) {
  const order = ["work", "warmup", "failure", "drop"];
  const current = normalizeSetTag(tag);
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

function setTagShort(tag) {
  const current = normalizeSetTag(tag);
  if (current === "warmup") return "WU";
  if (current === "failure") return "F";
  if (current === "drop") return "D";
  return "W";
}

function setTagLabel(tag) {
  const current = normalizeSetTag(tag);
  if (current === "warmup") return "Warm-up";
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
  const category = $("#exerciseCategory")?.value.trim();
  const type = $("#exerciseType")?.value || "weight";
  if (!name) {
    toast("Exercise needs a name");
    return;
  }
  const exercise = {
    id: uid(),
    name,
    category,
    type
  };
  state.exercises.push(exercise);
  $("#exerciseName").value = "";
  $("#exerciseCategory").value = "";
  saveState();
  renderExercises();
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
    const bwInput = $("[data-field='workout-bodyweight']");
    const notesInput = $("[data-field='workout-notes']");
    if (nameInput) nameInput.value = active.name || "";
    if (bwInput) bwInput.value = Number.isFinite(active.bodyweight) ? active.bodyweight : "";
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
      container.innerHTML = active.items.map((item) => renderWorkoutExercise(item, active)).join("");
    }
  }

  updateTimerUI();
  renderPhotoStrip(active.photoIds || []);
}

function getPreviousSets(exerciseId, workoutId) {
  const sorted = state.workouts
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  for (const workout of sorted) {
    if (workout.id === workoutId) continue;
    const item = workout.items.find((entry) => entry.exerciseId === exerciseId);
    if (item) return item.sets || [];
  }
  return [];
}

function formatPreviousSet(set) {
  if (!set) return "-";
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
  const weight = Number.isFinite(set.weight) ? `${set.weight} kg` : "-";
  const reps = Number.isFinite(set.reps) ? `${set.reps} reps` : "-";
  return `${weight} x ${reps}`;
}

  function renderSetsHeader(type, owner) {
    const loadLabel = type === "assisted" ? "Assist" : type === "duration" ? "Time" : "kg";
    const repsLabel = type === "duration" ? "Distance" : "Reps";
    const doneLabel = owner === "workout" ? "<div>Done</div>" : "";
    return `<div class="set-row owner-${owner} header"><div>Set</div><div>Previous</div><div>${loadLabel}</div><div>${repsLabel}</div>${doneLabel}<div></div></div>`;
  }

  function renderSetRow(set, index, itemId, owner, prevSet) {
    const tag = normalizeSetTag(set.tag || "work");
    const prevLabel = formatPreviousSet(prevSet);
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
        <div class="set-cell set-prev">${esc(prevLabel)}</div>
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
  const prevSets = owner === "workout" ? getPreviousSets(item.exerciseId, options.workoutId) : [];
    const setsHeader = renderSetsHeader(exercise.type, owner);
  const setsRows = item.sets.map((set, index) => renderSetRow(set, index, item.id, owner, prevSets[index])).join("");
  const setsHtml = item.sets.length ? setsHeader + setsRows : `${setsHeader}<div class="muted small">No sets yet.</div>`;
  const tagHelp = item.sets.length
    ? "<div class=\"muted small set-tag-help\">Tap set number to cycle tag (W, WU, F, D).</div>"
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

function renderWorkoutExercise(item, workout) {
  return renderExerciseCard(item, { owner: "workout", workoutId: workout.id });
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

  function renderHistory() {
    const list = $("#historyList");
    if (!list) return;
    const history = state.workouts
      .filter((w) => w.id !== state.activeWorkoutId)
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!history.length) {
      list.innerHTML = "<div class=\"muted small\">No saved workouts yet.</div>";
      return;
    }
    list.innerHTML = history.map((workout) => {
      const volume = workoutVolume(workout);
      const exerciseCount = workout.items.length;
      return `
        <div class="result-item history-item" data-action="history-details" data-workout-id="${workout.id}">
          <div>
            <div class="title">${esc(workout.name || "Workout")}</div>
            <div class="muted small">${formatDate(workout.createdAt)} · ${exerciseCount} exercises</div>
          </div>
          <div class="history-actions">
            <div class="title">${volume.toFixed(0)} kg</div>
            <button class="ghost icon-btn" data-action="history-delete" data-workout-id="${workout.id}" aria-label="Delete workout">⋯</button>
          </div>
        </div>
      `;
    }).join("");
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

  function openHistorySheet(workoutId) {
    const workout = state.workouts.find((w) => w.id === workoutId);
    if (!workout) return;
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

  function closeHistorySheet() {
    const sheet = $("#historySheet");
    if (sheet) sheet.classList.add("hidden");
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
  const list = $("#exerciseList");
  if (!list) return;
  const term = ui.exerciseSearch.toLowerCase();
  const exercises = state.exercises
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((ex) => ex.name.toLowerCase().includes(term) || (ex.category || "").toLowerCase().includes(term));

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

  function computeExerciseStats(exerciseId) {
    const exercise = getExercise(exerciseId);
    if (!exercise) return null;

    let maxWeight = 0;
    let maxReps = 0;
    let maxOneRm = 0;
    let totalVolume = 0;
    let totalReps = 0;
    let totalWeight = 0;
    const progression = [];

  state.workouts.forEach((workout) => {
    let dayVolume = 0;
    let dayOneRm = 0;
    workout.items.forEach((item) => {
        if (item.exerciseId !== exerciseId) return;
        item.sets.forEach((set) => {
          if (exercise.type === "duration") {
            if (set.durationSec) {
              totalVolume += set.durationSec;
              dayVolume += set.durationSec;
              totalReps += set.durationSec;
              maxReps = Math.max(maxReps, set.durationSec);
            }
            return;
          }
          if (!set.reps) return;
          const weight = effectiveWeight(set, workout.bodyweight);
          if (!weight) return;
          maxWeight = Math.max(maxWeight, weight);
          maxReps = Math.max(maxReps, set.reps);
          const oneRm = calcOneRm(weight, set.reps);
          maxOneRm = Math.max(maxOneRm, oneRm);
          dayOneRm = Math.max(dayOneRm, oneRm);
          const volume = weight * set.reps;
          totalVolume += volume;
          totalWeight += volume;
          totalReps += set.reps;
          dayVolume += volume;
        });
      });
      if (dayVolume > 0) {
        progression.push({ date: workout.createdAt, volume: dayVolume, oneRm: dayOneRm });
      }
    });

    progression.sort((a, b) => new Date(a.date) - new Date(b.date));
    return { exercise, maxWeight, maxReps, maxOneRm, totalVolume, totalReps, totalWeight, progression };
  }

function renderStats() {
  const select = $("#statsExerciseSelect");
  if (select) {
    if (!state.exercises.length) {
      select.innerHTML = "<option value=\"\">Add exercises first</option>";
      select.disabled = true;
      ui.statsExerciseId = null;
    } else {
      select.disabled = false;
      select.innerHTML = state.exercises
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((ex) => `<option value="${ex.id}">${esc(ex.name)}</option>`)
        .join("");
      if (!ui.statsExerciseId) ui.statsExerciseId = state.exercises[0]?.id || null;
      if (ui.statsExerciseId) select.value = ui.statsExerciseId;
    }
  }

    if (!ui.statsExerciseId) {
      $("#stat1rm").textContent = "-";
      $("#statMaxWeight").textContent = "-";
      $("#statMaxReps").textContent = "-";
      $("#statVolume").textContent = "-";
      $("#statTotalReps").textContent = "-";
      renderLineChart($("#volumeChart"), [], "#b197ff");
      renderLineChart($("#oneRmChart"), [], "#b197ff");
      return;
    }
  const stats = computeExerciseStats(ui.statsExerciseId);
  if (!stats) return;

  const isDuration = stats.exercise.type === "duration";

  $("#stat1rm").textContent = isDuration ? "-" : `${stats.maxOneRm.toFixed(1)} kg`;
  $("#statMaxWeight").textContent = isDuration ? "-" : `${stats.maxWeight.toFixed(1)} kg`;
    $("#statMaxReps").textContent = isDuration
      ? formatDuration(stats.maxReps)
      : `${stats.maxReps}`;
    $("#statVolume").textContent = isDuration
      ? "-"
      : `${stats.totalWeight.toFixed(0)} kg`;
    $("#statTotalReps").textContent = isDuration
      ? `${formatDuration(stats.totalReps)}`
      : `${stats.totalReps}`;

  const volumeData = stats.progression.map((p) => ({ label: formatDate(p.date), value: p.volume }));
  const oneRmData = stats.progression.map((p) => ({ label: formatDate(p.date), value: p.oneRm }));

  renderLineChart($("#volumeChart"), volumeData, "#b197ff");
  renderLineChart($("#oneRmChart"), isDuration ? [] : oneRmData, "#7a5cff");
}

function renderLineChart(container, data, color) {
  if (!container) return;
  if (!data.length) {
    container.innerHTML = "<div class=\"muted small\">No data yet.</div>";
    return;
  }
  const width = 320;
  const height = 160;
  const pad = 20;
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = pad + step * i;
    const y = height - pad - ((d.value - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const last = data[data.length - 1];
  const lastX = pad + step * (data.length - 1);
  const lastY = height - pad - ((last.value - min) / span) * (height - pad * 2);

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="160" preserveAspectRatio="none">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${lastX}" cy="${lastY}" r="4" fill="${color}" />
    </svg>
  `;
}

function renderTools() {
  if ($("#restSecondsWork")) $("#restSecondsWork").value = state.settings.restSecondsWork;
  if ($("#restSecondsWarmup")) $("#restSecondsWarmup").value = state.settings.restSecondsWarmup;
  if ($("#restSecondsDrop")) $("#restSecondsDrop").value = state.settings.restSecondsDrop;
  const autoRest = $("#autoRest");
  if (autoRest) autoRest.checked = !!state.settings.autoRest;
  $("#warmupPercents").value = state.settings.warmupPercents.join(", ");
  $("#barWeight").value = state.settings.barWeight;
  $("#plates").value = state.settings.plates.join(", ");
  $("#bodyweight").value = state.settings.bodyweight;
  $("#oneRmFormula").value = state.settings.oneRmFormula;
  $("#plateBarWeight").value = state.settings.barWeight;
}

function getWeightIncrement() {
  const plates = state.settings.plates.length ? state.settings.plates : [2.5];
  const min = Math.min(...plates);
  return min * 2;
}

function roundToIncrement(weight, increment) {
  return Math.round(weight / increment) * increment;
}

function calcWarmup() {
  const input = parseFloat($("#warmupWeight").value);
  if (!Number.isFinite(input)) {
    toast("Enter a working weight");
    return;
  }
  const increment = getWeightIncrement();
  const results = state.settings.warmupPercents.map((percent) => {
    const weight = roundToIncrement(input * (percent / 100), increment);
    return { percent, weight };
  });
  const list = $("#warmupResults");
  list.innerHTML = results.map((r) => {
    return `<div class="result-item"><div>${r.percent}%</div><div>${r.weight.toFixed(1)} kg</div></div>`;
  }).join("");
}

function calcPlates() {
  const target = parseFloat($("#plateTarget").value);
  const bar = parseFloat($("#plateBarWeight").value || state.settings.barWeight);
  if (!Number.isFinite(target)) {
    toast("Enter target weight");
    return;
  }
  const perSide = (target - bar) / 2;
  if (perSide < 0) {
    toast("Target is below bar weight");
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
  if (!counts.length) {
    list.innerHTML = "<div class=\"muted small\">No plates needed.</div>";
    return;
  }
  list.innerHTML = counts.map((c) => {
    return `<div class="result-item"><div>${c.plate} kg</div><div>${c.count} per side</div></div>`;
  }).join("");
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
    } else if (key === "warmupPercents") {
    state.settings.warmupPercents = value
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((v) => Number.isFinite(v));
  } else if (key === "plates") {
    state.settings.plates = value
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((v) => Number.isFinite(v))
      .sort((a, b) => b - a);
  } else if (key === "restSecondsWork") {
    state.settings.restSecondsWork = Math.max(10, parseInt(value, 10) || 90);
    updateTimerUI();
  } else if (key === "restSecondsWarmup") {
    state.settings.restSecondsWarmup = Math.max(10, parseInt(value, 10) || 60);
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
      const plateBar = $("#plateBarWeight");
      if (plateBar) plateBar.value = state.settings.barWeight;
    } else if (key === "bodyweight") {
    state.settings.bodyweight = parseFloat(value) || 0;
  } else if (key === "oneRmFormula") {
    state.settings.oneRmFormula = value;
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
      if (target.id === "plateBarWeight") {
        updateSetting("barWeight", target.value, target);
        return;
      }
      if (target.dataset.field === "workout-name") {
        const workout = getActiveWorkout();
        if (workout) workout.name = target.value;
        saveState();
      return;
    }
    if (target.dataset.field === "workout-bodyweight") {
      const workout = getActiveWorkout();
      if (workout) workout.bodyweight = parseFloat(target.value);
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
    }
    if (target.id === "routineSelect") {
      ui.editRoutineId = target.value;
      renderRoutines();
    }
    if (target.id === "workoutPhotos") {
      handlePhotoUpload(target.files);
      target.value = "";
    }
      if (target.id === "importJsonInput") {
        importJson(target.files[0]);
        target.value = "";
      }
    });

    document.addEventListener("click", (event) => {
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
        openHistorySheet(button.dataset.workoutId);
        return;
      }
      if (action === "history-delete") {
        deleteWorkout(button.dataset.workoutId);
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
    if (action === "calc-warmup") {
      calcWarmup();
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
  merged.exercises = stripLegacyExercises(parsed.exercises);
  merged.routines = Array.isArray(parsed.routines) ? parsed.routines.map(normalizeRoutine) : [];
  merged.workouts = Array.isArray(parsed.workouts) ? parsed.workouts.map(normalizeWorkout) : [];
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






