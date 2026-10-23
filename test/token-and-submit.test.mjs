import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { encodeToken, decodeToken } from "../public/lib/token.js";
import worker from "../src/worker.js";

const answers = [1, 1, 1, 0, 0, 2, 0, 3, 3, 0, 0, 0, 0, 2, 3]; // CREED order

test("token round trip keeps answers and niche, including accents and emoji", () => {
  const niche = "Independent dental practices in the Midlands, café owners too 🦷";
  const t = encodeToken(answers, niche);
  assert.match(t, /^[A-Za-z0-9_-]+$/);
  const d = decodeToken(t);
  assert.deepEqual(d.answers, answers);
  assert.equal(d.niche, niche);
});

test("token caps the niche at 300 characters", () => {
  const d = decodeToken(encodeToken(answers, "x".repeat(500)));
  assert.equal(d.niche.length, 300);
});

test("token rejects tampering", () => {
  assert.throws(() => decodeToken(""));
  assert.throws(() => decodeToken("2" + "0".repeat(15) + "YQ"));
  assert.throws(() => decodeToken("1" + "4" + "0".repeat(14) + "YQ"));
  assert.throws(() => decodeToken("1" + "0".repeat(15)));          // no niche
  assert.throws(() => decodeToken("1" + "0".repeat(15) + "a$b"));  // bad characters
});

const env = { BOOKING_URL: "https://example.com/book", PRIVACY_URL: "https://neesh.agency/privacy", RESULTS_BASE_URL: "https://diagnostic.neesh.agency", GHL_WEBHOOK_URL: "" };
const submit = (body, e = env) => worker.fetch(new Request("https://diagnostic.neesh.agency/api/submit", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
}), e);

test("submit with no GHL webhook logs and still succeeds", async () => {
  const logs = [];
  const orig = console.log;
  console.log = (...a) => logs.push(a.join(" "));
  try {
    const res = await submit({ token: encodeToken(answers, "Dentists"), first_name: "Sam", email: "sam@example.com", marketing_consent: false });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, delivered: false });
  } finally { console.log = orig; }
  assert.ok(logs.some((l) => l.includes('"verdict":"Sharpen"')));
});

test("submit sends the full payload to GHL, email never in the results link", async () => {
  let sent;
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent = { url, body: JSON.parse(init.body) }; return new Response("ok"); };
  try {
    const res = await submit({ token: encodeToken(answers, "Dentists"), first_name: "Sam", email: "Sam@Example.com", marketing_consent: true, email_corrected: true }, { ...env, GHL_WEBHOOK_URL: "https://hooks.example/abc" });
    assert.equal(res.status, 200);
  } finally { globalThis.fetch = origFetch; }
  const p = sent.body;
  assert.equal(sent.url, "https://hooks.example/abc");
  for (const k of ["first_name", "email", "marketing_consent", "consent_tag", "email_corrected", "niche_description",
    "score_experience", "score_demand", "score_reach", "score_commercial_value", "score_enjoyment",
    "band_experience", "band_demand", "band_reach", "band_commercial_value", "band_enjoyment",
    "overall_score", "verdict", "results_url", "email_subject", "report_html", "report_text", "completed_at", "source"]) {
    assert.ok(k in p, `missing ${k}`);
  }
  assert.equal(p.email, "sam@example.com");
  assert.equal(p.marketing_consent, true);
  assert.equal(p.email_corrected, true);
  assert.equal(p.score_experience, 33);
  assert.equal(p.band_reach, "High");
  assert.equal(p.overall_score, 64);
  assert.equal(p.verdict, "Sharpen");
  assert.equal(p.source, "neesh-diagnostic");
  assert.ok(p.results_url.startsWith("https://diagnostic.neesh.agency/?r=1"));
  assert.ok(!p.results_url.toLowerCase().includes("sam"));
  // The full paragraphs and the question breakdown are in the report
  assert.ok(p.report_html.includes("Experience is underweight. You lack the depth"));
  assert.ok(p.report_html.includes("Q15."));
  // The overall statement for the verdict is in the report
  assert.ok(p.report_html.includes("There is potential here, with gaps."));
  assert.ok(p.report_text.includes("There is potential here, with gaps."));
  // Points per answer stay private
  assert.ok(!/points/i.test(p.report_html));
  assert.ok(!/points/i.test(p.report_text));
  assert.ok(p.report_html.includes("https://example.com/book"));
});

test("submit rejects a bad email, missing name or bad token", async () => {
  const t = encodeToken(answers, "Dentists");
  assert.equal((await submit({ token: t, first_name: "Sam", email: "nope" })).status, 400);
  assert.equal((await submit({ token: t, first_name: "", email: "sam@example.com" })).status, 400);
  assert.equal((await submit({ token: "rubbish", first_name: "Sam", email: "sam@example.com" })).status, 400);
});

test("a failing GHL webhook returns an error so the person can retry", async () => {
  const origFetch = globalThis.fetch;
  const origLog = console.log;
  globalThis.fetch = async () => new Response("nope", { status: 500 });
  console.log = () => {};
  try {
    const res = await submit({ token: encodeToken(answers, "Dentists"), first_name: "Sam", email: "sam@example.com" }, { ...env, GHL_WEBHOOK_URL: "https://hooks.example/abc" });
    assert.equal(res.status, 502);
  } finally { globalThis.fetch = origFetch; console.log = origLog; }
});

test("full factor paragraphs never reach the browser", () => {
  const walk = (d) => readdirSync(d).flatMap((f) => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
  for (const f of walk("public").filter((f) => /\.(js|html|css)$/.test(f))) {
    assert.ok(!readFileSync(f, "utf8").includes("You lack the depth or track record"), f);
  }
});

test("no em dashes anywhere in the project", () => {
  const walk = (d) => readdirSync(d).flatMap((f) => (f === "node_modules" || f.startsWith(".")) ? [] : statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
  for (const f of walk(".").filter((f) => /\.(js|mjs|html|css|md|toml|json)$/.test(f))) {
    assert.ok(!readFileSync(f, "utf8").includes(String.fromCharCode(0x2014)), f);
  }
});
