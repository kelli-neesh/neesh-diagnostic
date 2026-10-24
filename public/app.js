// The NEESH Diagnostic: the page.
import { QUESTIONS, COPY, NICHE_MAX_CHARS } from "./lib/config.js";
import { scoreAnswers } from "./lib/scoring.js";
import { encodeToken, decodeToken } from "./lib/token.js";

const PREVIEW = window.NEESH_PREVIEW === true;
const TOTAL_STEPS = QUESTIONS.length + 1; // niche + 15 questions
const app = document.getElementById("app");

const state = {
  step: 0,                 // 0 intro, 1 niche, 2 to 16 questions
  niche: "",
  answers: Array(QUESTIONS.length).fill(null),
  token: null,
  sentTo: null,            // email the report went to in this visit
  firstName: "",
  consent: false,
  settings: { booking_url: "", privacy_url: "" },
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function focusMain(selector) {
  const el = (selector && app.querySelector(selector)) || app;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function progress(step) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return `<div class="progress">
    <div class="meta"><span>Step ${step} of ${TOTAL_STEPS}</span><span aria-hidden="true">${pct}%</span></div>
    <div class="track" aria-hidden="true"><div class="fill" style="width:${pct}%"></div></div>
  </div>`;
}

// ---------------------------------------------------------------- screens

function renderIntro() {
  app.innerHTML = `<section class="intro stack-lg">
    <p class="eyebrow">Niche strategy check</p>
    <h1 class="display" id="h">${esc(COPY.introHeading)}</h1>
    <p class="lede">${esc(COPY.introLine)}</p>
    <div class="facts"><span class="tag">${esc(COPY.introTime)}</span></div>
    <div><button class="btn" id="start" type="button">${esc(COPY.startButton)}</button></div>
  </section>`;
  app.querySelector("#start").addEventListener("click", () => go(1));
}

function renderNiche() {
  app.innerHTML = `<form class="stack-lg" id="f" novalidate>
    ${progress(1)}
    <label class="field" for="niche">
      <span class="display" style="font-size:clamp(34px,7vw,48px)" id="h">${esc(COPY.nicheLabel)}</span>
      <span class="muted" style="font-weight:400" id="niche-hint">${esc(COPY.nicheHint)}</span>
    </label>
    <div class="stack" style="gap:6px">
      <textarea id="niche" name="niche" maxlength="${NICHE_MAX_CHARS}" required aria-describedby="niche-hint niche-count niche-err">${esc(state.niche)}</textarea>
      <p class="count" id="niche-count" aria-live="polite"></p>
      <p class="error" id="niche-err" hidden>Please describe your niche to continue.</p>
    </div>
    <div class="nav">
      <button class="btn ghost" type="button" id="back">Back</button>
      <button class="btn" type="submit" id="next">Next</button>
    </div>
  </form>`;
  const ta = app.querySelector("#niche");
  const next = app.querySelector("#next");
  const count = app.querySelector("#niche-count");
  const update = () => {
    const left = NICHE_MAX_CHARS - ta.value.length;
    count.textContent = `${left} characters left`;
    next.disabled = ta.value.trim().length === 0;
  };
  ta.addEventListener("input", () => { state.niche = ta.value; app.querySelector("#niche-err").hidden = true; update(); });
  update();
  app.querySelector("#back").addEventListener("click", () => go(0));
  app.querySelector("#f").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!ta.value.trim()) { app.querySelector("#niche-err").hidden = false; ta.focus(); return; }
    state.niche = ta.value.trim();
    go(2);
  });
}

function renderQuestion(step) {
  const i = step - 2;
  const q = QUESTIONS[i];
  const last = i === QUESTIONS.length - 1;
  const chosen = state.answers[i];
  app.innerHTML = `<form class="stack-lg" id="f">
    ${progress(step)}
    <fieldset>
      <legend id="h" tabindex="-1"><span class="eyebrow" style="display:block;margin-bottom:8px">Question ${q.n} of ${QUESTIONS.length}</span>${esc(q.text)}</legend>
      <div class="answers">
        ${q.answers.map((a, j) => `<label class="answer">
          <input type="radio" name="a" value="${j}" ${chosen === j ? "checked" : ""}>
          <span class="dot" aria-hidden="true"></span>
          <span>${esc(a)}</span>
        </label>`).join("")}
      </div>
    </fieldset>
    <div class="nav">
      <button class="btn ghost" type="button" id="back">Back</button>
      <button class="btn" type="submit" id="next" ${chosen === null ? "disabled" : ""}>${last ? "See my results" : "Next"}</button>
    </div>
  </form>`;
  const next = app.querySelector("#next");
  app.querySelectorAll('input[name="a"]').forEach((r) => r.addEventListener("change", () => {
    state.answers[i] = Number(r.value);
    next.disabled = false;
  }));
  app.querySelector("#back").addEventListener("click", () => go(step - 1));
  app.querySelector("#f").addEventListener("submit", (e) => {
    e.preventDefault();
    if (state.answers[i] === null) return;
    if (last) finish(); else go(step + 1);
  });
}

