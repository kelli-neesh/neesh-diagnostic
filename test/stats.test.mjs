import test from "node:test";
import assert from "node:assert/strict";
import { encodeToken } from "../public/lib/token.js";
import { aggregate, toCsv, keyMatches } from "../src/stats.js";
import { buildStatements } from "../public/stats/statement.js";
import worker from "../src/worker.js";

// A small stand-in for Cloudflare D1, enough for the queries the app makes.
function fakeD1() {
  const rows = [];
  const queries = [];
  return {
    rows,
    queries,
    prepare(sql) {
      queries.push(sql);
      let args = [];
      const stmt = {
        bind(...a) { args = a; return stmt; },
        async run() {
          if (/^INSERT/i.test(sql)) rows.push({ id: rows.length + 1, created_at: args[0], answers: args[1] });
          return { success: true };
        },
        async all() { return { results: rows.slice() }; },
      };
      return stmt;
    },
  };
}

const strong = Array(15).fill(0);
const weak = Array(15).fill(3);
const mixed = [1, 1, 1, 0, 0, 2, 0, 3, 3, 0, 0, 0, 0, 2, 3];

const post = (path, body, env) => worker.fetch(new Request(`https://diagnostic.neesh.agency${path}`, {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
}), env);
const get = (path, env) => worker.fetch(new Request(`https://diagnostic.neesh.agency${path}`), env);

test("record stores only the answers and a date, never the niche", async () => {
  const db = fakeD1();
  const niche = "Independent dental practices in the Midlands";
  const res = await post("/api/record", { token: encodeToken(mixed, niche) }, { STATS_DB: db });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, stored: true });
  assert.equal(db.rows.length, 1);
  assert.equal(db.rows[0].answers, mixed.join(""));
  assert.match(db.rows[0].created_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(JSON.stringify(db.rows).includes("dental"), false);
  // The table has no column for anything else, and nothing ever deletes rows.
  const schema = db.queries.find((q) => /CREATE TABLE/.test(q));
  assert.match(schema, /answers TEXT/);
  assert.doesNotMatch(schema, /niche|email|name/i);
  assert.equal(db.queries.some((q) => /DELETE|DROP|TRUNCATE/i.test(q)), false);
});

test("record still succeeds when the stats store isn't switched on", async () => {
  const res = await post("/api/record", { token: encodeToken(mixed, "x") }, {});
  assert.deepEqual(await res.json(), { ok: true, stored: false });
});

test("record rejects a bad token", async () => {
  const db = fakeD1();
  const res = await post("/api/record", { token: "1999" }, { STATS_DB: db });
  assert.equal(res.status, 400);
  assert.equal(db.rows.length, 0);
});

test("stats need the right key", async () => {
  const db = fakeD1();
  const env = { STATS_DB: db, STATS_KEY: "secret-key-123" };
  assert.equal((await get("/api/stats", env)).status, 403);
  assert.equal((await get("/api/stats?key=wrong-key-1234", env)).status, 403);
  assert.equal((await get("/api/stats?key=secret-key-123", { STATS_DB: db })).status, 403); // no key set: locked
  assert.equal((await get("/api/stats/export?key=nope", env)).status, 403);
  const ok = await get("/api/stats?key=secret-key-123", env);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).total, 0);
});

test("keyMatches only accepts an exact match", () => {
  assert.equal(keyMatches("abc", "abc"), true);
  assert.equal(keyMatches("abd", "abc"), false);
  assert.equal(keyMatches("ab", "abc"), false);
  assert.equal(keyMatches("", ""), false);
});

test("aggregate counts answers, bands, verdicts and averages", () => {
  const rows = [strong, strong, weak, mixed].map((a, i) => ({ id: i + 1, created_at: `2026-10-2${i}T10:00:00.000Z`, answers: a.join("") }));
  const s = aggregate(rows);
  assert.equal(s.total, 4);
  assert.equal(s.firstAt, "2026-10-20T10:00:00.000Z");
  assert.equal(s.lastAt, "2026-10-23T10:00:00.000Z");
  // Question 1: answer 1 twice (strong), answer 2 once (mixed), answer 4 once (weak).
  assert.deepEqual(s.questions[0].answers.map((a) => a.count), [2, 1, 0, 1]);
  assert.deepEqual(s.questions[0].answers.map((a) => a.percent), [50, 25, 0, 25]);
  assert.equal(s.questions[0].factor, "Commercial Value");
  // Verdicts: strong x2 Lean In, weak Reconsider, mixed Sharpen (64%).
  assert.deepEqual(s.verdicts.map((v) => [v.name, v.count]), [["Lean In", 2], ["Sharpen", 1], ["Reconsider", 1]]);
  // Bands listed High, Medium, Low order reversed to Low, Medium, High.
  const cv = s.factors.find((f) => f.key === "commercial_value");
  assert.deepEqual(cv.bands.map((b) => [b.name, b.count]), [["Low", 1], ["Medium", 1], ["High", 2]]);
  assert.equal(s.averageOverall, Math.round((100 + 100 + 0 + 64) / 4));
});

test("aggregate counts people held at Sharpen by the Commercial Value rule", () => {
  const held = [3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 80% overall, Commercial Value Low
  const s = aggregate([{ id: 1, created_at: "2026-10-24T10:00:00.000Z", answers: held.join("") }]);
  assert.equal(s.heldByCommercial.count, 1);
  assert.equal(s.verdicts.find((v) => v.name === "Sharpen").count, 1);
});

test("aggregate with no rows is all zeros", () => {
  const s = aggregate([]);
  assert.equal(s.total, 0);
  assert.equal(s.averageOverall, 0);
  assert.equal(s.questions.length, 15);
  assert.deepEqual(buildStatements(s), []);
});

test("CSV has one line per result, answers shown 1 to 4", () => {
  const csv = toCsv([{ id: 7, created_at: "2026-10-24T10:00:00.000Z", answers: mixed.join("") }]);
  const [head, line] = csv.trim().split("\n");
  assert.equal(head.split(",").length, 19);
  assert.equal(line, `7,2026-10-24T10:00:00.000Z,${mixed.map((a) => a + 1).join(",")},64,"Sharpen"`);
});

test("statements use the real numbers and house style", () => {
  const rows = [strong, strong, weak, mixed].map((a, i) => ({ id: i + 1, created_at: "2026-10-24T10:00:00.000Z", answers: a.join("") }));
  const s = aggregate(rows);
  const st = buildStatements(s);
  assert.equal(st.length, 3);
  assert.match(st[0], /^4 accounting firm owners have now put their niche through the NEESH Diagnostic\. 50% came out ready to Lean In, 25% need to Sharpen, and 25% should Reconsider/);
  assert.match(st[1], /Commercial Value averages \d+%/);
  assert.match(st[2], /Based on 4 results\.$/);
  for (const line of st) {
    assert.equal(new RegExp(String.fromCharCode(0x2014) + "|" + String.fromCharCode(0x2013) + "|--").test(line), false, "no dashes");
    assert.equal(/quietly/i.test(line), false);
  }
});
