import test from "node:test";
import assert from "node:assert/strict";
import { scoreAnswers, bandFor, verdictFor } from "../public/lib/scoring.js";
import { HEADLINES, QUESTIONS, FACTORS } from "../public/lib/config.js";
import { FACTOR_COPY } from "../src/report-copy.js";

const all = (i) => Array(15).fill(i);

test("all first answers: every factor 100%, High, overall 100%, Lean In", () => {
  const s = scoreAnswers(all(0));
  for (const f of s.factors) {
    assert.equal(f.percent, 100);
    assert.equal(f.band, "High");
  }
  assert.equal(s.overall, 100);
  assert.equal(s.verdict.name, "Lean In");
});

test("all last answers: every factor 0%, Low, overall 0%, Reconsider", () => {
  const s = scoreAnswers(all(3));
  for (const f of s.factors) {
    assert.equal(f.percent, 0);
    assert.equal(f.band, "Low");
  }
  assert.equal(s.overall, 0);
  assert.equal(s.verdict.name, "Reconsider");
});

test("mixed set, hand calculated, with factors on the band boundaries", () => {
  // Answer positions: 0 = strongest (3 points) ... 3 = weakest (0 points)
  const answers = [
    1, 1, 1, // Commercial: 2 + 2 + 2 = 6 of 9 = 67%, Medium (top of Medium)
    0, 0, 2, // Reach:      3 + 3 + 1 = 7 of 9 = 78%, High (bottom of High)
    0, 3, 3, // Experience: 3 + 0 + 0 = 3 of 9 = 33%, Low (top of Low)
    0, 0, 0, // Enjoyment:  9 of 9 = 100%, High
    0, 2, 3, // Demand:     3 + 1 + 0 = 4 of 9 = 44%, Medium (bottom of Medium)
  ];
  const s = scoreAnswers(answers);
  const got = Object.fromEntries(s.factors.map((f) => [f.key, [f.points, f.percent, f.band]]));
  assert.deepEqual(got, {
    experience: [3, 33, "Low"],
    demand: [4, 44, "Medium"],
    reach: [7, 78, "High"],
    commercial_value: [6, 67, "Medium"],
    enjoyment: [9, 100, "High"],
  });
  // (33 + 44 + 78 + 67 + 100) / 5 = 64.4, rounds to 64
  assert.equal(s.overall, 64);
  assert.equal(s.verdict.name, "Sharpen");
});

test("verdict boundaries", () => {
  assert.equal(verdictFor(65).name, "Lean In");
  assert.equal(verdictFor(64).name, "Sharpen");
  assert.equal(verdictFor(35).name, "Sharpen");
  assert.equal(verdictFor(34).name, "Reconsider");
});

test("band boundaries in points", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(bandFor),
    ["Low", "Low", "Low", "Low", "Medium", "Medium", "Medium", "High", "High", "High"]);
});

test("rejects incomplete or out of range answers", () => {
  assert.throws(() => scoreAnswers(Array(14).fill(0)));
  assert.throws(() => scoreAnswers([...all(0).slice(0, 14), 4]));
  assert.throws(() => scoreAnswers([...all(0).slice(0, 14), null]));
});

test("15 questions, four answers each, every question in exactly one factor", () => {
  assert.equal(QUESTIONS.length, 15);
  for (const q of QUESTIONS) assert.equal(q.answers.length, 4);
  const used = FACTORS.flatMap((f) => f.questions).sort((a, b) => a - b);
  assert.deepEqual(used, Array.from({ length: 15 }, (_, i) => i + 1));
});

test("factors run in CREED order, each with the next three questions", () => {
  assert.equal(FACTORS.map((f) => f.name[0]).join(""), "CREED");
  FACTORS.forEach((f, i) => assert.deepEqual(f.questions, [i * 3 + 1, i * 3 + 2, i * 3 + 3]));
});

test("free headlines are the first sentence of Kelli's full paragraphs", () => {
  for (const f of FACTORS) {
    for (const band of ["High", "Medium", "Low"]) {
      assert.ok(FACTOR_COPY[f.key][band].startsWith(HEADLINES[f.key][band] + " "), `${f.key} ${band}`);
    }
  }
});
