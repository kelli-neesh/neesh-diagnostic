// The NEESH Diagnostic. Cloudflare Worker.
// Serves the pages in /public, plus two small endpoints:
//   GET  /api/settings   the public links the page needs (booking, privacy)
//   POST /api/submit     { token, first_name, email, marketing_consent, email_corrected }
//                        builds the full report and sends it to GHL
// Nothing is stored here. The only place a name or email goes is GHL.

import { decodeToken, encodeToken } from "../public/lib/token.js";
import { buildReport } from "./report.js";

const MAX_BODY_BYTES = 4096;
const WEBHOOK_TIMEOUT_MS = 8000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function baseUrl(env, request) {
  const set = String(env.RESULTS_BASE_URL || "").trim().replace(/\/+$/, "");
  return set || new URL(request.url).origin;
}

export async function handleSubmit(request, env) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "Too large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Bad request" }, 400); }

  // Hidden field that people never see. Bots fill it in.
  if (body.website) return json({ ok: true });

  const firstName = String(body.first_name || "").trim().slice(0, 60);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
  if (!firstName) return json({ error: "Please add your first name." }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: "Please check your email address." }, 400);

  let decoded;
  try { decoded = decodeToken(body.token); } catch { return json({ error: "Your results link isn't valid. Please retake the Diagnostic." }, 400); }

  const base = baseUrl(env, request);
  const resultsUrl = `${base}/?r=${encodeToken(decoded.answers, decoded.niche)}`;
  const report = buildReport({
    answers: decoded.answers,
    niche: decoded.niche,
    firstName,
    bookingUrl: env.BOOKING_URL || "",
    privacyUrl: env.PRIVACY_URL || "",
    resultsUrl,
    logoUrl: `${base}/neesh-logo-white.png`,
  });
  const s = report.scores;
  const byKey = Object.fromEntries(s.factors.map((f) => [f.key, f]));

  const payload = {
    first_name: firstName,
    email,
    marketing_consent: body.marketing_consent === true,
    consent_tag: body.marketing_consent === true ? "diagnostic-marketing-ok" : "diagnostic-no-marketing",
    email_corrected: body.email_corrected === true,
    niche_description: decoded.niche,
    score_experience: byKey.experience.percent,
    score_demand: byKey.demand.percent,
    score_reach: byKey.reach.percent,
    score_commercial_value: byKey.commercial_value.percent,
    score_enjoyment: byKey.enjoyment.percent,
    band_experience: byKey.experience.band,
    band_demand: byKey.demand.band,
    band_reach: byKey.reach.band,
    band_commercial_value: byKey.commercial_value.band,
    band_enjoyment: byKey.enjoyment.band,
    overall_score: s.overall,
    verdict: s.verdict.name,
    results_url: resultsUrl,
    email_subject: report.subject,
    report_html: report.html,
    report_text: report.text,
    completed_at: new Date().toISOString(),
    source: "neesh-diagnostic",
  };

  const hook = String(env.GHL_WEBHOOK_URL || "").trim();
  if (!hook) {
    // No GHL connection yet: log and carry on, so the app works end to end.
    console.log("GHL_WEBHOOK_URL not set. Payload that would be sent:", JSON.stringify({ ...payload, report_html: `[${payload.report_html.length} characters]` }));
    return json({ ok: true, delivered: false });
  }

  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`GHL responded ${res.status}`);
  } catch (e) {
    console.log("GHL webhook failed:", e.message);
    return json({ error: "We couldn't send your report just now. Please try again in a moment." }, 502);
  }
  return json({ ok: true, delivered: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/settings" && request.method === "GET") {
        return json({ booking_url: env.BOOKING_URL || "", privacy_url: env.PRIVACY_URL || "" });
      }
      if (url.pathname === "/api/submit" && request.method === "POST") return await handleSubmit(request, env);
      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
      return env.ASSETS.fetch(request);
    } catch (e) {
      console.log("Unexpected error:", e.message);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  },
};
