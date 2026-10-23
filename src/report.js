// Builds the full report that GHL sends as the email.
// Email-safe HTML: tables, inline styles, no scripts, no SVG.
import { FACTORS, QUESTIONS, COPY } from "../public/lib/config.js";
import { scoreAnswers } from "../public/lib/scoring.js";
import { FACTOR_COPY, EMAIL_COPY } from "./report-copy.js";

const C = {
  wine: "#640718",
  forest: "#1C3F1C",
  ink: "#1E1A1B",
  muted: "#5E5557",
  line: "#E6DEDA",
  bg: "#F7F3F0",
  chip: { High: "#AAD377", Medium: "#90D7EC", Low: "#F6A0A1" },
};
const FONT = "'Plus Jakarta Sans',Arial,Helvetica,sans-serif";
const PIPS = { Low: 1, Medium: 2, High: 3 };

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function chip(band) {
  const pips = "&#9679;".repeat(PIPS[band]) + "&#9675;".repeat(3 - PIPS[band]);
  return `<span style="display:inline-block;background:${C.chip[band]};color:${C.ink};font:700 13px/1 ${FONT};padding:6px 10px;border-radius:999px;white-space:nowrap">${band} <span aria-hidden="true" style="letter-spacing:1px">${pips}</span></span>`;
}

function bar(percent) {
  const p = Math.max(0, Math.min(100, percent));
  const fill = p === 0 ? "" : `<td width="${p}%" style="background:${C.wine};height:8px;font-size:0;line-height:0">&nbsp;</td>`;
  const rest = p === 100 ? "" : `<td style="background:${C.line};height:8px;font-size:0;line-height:0">&nbsp;</td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:4px;overflow:hidden"><tr>${fill}${rest}</tr></table>`;
}