function chip(band) {
  const on = { Low: 1, Medium: 2, High: 3 }[band];
  return `<span class="chip ${band}">${band}<span class="pips" aria-hidden="true">${[0, 1, 2].map((k) => `<i class="${k < on ? "on" : ""}"></i>`).join("")}</span></span>`;
}

function donut(overall) {
  const r = 52, c = 2 * Math.PI * r;
  const filled = (overall / 100) * c;
  return `<div class="donut" role="img" aria-label="Overall score ${overall} out of 100">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="#E6DEDA" stroke-width="14"></circle>
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="#640718" stroke-width="14" stroke-linecap="${overall > 0 && overall < 100 ? "round" : "butt"}" stroke-dasharray="${filled} ${c}"></circle>
    </svg>
    <div class="centre" aria-hidden="true"><span class="num">${overall}%</span><span class="of">Overall</span></div>
  </div>`;
}

function reportBlock() {
  const sent = Boolean(state.sentTo);
  return `<section class="report stack" aria-labelledby="report-h" id="report">
    <h2 class="display" id="report-h">${esc(COPY.reportHeading)}</h2>
    <p>${esc(COPY.reportLine)}</p>
    <form id="rf" novalidate>
      <label class="field" for="fn">First name
        <input type="text" id="fn" name="first_name" autocomplete="given-name" required maxlength="60" value="${esc(state.firstName)}">
      </label>
      <label class="field" for="em">Email
        <input type="email" id="em" name="email" autocomplete="email" required maxlength="200" value="${esc(sent ? state.sentTo : "")}">
      </label>
      <div class="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <label class="check"><input type="checkbox" id="mc" ${state.consent ? "checked" : ""}> <span>${esc(COPY.consentLabel)}</span></label>
      <p class="error" id="rf-err" role="alert" hidden></p>
      <div><button class="btn" type="submit" id="rf-btn">${esc(sent ? "Send to this address" : COPY.reportButton)}</button></div>
      <p class="small">${esc(COPY.privacyLine)} <a href="${esc(state.settings.privacy_url || "#")}" class="privacy">Privacy policy</a></p>
    </form>
  </section>`;
}

function renderResults(fromLink) {
  const s = scoreAnswers(state.answers);
  const sentLine = state.sentTo
    ? `<div class="notice" role="status">${esc(COPY.emailedLine)} <strong>${esc(state.sentTo)}</strong>. <button type="button" class="linkbtn" id="change">${esc(COPY.changeEmail)}</button></div>`
    : "";
  const book = state.settings.booking_url
    ? `<a class="btn light" href="${esc(state.settings.booking_url)}" target="_blank" rel="noopener">${esc(COPY.bookButton)}</a>`
    : `<a class="btn light" href="#" aria-disabled="true" title="Booking link not set yet">${esc(COPY.bookButton)}</a>`;

  app.innerHTML = `<article class="stack-lg">
    <div class="stack">
      <h1 class="display" id="h" tabindex="-1">${esc(COPY.resultsHeading)}</h1>
      <div id="sent">${sentLine}</div>
      <p class="lede">${esc(COPY.resultsIntro)}</p>
    </div>
    <blockquote class="quote">&ldquo;${esc(state.niche)}&rdquo;<cite>Your niche</cite></blockquote>

    <section class="summary" aria-label="Your scores">
      ${donut(s.overall)}
      <table class="factors">
        <caption>Your five factors</caption>
        <tbody>
          ${s.factors.map((f) => `<tr><th scope="row">${esc(f.name)}</th><td class="pc">${f.percent}%</td><td class="bd">${chip(f.band)}</td></tr>`).join("")}
        </tbody>
      </table>
    </section>

    <section class="verdict" aria-label="Verdict">
      <span class="lab">Your verdict</span>
      <span class="name">${esc(s.verdict.name)}</span>
      <p>${esc(s.verdict.line)}</p>${s.verdict.capNote ? `<p>${esc(s.verdict.capNote)}</p>` : ""}
    </section>

    <section class="cards" aria-label="Factor results">
      ${s.factors.map((f) => `<div class="fcard">
        <div class="top"><h3>${esc(f.name)}</h3><span class="score">${f.percent}% ${chip(f.band)}</span></div>
        <div class="bar" aria-hidden="true"><div style="width:${f.percent}%"></div></div>
        <p class="head">${esc(f.headline)}</p>
      </div>`).join("")}
    </section>

    ${reportBlock()}

    <section class="book on-wine stack" aria-labelledby="book-h">
      <h2 class="display" id="book-h">${esc(COPY.bookHeading)}</h2>
      <p>${esc(COPY.bookText)}</p>
      <div>${book}</div>
      <p class="small">${esc(COPY.bookSmall)}</p>
    </section>

    <p class="small"><button type="button" class="linkbtn" id="restart">Start the Diagnostic again</button></p>
  </article>`;

  const disabledBook = app.querySelector('.book a[aria-disabled="true"]');
  if (disabledBook) disabledBook.addEventListener("click", (e) => e.preventDefault());
  app.querySelector("#restart").addEventListener("click", restart);
  bindReportForm();
  bindChange();
}

