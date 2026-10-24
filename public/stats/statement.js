// Shareable statements, written fresh from the stats each time the page loads.
// Each one is a different angle on the same numbers. Plain facts only, so
// Kelli can add her own take when she shares it.

const whole = (n) => Math.round(n);
const count = (n) => Number(n).toLocaleString("en-GB");
const people = (n) => (n === 1 ? "accounting firm owner" : "accounting firm owners");

function strongestAndWeakest(factors) {
  let top = factors[0], bottom = factors[0];
  for (const f of factors) {
    if (f.averagePercent > top.averagePercent) top = f;
    if (f.averagePercent < bottom.averagePercent) bottom = f;
  }
  return { top, bottom };
}

function verdict(stats, name) {
  return whole(stats.verdicts.find((v) => v.name === name)?.percent || 0);
}

// stats: the object from /api/stats. Returns an array of statements.
export function buildStatements(stats) {
  const n = stats.total;
  if (!n) return [];
  const out = [];
  const { top, bottom } = strongestAndWeakest(stats.factors);

  // 1. The overview.
  let overview = `${count(n)} ${people(n)} have now put their niche through the NEESH Diagnostic. ` +
    `${verdict(stats, "Lean In")}% came out ready to Lean In, ${verdict(stats, "Sharpen")}% need to Sharpen, ` +
    `and ${verdict(stats, "Reconsider")}% should Reconsider before committing.`;
  if (top.key !== bottom.key) {
    overview += ` The strongest factor is ${top.name}, averaging ${top.averagePercent}%. The weakest is ${bottom.name}, at ${bottom.averagePercent}%.`;
  }
  out.push(overview);

  // 2. Commercial Value.
  const cv = stats.factors.find((f) => f.key === "commercial_value");
  if (cv) {
    const cvLow = whole(cv.bands.find((b) => b.name === "Low")?.percent || 0);
    let line = `Across ${count(n)} NEESH Diagnostic results, Commercial Value averages ${cv.averagePercent}%, ` +
      `and ${cvLow}% of firm owners score it Low.`;
    if (stats.heldByCommercial.count > 0) {
      line += ` ${whole(stats.heldByCommercial.percent)}% scored high enough overall to Lean In, but were held at Sharpen because the niche doesn't yet stack up commercially.`;
    }
    out.push(line);
  }

  // 3. The question people find hardest, and the one they find easiest.
  const share = (q, idx) => idx.reduce((s, i) => s + (q.answers[i]?.percent || 0), 0);
  const last = (q) => [q.answers.length - 2, q.answers.length - 1];
  let hardest = stats.questions[0], easiest = stats.questions[0];
  for (const q of stats.questions) {
    if (share(q, last(q)) > share(hardest, last(hardest))) hardest = q;
    if (share(q, [0]) > share(easiest, [0])) easiest = q;
  }
  let qLine = `The question accounting firm owners find hardest in the NEESH Diagnostic is "${hardest.text}" ` +
    `${whole(share(hardest, last(hardest)))}% picked one of the two weakest answers.`;
  if (easiest.n !== hardest.n) {
    qLine += ` The most confident answer is to "${easiest.text}", where ${whole(share(easiest, [0]))}% chose the strongest option.`;
  }
  qLine += ` Based on ${count(n)} results.`;
  out.push(qLine);

  return out;
}
