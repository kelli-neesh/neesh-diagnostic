// Scoring for the NEESH Diagnostic. All numbers come from config.js.
import { FACTORS, POINTS, BANDS, VERDICTS, QUESTIONS, HEADLINES, LEAN_IN_NEEDS_COMMERCIAL, COMMERCIAL_CAP_LINE } from "./config.js";

const MAX_PER_QUESTION = Math.max(...POINTS);

// Band for a factor, from its points.
export function bandFor(points) {
  for (const b of BANDS) if (points >= b.fromPoints) return b.name;
  return BANDS[BANDS.length - 1].name;
}

// Verdict for the overall percentage.
export function verdictFor(overall) {
  for (const v of VERDICTS) if (overall >= v.fromPercent) return v;
  return VERDICTS[VERDICTS.length - 1];
}

// answers: an array of 15 answer positions, 0 (strongest) to 3 (weakest),
// in question order.
export function scoreAnswers(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
    throw new Error(`Expected ${QUESTIONS.length} answers`);
  }
  for (const a of answers) {
    if (!Number.isInteger(a) || a < 0 || a >= POINTS.length) throw new Error("Answer out of range");
  }

  const factors = FACTORS.map((f) => {
    const points = f.questions.reduce((sum, n) => sum + POINTS[answers[n - 1]], 0);
    const max = f.questions.length * MAX_PER_QUESTION;
    const percent = Math.round((points / max) * 100);
    const band = bandFor(points);
    return {
      key: f.key,
      name: f.name,
      points,
      max,
      percent,
      band,
      headline: HEADLINES[f.key][band],
    };
  });

  const overall = Math.round(factors.reduce((s, f) => s + f.percent, 0) / factors.length);
  let verdict = verdictFor(overall);
  // Commercial Value rule: no Lean In unless Commercial Value reaches the set band.
  const order = BANDS.map((b) => b.name).reverse(); // Low, Medium, High
  const commercial = factors.find((f) => f.key === "commercial_value");
  let capNote = "";
  if (verdict.name === "Lean In" && order.indexOf(commercial.band) < order.indexOf(LEAN_IN_NEEDS_COMMERCIAL)) {
    verdict = VERDICTS.find((v) => v.name === "Sharpen");
    capNote = COMMERCIAL_CAP_LINE;
  }
  return { factors, overall, verdict: { name: verdict.name, line: verdict.line, capNote } };
}