function bindChange() {
  const ch = app.querySelector("#change");
  if (!ch) return;
  ch.addEventListener("click", () => {
    const em = app.querySelector("#em");
    em.value = "";
    app.querySelector("#rf-btn").textContent = "Send to this address";
    app.querySelector("#report").scrollIntoView({ behavior: "smooth", block: "start" });
    em.focus({ preventScroll: true });
  });
}

function bindReportForm() {
  const form = app.querySelector("#rf");
  const err = app.querySelector("#rf-err");
  const btn = app.querySelector("#rf-btn");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    const firstName = form.first_name.value.trim();
    const email = form.email.value.trim();
    const consent = app.querySelector("#mc").checked;
    if (!firstName) return showErr("Please add your first name.", form.first_name);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return showErr("Please check your email address.", form.email);

    const corrected = Boolean(state.sentTo) && state.sentTo.toLowerCase() !== email.toLowerCase();
    btn.disabled = true;
    btn.textContent = "Sending...";
    try {
      if (PREVIEW) {
        await window.NEESH_PREVIEW_SEND({ token: state.token, first_name: firstName, email, marketing_consent: consent, email_corrected: corrected });
      } else {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: state.token, first_name: firstName, email, marketing_consent: consent, email_corrected: corrected, website: form.website.value }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "We couldn't send your report just now. Please try again in a moment.");
      }
      state.sentTo = email;
      state.firstName = firstName;
      state.consent = consent;
      app.querySelector("#sent").innerHTML = `<div class="notice" role="status">${esc(COPY.emailedLine)} <strong>${esc(email)}</strong>. <button type="button" class="linkbtn" id="change">${esc(COPY.changeEmail)}</button></div>`;
      bindChange();
      btn.textContent = "Send to this address";
      btn.disabled = false;
      app.querySelector("#sent").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (ex) {
      btn.disabled = false;
      btn.textContent = state.sentTo ? "Send to this address" : COPY.reportButton;
      showErr(ex.message);
    }
    function showErr(msg, field) {
      err.textContent = msg;
      err.hidden = false;
      if (field) field.focus();
    }
  });
}

// ---------------------------------------------------------------- flow

function go(step) {
  state.step = step;
  if (step === 0) renderIntro();
  else if (step === 1) renderNiche();
  else renderQuestion(step);
  focusMain("#h");
}

// Counts this completion in the anonymous stats. Only the answers are kept;
// the Worker drops the niche description. Skipped on any browser that has
// opened the stats page, so Kelli's own test runs don't skew the numbers.
function recordForStats(token) {
  if (PREVIEW) return;
  try { if (localStorage.getItem("neesh-stats-exclude") === "1") return; } catch { /* storage blocked: still count */ }
  fetch("/api/record", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
    keepalive: true,
  }).catch(() => { /* stats are best-effort; never get in the visitor's way */ });
}

function finish() {
  state.token = encodeToken(state.answers, state.niche);
  recordForStats(state.token);
  const url = new URL(location.href);
  url.searchParams.set("r", state.token);
  try { history.pushState({ r: state.token }, "", url); } catch { /* preview frames can block this */ }
  renderResults(false);
  focusMain("#h");
}

function restart() {
  state.step = 0;
  state.niche = "";
  state.answers = Array(QUESTIONS.length).fill(null);
  state.token = null;
  state.sentTo = null;
  const url = new URL(location.href);
  url.searchParams.delete("r");
  try { history.pushState({}, "", url); } catch { /* ignore */ }
  go(0);
}

function loadFromLink() {
  const r = new URL(location.href).searchParams.get("r");
  if (!r) return false;
  try {
    const d = decodeToken(r);
    state.answers = d.answers;
    state.niche = d.niche;
    state.token = r;
    state.step = TOTAL_STEPS + 1;
    renderResults(true);
    return true;
  } catch {
    return false;
  }
}

async function loadSettings() {
  if (PREVIEW) {
    state.settings = window.NEESH_PREVIEW_SETTINGS || state.settings;
  } else {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) state.settings = await res.json();
    } catch { /* keep defaults */ }
  }
  const p = document.getElementById("privacy-link");
  if (p) p.href = state.settings.privacy_url || "#";
}

window.addEventListener("popstate", () => {
  if (!loadFromLink()) go(state.step && state.step <= TOTAL_STEPS ? state.step : 0);
});

await loadSettings();
if (!loadFromLink()) renderIntro();
