const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const storage = new Map();
const noop = () => {};
const context = {
  console,
  crypto: crypto.webcrypto,
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key)
  },
  window: {
    FORGE_CONFIG: {},
    addEventListener: noop,
    location: { href: "http://localhost/", origin: "http://localhost", pathname: "/" },
    history: { replaceState: noop }
  },
  document: {
    addEventListener: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    documentElement: { style: { setProperty: noop } },
    title: "Forge"
  },
  navigator: {},
  indexedDB: {},
  fetch: async () => ({ ok: false, json: async () => [] }),
  URL,
  URLSearchParams,
  Blob,
  Date,
  Math,
  JSON,
  Map,
  Set,
  Promise,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  requestAnimationFrame: (callback) => callback(),
  getComputedStyle: () => ({ getPropertyValue: () => "" }),
  confirm: () => true,
  prompt: () => null
};
context.window.document = context.document;
context.window.navigator = context.navigator;
vm.createContext(context);

const appPath = path.join(__dirname, "..", "app.js");
let source = fs.readFileSync(appPath, "utf8");
source += `
globalThis.__muscleTest = {
  mapMuscleToCanonicalGroups,
  CANONICAL_MUSCLE_GROUPS
};`;
vm.runInContext(source, context, { filename: "app.js" });

const { mapMuscleToCanonicalGroups, CANONICAL_MUSCLE_GROUPS } = context.__muscleTest;
const first = (m) => mapMuscleToCanonicalGroups(m)[0];

// Strings that previously fell into "Other" now resolve to a specific category.
const remapped = {
  Peroneals: "Lower Legs",
  "Tibialis Posterior": "Lower Legs",
  Infraspinatus: "Shoulders",
  Anconeus: "Triceps",
  Iliopsoas: "Upper Legs",
  Piriformis: "Glutes",
  "Hip Extensors": "Glutes",
  "Hip Internal + External Rotators": "Glutes",
  "Hip Stabilisers": "Glutes",
  "Hip Capsule": "Glutes",
  "Thoracic Rotators": "Upper Back",
  Diaphragm: "Abdominals",
  "Iliac Crest Attachments": "Abdominals"
};
for (const [muscle, expected] of Object.entries(remapped)) {
  assert.strictEqual(first(muscle), expected, `${muscle} should map to ${expected}, got ${first(muscle)}`);
}

// Leg buckets are un-collapsed into their own canonical groups.
const legs = {
  Glutes: "Glutes",
  "Glute Med": "Glutes",
  Quads: "Quadriceps",
  "Rectus Femoris": "Quadriceps",
  Hamstrings: "Hamstrings",
  Calves: "Calves",
  Soleus: "Calves"
};
for (const [muscle, expected] of Object.entries(legs)) {
  assert.strictEqual(first(muscle), expected, `${muscle} should map to ${expected}, got ${first(muscle)}`);
}

// Spelling / word-order variants seen in live data resolve correctly.
assert.strictEqual(first("Anterior Tibialis"), "Lower Legs", "reversed word order should still map to Lower Legs");
assert.strictEqual(first("Tibialis Posterior"), "Lower Legs");
assert.strictEqual(first("Illiopsoas"), "Upper Legs", "double-L misspelling should map to Upper Legs");
assert.strictEqual(first("Obli"), "Abdominals", "obliques abbreviation should map to Abdominals");

// Deliberately unclassified strings stay in Other.
assert.strictEqual(first("Serratus Anterior"), "Other");
assert.strictEqual(first("Spine"), "Other");

// Ordering hazards: these must not be swallowed by an earlier rule.
assert.strictEqual(first("Biceps femoris"), "Hamstrings", "biceps femoris must resolve to Hamstrings, not Biceps");
assert.strictEqual(first("Hip Abductors"), "Abductors", "hip abductors must resolve to Abductors, not Glutes");

// Upper/Lower Legs remain the home for generic and shin/ankle terms.
assert.strictEqual(first("Legs"), "Upper Legs");
assert.strictEqual(first("Hip Flexors"), "Upper Legs");
assert.strictEqual(first("Achilles Tendon"), "Lower Legs");
assert.strictEqual(first("Tibialis Anterior"), "Lower Legs");

// Regression guard on a sample of previously-correct mappings.
const unchanged = {
  Core: "Abdominals",
  "Erector Spinae": "Lower Back",
  Rhomboids: "Upper Back",
  "Rotator Cuff": "Shoulders",
  Groin: "Adductors",
  "Pelvic Floor": "Pelvis",
  Lats: "Lats"
};
for (const [muscle, expected] of Object.entries(unchanged)) {
  assert.strictEqual(first(muscle), expected, `${muscle} should still map to ${expected}, got ${first(muscle)}`);
}

// Every curated template muscle string resolves to a real category — "Other" is empty.
const templates = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "templates.json"), "utf8"));
const templateMuscles = new Set();
for (const tpl of templates) {
  for (const ex of tpl.exercises || []) {
    (ex.primaryMuscles || []).forEach((m) => templateMuscles.add(m));
    (ex.secondaryMuscles || []).forEach((m) => templateMuscles.add(m));
  }
}
const strandedInOther = [...templateMuscles].filter((m) => {
  const groups = mapMuscleToCanonicalGroups(m);
  return groups.length === 1 && groups[0] === "Other";
});
assert.deepStrictEqual(strandedInOther, [], `template muscles still landing in Other: ${strandedInOther.join(", ")}`);

// Every canonical group (except the Other fallback) is reachable by the classifier.
const probes = {
  Abdominals: "abs", Abductors: "abductors", Adductors: "adductors", Biceps: "biceps",
  Calves: "calves", Cardio: "running", Chest: "chest", Forearms: "forearms", Pelvis: "pelvis",
  "Upper Legs": "legs", "Lower Legs": "achilles", Glutes: "glutes", Hamstrings: "hamstrings",
  Lats: "lats", "Lower Back": "lumbar", Neck: "neck", Quadriceps: "quads", Shoulders: "delts",
  Traps: "traps", Triceps: "triceps", "Upper Back": "rhomboids"
};
const reachable = new Set();
Object.values(probes).forEach((p) => mapMuscleToCanonicalGroups(p).forEach((g) => reachable.add(g)));
const unreachable = Array.from(CANONICAL_MUSCLE_GROUPS).filter((g) => g !== "Other" && !reachable.has(g));
assert.deepStrictEqual(unreachable, [], `canonical groups unreachable by the classifier: ${unreachable.join(", ")}`);

console.log("Muscle mapping tests passed");
