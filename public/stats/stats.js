// The private stats page for the NEESH Diagnostic.
// Opened with /stats?key=YOUR_KEY. Without the right key, nothing is shown.
import { buildStatements } from "./statement.js";

const app = document.getElementById("app");
const key = new URL(location.href).searchParams.get("key") || "";
const EARLY_BELOW = 30;

// Anyone who opens this page is leaving their own test runs out of the stats.
try { localStorage.setItem("neesh-stats-exclude", "1"); } catch { /* ignore */ }

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (p) => `${Number.isInteger(p) ? p : p.toFixed(1)}%`;
const date = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "None yet");

// Colours, strongest to weakest. Every segment is also named in the legend,
// so colour is never the only way to read a chart.
const ANSWER_COLOURS = ["#1C3F1C", "#79C9AA", "#F6A0A1", "#640718"];
const BAND_COLOURS = { High: "#AAD377", Medium: "#90D7EC", Low: "#F6A0A1" };
const VERDICT_COLOURS = { "Lean In": "#AAD377", Sharpen: "#90D7EC", Reconsider: "#F6A0A1" };

function ring(segments, centreNum, centreLabel, large, label) {
  const r = 50, c = 2 * Math.PI * r, w = 18;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  const arcs = total
    ? segments.filter((s) => s.value > 0).map((s) => {
      const len = (s.value / total) * c;
      const arc = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${s.colour}" stroke-width="${w}" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}"></circle>`;
      offset += len;
      return arc;
    }).join("")
    : "";
  return `<div class="ring${large ? " lg" : ""}" role="img" aria-label="${esc(label)}">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="#E6DEDA" stroke-width="${w}"></circle>${arcs}
    </svg>
    <div class="centre" aria-hidden="true"><span class="num">${esc(centreNum)}</span><span class="of">${esc(centreLabel)}</span></div>
  </div>`;
}

function legend(items) {
  return `<ul class="legend">${items.map((i) => `<li>
    <span class="sw" style="background:${i.colour}" aria-hidden="true"></span>
    <span class="t">${i.label}</span>
    <span class="p">${fmt(i.percent)}<small>(${i.count})</small></span>
  </li>`).join("")}</ul>`;
}

function topOf(list) {
  return list.reduce((a, b) => (b.count > a.count ? b : a), list[0]);
}

function render(stats) {
  const n = stats.total;
  const statements = buildStatements(stats);
  let which = 0;

  const verdictCard = `<div class="dcard">
    <p class="eyebrow">Overall</p>
    <h3 class="big">Verdicts</h3>
    <div class="body">
      ${ring(stats.verdicts.map((v) => ({ value: v.count, colour: VERDICT_COLOURS[v.name] })), `${stats.averageOverall}%`, "Average score", false,
        `Verdicts: ${stats.verdicts.map((v) => `${v.name} ${fmt(v.percent)}`).join(", ")}. Average overall score ${stats.averageOverall}%.`)}
      ${legend(stats.verdicts.map((v) => ({ colour: VERDICT_COLOURS[v.name], label: `<b>${esc(v.name)}</b>`, percent: v.percent, count: v.count })))}
    </div>
    <p class="q-avg">${fmt(stats.heldByCommercial.percent)} (${stats.heldByCommercial.count}) would have scored Lean In but were held at Sharpen by the Commercial Value rule.</p>
  </div>`;

  const factorCards = stats.factors.map((f) => `<div class="dcard">
    <p class="eyebrow">Questions ${f.questions[0]} to ${f.questions[f.questions.length - 1]}</p>
    <h3 class="big">${esc(f.name)}</h3>
    <div class="body">
      ${ring([...f.bands].reverse().map((b) => ({ value: b.count, colour: BAND_COLOURS[b.name] })), `${f.averagePercent}%`, "Average", false,
        `${f.name}: average ${f.averagePercent}%. ${[...f.bands].reverse().map((b) => `${b.name} ${fmt(b.percent)}`).join(", ")}.`)}
      ${legend([...f.bands].reverse().map((b) => ({ colour: BAND_COLOURS[b.name], label: `<b>${esc(b.name)}</b>`, percent: b.percent, count: b.count })))}
    </div>
  </div>`).join("");

  const questionCards = stats.questions.map((q) => {
    const top = topOf(q.answers);
    const topIdx = q.answers.indexOf(top);
    return `<div class="dcard q">
      <p class="eyebrow">Question ${q.n} &middot; ${esc(q.factor)}</p>
      <h3>${esc(q.text)}</h3>
      <div class="body">
        ${ring(q.answers.map((a, j) => ({ value: a.count, colour: ANSWER_COLOURS[j] })), n ? fmt(Math.round(top.percent)) : "0%", n ? `Chose answer ${topIdx + 1}` : "No answers", false,
          `Question ${q.n}: ${q.answers.map((a, j) => `answer ${j + 1} ${fmt(a.percent)}`).join(", ")}.`)}
        ${legend(q.answers.map((a, j) => ({ colour: ANSWER_COLOURS[j], label: `<b>${j + 1}.</b> ${esc(a.text)}`, percent: a.percent, count: a.count })))}
      </div>
    </div>`;
  }).join("");

  const statementBlock = statements.length ? `<section class="statement" aria-labelledby="st-h">
    <span class="lab" id="st-h">A statement you can share</span>
    <blockquote id="st"></blockquote>
    <div class="row">
      <button class="btn light" type="button" id="copy">Copy statement</button>
      ${statements.length > 1 ? `<button class="btn ghost" type="button" id="next">Show another angle</button>` : ""}
      <span class="done" id="copied" role="status" aria-live="polite"></span>
    </div>
  </section>` : "";

  app.innerHTML = `<div class="stack-lg">
    <div class="stats-head">
      <p class="eyebrow">Private</p>
      <h1 class="display" id="h" tabindex="-1">Diagnostic stats</h1>
      <p class="lede">Every completed NEESH Diagnostic, counted anonymously. Only answers and dates are kept, never names, emails or niche descriptions.</p>
    </div>

    <div class="kpis">
      <div class="kpi"><span class="v">${n.toLocaleString("en-GB")}</span><span class="l">Completed</span></div>
      <div class="kpi"><span class="v">${stats.averageOverall}%</span><span class="l">Average score</span></div>
      <div class="kpi"><span class="v date">${date(stats.firstAt)}</span><span class="l">First result</span></div>
      <div class="kpi"><span class="v date">${date(stats.lastAt)}</span><span class="l">Latest result</span></div>
    </div>

    ${n === 0 ? `<p class="early">No results yet. Counting starts from the first Diagnostic completed after this page went live.</p>` :
      n < EARLY_BELOW ? `<p class="early">Early numbers: these are based on ${n} result${n === 1 ? "" : "s"}, so they will move a lot as more come in.</p>` : ""}

    ${statementBlock}

    <section class="stack">
      <div class="section-h"><h2 class="display">The verdict and the five factors</h2></div>
      <div class="grid factors-grid">${verdictCard}${factorCards}</div>
    </section>

    <section class="stack">
      <div class="section-h">
        <h2 class="display">Every question</h2>
        <p class="muted">Answers are numbered as they appear in the Diagnostic, 1 being the strongest.</p>
      </div>
      <div class="grid">${questionCards}</div>
    </section>

    <section class="tools">
      <a class="btn ghost" href="/api/stats/export?key=${encodeURIComponent(key)}" download>Download all results (CSV)</a>
      <span class="small">Your own backup of every stored result.</span>
    </section>
  </div>`;

  if (statements.length) {
    const st = app.querySelector("#st");
    const copied = app.querySelector("#copied");
    const show = () => { st.textContent = statements[which]; copied.textContent = ""; };
    show();
    app.querySelector("#copy").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(statements[which]);
        copied.textContent = "Copied";
      } catch {
        const range = document.createRange();
        range.selectNodeContents(st);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
        copied.textContent = "Selected: press Ctrl+C or Cmd+C to copy";
      }
    });
    const next = app.querySelector("#next");
    if (next) next.addEventListener("click", () => { which = (which + 1) % statements.length; show(); });
  }
}

function message(heading, text) {
  app.innerHTML = `<div class="stack"><h1 class="display" id="h">${esc(heading)}</h1><p class="lede">${esc(text)}</p></div>`;
}

async function load() {
  if (!key) return message("Private page", "This page needs its private link. Please use the full link you were given.");
  try {
    const res = await fetch(`/api/stats?key=${encodeURIComponent(key)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.status === 403) return message("Private page", "This link isn't valid. Please check you have the full private link.");
    if (!res.ok) return message("Not ready yet", data.error || "The stats couldn't be loaded just now. Please try again in a moment.");
    render(data);
  } catch {
    message("Not ready yet", "The stats couldn't be loaded just now. Please try again in a moment.");
  }
}

load();
