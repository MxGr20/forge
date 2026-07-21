const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const wodCardStart = html.indexOf("function WodCard");
const wodCardEnd = html.indexOf("function MuscleLoadRollup", wodCardStart);
const workoutsStart = html.indexOf("function WorkoutsView");
const workoutsEnd = html.indexOf("function TemplateEditSheet", workoutsStart);

assert.ok(wodCardStart >= 0 && wodCardEnd > wodCardStart, "WodCard component not found");
assert.ok(workoutsStart >= 0 && workoutsEnd > workoutsStart, "WorkoutsView component not found");

const wodCardSource = html.slice(wodCardStart, wodCardEnd);
const workoutsSource = html.slice(workoutsStart, workoutsEnd);

assert.match(wodCardSource, /function WodCard\(\{wod\}\)/);
assert.doesNotMatch(wodCardSource, /onClick=/);
assert.doesNotMatch(workoutsSource, /handleWodTap/);
assert.doesNotMatch(workoutsSource, />Start Workout<\/button>/);
assert.match(workoutsSource, /<WodCard wod=\{viewWod\}\/>/);
assert.match(workoutsSource, /onClick=\{\(\)=>onStart\(r\)\}>Start<\/button>/);
assert.doesNotMatch(html, /startWorkout\(null\)/);

console.log("Read-only WOD card tests passed");
