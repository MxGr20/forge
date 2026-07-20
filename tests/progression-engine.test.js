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
globalThis.__progressionTest = {
  setState(value) { state = value; },
  getState() { return state; },
  buildProgressionPlan,
  evaluateProgressionAttempt,
  normalizeProgressionPlan,
  applyProgressionPlanToSets,
  applyProgressionDeload,
  getWorkoutProgressionOutcomes,
  hydrateState,
  startWorkout
};`;
vm.runInContext(source, context, { filename: "app.js" });

const api = context.__progressionTest;
const rule = { enabled: true, minReps: 8, maxReps: 10, increment: 2.5 };
const routine = { id: "r1", name: "Lower", items: [] };
const routineItem = {
  id: "ri1",
  exerciseId: "ex1",
  metricMode: "reps",
  progression: rule
};
const exercise = { id: "ex1", name: "Split Squat", type: "weight" };
const makeSets = (prefix, reps = [8, 8, 8], weight = 20, completed = false) =>
  reps.map((setReps, index) => ({
    id: `${prefix}${index}`,
    tag: "work",
    weight,
    reps: setReps,
    completed
  }));
const makeWorkout = (id, day, plan, sets) => ({
  id,
  name: "Lower",
  routineId: "r1",
  createdAt: `2026-01-${String(day).padStart(2, "0")}T00:00:00Z`,
  endedAt: `2026-01-${String(day).padStart(2, "0")}T01:00:00Z`,
  items: [{
    id: `wi-${id}`,
    routineItemId: "ri1",
    exerciseId: "ex1",
    progressionPlan: plan,
    sets
  }]
});
const makeState = (workouts, activeWorkoutId = null) => ({
  version: 3,
  lastModified: 0,
  settings: {},
  exercises: [exercise],
  routines: [routine],
  workouts,
  bodyMeasurements: [],
  muscleGroups: [],
  muscleTagLibrary: { primary: [], detailed: [] },
  activeWorkoutId
});

api.setState(makeState([]));
const sets1 = makeSets("a");
const plan1 = api.buildProgressionPlan(routine, routineItem, sets1);
assert.equal(plan1.decision.type, "baseline");
assert.deepEqual(plan1.targets.map((target) => target.reps), [8, 8, 8]);
const mixedPlan = api.buildProgressionPlan(routine, routineItem, [
  { id: "warmup", tag: "warmup", weight: 10, reps: 5, completed: false },
  { id: "work", tag: "work", weight: 20, reps: 8, completed: false },
  { id: "drop", tag: "drop", weight: 15, reps: 12, completed: false }
]);
assert.deepEqual(mixedPlan.targets.map((target) => target.setId), ["work"]);

sets1.forEach((set) => {
  set.completed = true;
  set.reps = 10;
});
const workout1 = makeWorkout("w1", 1, plan1, sets1);
api.setState(makeState([workout1]));
const otherRoutinePlan = api.buildProgressionPlan({ id: "r2" }, routineItem, makeSets("other"));
assert.equal(otherRoutinePlan.decision.type, "baseline");
const sets2 = makeSets("b", [10, 10, 10]);
const plan2 = api.buildProgressionPlan(routine, routineItem, sets2);
assert.equal(plan2.decision.type, "add_weight");
assert.deepEqual(plan2.targets.map((target) => target.weight), [22.5, 22.5, 22.5]);
assert.deepEqual(plan2.targets.map((target) => target.reps), [8, 8, 8]);

api.applyProgressionPlanToSets(sets2, plan2);
sets2.forEach((set) => { set.completed = true; });
const workout2 = makeWorkout("w2", 2, plan2, sets2);
api.setState(makeState([workout2, workout1]));
const sets3 = makeSets("c", [8, 8, 8], 22.5);
const plan3 = api.buildProgressionPlan(routine, routineItem, sets3);
assert.equal(plan3.decision.type, "add_rep");
assert.deepEqual(plan3.targets.map((target) => target.reps), [9, 8, 8]);

api.applyProgressionPlanToSets(sets3, plan3);
sets3.forEach((set) => { set.completed = true; });
sets3[0].reps = 8;
const workout3 = makeWorkout("w3", 3, plan3, sets3);
api.setState(makeState([workout3, workout2, workout1]));
const sets4 = makeSets("d", [8, 8, 8], 22.5);
const plan4 = api.buildProgressionPlan(routine, routineItem, sets4);
assert.equal(plan4.decision.type, "repeat");
assert.equal(plan4.priorMisses, 1);
assert.deepEqual(plan4.targets.map((target) => target.reps), [9, 8, 8]);

api.applyProgressionPlanToSets(sets4, plan4);
sets4.forEach((set) => { set.completed = true; });
sets4[0].reps = 8;
const workout4 = makeWorkout("w4", 4, plan4, sets4);
api.setState(makeState([workout4, workout3, workout2, workout1]));
const sets5 = makeSets("e", [8, 8, 8], 22.5);
const plan5 = api.buildProgressionPlan(routine, routineItem, sets5);
assert.equal(plan5.decision.type, "deload_offer");
assert.equal(plan5.priorMisses, 2);
assert.deepEqual(plan5.targets.map((target) => target.reps), [9, 8, 8]);

api.applyProgressionPlanToSets(sets5, plan5);
const activeWorkout = makeWorkout("w5", 5, plan5, sets5);
delete activeWorkout.endedAt;
api.setState(makeState([activeWorkout, workout4, workout3, workout2, workout1], "w5"));
assert.equal(api.applyProgressionDeload(activeWorkout.items[0].id), true);
assert.deepEqual(activeWorkout.items[0].progressionPlan.targets.map((target) => target.weight), [20, 20, 20]);
assert.deepEqual(activeWorkout.items[0].progressionPlan.targets.map((target) => target.reps), [8, 8, 8]);

const skippedSets = makeSets("f", [8, 8, 8], 22.5);
const skippedWorkout = makeWorkout("w6", 6, plan5, skippedSets);
api.setState(makeState([skippedWorkout, workout4, workout3, workout2, workout1]));
const planAfterSkip = api.buildProgressionPlan(routine, routineItem, makeSets("g", [8, 8, 8], 22.5));
assert.equal(planAfterSkip.decision.type, "deload_offer");
assert.equal(planAfterSkip.priorMisses, 2);

const outcomes = api.getWorkoutProgressionOutcomes("w4");
assert.ok(outcomes[0].text.startsWith("Stalled twice"));

const legacy = api.hydrateState({
  version: 2,
  exercises: [exercise],
  routines: [{ id: "legacy-routine", name: "Legacy", items: [{ id: "legacy-item", exerciseId: "ex1", sets: [] }] }],
  workouts: [{ id: "legacy-workout", createdAt: "2025-01-01T00:00:00Z", items: [] }]
});
assert.equal(legacy.routines[0].items[0].progression, null);
assert.equal(legacy.workouts[0].items.length, 0);

routine.items = [{ ...routineItem, sets: makeSets("template", [8, 8, 8], 20) }];
api.setState(makeState([]));
api.startWorkout("r1");
const startedState = api.getState();
const startedItem = startedState.workouts[0].items[0];
assert.equal(startedItem.routineItemId, "ri1");
assert.equal(startedItem.progressionPlan.decision.type, "baseline");
assert.deepEqual(startedItem.sets.map((set) => set.reps), [8, 8, 8]);

console.log("Progression engine tests passed");