// input: { answers, niche, firstName, bookingUrl, resultsUrl, privacyUrl, logoUrl }
export function buildReport(input) {
  const { answers, niche, firstName, bookingUrl, resultsUrl, privacyUrl, logoUrl } = input;
  const s = scoreAnswers(answers);
  const greeting = EMAIL_COPY.greeting.replace("{first_name}", firstName || "there");

  const factorRows = s.factors.map((f) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${C.line};font:600 15px ${FONT};color:${C.ink}">${escapeHtml(f.name)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${C.line};font:700 15px ${FONT};color:${C.ink};text-align:right;white-space:nowrap">${f.percent}%</td>
      <td style="padding:10px 0;border-bottom:1px solid ${C.line};text-align:right">${chip(f.band)}</td>
    </tr>`).join("");

  const factorSections = s.factors.map((f) => {
    const def = FACTORS.find((x) => x.key === f.key);
    const qs = def.questions.map((n) => {
      const q = QUESTIONS[n - 1];
      const a = answers[n - 1];
      return `
        <tr><td style="padding:12px 0 0">
          <p style="margin:0 0 4px;font:600 14px/1.45 ${FONT};color:${C.ink}">Q${n}. ${escapeHtml(q.text)}</p>
          <p style="margin:0;font:400 14px/1.45 ${FONT};color:${C.muted}">${escapeHtml(EMAIL_COPY.answerLabel)}: ${escapeHtml(q.answers[a])}</p>
        </td></tr>`;
    }).join("");
    return `
      <tr><td style="padding:28px 0 0">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${C.line};border-radius:14px">
          <tr><td style="padding:22px 22px 6px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="font:700 22px/1.2 ${FONT};color:${C.wine}">${escapeHtml(f.name)}</td>
              <td style="text-align:right;white-space:nowrap"><span style="font:700 18px ${FONT};color:${C.ink};padding-right:8px">${f.percent}%</span>${chip(f.band)}</td>
            </tr></table>
            <div style="padding:12px 0 4px">${bar(f.percent)}</div>
            <p style="margin:14px 0 0;font:400 16px/1.6 ${FONT};color:${C.ink}">${escapeHtml(FACTOR_COPY[f.key][f.band])}</p>
          </td></tr>
          <tr><td style="padding:8px 22px 22px">
            <p style="margin:12px 0 0;font:700 12px/1 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${C.muted}">${escapeHtml(EMAIL_COPY.breakdownLabel)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${qs}</table>
          </td></tr>
        </table>
      </td></tr>`;
  }).join("");

  const button = bookingUrl
    ? `<a href="${escapeHtml(bookingUrl)}" style="display:inline-block;background:#ffffff;color:${C.wine};font:700 16px/1 ${FONT};text-decoration:none;padding:16px 24px;border-radius:12px">${escapeHtml(COPY.bookButton)}</a>`
    : `<span style="display:inline-block;background:#ffffff;color:${C.wine};font:700 16px/1 ${FONT};padding:16px 24px;border-radius:12px">${escapeHtml(COPY.bookButton)} [booking link not set]</span>`;

  const logo = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" width="150" alt="NEESH" style="display:block;width:150px;height:auto;border:0">`
    : "";

  const html = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(EMAIL_COPY.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
  <tr><td style="background:${C.wine};border-radius:16px 16px 0 0;padding:26px 28px">${logo}
    <p style="margin:${logo ? "18px" : "0"} 0 0;font:700 13px/1 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:#F6A0A1">The NEESH Diagnostic</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:28px;border-radius:0 0 16px 16px">
    <p style="margin:0 0 12px;font:400 16px/1.6 ${FONT};color:${C.ink}">${escapeHtml(greeting)}</p>
    <p style="margin:0;font:400 16px/1.6 ${FONT};color:${C.ink}">${escapeHtml(EMAIL_COPY.intro)}</p>
    <p style="margin:22px 0 6px;font:700 12px/1 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${C.muted}">${escapeHtml(EMAIL_COPY.nicheLabel)}</p>
    <p style="margin:0;padding:12px 16px;border-left:4px solid ${C.wine};background:${C.bg};font:italic 400 16px/1.55 ${FONT};color:${C.ink}">&ldquo;${escapeHtml(niche)}&rdquo;</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px"><tr>
      <td style="vertical-align:top;width:45%;padding-right:12px">
        <p style="margin:0;font:700 12px/1 ${FONT};letter-spacing:.12em;text-transform:uppercase;color:${C.muted}">${escapeHtml(EMAIL_COPY.overallLabel)}</p>
        <p style="margin:6px 0 0;font:800 56px/1 ${FONT};color:${C.wine}">${s.overall}%</p>
        <p style="margin:10px 0 0;font:800 22px/1.2 ${FONT};color:${C.forest}">${escapeHtml(s.verdict.name)}</p>
        <p style="margin:6px 0 0;font:400 15px/1.5 ${FONT};color:${C.ink}">${escapeHtml(s.verdict.line)}</p>
      </td>
      <td style="vertical-align:top">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${factorRows}</table>
      </td>
    </tr></table>
  </td></tr>
  ${factorSections}
  <tr><td style="padding:28px 0 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.wine};border-radius:16px"><tr><td style="padding:28px">
      <p style="margin:0;font:800 24px/1.2 ${FONT};color:#ffffff">${escapeHtml(COPY.bookHeading)}</p>
      <p style="margin:12px 0 20px;font:400 16px/1.6 ${FONT};color:#F7E6E8">${escapeHtml(COPY.bookText)}</p>
      ${button}
      <p style="margin:16px 0 0;font:400 13px/1.5 ${FONT};color:#F0D3D7">${escapeHtml(COPY.bookSmall)}</p>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:22px 8px;font:400 13px/1.6 ${FONT};color:${C.muted};text-align:center">
    <a href="${escapeHtml(resultsUrl)}" style="color:${C.wine}">${escapeHtml(EMAIL_COPY.resultsLink)}</a>${privacyUrl ? ` &middot; <a href="${escapeHtml(privacyUrl)}" style="color:${C.wine}">Privacy</a>` : ""}<br>
    ${escapeHtml(EMAIL_COPY.footer)}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    greeting,
    "",
    EMAIL_COPY.intro,
    "",
    `${EMAIL_COPY.nicheLabel}: "${niche}"`,
    "",
    `${EMAIL_COPY.overallLabel}: ${s.overall}%. ${s.verdict.name}. ${s.verdict.line}`,
    "",
    ...s.factors.flatMap((f) => {
      const def = FACTORS.find((x) => x.key === f.key);
      return [
        `${f.name.toUpperCase()}: ${f.percent}% (${f.band})`,
        FACTOR_COPY[f.key][f.band],
        `${EMAIL_COPY.breakdownLabel}:`,
        ...def.questions.map((n) => `  Q${n}. ${QUESTIONS[n - 1].text}\n  ${EMAIL_COPY.answerLabel}: ${QUESTIONS[n - 1].answers[answers[n - 1]]}`),
        "",
      ];
    }),
    COPY.bookHeading,
    COPY.bookText,
    `${COPY.bookButton}: ${bookingUrl || "[booking link not set]"}`,
    COPY.bookSmall,
    "",
    `${EMAIL_COPY.resultsLink}: ${resultsUrl}`,
  ].join("\n");

  return { subject: EMAIL_COPY.subject, html, text, scores: s };
}
