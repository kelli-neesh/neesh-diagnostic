// Aggregate stats for the NEESH Diagnostic.
//
// What is stored: one row per completed Diagnostic, holding only the 15
// answers (as 15 digits, 0 strongest to 3 weakest) and the date. No name, no
// email, no niche description, nothing that identifies anyone.
//
// Rows are kept forever. Nothing in this app deletes them.
//
// Scores, bands and verdicts are worked out from the stored answers each time
// the stats are read, using the current rules in public/lib/config.js. So if
// a cut-off changes, the whole history is recalculated under the new rules.

import { QUESTIONS, FACTORS, BANDS, VERDICTS } from "../public/lib/config.js";
import { scoreAnswers } from "../public/lib/scoring.js";

const SCHEMA = `CREATE TABLE IF NOT EXISTS completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  answers TEXT NOT NULL
)`;

let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.prepare(SCHEMA).run();
  schemaReady = true;
}

const ANSWERS_RE = new RegExp(`^[0-3]{${QUESTIONS.length}}$`);

export async function recordCompletion(db, answers, now = new Date()) {
  const digits = answers.join("");
  if (!ANSWERS_RE.test(digits)) throw new Error("Bad answers");
  await ensureSchema(db);
  await db.prepare("INSERT INTO completions (created_at, answers) VALUES (?, ?)")
    .bind(now.toISOString(), digits)
    .run();
}

export async function readCompletions(db) {
  await ensureSchema(db);
  const { results } = await db.prepare("SELECT id, created_at, answers FROM completions ORDER BY id").all();
  return (results || []).filter((r) => ANSWERS_RE.test(r.answers));
}

const pct = (n, total) => (total ? Math.round((n / total) * 1000) / 10 : 0);

// rows: [{ created_at, answers: "012301..." }]
export function aggregate(rows) {
  const total = rows.length;
  const bandNames = BANDS.map((b) => b.name).reverse(); // Low, Medium, High
  const verdictNames = VERDICTS.map((v) => v.name);     // Lean In, Sharpen, Reconsider

  const questionCounts = QUESTIONS.map((q) => q.answers.map(() => 0));
  const factorBands = FACTORS.map(() => Object.fromEntries(bandNames.map((b) => [b, 0])));
  const factorPercentSum = FACTORS.map(() => 0);
  const verdictCounts = Object.fromEntries(verdictNames.map((v) => [v, 0]));
  let overallSum = 0;
  let heldByCommercial = 0;

  for (const r of rows) {
    const answers = Array.from(r.answers, Number);
    answers.forEach((a, i) => { questionCounts[i][a] += 1; });
    const s = scoreAnswers(answers);
    s.factors.forEach((f, i) => {
      factorBands[i][f.band] += 1;
      factorPercentSum[i] += f.percent;
    });
    verdictCounts[s.verdict.name] += 1;
    overallSum += s.overall;
    if (s.verdict.capNote) heldByCommercial += 1;
  }

  const dates = rows.map((r) => r.created_at).sort();
  return {
    total,
    firstAt: dates[0] || null,
    lastAt: dates[dates.length - 1] || null,
    averageOverall: total ? Math.round(overallSum / total) : 0,
    verdicts: verdictNames.map((name) => ({ name, count: verdictCounts[name], percent: pct(verdictCounts[name], total) })),
    heldByCommercial: { count: heldByCommercial, percent: pct(heldByCommercial, total) },
    factors: FACTORS.map((f, i) => ({
      key: f.key,
      name: f.name,
      questions: f.questions,
      averagePercent: total ? Math.round(factorPercentSum[i] / total) : 0,
      bands: bandNames.map((b) => ({ name: b, count: factorBands[i][b], percent: pct(factorBands[i][b], total) })),
    })),
    questions: QUESTIONS.map((q, i) => ({
      n: q.n,
      text: q.text,
      factor: FACTORS.find((f) => f.questions.includes(q.n))?.name || "",
      answers: q.answers.map((text, j) => ({ text, count: questionCounts[i][j], percent: pct(questionCounts[i][j], total) })),
    })),
  };
}

// CSV of every stored row, for Kelli's own backup.
export function toCsv(rows) {
  const head = ["id", "completed_at", ...QUESTIONS.map((q) => `q${q.n}`), "overall", "verdict"];
  const lines = [head.join(",")];
  for (const r of rows) {
    const answers = Array.from(r.answers, Number);
    const s = scoreAnswers(answers);
    // Answers shown 1 to 4 (1 = strongest), as people see them on screen.
    lines.push([r.id, r.created_at, ...answers.map((a) => a + 1), s.overall, `"${s.verdict.name}"`].join(","));
  }
  return lines.join("\n") + "\n";
}

// Constant-time comparison so the key can't be guessed by timing.
export function keyMatches(given, expected) {
  const a = String(given || "");
  const b = String(expected || "");
  if (!b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
